# EDABIP Mobile

The EDABIP mobile client for **Android** and **iOS**, built with Expo and React Native.

It consumes the **same backend** as the existing web app (`edabip-backend`, FastAPI).
There is no mobile-specific backend, and nothing in `edabip-frontend` is shared,
imported, or modified by this project.

> **Status:** foundation only. Navigation, theming, API access, authentication
> architecture, state management, and the reusable component set are in place.
> The product screens have not been built yet — see [Current scope](#current-scope).

---

## Stack

| Concern        | Choice                                                 | Why                                                                                                          |
| -------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Framework      | Expo SDK 57, React Native 0.86, React 19               | Managed workflow, OTA-capable, single codebase for both platforms                                            |
| Language       | TypeScript 6 (`strict`)                                | Required by the brief; no `.js` source files                                                                 |
| Navigation     | Expo Router 57 (file-based)                            | Expo's default; gives deep links and typed routes for free. **React Navigation is not installed separately** |
| State          | React Context + hooks, split into three stores         | No global store library needed at this size                                                                  |
| HTTP           | `fetch` wrapper in `src/services/api/client.ts`        | Interceptor behaviour (auth header, refresh, timeout) in ~150 lines, no `axios` dependency                   |
| Secure storage | `expo-secure-store`                                    | Keychain / EncryptedSharedPreferences for tokens                                                             |
| Preferences    | `@react-native-async-storage/async-storage`            | Non-sensitive device settings                                                                                |
| Fonts          | `@expo-google-fonts/inter`                             | Matches the web design system without committing binary font files                                           |
| Lint / format  | ESLint 9 flat config (`eslint-config-expo`) + Prettier | Matches the Expo toolchain                                                                                   |

---

## Getting started

```bash
cd edabip-FE-mobile
npm install
cp .env.example .env      # then edit EXPO_PUBLIC_API_BASE_URL
npm start
```

This project uses a **development client** (`EDABIP Dev`), not Expo Go. Keep
Metro running, then press `a` for Android, `i` for iOS (macOS only), or open
the app from the Expo Dev Client screen. `npm start` maps USB devices and
emulators to Metro with `adb reverse tcp:8081 tcp:8081`. If the phone is on
Wi-Fi only, use `npm run start:tunnel`.

| Command                | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| `npm start`            | Start Metro (LAN) and reverse USB port 8081  |
| `npm run start:tunnel` | Start Metro through ngrok when LAN is blocked |
| `npm run android`      | Build the dev client and open it on Android  |
| `npm run ios`          | Start and open in the iOS simulator (macOS)  |
| `npm run web`          | Start the web target (development aid only)  |
| `npm run typecheck`    | `tsc --noEmit`                               |
| `npm run lint`         | ESLint over the whole project                |
| `npm run format`       | Rewrite files with Prettier                  |
| `npm run format:check` | Verify formatting without writing            |
| `npm run doctor`       | `expo-doctor` dependency/config health check |

### Pointing the app at the backend

Start the backend first (`cd edabip-backend && python main.py`, port `8000`),
then set `EXPO_PUBLIC_API_BASE_URL` to a host the **device** can reach:

| Where the app runs | Value                                               |
| ------------------ | --------------------------------------------------- |
| Android emulator   | `http://10.0.2.2:8000` (auto)                       |
| iOS simulator      | `http://localhost:8000`                             |
| Physical device    | Metro host IP (auto) or `http://<your-LAN-IP>:8000` |

`localhost` inside an Android emulator or physical device refers to the device
itself, which is the most common cause of signup/login timeouts during setup.
In development, `src/config/env.ts` rewrites `localhost` / `127.0.0.1` to the
same host Metro uses (e.g. `192.168.1.12:8000`) so physical devices can reach
your machine without editing `.env` every time you change networks. If no value is
set, `env.ts` picks a sensible per-platform default in development and
**throws** in production builds.

CORS is not a concern: a native app sends no `Origin` header, and the backend
authenticates with bearer tokens rather than cookies.

---

## Project structure

```text
edabip-FE-mobile/
├── app/                          # Expo Router route tree — thin files only
│   ├── _layout.tsx               # Providers, fonts, splash gating
│   ├── index.tsx                 # Redirects based on auth status
│   ├── +not-found.tsx
│   ├── (auth)/                   # Guest-only group
│   │   ├── _layout.tsx           # Redirects to the app when authenticated
│   │   ├── login.tsx  signup.tsx  otp.tsx
│   │   └── forgot-password.tsx  reset-password.tsx
│   └── (main)/                   # Authenticated group
│       ├── _layout.tsx           # Redirects to login when signed out
│       ├── (tabs)/               # Bottom tab bar
│       │   ├── _layout.tsx
│       │   └── dashboard.tsx  analytics.tsx  reports.tsx  ai.tsx  more.tsx
│       └── powerbi.tsx  billing.tsx  profile.tsx  settings.tsx
│
├── assets/                       # App icon and splash (referenced by app.config.ts)
│
├── src/
│   ├── assets/                   # In-app images, icons, fonts, animations
│   ├── components/               # Reusable UI, grouped by kind
│   │   ├── buttons/  cards/  charts/  common/  inputs/  loaders/  modals/
│   │   └── index.ts              # Barrel export
│   ├── config/                   # env.ts, appConfig.ts
│   ├── constants/                # storageKeys.ts
│   ├── hooks/                    # useTheme, useAsyncAction, useCountdown
│   ├── navigation/               # Route constants, param readers, param types
│   ├── screens/                  # Screen implementations, one folder per module
│   │   ├── auth/{Login,Signup,OTP,ForgotPassword,ResetPassword}/
│   │   ├── auth/components/      # Shared across the auth flow
│   │   └── dashboard/ reports/ analytics/ powerbi/ billing/ profile/ settings/ ai/ more/
│   ├── services/
│   │   ├── api/                  # client, endpoints, authApi, per-domain modules
│   │   ├── storage/              # secureStorage, preferenceStorage, tokenStorage
│   │   └── notifications/        # Reserved — see the README in that folder
│   ├── store/                    # auth/, user/, app/ + StoreProvider
│   ├── theme/                    # colors, typography, spacing, dimensions, radii, shadows
│   ├── types/                    # api.ts, auth.ts
│   └── utils/                    # logger, validation, format
│
├── .env.example
├── app.config.ts
├── eslint.config.js
├── tsconfig.json
└── package.json
```

`app/` files are deliberately one-liners that re-export a screen from `src/screens/`.
Routing concerns stay in `app/`, implementation stays in `src/` — so a screen can be
moved or renamed without touching its URL, and vice versa.

There is **no `babel.config.js`**: Expo SDK 57 supplies its default Babel config
and no longer hoists `babel-preset-expo`, so an explicit config file breaks the
bundler unless the preset is added as a direct dependency.

---

## Navigation

```text
Root (Stack)
├── (auth)                       guest only
│   ├── login
│   ├── signup
│   ├── otp                      handles both signup verification and login MFA
│   ├── forgot-password
│   └── reset-password
└── (main)                       requires a session
    ├── (tabs)                   Dashboard · Analytics · Reports · AI · More
    ├── powerbi
    ├── billing
    ├── profile
    └── settings
```

Route guards are declarative `<Redirect>` calls in the two group layouts, so an
unauthenticated deep link into `/billing` lands on `/login` without a flash of
protected content.

**This is not the web sidebar shrunk down.** The web app exposes nine sidebar
destinations; a phone tab bar tops out at five before the targets get too small.
Dashboard, Analytics, Reports, and AI earn tabs; Power BI, Billing, Profile, and
Settings are reached from a **More** hub and push full-screen over the tab bar,
so they get a real back gesture. Screens use safe-area insets, keyboard-aware
scrolling, bottom sheets, pull-to-refresh, and 44pt minimum touch targets.

Route paths are centralised in `src/navigation/routes.ts` — use `ROUTES.*`
rather than string literals.

---

## API architecture

```text
src/services/api/
├── client.ts          fetch wrapper: auth header, refresh, timeout, error mapping
├── endpoints.ts       every backend path, in one place
├── apiError.ts        ApiError class + FastAPI error normalisation
├── sessionEvents.ts   decouples "session died" from the auth store
├── authApi.ts         fully implemented against the live backend
└── dashboardApi.ts  reportsApi.ts  analyticsApi.ts  billingApi.ts  aiApi.ts
```

`client.ts` gives the same guarantees the web `apiClient` does, without axios:

- Attaches `Authorization: Bearer <access_token>` from secure storage.
- Refreshes proactively when the stored token is within 5 minutes of its 60
  minute expiry, and reactively on a 401.
- **Single-flight refresh.** The backend rotates and revokes the refresh token on
  every `/auth/refresh`, so concurrent refreshes would invalidate each other.
- Aborts on timeout via `AbortController` (`EXPO_PUBLIC_API_TIMEOUT_MS`).
- Normalises `{"detail": "..."}` and the 422 `{"detail": [{loc, msg}]}` array
  into an `ApiError` carrying `status`, `code`, and per-field messages.
- Emits `sessionExpired` when refresh fails, which signs the user out.

The base URL always comes from configuration. Nothing is hardcoded.

### Implemented endpoints

Verified against `edabip-backend/routers/`. Note the backend mounts its routers
at the root — **there is no `/api` prefix**.

| Method | Path                     | Used by                    |
| ------ | ------------------------ | -------------------------- |
| POST   | `/auth/register`         | Sign up                    |
| POST   | `/auth/verify-otp`       | Email verification         |
| POST   | `/auth/resend-otp`       | Resend verification code   |
| POST   | `/auth/login`            | Sign in                    |
| POST   | `/auth/refresh`          | Token rotation (automatic) |
| POST   | `/auth/logout`           | Sign out                   |
| POST   | `/auth/forgot-password`  | Request reset link         |
| POST   | `/auth/reset-password`   | Set new password           |
| GET    | `/auth/me`               | Load profile               |
| POST   | `/auth/login/mfa/verify` | Login OTP challenge        |
| POST   | `/auth/login/mfa/resend` | Resend login OTP           |

### Endpoints that do not exist yet

The backend currently mounts **only** the auth routers. There are no dashboard,
reports, analytics, Power BI, billing, or AI routes in `edabip-backend`.

Rather than invent request and response contracts, those modules declare their
operations and throw a descriptive error via `notImplemented()`, and each domain
is gated behind a flag in `src/config/appConfig.ts` (`features.*`, all `false`).
When a router ships: add its paths to `endpoints.ts`, implement the calls, and
flip the flag.

---

## Authentication

Session state and the user profile are owned by different stores, and neither
lives in a component.

```text
UI  →  store/auth (session lifecycle)  →  services/api/authApi  →  services/api/client
                                       →  services/storage/tokenStorage  (expo-secure-store)
UI  →  store/user  (profile)           →  services/api/authApi  (GET /auth/me)
```

- **Tokens** are written to `expo-secure-store` under three separate keys
  (access, refresh, expiry). Separate keys avoid Android's ~2KB per-entry
  SecureStore warning that a single JSON blob of two JWTs can hit.
- **No password is ever persisted**, and the logger compiles debug output away
  outside development so tokens and OTPs cannot reach a release console.
- **Bootstrap:** on launch, a stored session moves the app straight to
  `authenticated` and the first request validates it. A failed refresh emits
  `sessionExpired` and signs the user out.
- **Sign out** clears local state immediately, then revokes the refresh token
  server-side on a best-effort basis — a failed network call must not leave a
  user signed in on their device.
- Client-side auth state is treated as UI state only. Authorisation is enforced
  by the backend.

Flows wired up: login, signup, email OTP verification and resend, login MFA
challenge, forgot password, reset password, logout, and token refresh. No mock
or fake authentication is included — every call hits the real backend.

`src/utils/validation.ts` mirrors `validate_password_strength` from
`edabip-backend/utils/security.py`, so the UI never submits a password the API
will reject.

---

## State management

Three independent contexts instead of one global store, composed by
`StoreProvider`:

| Store        | Owns                                                          |
| ------------ | ------------------------------------------------------------- |
| `store/app`  | Colour scheme preference, onboarding flag — survives sign-out |
| `store/auth` | `AuthStatus`, MFA challenge, and every auth action            |
| `store/user` | The signed-in user's profile, hydrated from `/auth/me`        |

Screen-local async state (form submits, retries) uses the `useAsyncAction` hook
rather than the global stores, which keeps pending/error state next to the
component that renders it.

No Redux, Zustand, or MobX. If server-cache concerns grow — pagination,
background refetching, cache invalidation across screens — TanStack Query is the
natural next addition; the API layer is already isolated behind
`services/api/` so it can be adopted without touching components.

---

## Theme

`src/theme/` holds colours, typography, spacing, dimensions, radii, and shadows.
Values were transcribed from the web app's CSS custom properties
(`--db-*` in `DashboardPage.css`, `--lv2-*` in `Landing-page-v2.css`) so the two
clients stay visually consistent: brand teal `#134B4A`, mid teal `#3E9593`,
aqua `#4EA9A0`, gold `#F5C85B`, success `#2DA20A`, danger `#DD2D30`.

Components consume **semantic** tokens (`colors.brand`, `colors.textSecondary`),
never raw palette entries, so light and dark schemes resolve automatically.
Access the theme with `useTheme()`, or `useThemedStyles(createStyles)` to build a
memoised `StyleSheet`.

The web pairs Inter with Lato; mobile standardises on **Inter** alone — two
families cost an extra font payload and read almost identically at phone sizes.

---

## Components

| Folder     | Contents                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------ |
| `buttons/` | `Button` — 5 variants, 3 sizes, loading and disabled states                                |
| `cards/`   | `Card` — optional header, accessory slot, pressable variant                                |
| `charts/`  | `ChartCard` — chart chrome with loading/error/empty states                                 |
| `common/`  | `Screen`, `ScreenHeader`, `AppText`, `ListItem`, `EmptyState`, `ErrorState`, `ErrorBanner` |
| `inputs/`  | `TextField` (label, error, password toggle), `OtpInput`                                    |
| `loaders/` | `LoadingView`, `Skeleton`                                                                  |
| `modals/`  | `BottomSheet`, `ConfirmDialog`                                                             |

`Screen` is the layout primitive every screen sits inside: safe-area insets,
themed background, status-bar style, optional scrolling, keyboard avoidance,
and a pinned footer slot.

Two components were **deliberately not built**:

- **Bottom navigation** — Expo Router's `Tabs` already provides it; a custom
  wrapper would only re-skin what the theme already styles.
- **A form abstraction** — `TextField` plus `useAsyncAction` covers every form in
  the app today. Add a form library when a screen actually needs cross-field
  validation or dynamic field arrays.

No chart library is installed. The web app uses Recharts, which is DOM-based and
cannot run in React Native. `react-native-gifted-charts` or `victory-native`
(Skia) should be evaluated when the first real chart is built; render it inside
`ChartCard` so every chart shares the same async-state behaviour.

---

## Environment configuration

Configuration is read through `src/config/env.ts`. Copy `.env.example` to `.env`
and fill it in; `.env` is git-ignored.

| Variable                         | Default (dev)             | Notes                                      |
| -------------------------------- | ------------------------- | ------------------------------------------ |
| `EXPO_PUBLIC_APP_ENV`            | `development`             | `development` \| `testing` \| `production` |
| `EXPO_PUBLIC_API_BASE_URL`       | per-platform localhost    | Required in production builds              |
| `EXPO_PUBLIC_API_TIMEOUT_MS`     | `20000`                   |                                            |
| `EXPO_PUBLIC_ENABLE_DEV_LOGGING` | `true` outside production |                                            |

`EXPO_PUBLIC_APP_ENV` also drives `app.config.ts`, giving each environment its
own app name, bundle identifier, and deep-link scheme so all three can be
installed side by side:

| Environment   | Name        | Bundle ID                | Scheme        |
| ------------- | ----------- | ------------------------ | ------------- |
| `development` | EDABIP Dev  | `com.edabip.mobile.dev`  | `edabip-dev`  |
| `testing`     | EDABIP Test | `com.edabip.mobile.test` | `edabip-test` |
| `production`  | EDABIP      | `com.edabip.mobile`      | `edabip`      |

`env.ts` fails fast in production if the base URL is missing or not HTTPS.

**Everything prefixed `EXPO_PUBLIC_` is embedded in the JavaScript bundle and is
therefore public.** Never put secrets, client secrets, or API keys in `.env`.

---

## Current scope

Built:

1. Expo + TypeScript project, independently runnable
2. Folder structure
3. Navigation with route guards
4. Theme system
5. API client and endpoint map
6. Environment configuration for three environments
7. Authentication architecture against the real backend
8. Three-store state foundation
9. Reusable component set
10. ESLint, Prettier, strict TypeScript
11. This README

Intentionally **not** built: production screens. Dashboard, Profile, Settings,
and More are wired to real state to prove the architecture end to end; Reports,
Analytics, Power BI, Billing, and AI render a shared `ModulePlaceholder`, which
is scaffolding to be deleted as each screen is implemented.

---

## Validation performed

| Check                                | Result                                                                           |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `npm install`                        | Pass — 0 peer-dependency conflicts                                               |
| `npm run typecheck`                  | Pass — no errors under `strict` + `noUncheckedIndexedAccess`                     |
| `npm run lint`                       | Pass — 0 errors, 0 warnings                                                      |
| `npm run format:check`               | Pass                                                                             |
| `npx expo export --platform android` | Pass — bundles, so no broken imports in the module graph                         |
| `npx expo export --platform ios`     | Pass                                                                             |
| Web project untouched                | Pass — `git status` shows no changes under `edabip-frontend` or `edabip-backend` |

### Not verified in this environment

These need hardware or a platform this project was set up on (Windows) and are
listed honestly rather than claimed:

- **Runtime launch on a device or emulator.** No Android emulator or physical
  device was available. The bundle compiles for both platforms, but the first
  render, splash-screen handoff, and font loading have not been observed.
- **iOS build and simulator run.** Requires macOS and Xcode.
- **End-to-end auth against a live backend.** The backend needs a running MySQL
  instance, which was not started. Requests are written against the verified
  route and payload shapes in `edabip-backend/routers/`, but no login round trip
  has been executed from the device.
- **Keychain / EncryptedSharedPreferences persistence.** `expo-secure-store` has
  no web implementation, so token persistence has only been exercised through
  its `localStorage` fallback path in code, not on a real device.

---

## Known gaps and follow-ups

- **Password-reset deep links.** Set `MOBILE_APP_SCHEME=edabip-dev` in
  `edabip-backend/.env` so reset emails use `edabip-dev://reset-password?token=…`
  (opens the app on your phone). `localhost:5173` in email only works on the
  same machine running the Vite dev server, not on a physical device. Without
  SMTP, copy the **Mobile** link from the backend console after forgot-password.
  Production: configure Universal Links / App Links on your web host.
- **Social sign-in.** `/auth/microsoft/exchange` accepts an MSAL id token and
  returns JSON, so it is the mobile-friendly path. Google exists only as a
  browser redirect that hands tokens back through a web URL fragment, so it
  needs `expo-auth-session` and a native redirect URI. Neither is wired up.
- **Login MFA.** The backend defines `/auth/login/mfa/*` but `/auth/login` never
  issues a `challenge_token`, so the challenge branch is currently unreachable.
  The client handles it defensively, matching the web app.
- **Push notifications.** See `src/services/notifications/README.md`.
- **Tests.** No test runner is configured yet. `jest-expo` plus React Native
  Testing Library is the conventional choice; the store and service layers are
  already isolated enough to test without a renderer.
- **`npm audit`** reports moderate advisories, all from transitive Expo
  tooling dependencies. Re-check after the next SDK patch release.
