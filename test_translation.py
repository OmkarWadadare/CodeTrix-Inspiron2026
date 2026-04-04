# test_translation.py

import requests
import os

BASE = "http://localhost:8000/api"
TEST_FILE = "test_doc.docx"   # make sure this exists in ./uploads/
TARGET_LANG = "Spanish"
TONE = "Formal"

def run():
    # ─────────────────────────────────────────────
    # 1. UPLOAD DOCUMENT
    # ─────────────────────────────────────────────
    with open(f"uploads/{TEST_FILE}", "rb") as f:
        r = requests.post(
            f"{BASE}/upload",
            files={"file": (TEST_FILE, f)}
        )

    print("\n[UPLOAD]")
    print("STATUS:", r.status_code)
    print("RESPONSE:", r.text)
    r.raise_for_status()

    data = r.json()
    session_id = data["session_id"]
    file_type = data["file_type"]
    segments = data["segments"]

    print(f"Session: {session_id}")
    print(f"Segments: {len(segments)}")

    # ─────────────────────────────────────────────
    # 2. VALIDATE SEGMENTS
    # ─────────────────────────────────────────────
    r = requests.post(
        f"{BASE}/validate",
        json={"segments": [s["text"] for s in segments]}
    )

    print("\n[VALIDATE]")
    print("STATUS:", r.status_code)
    print("RESPONSE:", r.text)
    r.raise_for_status()

    issues = r.json()
    print(f"Issues found: {issues['issue_count']}")

    # ─────────────────────────────────────────────
    # 3. TRANSLATE SEGMENTS (TM + AI PIPELINE)
    # ─────────────────────────────────────────────
    r = requests.post(
        f"{BASE}/translate",
        json={
            "segments": [s["text"] for s in segments],
            "target_lang": TARGET_LANG,
            "tone": TONE
        }
    )

    print("\n[TRANSLATE SEGMENTS]")
    print("STATUS:", r.status_code)
    print("RESPONSE:", r.text)
    r.raise_for_status()

    results = r.json()["results"]

    # Optional: preview few translations
    print("\nSample translations:")
    for i, res in enumerate(results[:5]):
        print(f"{i+1}. {res['source']} → {res['translation']}")

    # ─────────────────────────────────────────────
    # 4. FULL DOCUMENT TRANSLATION + REBUILD
    # ─────────────────────────────────────────────
    r = requests.post(
        f"{BASE}/translate-document",
        json={
            "session_id": session_id,
            "file_type": file_type,
            "segments": segments,
            "target_lang": TARGET_LANG,
            "tone": TONE
        }
    )

    print("\n[TRANSLATE DOCUMENT]")
    print("STATUS:", r.status_code)
    print("RESPONSE:", r.text)
    r.raise_for_status()

    download_url = r.json()["download_url"]
    print(f"Download URL: {download_url}")

    # ─────────────────────────────────────────────
    # 5. DOWNLOAD OUTPUT FILE
    # ─────────────────────────────────────────────
    r = requests.get(f"http://localhost:8000{download_url}")

    print("\n[DOWNLOAD]")
    print("STATUS:", r.status_code)

    out_file = f"translated_output.{file_type}"
    with open(out_file, "wb") as f:
        f.write(r.content)

    print(f"Saved: {out_file}")
    print(f"File size: {os.path.getsize(out_file)} bytes")


if __name__ == "__main__":
    run()