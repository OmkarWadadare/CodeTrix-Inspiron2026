# app/db/database.py

import sqlite3
import uuid
import random
import string
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

def ensure_org_tables():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.executescript('''
    CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        owner_email TEXT NOT NULL,
        created_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS org_members (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TIMESTAMP,
        FOREIGN KEY (org_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS org_invite_codes (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        created_by TEXT NOT NULL,
        created_at TIMESTAMP,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (org_id) REFERENCES organizations(id)
    );
    ''')
    conn.commit()
    conn.close()
    print("Organization tables ensured!")

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

# ── Organization Management ──────────────────────────────────────────────

def create_organization(name: str, owner_email: str) -> str:
    org_id = str(uuid.uuid4())
    member_id = str(uuid.uuid4())
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO organizations (id, name, owner_email, created_at)
        VALUES (?, ?, ?, ?)
    ''', (org_id, name, owner_email, datetime.now()))
    cursor.execute('''
        INSERT INTO org_members (id, org_id, email, role, joined_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (member_id, org_id, owner_email, 'owner', datetime.now()))
    conn.commit()
    conn.close()
    return org_id

def get_organization_by_email(email: str):
    row = query_db('''
        SELECT o.id, o.name, o.owner_email, o.created_at
        FROM organizations o
        JOIN org_members m ON o.id = m.org_id
        WHERE m.email = ?
    ''', (email,), one=True)
    return dict(row) if row else None

def get_org_members(org_id: str):
    rows = query_db('SELECT * FROM org_members WHERE org_id=?', (org_id,))
    return [dict(r) for r in rows]

def add_org_member(org_id: str, email: str, role: str = 'member'):
    member_id = str(uuid.uuid4())
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO org_members (id, org_id, email, role, joined_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (member_id, org_id, email, role, datetime.now()))
    conn.commit()
    conn.close()

def remove_org_member(org_id: str, email: str):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM org_members WHERE org_id=? AND email=?', (org_id, email))
    conn.commit()
    conn.close()

def generate_invite_code(org_id: str, created_by: str, expires_hours: int = 168) -> str:
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    from datetime import timedelta
    expires_at = datetime.now() + timedelta(hours=expires_hours)
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO org_invite_codes (id, org_id, code, created_by, created_at, expires_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
    ''', (str(uuid.uuid4()), org_id, code, created_by, datetime.now(), expires_at))
    conn.commit()
    conn.close()
    return code

def validate_invite_code(code: str):
    row = query_db('''
        SELECT * FROM org_invite_codes 
        WHERE code = ? AND is_active = 1 AND expires_at > ?
    ''', (code, datetime.now()), one=True)
    return dict(row) if row else None

def join_organization(code: str, email: str):
    code_data = validate_invite_code(code)
    if not code_data:
        return {"error": "Invalid or expired code"}
    org_id = code_data["org_id"]
    existing = query_db('SELECT * FROM org_members WHERE org_id=? AND email=?', (org_id, email), one=True)
    if existing:
        return {"error": "Already a member of this organization"}
    add_org_member(org_id, email, 'member')
    org = query_db('SELECT * FROM organizations WHERE id=?', (org_id,), one=True)
    return {"success": True, "org_id": org_id, "org_name": org["name"] if org else "Unknown"}

def get_org_invite_codes(org_id: str):
    rows = query_db('''
        SELECT * FROM org_invite_codes 
        WHERE org_id=? ORDER BY created_at DESC LIMIT 20
    ''', (org_id,))
    return [dict(r) for r in rows]

def deactivate_invite_code(code_id: str):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('UPDATE org_invite_codes SET is_active=0 WHERE id=?', (code_id,))
    conn.commit()
    conn.close()
