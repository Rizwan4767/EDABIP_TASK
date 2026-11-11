"""
Static option catalogs for Settings dropdowns. These are UI reference data,
not user data — kept out of the DB so they ship/version with the code.
"""

TIMEZONE_OPTIONS = [
    {"value": "UTC", "label": "UTC(Coordinated Universal Time)"},
    {"value": "America/New_York", "label": "EST (Eastern Standard Time)"},
    {"value": "America/Chicago", "label": "CST (Central Standard Time)"},
    {"value": "America/Denver", "label": "MST (Mountain Standard Time)"},
    {"value": "America/Los_Angeles", "label": "PST (Pacific Standard Time)"},
    {"value": "Europe/London", "label": "GMT (Greenwich Mean Time)"},
    {"value": "Asia/Kolkata", "label": "IST (India Standard Time)"},
    {"value": "Asia/Dubai", "label": "GST (Gulf Standard Time)"},
    {"value": "Asia/Singapore", "label": "SGT (Singapore Time)"},
    {"value": "Australia/Sydney", "label": "AEST (Australian Eastern Time)"},
]

COMPANY_SIZE_OPTIONS = [
    {"value": "1-50", "label": "1-50 Employees"},
    {"value": "51-200", "label": "51-200 Employees"},
    {"value": "201-500", "label": "201-500 Employees"},
    {"value": "501-1000", "label": "501-1000 Employees"},
    {"value": "1000+", "label": "1000+ Employees"},
]

INDUSTRY_OPTIONS = [
    {"value": "healthcare", "label": "Healthcare"},
    {"value": "retail", "label": "Retail"},
    {"value": "finance", "label": "Finance"},
    {"value": "manufacturing", "label": "Manufacturing"},
    {"value": "education", "label": "Education"},
]

# Values are the slugs the frontend's <select> elements actually send/match
# on (SettingsSelect compares option.value === value) — see
# DASHBOARD_ALERT_OPTIONS / REPORT_UPDATE_OPTIONS in
# src/modules/settings/api/settingsApi.js. Labels are what's displayed.
DASHBOARD_ALERT_OPTIONS = [
    {"value": "all", "label": "All Alerts"},
    {"value": "critical", "label": "Critical Only"},
    {"value": "warnings", "label": "Warnings & Critical"},
    {"value": "none", "label": "None"},
]

REPORT_UPDATE_OPTIONS = [
    {"value": "realtime", "label": "Real Time"},
    {"value": "hourly", "label": "Hourly"},
    {"value": "daily", "label": "Daily"},
    {"value": "weekly", "label": "Weekly"},
]
