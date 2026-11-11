"""GST split, GSTIN, Indian amount-in-words, and invoice PDF."""
import sys
from datetime import datetime
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from billing.gst import (  # noqa: E402
    amount_in_words_inr,
    format_inr,
    gstin_checksum,
    split_inclusive_gst,
    validate_gstin,
    validate_pincode,
)
from billing.invoice_document import build_gst_snapshot  # noqa: E402
from billing.invoice_pdf import render_invoice_pdf, render_invoices_pdf  # noqa: E402
from billing.models import Invoice, InvoiceStatus  # noqa: E402


def test_inclusive_gst_intra_state_sums_to_total():
    tax = split_inclusive_gst(2_000_000, seller_state_code="29", buyer_state_code="29")
    assert tax.intra_state is True
    assert tax.taxable_cents + tax.cgst_cents + tax.sgst_cents + tax.igst_cents == 2_000_000
    assert tax.igst_cents == 0
    assert tax.cgst_cents + tax.sgst_cents == 2_000_000 - tax.taxable_cents
    assert abs(tax.cgst_cents - tax.sgst_cents) <= 1


def test_inclusive_gst_inter_state_uses_igst():
    tax = split_inclusive_gst(800_000, seller_state_code="29", buyer_state_code="27")
    assert tax.intra_state is False
    assert tax.cgst_cents == 0
    assert tax.sgst_cents == 0
    assert tax.taxable_cents + tax.igst_cents == 800_000
    assert tax.place_of_supply.startswith("Maharashtra")


def test_figma_total_matches_taxable_plus_gst():
    # ₹2,32,432.00 inclusive as in the Figma invoice.
    tax = split_inclusive_gst(23_243_200, seller_state_code="29", buyer_state_code="29")
    assert tax.total_cents == 23_243_200
    assert tax.taxable_cents + tax.cgst_cents + tax.sgst_cents == 23_243_200
    assert format_inr(tax.total_cents) == "₹2,32,432.00"


def test_amount_in_words_indian_numbering():
    assert amount_in_words_inr(23_243_200) == (
        "Indian Rupees Two Lakh Thirty Two Thousand Four Hundred Thirty Two Only"
    )
    assert amount_in_words_inr(2_000_000) == "Indian Rupees Twenty Thousand Only"


def test_gstin_checksum_roundtrip():
    body = "29AABCA1234C1Z"
    gstin = body + gstin_checksum(body)
    assert validate_gstin(gstin) == gstin
    with pytest.raises(ValueError):
        validate_gstin(body + ("0" if gstin[-1] != "0" else "1"))


def test_pincode_rejects_leading_zero():
    assert validate_pincode("560034") == "560034"
    with pytest.raises(ValueError):
        validate_pincode("012345")


def _sample_invoice(number: str, amount_cents: int = 23_243_200) -> Invoice:
    return Invoice(
        invoice_number=number,
        org_id=1,
        subscription_id=1,
        period_start=datetime(2025, 4, 1),
        period_end=datetime(2025, 4, 30, 23, 59, 59),
        issue_date=datetime(2025, 4, 30),
        due_date=datetime(2025, 4, 30),
        amount_cents=amount_cents,
        currency="inr",
        status=InvoiceStatus.PAID,
    )


def _sample_snapshot(invoice: Invoice) -> dict:
    snapshot = build_gst_snapshot(invoice, plan=None, profile=None)
    snapshot["seller"] = {
        "legal_name": "STACKLY Pvt Ltd",
        "address_lines": ["#42, 3rd Floor, Indiranagar", "Bengaluru, Karnataka 560038, India"],
        "gstin": "29AABCE1234F1Z5",
        "email": "accounts@edabip.com",
        "state": "Karnataka",
        "state_code": "29",
    }
    snapshot["buyer"] = {
        "legal_name": "ABC Technologies Pvt Ltd",
        "address_lines": ["123, Business Park, Koramangala", "Bengaluru, Karnataka 560034, India"],
        "gstin": "29AABCA1234C1Z5",
        "email": "finance@abctech.com",
        "state": "Karnataka",
        "state_code": "29",
    }
    return snapshot


def test_pdf_contains_invoice_number_and_tax_invoice_heading():
    invoice = _sample_invoice("INV-2025-00012")
    snapshot = _sample_snapshot(invoice)
    pdf = render_invoice_pdf(invoice, snapshot)
    assert pdf.startswith(b"%PDF")
    assert len(pdf) > 2000
    from billing.invoice_pdf import _LOGO_PATH
    assert _LOGO_PATH.is_file()
    text = pdf.decode("latin-1", errors="ignore")
    assert "TAX INVOICE" in text
    assert "INV-2025-00012" in text
    assert "STACKLY Pvt Ltd" in text
    assert "ABC Technologies Pvt Ltd" in text


def test_combined_pdf_includes_each_selected_invoice():
    first = _sample_invoice("INV-2026-00017", 2_000_000)
    second = _sample_invoice("INV-2026-00018", 800_000)
    pdf = render_invoices_pdf(
        [(first, _sample_snapshot(first)), (second, _sample_snapshot(second))]
    )
    assert pdf.startswith(b"%PDF")
    text = pdf.decode("latin-1", errors="ignore")
    assert "INV-2026-00017" in text
    assert "INV-2026-00018" in text
    assert "/Count 2" in text
    assert text.count("TAX INVOICE") >= 2
