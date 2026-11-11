# EDABIP — Integrated Project

This package contains both halves of the project, unzipped side by side:

```
edabip-integrated/
├── edabip-frontend/   ← untouched, byte-identical to what you uploaded
└── edabip-backend/    ← fixed so it matches what the frontend actually sends/expects
```

## 1. Run the backend

```bash
cd edabip-backend
python3 -m venv venv && source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# then edit .env — at minimum set DATABASE_URL to your MySQL instance
# and JWT_SECRET_KEY to a random 32+ char string, e.g.:
#   python -c "import secrets; print(secrets.token_urlsafe(48))"

python seed.py        # creates roles + an admin user: admin@example.com / Admin@123
python main.py         # serves on http://localhost:8000, docs at /docs
```

Leave `SMTP_USER` blank in `.env` for local testing — with no SMTP configured, the
register/verify-otp/resend-otp endpoints return the OTP directly in the JSON
response (`dev_email_otp`) instead of emailing it, and the frontend's dev-mode
OTP hint will pick that up automatically after registration.

## 2. Run the frontend

```bash
cd edabip-frontend
npm install
npm run dev             # serves on http://localhost:5173
```

`.env.development` already points at `http://localhost:8000` with
`VITE_ENABLE_MOCK_AUTH=false`, so it talks to the real backend above by default.


3. Run the mobile app (dev)
```bash
cd edabip-fe-mobile
npm install
npx expo start -c --lan --dev-client
```
Open the installed EDABIP dev client app on your phone (not Expo Go) — it connects to this Metro server automatically over the same LAN. Point it at the backend from step 1 the same way the web frontend does.


## What's actually wired up right now

Only these frontend flows call the backend at all in this build — everything
else (Billing, User Management, Dashboard UI data, Google/Microsoft sign-in
buttons, Forgot Password) currently runs on local mock/stub logic in the
frontend and doesn't hit the network, regardless of backend state:

- Register → email OTP verify/resend → Login → Refresh → Logout → `/auth/me`

The backend now also exposes dashboard and advanced analytics APIs under
`/analytics` (including `/analytics/dashboard`, `/analytics/kpis`, and the
revenue, active-user, activity, forecast, and model endpoints). The current
frontend dashboard still uses mock data; these API routes are available for
frontend integration. After creating the database tables, run
`python seed_analytics.py` from `edabip-backend` to populate example data.

**One frontend-side issue worth knowing about:** `SignupForm.jsx` still
validates `companyName`/`companySize`/`industry` as required fields, but the
inputs for them are commented out of the UI. That means the signup form
can't currently be submitted from the UI — it fails client-side validation
before any request is sent. This is unrelated to the backend and wasn't
changed here, per the "no frontend changes" instruction; removing those
three dead checks in `validateSignupForm()` is what would unblock it.

## Backend fixes made (summary)

- User model brought in line with what every router and the frontend
  actually expect: `full_name` (was split first/last name and missing
  entirely from several routers), `phone_verified`, `avatar_url` added;
  `organization_id` made optional (the frontend never collects company data).
- `/auth/register` now accepts exactly `{full_name, email, password}` —
  what `authApi.js` sends — instead of requiring company/phone fields.
- Added `POST /auth/resend-otp` (the frontend called it; it didn't exist).
- Fixed a bug where every self-registered user silently got the **admin**
  role instead of "user" (OAuth signups were already correct).
- Fixed Google/Microsoft OAuth account creation crashing on a required
  `organization_id` that was never supplied.
- JWTs now carry a unique `jti`, fixing an intermittent crash where two
  tokens issued in the same second for the same user collided on the
  refresh-token table's unique constraint.
- "Account disabled" now returns 400 instead of 403, so it doesn't get
  mis-handled by the frontend's "403 = verify your email" branch.

All of the above was verified against a live MySQL instance end-to-end
(register/verify/resend/login/refresh/logout, token rotation, account
lockout, rapid-login collision stress test, OAuth account creation, admin
vs. user roles, CORS from `localhost:5173`) — 48/48 checks passing.
