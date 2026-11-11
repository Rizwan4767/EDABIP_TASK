import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.dashboard import DashboardOverview
from services.dashboard_overview import build_dashboard_overview
from utils.auth import get_current_user, require_permission

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "",
    response_model=DashboardOverview,
    response_model_exclude_none=True,
    dependencies=[
        Depends(require_permission("dashboard.view"))
    ],
)
@router.get(
    "/",
    response_model=DashboardOverview,
    response_model_exclude_none=True,
    dependencies=[
        Depends(require_permission("dashboard.view"))
    ],
)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the Dashboard overview for authorized users."""
    try:
        return build_dashboard_overview(db, current_user)
    except Exception as exc:
        logger.exception("Dashboard overview query failed: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Dashboard data temporarily unavailable.",
        ) from exc
