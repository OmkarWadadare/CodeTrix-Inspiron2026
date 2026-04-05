# app/core/engine.py

import os
import uuid
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

LANGUAGE_NAMES = {
    "hindi": "Hindi (हिन्दी)",
    "bengali": "Bengali (বাংলা)",
    "tamil": "Tamil (தமிழ்)",
    "telugu": "Telugu (తెలుగు)",
    "marathi": "Marathi (मराठी)",
    "gujarati": "Gujarati (ગુજરાતી)",
    "kannada": "Kannada (ಕನ್ನಡ)",
    "malayalam": "Malayalam (മലയാളം)",
    "odia": "Odia (ଓଡ଼ିଆ)",
    "punjabi": "Punjabi (ਪੰਜਾਬੀ)",
    "assamese": "Assamese (অসমীয়া)",
    "urdu": "Urdu (اردو)",
    "sanskrit": "Sanskrit (संस्कृतम्)",
    "konkani": "Konkani (कोंकणी)",
    "manipuri": "Manipuri (মৈতৈলোন্)",
    "nepali": "Nepali (नेपाली)",
    "bodo": "Bodo (बड़'",
    "dogri": "Dogri (डोगरी)",
    "kashmiri": "Kashmiri (کٲشُر)",
    "maithili": "Maithili (मैथिली)",
    "santali": "Santali (ᱥᱟᱱᱛᱟᱲᱤ)",
    "sindhi": "Sindhi (سنڌي)",
    "english": "English",
    "french": "French (Français)",
    "spanish": "Spanish (Español)",
    "german": "German (Deutsch)",
    "italian": "Italian (Italiano)",
    "portuguese": "Portuguese (Português)",
    "russian": "Russian (Русский)",
    "chinese": "Chinese Simplified (中文)",
    "chinese-traditional": "Chinese Traditional (繁體中文)",
    "japanese": "Japanese (日本語)",
    "korean": "Korean (한국어)",
    "arabic": "Arabic (العربية)",
    "dutch": "Dutch (Nederlands)",
    "swedish": "Swedish (Svenska)",
    "norwegian": "Norwegian (Norsk)",
    "danish": "Danish (Dansk)",
    "finnish": "Finnish (Suomi)",
    "polish": "Polish (Polski)",
    "turkish": "Turkish (Türkçe)",
    "greek": "Greek (Ελληνικά)",
    "hebrew": "Hebrew (עברית)",
    "thai": "Thai (ไทย)",
    "vietnamese": "Vietnamese (Tiếng Việt)",
    "indonesian": "Indonesian (Bahasa Indonesia)",
    "malay": "Malay (Bahasa Melayu)",
    "filipino": "Filipino (Tagalog)",
}

TM_AVAILABLE = False
try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('all-MiniLM-L6-v2')
    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    collection = chroma_client.get_or_create_collection(name="translation_memory")
    TM_AVAILABLE = True
    print("Translation Memory (ChromaDB + SentenceTransformers) loaded successfully.")
except Exception as e:
    print(f"Warning: Translation Memory disabled ({e}). Using simple fallback.")
    _simple_tm = []

def add_to_tm(source_text, target_text, target_lang):
    if TM_AVAILABLE:
        try:
            embedding = model.encode(source_text).tolist()
            collection.add(
                documents=[source_text],
                metadatas=[{"target_lang": target_lang, "target_text": target_text}],
                embeddings=[embedding],
                ids=[str(uuid.uuid4())]
            )
        except Exception as e:
            print(f"TM add error: {e}")
    else:
        _simple_tm.append({"source": source_text, "target": target_text, "lang": target_lang})

def match_against_tm(source_text, target_lang, threshold=0.75):
    if TM_AVAILABLE:
        try:
            query_embedding = model.encode(source_text).tolist()
            results = collection.query(
                query_embeddings=[query_embedding], 
                n_results=1,
                where={"target_lang": target_lang}
            )
            if results["distances"] and len(results["distances"][0]) > 0:
                confidence = 1 - results["distances"][0][0]
                if confidence >= 0.99:
                    return {"type": "EXACT", "match": results["metadatas"][0][0]["target_text"], "confidence": confidence}
                elif confidence >= threshold:
                    return {"type": "FUZZY", "match": results["metadatas"][0][0]["target_text"], "confidence": confidence}
        except Exception as e:
            print(f"TM match error: {e}")
    else:
        for entry in _simple_tm:
            if entry["lang"] == target_lang and entry["source"].lower() == source_text.lower():
                return {"type": "EXACT", "match": entry["target"], "confidence": 1.0}
    return {"type": "NEW", "match": None, "confidence": 0.0}

