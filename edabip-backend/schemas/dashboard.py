"""Response contract for the signed-in Dashboard."""

from pydantic import BaseModel, ConfigDict


class _Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RevenueKpi(_Model):
    value: str
    label: str
    change: str
    changeNote: str


class CustomersKpi(RevenueKpi):
    activeLabel: str
    activeNote: str
    activeProgress: int


class ReportRow(_Model):
    id: str
    label: str
    value: str


class ReportsKpi(_Model):
    value: str
    label: str
    badge: str
    rows: list[ReportRow]


class SystemHealthKpi(_Model):
    value: str
    label: str
    badge: str


class DashboardKpis(_Model):
    revenue: RevenueKpi
    customers: CustomersKpi
    reports: ReportsKpi
    systemHealth: SystemHealthKpi


class DashboardStat(_Model):
    id: str
    label: str
    value: str
    tone: str | None = None


class DataSourceRow(_Model):
    source: str
    status: str
    health: int
    sync: str
    latency: str


class ScheduledReportRow(_Model):
    id: str
    title: str
    when: str
    status: str


class ActivityRow(_Model):
    id: str
    user: str
    module: str
    action: str
    time: str
    date: str
    status: str


class RevenuePoint(_Model):
    month: str
    value: int


class ActiveUserPoint(_Model):
    day: str
    value: int


class DashboardOverview(_Model):
    kpis: DashboardKpis
    userStats: list[DashboardStat]
    sourceStats: list[DashboardStat]
    dataSources: list[DataSourceRow]
    scheduledReports: list[ScheduledReportRow]
    recentActivity: list[ActivityRow]
    revenueTrend: list[RevenuePoint]
    activeUsers: list[ActiveUserPoint]
