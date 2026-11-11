# Reports module (backend)

Report templates, on-demand and scheduled generation (CSV / Excel / PDF), run history,
downloads, a dashboard API and an append-only audit trail. Everything is mounted at
`/api/reports` by `main.py`. Interactive docs: `/docs`.

## Permissions

| Code | Allows |
|---|---|
| `reports.view` | list templates / schedules / history, dashboards, export, **download** |
| `reports.create` | generate, create schedules, preview, retry, cancel |
| `reports.edit` | edit / pause / resume schedules, archive / unarchive history |
| `reports.delete` | delete schedules and history rows |

Non-admins only see and change **their own** schedules and history (other people's rows
answer `404`). A template can also be limited to named roles through
`report_templates.allowed_roles_json` (e.g. `["admin","business_analyst"]`; `NULL` = every
role with `reports.view`; admins always have access). The seeded **HR Report** is limited
this way.

## Endpoints

| Method & path | Purpose |
|---|---|
| `GET /templates` | templates the caller may use (`search`, `category`) |
| `GET /templates/top` | most-used templates (`range`, `limit` up to 100; `include_unused=true` also lists unused ones: "View All") |
| `GET /categories` | categories for the "All Categories" filter |
| `GET /templates/{id}` / `/preview` | one template / first rows of its report, nothing stored |
| `POST /generate` | run now, or create a schedule with `scheduled=true` |
| `GET /scheduled`, `GET/PATCH/DELETE /scheduled/{id}`, `POST .../pause`, `.../resume` | manage schedules |
| `GET /history`, `GET /history/{id}` | runs (search, filters, sort, pagination), single run for status polling |
| `GET /history/export` | the same filters as a file: `format=csv\|excel\|pdf`; repeat `ids=` to export only the selected rows |
| `POST /history/{id}/retry`, `/cancel`, `/archive`, `/unarchive`, `DELETE /history/{id}` | run actions (`/cancel` works on queued **and running** reports) |
| `POST /history/bulk-delete` | delete the selected runs: body `{"ids": [...]}` (max 200); rows that cannot be deleted come back in `skipped` |
| `GET /download/{id}` | the generated file (audited) |
| `GET /summary`, `/analytics/type-distribution`, `/analytics/status-distribution` | dashboard data. `range` takes `30d`, `3m`, `all`, or the UI labels (`Last 9 Months`, `Last 30 Days`, `All Time`): 1-365 days or 1-36 months; or `date_from`/`date_to`. Optional `category`. |

List endpoints take `page`, `page_size` (max 100), `sort_by`, `order`, `search`
(2-100 chars of letters, digits, space, `.`, `_`, `-`; a plain number always searches by id).
`/history` also filters on `status` (`processing` matches queued/running too),
`trigger_type`, `report_type`, `owner_id`, `date_from`, `date_to` and `archived`
(`exclude` default / `only` / `include`).

## Run lifecycle

`queued → running → completed | failed` (a queued run can be `cancelled`). `status_label`
collapses the in-progress states into the single "Processing" indicator. Each run records
`started_at`, `completed_at`, `duration_seconds`, `progress_percent` and, on failure, a
user-safe `failure_reason`; the full error stays server-side in `report_history.error_detail`
and the audit log and is never returned by the API.

A queued or running report can be cancelled; a running one stops at its next checkpoint
(after the data is read, and again after the file is written) and never ends up `completed`.

`trigger_type` is `scheduled` (started by a schedule), `on_demand` (a user run with the
template defaults), `ad_hoc` (a user run with custom parameters) or `system`.

## Parameters

`POST /generate` accepts `parameters`: `date_from`, `date_to`, `region`, `segment`,
`product_category` and (Forecast only) `forecast_months` (1-12). A template's
`default_parameters_json` is applied first. Unknown or unsupported parameters are a `422`.

## Schedules

Frequencies: `one_time`, `daily`, `weekly`, `monthly`, `quarterly`, `custom` (with
`interval_days`). `next_run_time` is interpreted in `timezone` (default: the user's own
timezone setting, else UTC) and stored as UTC; monthly/quarterly runs follow calendar months.
A paused or long-overdue schedule skips missed periods instead of replaying them.
Scheduled runs email the schedule's `recipients` and its owner when they finish; the email
links to Reports and does not attach the file.

## Running the workers

Generation of on-demand reports happens inside the API process. Scheduled reports need a
worker, because nothing in the API fires on a timer:

```
# every minute (recommended; safe with any number of API workers)
* * * * *  cd /path/to/edabip-backend && python -m services.report_scheduler
# nightly: recover stuck runs, archive old runs, delete very old files
0 2 * * *  cd /path/to/edabip-backend && python -m services.report_maintenance
```

Single-instance alternative: `REPORT_SCHEDULER_ENABLED=true` starts the same loop inside the API.

| Setting (env) | Default | Meaning |
|---|---|---|
| `REPORT_SCHEDULER_ENABLED` | `false` | in-process scheduler loop |
| `REPORT_SCHEDULER_POLL_SECONDS` | `60` | loop interval |
| `REPORT_ARCHIVE_AFTER_DAYS` | `90` | finished runs are archived after this long |
| `REPORT_PURGE_FILES_AFTER_DAYS` | `365` | files older than this are deleted (the history row stays) |
| `REPORT_STUCK_AFTER_MINUTES` | `30` | a run still queued/running after this is marked failed |

## Database

`init_db()` creates missing tables and `services/reports_migration.py` upgrades existing
report tables (new columns, wider enums, indexes, FK, audit triggers). It is idempotent and can
also be run alone: `python -m services.reports_migration`. The two `report_audit_logs`
triggers need the MySQL `TRIGGER` privilege; without it the migration reports them as
skipped and the application still refuses to update or delete audit rows.

Seed the template catalog with `python seed_reports.py`.

## Tests

```
pytest tests/test_reports.py tests/test_reports_lifecycle.py
```
Both files share one in-memory SQLite database and need only a `DATABASE_URL` /
`JWT_SECRET_KEY` value set (they never connect to it).

## Dashboard notes

* `/summary` returns each card with `value`, `previous`, `change_percent` (vs the previous
  period of the same length) and a `trend` block of parallel arrays (`buckets[i]` ↔ `total_reports[i]`,
  `completed[i]`, ...) for the mini graphs: daily buckets up to ~3 months, monthly beyond that.
  `generated_at` is the "Last Refreshed" time.
* `avg_run_time_seconds` has millisecond precision and a `label` ("350 ms", "4.2 sec",
  "02 : 35 mins"), because most reports finish in well under a second.
* The **Scheduled** card is the number of active schedules. The status donut is different: every
  run in the selected period/category falls in exactly one slice (Completed, Scheduled = queued,
  Failed, Processing, Cancelled), so the slices add up to the period's total.
* `System Generated` stays 0 until some part of the platform creates a run with
  `trigger_type="system"`; nothing in the Reports module does that by itself.

## Templates

A template is usable only when it is **active and approved** (`approval_status = 'approved'`;
`pending` / `rejected` templates are hidden everywhere and answer 404). `version` and
`updated_at` are returned for display. Existing templates become approved, version 1 on upgrade.