def _get_lang_name(code):
    return LANGUAGE_NAMES.get(code.lower(), code.capitalize())

def translate_with_groq(source_text, target_lang, tone, glossary=None, source_lang="english"):
    try:
        src_name = _get_lang_name(source_lang)
        tgt_name = _get_lang_name(target_lang)

        gloss_text = ""
        if glossary:
            terms = [f"{s} -> {t}" for s, t in glossary.items()]
            gloss_text = "GLOSSARY:\n" + "\n".join(terms)

        prompt = f"""You are a professional translator. Translate the following text from {src_name} to {tgt_name}.
Tone: {tone}
{gloss_text}

Text to translate:
{source_text}

Output ONLY the translation, nothing else:"""
        
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.3
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        return f"Translation Error: {str(e)}"

def translate_batch_with_groq(segments: list, target_lang: str, tone: str, glossary: dict = None, source_lang: str = "english"):
    try:
        src_name = _get_lang_name(source_lang)
        tgt_name = _get_lang_name(target_lang)

        glossary_info = ""
        if glossary:
            terms = [f"- '{src}' should ALWAYS be translated as '{tgt}'" for src, tgt in glossary.items()]
            glossary_info = "### STRICT GLOSSARY RULES:\n" + "\n".join(terms)

        formatted_segments = "\n".join([f"ID_{i+1}: {text}" for i, text in enumerate(segments)])

        prompt = f"""You are an expert translator. Translate the following segments from {src_name} to {tgt_name} with a {tone} tone.

{glossary_info}

### INSTRUCTIONS:
1. Translate each segment from {src_name} to {tgt_name}.
2. Maintain the exact original meaning and tone.
3. Follow the glossary rules strictly.
4. Return translations using the SAME ID format (e.g., ID_1: [translated text]).
5. Provide ONLY the translated list. No intro, no outro, no explanations.
6. If a segment is empty or just whitespace, return it as-is.

### SEGMENTS TO TRANSLATE:
{formatted_segments}"""

        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )
        
        response_text = completion.choices[0].message.content.strip()
        
        translated_list = []
        for line in response_text.split('\n'):
            line = line.strip()
            if not line:
                continue
            if ': ' in line:
                translated_list.append(line.split(': ', 1)[-1].strip())
            else:
                translated_list.append(line)
        
        return translated_list
    except Exception as e:
        print(f"Batch Error: {e}")
        return None

def translate_full_document(full_text: str, target_lang: str, tone: str, glossary: dict):
    all_sentences = [s.strip() for s in full_text.split('.') if s.strip()]
    
    translated_document = []
    chunk_size = 10 
    
    for i in range(0, len(all_sentences), chunk_size):
        chunk = all_sentences[i : i + chunk_size]
        print(f"Translating chunk {i//chunk_size + 1}...")

        translated_chunk = translate_batch_with_groq(chunk, target_lang, tone, glossary)
        
        if translated_chunk:
            translated_document.extend(translated_chunk)
            
    return " ".join(translated_document)

def enrich_glossary_from_approval(source: str, target: str, target_lang: str):
    from app.db.database import add_glossary_entry, check_glossary_conflict
    from app.models.schemas import GlossaryEntryRequest
    
    stopwords = {"the","a","an","is","are","was","were","to","of","and","in","that","it"}
    src_words = [w for w in source.split() if w.lower() not in stopwords and len(w) > 3]
    tgt_words = [w for w in target.split() if len(w) > 3]

    for src_w, tgt_w in zip(src_words, tgt_words):
        if not check_glossary_conflict(src_w, target_lang):
            entry = GlossaryEntryRequest(
                source_lang="en", target_lang=target_lang,
                source_term=src_w, target_term=tgt_w,
                context="auto-extracted from approval"
            )
            add_glossary_entry(entry)
