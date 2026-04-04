# app/core/validator.py
import re
from spellchecker import SpellChecker

spell = SpellChecker()

def validate_segments(segments: list[str]) -> list[dict]:
    """
    Returns list of issues per segment with severity: ERROR | WARNING | INFO
    """
    issues = []
    term_freq = {}  # for consistency check

    for i, text in enumerate(segments):
        seg_issues = []

        # 1. Spell check
        words = text.split()
        word_tokens = re.findall(r'\b\w+\b', text)
        misspelled = spell.unknown(word_tokens)
        for w in misspelled:
            seg_issues.append({
                "type": "SPELLING", "severity": "WARNING",
                "detail": f"Possible misspelling: '{w}'",
                "suggestion": spell.correction(w)
            })

        # 2. Double spaces
        if "  " in text:
            seg_issues.append({"type": "FORMATTING", "severity": "INFO",
                                "detail": "Double space detected"})

        # 3. Missing space after punctuation
        if re.search(r'[,\.][A-Za-z]', text):
            seg_issues.append({"type": "PUNCTUATION", "severity": "WARNING",
                                "detail": "Missing space after punctuation"})

        # 4. Inconsistent number formats (mix of 1,000 and 1000)
        if re.search(r'\b\d{4,}\b', text) and re.search(r'\b\d{1,3}(,\d{3})+\b', text):
            seg_issues.append({"type": "FORMATTING", "severity": "INFO",
                                "detail": "Inconsistent number format"})

        # 5. Consistency tracking (same term different case)
        for word in words:
            key = word.lower()
            if key not in term_freq:
                term_freq[key] = set()
            term_freq[key].add(word)

        if seg_issues:
            issues.append({"segment_index": i, "text": text, "issues": seg_issues})

    # 6. Cross-segment consistency
    for key, variants in term_freq.items():
        if len(variants) > 1:
            issues.append({
                "segment_index": -1, "text": "",
                "issues": [{"type": "CONSISTENCY", "severity": "ERROR",
                             "detail": f"Term used inconsistently: {variants}"}]
            })

    return issues