"""Append-only audit helper for the Reports module (BR-RM-007)."""
import json
from typing import Any

from sqlalchemy.orm import Session

from models.reports import ReportAuditLog


def log_report_action(
    db: Session,
    *,
    actor_user_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    details: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> ReportAuditLog:
    """Stage an audit row in the caller's transaction.

    It only add()s and flush()es - the caller commits - so the audit row and the
    change it describes commit or roll back together: nothing is logged that did
    not happen, and nothing that happened goes unlogged. actor_user_id=None means
    the platform itself (scheduler, generation worker, retention job).
    """
    entry = ReportAuditLog(
        actor_user_id=actor_user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=json.dumps(details, default=str, sort_keys=True) if details else None,
        ip_address=ip_address,
    )
    db.add(entry)
    db.flush()
    return entry
