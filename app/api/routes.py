# app/api/routes.py

import os, shutil, uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.models.schemas import DocumentTranslationRequest, GlossaryEntryRequest, StyleProfileRequest, TranslationRequest, ApprovalRequest, ValidationRequest
from app.core.engine import match_against_tm, translate_with_groq, add_to_tm
from app.db.database import log_action, get_glossary_from_db
from app.core.engine import translate_batch_with_groq
from app.core.parser import extract_pdf_segments, extract_docx_segments
from app.core.validator import validate_segments
from app.core.rebuilder import rebuild_pdf_translated, rebuild_docx_translated
from fastapi.responses import FileResponse
from app.db.database import (add_glossary_entry, check_glossary_conflict,
                              save_style_profile, log_correction_batch,
                              get_glossary_by_lang_pair)
from app.db.database import (get_glossary_by_lang_pair, get_style_profile,
                              delete_glossary_entry, get_audit_log,
                              get_correction_batches)

UPLOAD_DIR = "./uploads"
OUTPUT_DIR = "./outputs"

router = APIRouter()

@router.post("/translate")
async def translate_segments(request: TranslationRequest):
    results = []
    segments_to_ai = [] 
    ai_indices = []
    
    try:
        glossary = get_glossary_from_db()
        for i, segment in enumerate(request.segments):
            match = match_against_tm(segment, request.target_lang)
            
            if match["type"] == "FUZZY" and match["confidence"] >= 0.95:
                results.append({
                    "source": segment,
                    "translation": match["match"],
                    "status": "TM_MATCH"
                })
                log_action(segment, "TM_MATCH", "", match["match"])
            else:
                segments_to_ai.append(segment)
                ai_indices.append(i)
                results.append(None) 

        if segments_to_ai:
            ai_translations = translate_batch_with_groq(
                segments_to_ai, 
                request.target_lang, 
                request.tone, 
                glossary
            )
            
            if ai_translations and len(ai_translations) == len(segments_to_ai):
                for idx, translation in zip(ai_indices, ai_translations):
                    results[idx] = {
                        "source": request.segments[idx],
                        "translation": translation,
                        "status": "AI_BATCH_GENERATED"
                    }
                    add_to_tm(request.segments[idx], translation, request.target_lang)
                    log_action(request.segments[idx], "AI_BATCH_GENERATED", "", translation)
            else:
                for idx in ai_indices:
                    results[idx] = {"source": request.segments[idx], "translation": "Batch Error", "status": "ERROR"}

        return {"results": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1].lower()
    if ext not in ("pdf", "docx"):
        raise HTTPException(400, "Only PDF and DOCX supported")

    session_id = str(uuid.uuid4())
    save_dir = os.path.join(UPLOAD_DIR, session_id)
    os.makedirs(save_dir, exist_ok=True)
    file_path = os.path.join(save_dir, file.filename)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    output_dir = os.path.join(save_dir, "extracted")

    if ext == "pdf":
        result = extract_pdf_segments(file_path, output_dir)
    else:
        result = extract_docx_segments(file_path, output_dir)

    return {
        "session_id": session_id,
        "file_type": ext,
        "segment_count": len(result["segments"]),
        "segments": result["segments"],
        "json_path": result["json_path"]
    }

@router.post("/validate")
async def validate_source(request: ValidationRequest):
    issues = validate_segments(request.segments)
    return {"issue_count": len(issues), "issues": issues}

@router.post("/translate-document")
async def translate_document(request: DocumentTranslationRequest):
    session_dir = os.path.join(UPLOAD_DIR, request.session_id)
    ext = request.file_type

    json_path = os.path.join(session_dir, "extracted",
                             "pdf.json" if ext == "pdf" else "doc.json")

    glossary = get_glossary_by_lang_pair("en", request.target_lang)
    segment_texts = [s["text"] for s in request.segments]
    segment_ids   = [s["id"]   for s in request.segments]

    translated_texts = translate_batch_with_groq(
        segment_texts, request.target_lang, request.tone, glossary
    )

    translations = dict(zip(segment_ids, translated_texts or segment_texts))

    output_path = os.path.join(OUTPUT_DIR, f"{request.session_id}_translated.{ext}")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if ext == "pdf":
        rebuild_pdf_translated(json_path, translations, output_path)
    else:
        rebuild_docx_translated(json_path, translations, output_path)

    return {"download_url": f"/api/download/{request.session_id}/{ext}"}

@router.get("/download/{session_id}/{ext}")
async def download_file(session_id: str, ext: str):
    path = os.path.join(OUTPUT_DIR, f"{session_id}_translated.{ext}")
    if not os.path.exists(path):
        raise HTTPException(404, "File not found")
    return FileResponse(path, filename=f"translated.{ext}")

@router.post("/glossary/add")
async def add_glossary(request: GlossaryEntryRequest):
    conflict = check_glossary_conflict(request.source_term, request.target_lang)
    if conflict:
        return {"status": "CONFLICT", "existing": conflict}
    add_glossary_entry(request)
    return {"status": "ADDED"}

@router.post("/style-profile")
async def create_style_profile(request: StyleProfileRequest):
    save_style_profile(request)
    return {"status": "SAVED"}

@router.post("/approve")
async def approve_translation(request: ApprovalRequest):
    try:
        if request.action in ("accept", "edit"):
            add_to_tm(request.source_text, request.corrected_text, request.target_lang)
            # Glossary enrichment on approval
            from app.core.engine import enrich_glossary_from_approval
            enrich_glossary_from_approval(
                request.source_text, request.corrected_text, request.target_lang
            )
        log_action(request.source_text, f"USER_{request.action.upper()}", "", request.corrected_text, request.user_id)
        log_correction_batch(request)
        return {"message": f"Segment {request.action}ed and system updated."}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/glossary/{source_lang}/{target_lang}")
async def list_glossary(source_lang: str, target_lang: str):
    rows = get_glossary_by_lang_pair(source_lang, target_lang)
    return {"glossary": [{"source": k, "target": v} for k, v in rows.items()]}

@router.delete("/glossary/{term_id}")
async def remove_glossary_entry(term_id: str):
    delete_glossary_entry(term_id)
    return {"status": "DELETED"}

@router.get("/style-profile/{project_id}")
async def fetch_style_profile(project_id: str):
    profile = get_style_profile(project_id)
    if not profile:
        raise HTTPException(404, "Profile not found")
    return dict(profile)

@router.get("/audit-log")
async def fetch_audit_log(limit: int = 50):
    return {"logs": get_audit_log(limit)}

@router.get("/corrections/export")
async def export_corrections():
    return {"batches": get_correction_batches()}

@router.post("/tm/import")
async def import_bilingual_pairs(pairs: list[dict], target_lang: str):
    """pairs = [{"source": "...", "target": "..."}]"""
    for pair in pairs:
        add_to_tm(pair["source"], pair["target"], target_lang)
        log_action(pair["source"], "TM_IMPORT", "", pair["target"])
    return {"imported": len(pairs)}