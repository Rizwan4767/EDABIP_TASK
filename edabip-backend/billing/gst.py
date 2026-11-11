"""GST helpers for EDABIP tax invoices.

Plan prices are GST-inclusive. 18% GST is split as CGST+SGST when the
buyer and seller are in the same state, or IGST when they are not.
Place of supply follows the buyer's GSTIN state code, then their
address state, then the seller's state.

Money stays in integer paise. Rounding is half-up so taxable + tax
always equals the invoice total.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

GST_RATE_PERCENT = Decimal("18")
CGST_RATE_PERCENT = Decimal("9")
SGST_RATE_PERCENT = Decimal("9")
IGST_RATE_PERCENT = GST_RATE_PERCENT
SAC_CODE = "998314"
SAC_LABEL = "SaaS"

GSTIN_PATTERN = re.compile(
    r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$"
)
PINCODE_PATTERN = re.compile(r"^[1-9][0-9]{5}$")
_GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

# GSTIN first two digits → state. Codes current as of GSTN 2024.
GST_STATES: dict[str, str] = {
    "01": "Jammu and Kashmir",
    "02": "Himachal Pradesh",
    "03": "Punjab",
    "04": "Chandigarh",
    "05": "Uttarakhand",
    "06": "Haryana",
    "07": "Delhi",
    "08": "Rajasthan",
    "09": "Uttar Pradesh",
    "10": "Bihar",
    "11": "Sikkim",
    "12": "Arunachal Pradesh",
    "13": "Nagaland",
    "14": "Manipur",
    "15": "Mizoram",
    "16": "Tripura",
    "17": "Meghalaya",
    "18": "Assam",
    "19": "West Bengal",
    "20": "Jharkhand",
    "21": "Odisha",
    "22": "Chhattisgarh",
    "23": "Madhya Pradesh",
    "24": "Gujarat",
    "26": "Dadra and Nagar Haveli and Daman and Diu",
    "27": "Maharashtra",
    "29": "Karnataka",
    "30": "Goa",
    "31": "Lakshadweep",
    "32": "Kerala",
    "33": "Tamil Nadu",
    "34": "Puducherry",
    "35": "Andaman and Nicobar Islands",
    "36": "Telangana",
    "37": "Andhra Pradesh",
    "38": "Ladakh",
    "97": "Other Territory",
    "99": "Centre Jurisdiction",
}

_STATE_NAME_TO_CODE = {name.casefold(): code for code, name in GST_STATES.items()}
_STATE_NAME_TO_CODE.update(
    {
        "karnataka": "29",
        "bangalore": "29",
        "bengaluru": "29",
        "maharashtra": "27",
        "delhi": "07",
        "nct of delhi": "07",
        "tamil nadu": "33",
        "telangana": "36",
        "andhra pradesh": "37",
        "west bengal": "19",
        "gujarat": "24",
        "rajasthan": "08",
        "uttar pradesh": "09",
        "madhya pradesh": "23",
        "kerala": "32",
        "odisha": "21",
        "orissa": "21",
        "punjab": "03",
        "haryana": "06",
        "bihar": "10",
        "jharkhand": "20",
        "assam": "18",
        "goa": "30",
        "chhattisgarh": "22",
        "uttarakhand": "05",
        "himachal pradesh": "02",
        "jammu and kashmir": "01",
        "ladakh": "38",
        "puducherry": "34",
        "pondicherry": "34",
        "chandigarh": "04",
    }
)

_ONES = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
]
_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]


@dataclass(frozen=True)
class TaxSplit:
    taxable_cents: int
    cgst_cents: int
    sgst_cents: int
    igst_cents: int
    total_cents: int
    intra_state: bool
    seller_state_code: str
    buyer_state_code: str
    place_of_supply: str

    @property
    def gst_cents(self) -> int:
        return self.cgst_cents + self.sgst_cents + self.igst_cents


def _round_half_up(value: Decimal) -> int:
    return int(value.to_integral_value(rounding=ROUND_HALF_UP))


def cents_to_amount(cents: int) -> float:
    return float((Decimal(cents) / Decimal(100)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def format_inr(cents: int) -> str:
    """₹12,34,567.00 using Indian grouping."""
    amount = cents_to_amount(cents)
    rupees, paise = f"{amount:.2f}".split(".")
    negative = rupees.startswith("-")
    digits = rupees.lstrip("-")
    if len(digits) <= 3:
        grouped = digits
    else:
        last3 = digits[-3:]
        rest = digits[:-3]
        chunks = []
        while rest:
            chunks.append(rest[-2:])
            rest = rest[:-2]
        grouped = ",".join(reversed(chunks)) + "," + last3
    return f"{'-' if negative else ''}₹{grouped}.{paise}"


def gstin_checksum(body14: str) -> str:
    factor = 1
    total = 0
    for char in body14.upper():
        code = _GSTIN_CHARS.index(char)
        product = factor * code
        factor = 2 if factor == 1 else 1
        total += product // 36 + product % 36
    return _GSTIN_CHARS[(36 - (total % 36)) % 36]


def normalize_gstin(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = re.sub(r"[\s-]", "", value).upper()
    return cleaned or None


def validate_gstin(value: str) -> str:
    gstin = normalize_gstin(value)
    if not gstin or not GSTIN_PATTERN.match(gstin):
        raise ValueError("Enter a valid 15-character GSTIN.")
    if gstin[:2] not in GST_STATES:
        raise ValueError("GSTIN state code is not recognised.")
    if gstin_checksum(gstin[:14]) != gstin[14]:
        raise ValueError("GSTIN checksum is invalid.")
    return gstin


def validate_pincode(value: str) -> str:
    cleaned = (value or "").strip()
    if not PINCODE_PATTERN.match(cleaned):
        raise ValueError("Enter a valid 6-digit PIN code.")
    return cleaned


def state_code_from_gstin(gstin: str) -> str:
    return gstin[:2]


def state_name(code: str) -> str:
    return GST_STATES.get(code, "Unknown")


def state_code_from_name(name: str) -> Optional[str]:
    if not name:
        return None
    trimmed = name.strip()
    if trimmed in GST_STATES:
        return trimmed
    return _STATE_NAME_TO_CODE.get(trimmed.casefold())


def place_of_supply_label(state_code: str) -> str:
    return f"{state_name(state_code)} ({state_code})"


def split_inclusive_gst(
    amount_cents: int,
    *,
    seller_state_code: str,
    buyer_state_code: str,
) -> TaxSplit:
    """Break an inclusive total into taxable value + GST.

    The extra paise from an odd GST amount is assigned to CGST so the
    two 9% legs still sum to the 18% remainder (same treatment as the
    Figma invoice's .38 / .37 split).
    """
    total = max(int(amount_cents), 0)
    seller = seller_state_code.zfill(2)
    buyer = buyer_state_code.zfill(2)
    intra = seller == buyer
    if total == 0:
        return TaxSplit(0, 0, 0, 0, 0, intra, seller, buyer, place_of_supply_label(buyer))

    divisor = Decimal(1) + (GST_RATE_PERCENT / Decimal(100))
    taxable = _round_half_up(Decimal(total) / divisor)
    gst = total - taxable
    if intra:
        cgst = (gst + 1) // 2
        sgst = gst - cgst
        igst = 0
    else:
        cgst = 0
        sgst = 0
        igst = gst
    return TaxSplit(
        taxable_cents=taxable,
        cgst_cents=cgst,
        sgst_cents=sgst,
        igst_cents=igst,
        total_cents=total,
        intra_state=intra,
        seller_state_code=seller,
        buyer_state_code=buyer,
        place_of_supply=place_of_supply_label(buyer),
    )


def _chunk_to_words(value: int) -> str:
    if value < 20:
        return _ONES[value]
    if value < 100:
        tens, ones = divmod(value, 10)
        return f"{_TENS[tens]} {_ONES[ones]}".strip()
    hundreds, rest = divmod(value, 100)
    if rest:
        return f"{_ONES[hundreds]} Hundred {_chunk_to_words(rest)}"
    return f"{_ONES[hundreds]} Hundred"


def _rupees_to_words(rupees: int) -> str:
    if rupees == 0:
        return "Zero"
    parts = []
    crore, rupees = divmod(rupees, 10_000_000)
    lakh, rupees = divmod(rupees, 100_000)
    thousand, rupees = divmod(rupees, 1000)
    if crore:
        parts.append(f"{_chunk_to_words(crore)} Crore")
    if lakh:
        parts.append(f"{_chunk_to_words(lakh)} Lakh")
    if thousand:
        parts.append(f"{_chunk_to_words(thousand)} Thousand")
    if rupees:
        parts.append(_chunk_to_words(rupees))
    return " ".join(parts)


def amount_in_words_inr(cents: int) -> str:
    amount = Decimal(cents).copy_abs() / Decimal(100)
    rupees = int(amount)
    paise = int((amount - rupees) * 100)
    prefix = "Negative " if cents < 0 else ""
    words = f"{prefix}Indian Rupees {_rupees_to_words(rupees)}"
    if paise:
        words += f" and {_chunk_to_words(paise)} Paise"
    return f"{words} Only"


def state_options() -> list[dict[str, str]]:
    return [
        {"code": code, "name": name}
        for code, name in sorted(GST_STATES.items(), key=lambda item: item[1])
        if code not in {"97", "99"}
    ]
