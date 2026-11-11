"""Protected examples showing action-level RBAC permissions."""

from fastapi import APIRouter, Depends

from utils.auth import require_permission


router = APIRouter(
    prefix="/rbac-demo",
    tags=["RBAC Examples"],
)


@router.get(
    "/dashboard",
    dependencies=[
        Depends(require_permission("dashboard.view"))
    ],
)
def view_dashboard():
    return {
        "message": "Dashboard is visible to users with dashboard.view"
    }


@router.post(
    "/reports",
    dependencies=[
        Depends(require_permission("reports.create"))
    ],
)
def create_report():
    return {
        "message": "Report creation allowed"
    }


@router.put(
    "/reports/{report_id}",
    dependencies=[
        Depends(require_permission("reports.edit"))
    ],
)
def edit_report(report_id: int):
    return {
        "message": "Report edit allowed",
        "report_id": report_id,
    }


@router.delete(
    "/reports/{report_id}",
    dependencies=[
        Depends(require_permission("reports.delete"))
    ],
)
def delete_report(report_id: int):
    return {
        "message": "Report deletion allowed",
        "report_id": report_id,
    }


@router.get(
    "/data",
    dependencies=[
        Depends(require_permission("data.view"))
    ],
)
def view_data():
    return {
        "message": "Data view allowed"
    }
