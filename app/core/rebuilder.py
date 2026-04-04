"""
rebuilder.py

rebuild_pdf_translated(json_path, translations, output_pdf)
rebuild_docx_translated(json_path, translations, output_docx)

`translations` is a dict mapping segment_id → translated text string.
Any segment_id not present in `translations` falls back to its original text.
"""

"""
rebuilder.py
"""

import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont   # ✅ ADDED

from PIL import Image

from docx import Document
from docx.shared import Pt


# ─────────────────────────────────────────────
#  PDF REBUILDER
# ─────────────────────────────────────────────

FONT_DIR = Path(__file__).parent / "fonts"

FONTS = {
    "latin": FONT_DIR / "NotoSans-Regular.ttf",
    "devanagari": FONT_DIR / "NotoSansDevanagari-Regular.ttf",
    "tamil": FONT_DIR / "NotoSansTamil-Regular.ttf",
    "arabic": FONT_DIR / "NotoSansArabic-Regular.ttf",
    "chinese": FONT_DIR / "NotoSansSC-Regular.ttf",
    "fallback": FONT_DIR / "NotoSansSymbols-Regular.ttf",
}

for name, path in FONTS.items():
    pdfmetrics.registerFont(TTFont(name, str(path)))



def rebuild_pdf_translated(json_path: str, translations: dict, output_pdf: str) -> None:
    json_path = Path(json_path)

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    c = canvas.Canvas(str(output_pdf))

    pages_meta   = data["pages"]
    elements     = data["elements"]
    text_content = data["text_content"]
    assets       = data.get("assets", {})

    num_pages = len(pages_meta)

    for i in range(num_pages):
        page_meta = pages_meta[str(i)] if isinstance(pages_meta, dict) else pages_meta[i]
        pw = page_meta["width"]
        ph = page_meta["height"]

        c.setPageSize((pw, ph))

        flow_items = []

        for el in elements:
            if el["page"] != i:
                continue

            if el["type"] == "text":
                raw_text = translations.get(
                    el["id"],
                    text_content.get(el["id"], "")
                ).strip()

                if not raw_text:
                    continue

                x0, y0, x1, y1 = el["bbox"]
                flags = el.get("flags", 0)

                flow_items.append({
                    "type": "text",
                    "text": raw_text,
                    "x0": x0,
                    "y1": y1,
                    "size": el.get("size", 10),
                    "bold": bool(flags & 2),
                    "italic": bool(flags & 1),
                })

            elif el["type"] == "image":
                asset = assets.get(el["id"])
                if not asset:
                    continue

                flow_items.append({
                    "type": "image",
                    "path": json_path.parent / asset["path"],
                    "x0": el["bbox"][0],
                    "y1": el["bbox"][3],
                    "width": el["bbox"][2] - el["bbox"][0],
                    "height": el["bbox"][3] - el["bbox"][1],
                })

        # SORT by reading order
        flow_items.sort(key=lambda b: (-b["y1"], b["x0"]))

        _draw_flow(c, flow_items, pw, ph)

        c.showPage()

    c.save()
    print(f"[rebuild_pdf_translated] → {output_pdf}")

def _pick_font(text: str) -> str:
    for ch in text:
        code = ord(ch)

        if 0x0900 <= code <= 0x097F:
            return "devanagari"
        elif 0x0B80 <= code <= 0x0BFF:
            return "tamil"
        elif 0x0600 <= code <= 0x06FF:
            return "arabic"
        elif 0x4E00 <= code <= 0x9FFF:
            return "chinese"

    return "latin"

# ─────────────────────────────────────────────
# FLOW ENGINE
# ─────────────────────────────────────────────

