"""Render the Figma tax-invoice layout as a self-hosted PDF.

Layout follows the reports-screen invoice (node 236:3134): teal header,
amount-paid band, Issued by / Billed to cards, period meta, charges,
GST split, total payable, amount in words.
"""
from __future__ import annotations

from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Any

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from billing.gst import amount_in_words_inr, format_inr
from billing.models import Invoice

HEADER = HexColor("#0F5C58")
HEADER_DEEP = HexColor("#0C4F4B")
MINT = HexColor("#E7F1EF")
MINT_DEEP = HexColor("#DCEAE8")
INK = HexColor("#1C2B2A")
MUTED = HexColor("#5E7371")
LABEL = HexColor("#7A9A97")
PAID = HexColor("#1F9D64")
PENDING = HexColor("#C47B16")
OVERDUE = HexColor("#C0392B")
RULE = HexColor("#D5E3E1")
PAGE = HexColor("#F4F6F5")

_ASSETS = Path(__file__).resolve().parent / "assets"
_LOGO_PATH = _ASSETS / "edabip-wordmark.png"
_LOGO_ASPECT = 1072 / 408
_LOGO_HEIGHT = 24

_FONT_REG = "InvoiceSans"
_FONT_BOLD = "InvoiceSans-Bold"
_FONTS_READY = False


def _register_fonts() -> None:
    global _FONTS_READY
    if _FONTS_READY:
        return
    candidates = [
        (
            r"C:\Windows\Fonts\segoeui.ttf",
            r"C:\Windows\Fonts\segoeuib.ttf",
        ),
        (
            r"C:\Windows\Fonts\arial.ttf",
            r"C:\Windows\Fonts\arialbd.ttf",
        ),
        (
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ),
        (
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        ),
        (
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        ),
    ]
    for regular, bold in candidates:
        if Path(regular).is_file() and Path(bold).is_file():
            pdfmetrics.registerFont(TTFont(_FONT_REG, regular))
            pdfmetrics.registerFont(TTFont(_FONT_BOLD, bold))
            _FONTS_READY = True
            return
    _FONTS_READY = True  # fall back to Helvetica below


def _font(bold: bool = False) -> str:
    _register_fonts()
    wanted = _FONT_BOLD if bold else _FONT_REG
    if wanted in pdfmetrics.getRegisteredFontNames():
        return wanted
    return "Helvetica-Bold" if bold else "Helvetica"


def _status_color(status: str):
    value = (status or "").lower()
    if value == "paid":
        return PAID
    if value == "overdue":
        return OVERDUE
    return PENDING


def _round_rect(c: canvas.Canvas, x, y, w, h, r, fill=None, stroke=None, width=0.6):
    c.saveState()
    if fill is not None:
        c.setFillColor(fill)
    if stroke is not None:
        c.setStrokeColor(stroke)
        c.setLineWidth(width)
    c.roundRect(x, y, w, h, r, fill=1 if fill is not None else 0, stroke=1 if stroke is not None else 0)
    c.restoreState()


def _draw_logo(c: canvas.Canvas, x: float, y: float) -> None:
    """Official EDABIP mark + wordmark (white type for the teal header)."""
    height = _LOGO_HEIGHT
    width = height * _LOGO_ASPECT
    if _LOGO_PATH.is_file():
        c.drawImage(
            ImageReader(str(_LOGO_PATH)),
            x,
            y,
            width=width,
            height=height,
            mask="auto",
            preserveAspectRatio=True,
            anchor="sw",
        )
        return
    c.setFillColor(white)
    c.setFont(_font(True), 16)
    c.drawString(x, y + 6, "EDABIP")


def _wrapped(c: canvas.Canvas, text: str, font: str, size: float, max_width: float) -> list[str]:
    c.setFont(font, size)
    words = (text or "").split()
    if not words:
        return []
    lines, current = [], words[0]
    for word in words[1:]:
        trial = f"{current} {word}"
        if c.stringWidth(trial, font, size) <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def _party_card(c, x, y, w, h, eyebrow, party: dict[str, Any]) -> None:
    _round_rect(c, x, y, w, h, 12, fill=white, stroke=RULE, width=0.8)
    c.setFillColor(HexColor("#3F9694"))
    c.setFont(_font(True), 8)
    c.drawString(x + 16, y + h - 22, eyebrow)
    c.setFillColor(INK)
    c.setFont(_font(True), 11)
    name = party.get("legal_name") or "—"
    c.drawString(x + 16, y + h - 40, name)
    c.setFillColor(MUTED)
    c.setFont(_font(False), 8.5)
    text_y = y + h - 56
    for line in party.get("address_lines") or []:
        c.drawString(x + 16, text_y, line)
        text_y -= 12
    gstin = party.get("gstin")
    if gstin:
        c.drawString(x + 16, text_y, f"GSTIN  {gstin}")
        text_y -= 12
    email = party.get("email")
    if email:
        c.drawString(x + 16, text_y, email)


