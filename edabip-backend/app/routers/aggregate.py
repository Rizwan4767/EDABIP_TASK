from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import schemas
from app.core.database import get_db
from app.core.options import (
    COMPANY_SIZE_OPTIONS,
    DASHBOARD_ALERT_OPTIONS,
    INDUSTRY_OPTIONS,
    REPORT_UPDATE_OPTIONS,
    TIMEZONE_OPTIONS,
)
from app.core.permissions_catalog import module_options
from app.core.security import CurrentUser, get_current_db_user, get_current_user
from app.models import NotificationPreference, Role, User
from app.routers.integrations import _list_for_user
from app.routers.roles import serialize_role
from app.routers.security import _to_response as _security_response

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/me", response_model=schemas.AllSettingsResponse)
def get_my_settings(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    One-shot payload for the Settings page's initial load: profile,
    notification prefs, security preferences, integration statuses, every
    dropdown's option list (including the module list the Permission Matrix
    renders as columns), and every role with its permission matrix. So the
    frontend doesn't have to fire six requests before it can render.

    `roles` is included for every signed-in user. The Settings page shows
    Roles Overview and the Permission Matrix to every role. Changing a role
    is still a separate write, gated on `roles:write`.
    """
    user = get_current_db_user(db, current_user)

    pref = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == user.id
    ).first()
    if not pref:
        pref = NotificationPreference(user_id=user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)

    integrations_list = _list_for_user(db, user.id)

    roles = db.query(Role).order_by(Role.id).all()
    counts = dict(db.query(User.role_id, func.count(User.id)).group_by(User.role_id).all())
    roles_list = [serialize_role(r, counts.get(r.id, 0)) for r in roles]

    options = schemas.SettingsOptionsResponse(
        timezones=[schemas.OptionItem(**o) for o in TIMEZONE_OPTIONS],
        company_sizes=[schemas.OptionItem(**o) for o in COMPANY_SIZE_OPTIONS],
        industries=[schemas.OptionItem(**o) for o in INDUSTRY_OPTIONS],
        dashboard_alerts=[schemas.OptionItem(**o) for o in DASHBOARD_ALERT_OPTIONS],
        report_updates=[schemas.OptionItem(**o) for o in REPORT_UPDATE_OPTIONS],
        modules=[schemas.ModuleOption(**m) for m in module_options()],
    )

    return schemas.AllSettingsResponse(
        general=user,
        notifications=schemas.NotificationPreferenceResponse(
            dashboard_alerts=pref.dashboard_alerts,
            report_updates=pref.report_updates.value,
            sms_notifications=pref.sms_notifications,
        ),
        security=_security_response(user),
        integrations=integrations_list,
        roles=roles_list,
        options=options,
    )
