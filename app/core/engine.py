# app/core/engine.py

import os
import uuid
import chromadb
from sentence_transformers import SentenceTransformer
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Initialization
model = SentenceTransformer('all-MiniLM-L6-v2')
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="translation_memory")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def add_to_tm(source_text, target_text, target_lang):
    embedding = model.encode(source_text).tolist()
    collection.add(
        documents=[source_text],
        metadatas=[{"target_lang": target_lang, "target_text": target_text}],
        embeddings=[embedding],
        ids=[str(uuid.uuid4())]
    )

def match_against_tm(source_text, target_lang, threshold=0.75):
    query_embedding = model.encode(source_text).tolist()
    results = collection.query(
        query_embeddings=[query_embedding], 
        n_results=1,
        where={"target_lang": target_lang}
    )
    if results["distances"] and len(results["distances"][0]) > 0:
        confidence = 1 - results["distances"][0][0]
        if confidence >= threshold:
            return {"type": "FUZZY", "match": results["metadatas"][0][0]["target_text"], "confidence": confidence}
    return {"type": "NEW", "match": None, "confidence": 0.0}

def translate_with_groq(source_text, target_lang, tone, glossary=None):
    try:
        gloss_text = ""
        if glossary:
            terms = [f"{s} -> {t}" for s, t in glossary.items()]
            gloss_text = "GLOSSARY:\n" + "\n".join(terms)

        prompt = f"{gloss_text}\n\nTranslate to {target_lang} ({tone} tone):\n{source_text}\nOutput only translation:"
        
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.3
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        return f"Translation Error: {str(e)}"

def translate_batch_with_groq(segments: list, target_lang: str, tone: str, glossary: dict = None):
    try:
        glossary_info = ""
        if glossary:
            terms = [f"- '{src}' should ALWAYS be translated as '{tgt}'" for src, tgt in glossary.items()]
            glossary_info = "### STRICT GLOSSARY RULES:\n" + "\n".join(terms)

        formatted_segments = "\n".join([f"ID_{i+1}: {text}" for i, text in enumerate(segments)])

        prompt = f"""
        You are an expert technical translator. Your task is to translate a list of segments into {target_lang} with a {tone} tone.

        {glossary_info}

        ### INSTRUCTIONS:
        1. Maintain the exact original meaning and tone.
        2. Follow the glossary rules strictly for every segment.
        3. Return the translations using the same ID format (e.g., ID_1: [translation]).
        4. Provide ONLY the translated list. No intro, no outro, no explanations.

        ### SEGMENTS TO TRANSLATE:
        {formatted_segments}
        """

        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )
        
        response_text = completion.choices[0].message.content.strip()
        
        translated_list = []
        for line in response_text.split('\n'):
            if ': ' in line:
                translated_list.append(line.split(': ', 1)[-1].strip())
        
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
    """
    Naive term extraction: single-word tokens not in common stopwords
    get added to glossary if not already present.
    """
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

# ALSO fix match_against_tm — add EXACT threshold:
def match_against_tm(source_text, target_lang, threshold=0.75):
    query_embedding = model.encode(source_text).tolist()
    results = collection.query(
        query_embeddings=[query_embedding], n_results=1,
        where={"target_lang": target_lang}
    )
    if results["distances"] and len(results["distances"][0]) > 0:
        confidence = 1 - results["distances"][0][0]
        if confidence >= 0.99:
            return {"type": "EXACT", "match": results["metadatas"][0][0]["target_text"], "confidence": confidence}
        elif confidence >= threshold:
            return {"type": "FUZZY", "match": results["metadatas"][0][0]["target_text"], "confidence": confidence}
    return {"type": "NEW", "match": None, "confidence": 0.0}