def _format_date(value: datetime) -> str:
    return f"{value:%d %b %Y}"


def _format_period(start: datetime, end: datetime) -> str:
    if start.month == end.month and start.year == end.year:
        return f"{start.day} {start:%b} – {end.day} {end:%b %Y}"
    return f"{start:%d %b %Y} – {end:%d %b %Y}"


def _draw_invoice_page(c: canvas.Canvas, invoice: Invoice, snapshot: dict[str, Any]) -> None:
    width, height = A4
    margin = 28
    card_x = margin
    card_w = width - margin * 2
    card_y = 36
    card_h = height - 72
    _round_rect(c, 0, 0, width, height, 0, fill=PAGE)
    _round_rect(c, card_x, card_y, card_w, card_h, 18, fill=white)

    header_h = 96
    header_y = card_y + card_h - header_h
    c.saveState()
    c.setFillColor(HEADER)
    path = c.beginPath()
    path.moveTo(card_x, header_y)
    path.lineTo(card_x + card_w, header_y)
    path.lineTo(card_x + card_w, header_y + header_h - 18)
    path.arcTo(card_x + card_w - 36, header_y + header_h - 36, card_x + card_w, header_y + header_h, 0, 90)
    path.lineTo(card_x + 18, header_y + header_h)
    path.arcTo(card_x, header_y + header_h - 36, card_x + 36, header_y + header_h, 90, 90)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    c.restoreState()

    _draw_logo(c, card_x + 28, header_y + 54)
    c.setFillColor(white)
    c.setFont(_font(True), 16)
    c.drawRightString(card_x + card_w - 28, header_y + 62, "TAX INVOICE")
    c.setFont(_font(False), 9)
    c.setFillColor(HexColor("#C5E4E1"))
    c.drawRightString(card_x + card_w - 28, header_y + 46, invoice.invoice_number)

    status = (invoice.status.value if hasattr(invoice.status, "value") else invoice.status) or "pending"
    badge = status.upper()
    badge_color = _status_color(status)
    badge_w = 58
    badge_h = 16
    badge_x = card_x + card_w - 28 - badge_w
    _round_rect(c, badge_x, header_y + 24, badge_w, badge_h, 8, fill=white)
    c.setFillColor(badge_color)
    c.circle(badge_x + 10, header_y + 32, 3.2, fill=1, stroke=0)
    c.setFont(_font(True), 7.5)
    c.drawString(badge_x + 16, header_y + 29, badge)

    band_h = 58
    band_y = header_y - band_h
    c.setFillColor(HEADER_DEEP)
    c.rect(card_x, band_y, card_w, band_h, fill=1, stroke=0)

    tax = snapshot.get("tax") or {}
    total_cents = int(tax.get("total_cents") or invoice.amount_cents)
    provider = snapshot.get("payment_provider_label") or "Razorpay"
    c.setFillColor(HexColor("#8FBFBB"))
    c.setFont(_font(True), 7.5)
    c.drawString(card_x + 28, band_y + 36, "AMOUNT PAID")
    c.setFillColor(HexColor("#D5EDEB"))
    c.setFont(_font(False), 8)
    paid_line = f"{_format_date(invoice.issue_date)}  ·  {provider}  ·  GST invoice"
    c.drawString(card_x + 28, band_y + 18, paid_line)
    c.setFillColor(white)
    c.setFont(_font(True), 20)
    c.drawRightString(card_x + card_w - 28, band_y + 20, format_inr(total_cents))

    inner_x = card_x + 22
    inner_w = card_w - 44
    gap = 12
    party_h = 132
    party_y = band_y - 16 - party_h
    party_w = (inner_w - gap) / 2
    _party_card(c, inner_x, party_y, party_w, party_h, "ISSUED BY", snapshot.get("seller") or {})
    _party_card(
        c, inner_x + party_w + gap, party_y, party_w, party_h, "BILLED TO", snapshot.get("buyer") or {}
    )

    meta_h = 58
    meta_y = party_y - 14 - meta_h
    _round_rect(c, inner_x, meta_y, inner_w, meta_h, 12, fill=MINT)
    meta_cols = [
        ("BILLING PERIOD", _format_period(invoice.period_start, invoice.period_end)),
        ("DUE DATE", _format_date(invoice.due_date)),
        ("PLACE OF SUPPLY", snapshot.get("place_of_supply") or "—"),
        ("SAC", f"{snapshot.get('sac_code') or '998314'}  ·  {snapshot.get('sac_label') or 'SaaS'}"),
    ]
    col_w = inner_w / 4
    for index, (label, value) in enumerate(meta_cols):
        mx = inner_x + col_w * index + 14
        c.setFillColor(LABEL)
        c.setFont(_font(True), 6.5)
        c.drawString(mx, meta_y + 36, label)
        c.setFillColor(INK)
        c.setFont(_font(True), 8.5)
        for line_i, line in enumerate(_wrapped(c, value, _font(True), 8.5, col_w - 24)[:2]):
            c.drawString(mx, meta_y + 20 - line_i * 11, line)

    c.setFillColor(INK)
    c.setFont(_font(True), 11)
    charges_top = meta_y - 28
    c.drawString(inner_x, charges_top, "Charges")

    line = snapshot.get("line") or {}
    charge_h = 78
    charge_y = charges_top - 14 - charge_h
    _round_rect(c, inner_x, charge_y, inner_w, charge_h, 12, fill=white, stroke=RULE)
    c.setFillColor(INK)
    c.setFont(_font(True), 10.5)
    c.drawString(inner_x + 16, charge_y + 50, line.get("name") or "EDABIP Plan")
    c.setFont(_font(True), 10.5)
    taxable = int(tax.get("taxable_cents") or 0)
    c.drawRightString(inner_x + inner_w - 16, charge_y + 50, format_inr(taxable))
    c.setFillColor(MUTED)
    c.setFont(_font(False), 8)
    desc_lines = _wrapped(c, line.get("description") or "", _font(False), 8, inner_w - 160)
    for i, desc in enumerate(desc_lines[:2]):
        c.drawString(inner_x + 16, charge_y + 34 - i * 11, desc)

    chip_y = charge_y + 12
    chips = [
        f"SAC {snapshot.get('sac_code') or '998314'}",
        f"Qty {line.get('qty') or 1}",
        line.get("cycle_label") or "",
    ]
    chip_x = inner_x + 16
    for chip in chips:
        if not chip:
            continue
        chip_w = c.stringWidth(chip, _font(False), 7) + 14
        _round_rect(c, chip_x, chip_y, chip_w, 14, 7, fill=MINT)
        c.setFillColor(HexColor("#3F6F6C"))
        c.setFont(_font(False), 7)
        c.drawString(chip_x + 7, chip_y + 4, chip)
        chip_x += chip_w + 6

    rows_y = charge_y - 22
    c.setFont(_font(False), 9)
    rows = [("Taxable value", taxable)]
    if int(tax.get("cgst_cents") or 0) or int(tax.get("sgst_cents") or 0):
        seller_state = (snapshot.get("seller") or {}).get("state") or "Karnataka"
        rows.append((f"CGST @ 9%  ({seller_state})", int(tax.get("cgst_cents") or 0)))
        rows.append((f"SGST @ 9%  ({seller_state})", int(tax.get("sgst_cents") or 0)))
    if int(tax.get("igst_cents") or 0):
        rows.append(("IGST @ 18%", int(tax.get("igst_cents") or 0)))
    for label, cents in rows:
        c.setFillColor(MUTED)
        c.drawString(inner_x + 8, rows_y, label)
        c.setFillColor(INK)
        c.drawRightString(inner_x + inner_w - 8, rows_y, format_inr(cents))
        rows_y -= 16

    total_h = 36
    total_y = rows_y - 10 - total_h
    _round_rect(c, inner_x, total_y, inner_w, total_h, 10, fill=HEADER)
    c.setFillColor(white)
    c.setFont(_font(True), 10)
    c.drawString(inner_x + 16, total_y + 13, "Total payable")
    c.setFont(_font(True), 12)
    c.drawRightString(inner_x + inner_w - 16, total_y + 12, format_inr(total_cents))

    words_h = 44
    words_y = total_y - 14 - words_h
    _round_rect(c, inner_x, words_y, inner_w, words_h, 12, fill=MINT)
    c.setFillColor(LABEL)
    c.setFont(_font(True), 6.5)
    c.drawString(inner_x + 16, words_y + 28, "AMOUNT IN WORDS")
    c.setFillColor(INK)
    c.setFont(_font(True), 8.5)
    words = amount_in_words_inr(total_cents)
    for i, line_text in enumerate(_wrapped(c, words, _font(True), 8.5, inner_w - 32)[:2]):
        c.drawString(inner_x + 16, words_y + 14 - i * 11, line_text)

    c.setFillColor(MUTED)
    c.setFont(_font(False), 7)
    c.drawCentredString(
        width / 2,
        card_y + 14,
        "This is a computer-generated GST tax invoice. No signature is required.",
    )


def render_invoices_pdf(pages: list[tuple[Invoice, dict[str, Any]]]) -> bytes:
    if not pages:
        raise ValueError("No invoices to render.")
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4, pageCompression=0)
    first = pages[0][0]
    title = (
        f"{first.invoice_number} Tax Invoice"
        if len(pages) == 1
        else f"EDABIP tax invoices ({len(pages)})"
    )
    c.setTitle(title)
    c.setAuthor("EDABIP")
    c.setSubject("GST tax invoice")
    for invoice, snapshot in pages:
        _draw_invoice_page(c, invoice, snapshot)
        c.showPage()
    c.save()
    return buffer.getvalue()


def render_invoice_pdf(invoice: Invoice, snapshot: dict[str, Any]) -> bytes:
    return render_invoices_pdf([(invoice, snapshot)])
