# app/db/database.py

import sqlite3
import uuid
from datetime import datetime

DB_NAME = "translation_engine.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.executescript('''
    CREATE TABLE IF NOT EXISTS tm_metadata (
        id TEXT PRIMARY KEY,
        source_lang TEXT, target_lang TEXT,
        source_text TEXT, target_text TEXT,
        version INT, match_type TEXT, approved BOOLEAN,
        created_at TIMESTAMP, updated_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS glossary_entries (
        id TEXT PRIMARY KEY,
        source_lang TEXT, target_lang TEXT,
        source_term TEXT, target_term TEXT,
        context TEXT, part_of_speech TEXT,
        created_at TIMESTAMP, updated_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS style_profiles (
        id TEXT PRIMARY KEY,
        project_id TEXT, tone TEXT,
        style_rules TEXT, glossary_id TEXT,
        created_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS corrections_batch (
        id TEXT PRIMARY KEY,
        project_id TEXT, source_text TEXT,
        original_translation TEXT, corrected_translation TEXT,
        correction_type TEXT, status TEXT,
        created_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        segment_id TEXT, action TEXT,
        old_value TEXT, new_value TEXT,
        user_id TEXT, timestamp TIMESTAMP
    );
    ''')
    conn.commit()
    conn.close()
    print("Database & All Tables created successfully!")

def query_db(query, args=(), one=False):
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row 
    cur = conn.cursor()
    cur.execute(query, args)
    rv = cur.fetchall()
    conn.close()
    return (rv[0] if rv else None) if one else rv

def log_action(segment_id, action, old_val, new_val, user_id=None):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO audit_log (id, segment_id, action, old_value, new_value, user_id, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (str(uuid.uuid4()), segment_id, action, old_val, new_val, user_id, datetime.now()))
    conn.commit()
    conn.close()

def get_glossary_from_db():
    rows = query_db('SELECT source_term, target_term FROM glossary_entries')
    return {row['source_term']: row['target_term'] for row in rows}

def get_glossary_by_lang_pair(source_lang: str, target_lang: str) -> dict:
    rows = query_db(
        'SELECT source_term, target_term FROM glossary_entries WHERE source_lang=? AND target_lang=?',
        (source_lang, target_lang)
    )
    return {row['source_term']: row['target_term'] for row in rows}

def add_glossary_entry(entry):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO glossary_entries 
        (id, source_lang, target_lang, source_term, target_term, context, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (str(uuid.uuid4()), entry.source_lang, entry.target_lang,
          entry.source_term, entry.target_term, entry.context,
          datetime.now(), datetime.now()))
    conn.commit()
    conn.close()

def check_glossary_conflict(source_term: str, target_lang: str):
    return query_db(
        'SELECT * FROM glossary_entries WHERE source_term=? AND target_lang=?',
        (source_term, target_lang), one=True
    )

def save_style_profile(profile):
    import json as _json
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO style_profiles (id, project_id, tone, style_rules, glossary_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (str(uuid.uuid4()), profile.project_id, profile.tone,
          _json.dumps(profile.style_rules), profile.glossary_id, datetime.now()))
    conn.commit()
    conn.close()

def get_style_profile(project_id: str):
    return query_db('SELECT * FROM style_profiles WHERE project_id=?',
                    (project_id,), one=True)

def log_correction_batch(request):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO corrections_batch 
        (id, source_text, corrected_translation, correction_type, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (str(uuid.uuid4()), request.source_text, request.corrected_text,
          request.action, "PENDING_FINETUNE", datetime.now()))
    conn.commit()
    conn.close()

def delete_glossary_entry(term_id: str):
    conn = sqlite3.connect(DB_NAME)
    conn.execute('DELETE FROM glossary_entries WHERE id=?', (term_id,))
    conn.commit()
    conn.close()

def get_audit_log(limit: int = 50):
    rows = query_db('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?', (limit,))
    return [dict(r) for r in rows]

def get_correction_batches(status: str = "PENDING_FINETUNE"):
    rows = query_db('SELECT * FROM corrections_batch WHERE status=?', (status,))
    return [dict(r) for r in rows]