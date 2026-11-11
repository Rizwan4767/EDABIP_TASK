import re
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from models.reports import (
    ReportFileFormat,
    ReportFrequency,
    ReportGenerationStatus,
    ReportTriggerType,
    ScheduledReportStatus,
)

_FILTER_VALUE = re.compile(r"^[A-Za-z0-9 &._-]{1,60}$")


class ReportParameters(BaseModel):
    """Optional report parameters (AC-RM-011). Unknown keys are rejected with a 422.

    Which of these a template accepts depends on its category; the router checks
    that (services.report_providers.validate_parameters) and answers 422 with the
    unsupported filter's name.
    """

    model_config = ConfigDict(extra="forbid")

    date_from: date | None = None
    date_to: date | None = None
    region: str | None = None
    segment: str | None = None
    product_category: str | None = None
    forecast_months: int | None = Field(default=None, ge=1, le=12)

    @field_validator("region", "segment", "product_category")
    @classmethod
    def _clean_text(cls, value):
        if value is None:
            return None
        value = value.strip()
        if not _FILTER_VALUE.match(value):
            raise ValueError("contains invalid characters")
        return value


class ReportTemplateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    description: str | None = None
    is_active: bool
    default_format: ReportFileFormat = ReportFileFormat.CSV
    supported_formats: list[ReportFileFormat] = list(ReportFileFormat)
    default_parameters: dict = {}
    supported_parameters: list[str] = []
    is_restricted: bool = False
    version: int = 1
    approval_status: str = "approved"
    updated_at: datetime | None = None


class TemplatePreviewOut(BaseModel):
    template_id: int
    name: str
    parameters: dict
    columns: list[str]
    rows: list[list[str]]
    truncated: bool


class TopTemplateOut(BaseModel):
    template_id: int
    name: str
    category: str
    is_active: bool
    usage_count: int
    last_used_at: datetime | None = None


class ReportGenerateIn(BaseModel):
    template_id: int | None = None                   # required; checked in the router for a friendly message
    file_format: ReportFileFormat | None = None     # None -> the template's default format
    report_name: str | None = Field(default=None, min_length=1, max_length=150)
    parameters: ReportParameters | None = None
    scheduled: bool = False
    frequency: ReportFrequency | None = None
    next_run_time: datetime | None = None
    interval_days: int | None = Field(default=None, ge=1, le=366)   # frequency=custom only
    timezone: str | None = Field(default=None, max_length=64)       # default: the caller's own setting
    recipients: list[EmailStr] = Field(default_factory=list, max_length=20)


class ReportGenerateOut(BaseModel):
    history_id: int | None = None
    scheduled_report_id: int | None = None
    status: str
    message: str
    next_run_time: datetime | None = None
    next_run_time_local: str | None = None


class ReportHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    template_id: int | None = None
    report_name: str
    report_type: str | None = None               # the template's category ("Module" column)
    trigger_type: ReportTriggerType
    trigger_label: str
    generated_by: int
    generated_by_name: str | None = None
    status: ReportGenerationStatus
    status_label: str                            # Processing / Completed / Failed / Cancelled
    progress_percent: int = 0
    file_format: ReportFileFormat
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    duration_seconds: float | None = None
    failure_reason: str | None = None
    can_download: bool = False
    can_retry: bool = False
    can_cancel: bool = False
    schedule_id: int | None = None
    retry_of_id: int | None = None
    is_archived: bool = False
    parameters: dict = {}


class ScheduledReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    template_id: int
    name: str | None = None
    report_name: str | None = None               # name, falling back to the template's
    report_type: str | None = None
    frequency: ReportFrequency
    interval_days: int | None = None
    file_format: ReportFileFormat
    next_run_time: datetime
    next_run_time_local: str | None = None
    timezone: str = "UTC"
    owner_id: int
    owner_name: str | None = None
    status: ScheduledReportStatus
    display_status: str = "scheduled"            # scheduled / processing / completed / failed / paused
    last_run_at: datetime | None = None
    last_run_status: ReportGenerationStatus | None = None
    last_completed_history_id: int | None = None  # what the Download buttons point at
    recipients: list[str] = []
    parameters: dict = {}
    created_at: datetime | None = None


class ScheduledReportUpdateIn(BaseModel):
    """Edit a schedule. Only the fields sent are changed."""

    model_config = ConfigDict(extra="forbid")

    report_name: str | None = Field(default=None, min_length=1, max_length=150)
    file_format: ReportFileFormat | None = None
    frequency: ReportFrequency | None = None
    interval_days: int | None = Field(default=None, ge=1, le=366)
    next_run_time: datetime | None = None
    timezone: str | None = Field(default=None, max_length=64)
    recipients: list[EmailStr] | None = Field(default=None, max_length=20)
    parameters: ReportParameters | None = None


class PaginatedResponse(BaseModel):
    items: list
    page: int
    page_size: int
    total: int
    message: str | None = None                       # e.g. "No matching reports found." when total is 0


class MessageOut(BaseModel):
    message: str


# --- dashboard ----------------------------------------------------------------
class MetricOut(BaseModel):
    value: float | int | None = None
    previous: float | int | None = None
    change_percent: float | None = None
    label: str | None = None                         # display text, e.g. "350 ms" or "02 : 35 mins"


class TrendOut(BaseModel):
    """Parallel arrays for the mini graphs: values[i] belongs to buckets[i]."""

    granularity: Literal["day", "month"]
    buckets: list[str]
    total_reports: list[int]
    completed: list[int]
    failed: list[int]
    scheduled: list[int]                             # schedules created in that bucket
    avg_run_time_seconds: list[float | None]


class RangeOut(BaseModel):
    key: str
    start: datetime
    end: datetime


class ReportSummaryOut(BaseModel):
    generated_at: datetime
    range: RangeOut
    category: str | None = None
    total_reports: MetricOut
    completed: MetricOut
    failed: MetricOut
    scheduled: MetricOut
    in_progress: int
    avg_run_time_seconds: MetricOut
    trend: TrendOut


class TypeTotalOut(BaseModel):
    type: ReportTriggerType
    label: str
    count: int


class TypeDistributionOut(BaseModel):
    range: RangeOut
    category: str | None = None
    totals: list[TypeTotalOut]
    monthly: list[dict]


class StatusShareOut(BaseModel):
    key: str
    label: str
    count: int
    percent: float


class StatusDistributionOut(BaseModel):
    range: RangeOut
    category: str | None = None
    total: int
    items: list[StatusShareOut]


SortOrder = Literal["asc", "desc"]


class BulkDeleteIn(BaseModel):
    ids: list[int] = Field(min_length=1, max_length=200)


class BulkSkipped(BaseModel):
    id: int
    reason: str


class BulkDeleteOut(BaseModel):
    deleted: list[int]
    skipped: list[BulkSkipped]
    message: str


class CategoryOut(BaseModel):
    category: str
    label: str
    templates: int
