from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.core.database import get_db
from app.core.lookups import get_user_or_404
from app.core.security import CurrentUser, get_current_db_user, get_current_user, require_permission
from app.models import NotificationPreference, ReportFrequency

router = APIRouter(prefix="/settings/notifications", tags=["Notification Preferences"])

_VALID_REPORT_FREQUENCIES = {f.value for f in ReportFrequency}


def _get_or_create(db: Session, user_id: int) -> NotificationPreference:
    get_user_or_404(db, user_id)

    pref = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == user_id
    ).first()
    if not pref:
        pref = NotificationPreference(user_id=user_id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


def _to_response(pref: NotificationPreference) -> schemas.NotificationPreferenceResponse:
    return schemas.NotificationPreferenceResponse(
        dashboard_alerts=pref.dashboard_alerts,
        report_updates=pref.report_updates.value,
        sms_notifications=pref.sms_notifications,
    )


def _apply_update(
    pref: NotificationPreference, payload: schemas.NotificationPreferenceUpdate, db: Session
) -> schemas.NotificationPreferenceResponse:
    data = payload.model_dump(exclude_unset=True)

    if "dashboard_alerts" in data:
        pref.dashboard_alerts = data["dashboard_alerts"]
    if "sms_notifications" in data:
        pref.sms_notifications = data["sms_notifications"]
    if "report_updates" in data:
        if data["report_updates"] not in _VALID_REPORT_FREQUENCIES:
            raise HTTPException(
                status_code=422,
                detail=f"report_updates must be one of {sorted(_VALID_REPORT_FREQUENCIES)}",
            )
        pref.report_updates = ReportFrequency(data["report_updates"])

    db.commit()
    db.refresh(pref)
    return _to_response(pref)


@router.get("/me", response_model=schemas.NotificationPreferenceResponse)
def get_my_notification_preferences(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return _to_response(_get_or_create(db, get_current_db_user(db, current_user).id))


@router.put("/me", response_model=schemas.NotificationPreferenceResponse)
def update_my_notification_preferences(
    payload: schemas.NotificationPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    pref = _get_or_create(db, get_current_db_user(db, current_user).id)
    return _apply_update(pref, payload, db)


@router.get(
    "/{user_id}",
    response_model=schemas.NotificationPreferenceResponse,
    dependencies=[Depends(require_permission("users:read"))],
)
def get_notification_preferences(user_id: int, db: Session = Depends(get_db)):
    return _to_response(_get_or_create(db, user_id))


@router.put(
    "/{user_id}",
    response_model=schemas.NotificationPreferenceResponse,
    dependencies=[Depends(require_permission("users:write"))],
)
def update_notification_preferences(
    user_id: int, payload: schemas.NotificationPreferenceUpdate, db: Session = Depends(get_db)
):
    pref = _get_or_create(db, user_id)
    return _apply_update(pref, payload, db)
