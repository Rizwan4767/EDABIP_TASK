"""Map API first/last name to the users.full_name column without a DB import."""
from typing import Optional


def compose_full_name(first_name: Optional[str], last_name: Optional[str]) -> str:
    return " ".join(
        part for part in [(first_name or "").strip(), (last_name or "").strip()]
        if part
    ).strip()


def split_full_name(full_name: Optional[str]) -> tuple[str, str]:
    parts = (full_name or "").strip().split(None, 1)
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], parts[1]
