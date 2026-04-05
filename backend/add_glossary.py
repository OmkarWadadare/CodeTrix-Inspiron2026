import sqlite3
import uuid
from datetime import datetime

def add_test_glossary():
    conn = sqlite3.connect('translation_engine.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO glossary_entries (id, source_lang, target_lang, source_term, target_term, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (str(uuid.uuid4()), 'en', 'hi', 'Artificial Intelligence', 'कृत्रिम होशियारी', datetime.now()))
    
    conn.commit()
    conn.close()
    print("Glossary term added successfully!")

if __name__ == "__main__":
    add_test_glossary()