def _draw_flow(c, items, page_width, page_height):
    styles = getSampleStyleSheet()

    LEFT = 40
    RIGHT = 40
    TOP = page_height - 40
    BOTTOM = 40

    usable_width = page_width - LEFT - RIGHT
    y_cursor = TOP

    for item in items:

        # ───────── TEXT ─────────
        if item["type"] == "text":
            text = item["text"]

            style = styles["Normal"]
            style.fontName = _pick_font(text)
            style.fontSize = item.get("size", 11)
            style.leading = style.fontSize + 2

            # Detect bullets
            if text.strip().startswith(("•", "-", "*")):
                text = f"&bull; {text.lstrip('•-* ').strip()}"
                style.leftIndent = 10

            para = Paragraph(text, style)
            w, h = para.wrap(usable_width, page_height)

            if y_cursor - h < BOTTOM:
                c.showPage()
                y_cursor = TOP

            para.drawOn(c, LEFT, y_cursor - h)
            y_cursor -= (h + 6)

        # ───────── IMAGE ─────────
        elif item["type"] == "image":
            path = item["path"]

            if not path.exists():
                continue

            try:
                w = item["width"]
                h = item["height"]

                # If image too wide, scale proportionally
                if w > usable_width:
                    scale = usable_width / w
                    w *= scale
                    h *= scale

                # Page break if needed
                if y_cursor - h < BOTTOM:
                    c.showPage()
                    y_cursor = TOP

                c.drawImage(
                    str(path),
                    LEFT,
                    y_cursor - h,
                    width=w,
                    height=h,
                    preserveAspectRatio=True,
                    mask='auto'
                )

                y_cursor -= (h + 10)

            except Exception:
                pass

# ─────────────────────────────────────────────
# FONT HELPER
# ─────────────────────────────────────────────

def _select_reportlab_font(bold: bool, italic: bool) -> str:
    if bold and italic:
        return "Helvetica-BoldOblique"
    if bold:
        return "Helvetica-Bold"
    if italic:
        return "Helvetica-Oblique"
    return "Helvetica"

# ─────────────────────────────────────────────
#  DOCX REBUILDER
# ─────────────────────────────────────────────

def rebuild_docx_translated(json_path: str, translations: dict, output_docx: str) -> None:
    """
    Rebuild a translated DOCX from a segments.json produced by extract_docx_segments().

    Parameters
    ----------
    json_path    : str   Path to segments.json
    translations : dict  {segment_id: translated_text, ...}
    output_docx  : str   Output DOCX path
    """
    json_path = Path(json_path)

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    seg_map = {s["segment_id"]: s for s in data["segments"]}
    assets  = data.get("assets", {})

    doc = Document()

    for elem in data["elements"]:
        etype = elem["type"]

        if etype == "paragraph":
            p = doc.add_paragraph()
            try:
                p.style = elem["style"]
            except KeyError:
                p.style = "Normal"

            for seg_id in elem.get("segment_ids", []):
                if seg_id is None:
                    # Preserve empty run as blank
                    p.add_run("")
                    continue
                seg = seg_map.get(seg_id)
                if seg is None:
                    continue
                text = translations.get(seg_id, seg["text"])
                run = p.add_run(text)
                run.bold      = seg.get("bold", False)
                run.italic    = seg.get("italic", False)
                run.underline = seg.get("underline", False)
                fn = seg.get("font_name") or "Calibri"
                run.font.name = fn
                fs = seg.get("font_size")
                if fs:
                    run.font.size = Pt(fs)

            # Inline images attached to this paragraph
            for img_ref in elem.get("image_refs", []):
                img_path = assets.get(img_ref)
                if img_path and Path(img_path).exists():
                    try:
                        doc.add_picture(img_path)
                    except Exception:
                        pass

        elif etype == "table":
            rows = elem["rows"]
            cols = elem["cols"]
            if rows == 0 or cols == 0:
                continue

            table = doc.add_table(rows=rows, cols=cols)

            for r_idx, row_data in enumerate(elem.get("cells", [])):
                for c_idx, cell_data in enumerate(row_data):
                    cell = table.cell(r_idx, c_idx)
                    cell.text = ""
                    p = cell.paragraphs[0]

                    style = cell_data.get("style")
                    if style:
                        try:
                            p.style = style
                        except KeyError:
                            pass

                    for seg_id in cell_data.get("segment_ids", []):
                        if seg_id is None:
                            p.add_run("")
                            continue
                        seg = seg_map.get(seg_id)
                        if seg is None:
                            continue
                        text = translations.get(seg_id, seg["text"])
                        run = p.add_run(text)
                        run.bold      = seg.get("bold", False)
                        run.italic    = seg.get("italic", False)
                        run.underline = seg.get("underline", False)
                        fn = seg.get("font_name") or "Calibri"
                        run.font.name = fn
                        fs = seg.get("font_size")
                        if fs:
                            run.font.size = Pt(fs)

    doc.save(output_docx)
    print(f"[rebuild_docx_translated] → {output_docx}")