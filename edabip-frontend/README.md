# EDABIP Frontend

Frontend application for the EDABIP platform built with **React** and **Vite**.

## Tech Stack

- React
- Vite
- React Router
- CSS Modules / CSS
- Context API

## Project Structure

```
src/
├── assets/
├── components/
├── context/
├── lib/
├── modules/
├── routes/
└── App.jsx
```

## Getting Started

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

### Build production bundle

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

---

# EDABIP Frontend ↔ Backend Integration TODO
# EDABIP Frontend ↔ Backend Integration TODO
### (Final — all Authentication-related files reviewed)

**Purpose:** Documentation only — nothing here is implemented yet.

**Legend:**
- 🚩 = needs a team decision before implementation
- ⚠️ = a real bug/gap found in the current code, independent of backend integration
- ✅ = confirmed already working correctly (client-side); just needs the backend hooked in

---

## ⚠️ Priority: Real bugs found (fix these regardless of backend timing)

- [ ] **⚠️ Three uncoordinated attempt-tracking mechanisms** — `AuthContext.jsx`'s module variable, `LoginForm.jsx`'s own React state, and `AccountLockedForm.jsx` reading a `sessionStorage` key that's never written anywhere. Lockout is currently decided by `LoginForm`'s local count, not `AuthContext`'s.
- [ ] **⚠️ `SignupForm.jsx` doesn't submit anywhere** — valid submission only does `console.log(...)`.
- [ ] **⚠️ `CreateNewPasswordForm.jsx` never sends the new password anywhere**, and its OTP-verification route guard is commented out — anyone can currently reach `/create-new-password` directly without completing the OTP step.
- [ ] **⚠️ Google SSO buttons on Login and Signup have no `onClick`** — see Section 16, a working `SSOButton.jsx` component already exists and isn't being used by either form.
- [ ] **⚠️ `MFAChallenge.jsx` is an unused placeholder** — the real OTP UI lives entirely inside `ForgotPasswordForm.jsx`.
- [ ] **⚠️ `RoleGuard.jsx` is a no-op**, same pattern as `ProtectedRoute` — see Section 17. It ignores its own `requiredPermission` prop entirely.
- [ ] **⚠️ `ContactSupportForm.jsx` doesn't submit anywhere either** — same pattern as Signup: validates, then just sets local `submitted` state. No request is actually sent.

---

## 1. Auth Context & Session — `context/AuthContext.jsx`

- [ ] Replace `mockLoginRequest()` with real `POST /auth/login`
- [ ] 🚩 Resolve conflicting login implementations: inline mock vs. `authApi.js`'s unused stub (Section 10)
- [ ] Remove `MOCK_USER`, `mockAttemptsUsed`, `MAX_ATTEMPTS`
- [ ] Add loading/submitting state to `login()`
- [ ] Implement `resetSession()` — currently empty, but `useSessionTimeout.jsx` already calls it (Section 6)
- [ ] Replace `isSessionExpired()` (always `false`) — decide relationship to the hook's working version (Section 6)
- [ ] 🚩 Token storage strategy — httpOnly cookie vs `localStorage` vs `sessionStorage`
- [ ] Add refresh token handling (ties into `apiClient.js` interceptor, Section 11)
- [ ] `logout()` needs to call `POST /auth/logout`, not just clear local state
- [ ] Add a real `signup()` function — doesn't exist here at all
- [ ] Confirm real user object shape includes what RBAC needs

---

## 2. Route Protection — `App.jsx` + `ProtectedRoute` + `RoleGuard`

- [ ] 🚩 Two identical no-op `ProtectedRoute` components exist (`routes/ProtectedRoute.jsx` and one inline in `AuthContext.jsx`) — consolidate to one
- [ ] No routes are wrapped in `ProtectedRoute` in `App.jsx` — everything is currently public
- [ ] Implement the real auth check + redirect in `ProtectedRoute`
- [ ] `RoleGuard.jsx` is also a no-op (`return <>{children}</>`, `requiredPermission` prop unused) — implement the actual permission check against `rbac/permissions.js`'s `PERMISSIONS.ADMIN` / `PERMISSIONS.USER`
- [ ] Wire `RoleGuard` around whichever routes actually need role restriction (confirm which with the team — Billing? User Management?)

---

## 3. `hooks/useAuth.js` — 🚩 likely dead/broken code

- [ ] Hardcoded stub always returns `{ isAuthenticated: false, user: null }`
- [ ] Confirm nothing imports this instead of `useAuthContext()` — if something does, it's a live bug
- [ ] Fix to proxy `useAuthContext()`, or delete

---

## 4. Login — `LoginForm.jsx` ✅ mostly working, needs backend + de-duplication

- [ ] Replace local `failedAttempts` counting with backend's `attemptsRemaining`/`locked` values only
- [ ] Add loading/disabled state on submit
- [ ] Wire the Google SSO button using the existing `SSOButton.jsx` component (Section 16) instead of the current inert inline button
- [ ] Confirm error copy still matches real backend responses

---

## 5. Signup — `SignupForm.jsx` ⚠️ see priority bug above

- [ ] Build actual submit logic — nothing async happens currently
- [ ] Add `signup()` to `AuthContext.jsx`, wire this form to it
- [ ] Add loading/error states
- [ ] Confirm with backend whether email verification is required post-signup
- [ ] Wire Google SSO button via `SSOButton.jsx`, same as Login
- [ ] Validation logic itself (full name, email, Indian mobile format, password length, confirm-match, terms) is complete — no changes needed there

---

## 6. Session Timeout — `hooks/useSessionTimeout.jsx` ✅ confirmed working (client-side)

- [ ] Implement `resetSession()` in `AuthContext.jsx` so it actually does something when called
- [ ] Decide whether the 15-min client timer should also validate against real backend token expiry
- [ ] `SessionExpiredForm.jsx` itself is complete — no changes needed beyond what happens upstream

---

## 7. Forgot Password — `ForgotPasswordForm.jsx` ✅ most complete flow in the app

- [ ] Replace `verifyEmail()` (`mockForgotPasswordApi.js`) with real `POST /auth/forgot-password`
- [ ] Replace `verifyMobile()` (`mockForgetPasswordMobile.js`) with real mobile equivalent — confirmed real feature, see Section 8
- [ ] Replace `sendMockOtp()` / `verifyMockOtp()` with real OTP endpoints
- [ ] Preserve the `OTP_EXPIRED` / `INVALID_OTP` reason strings this component branches on
- [ ] "Contact Support" link on the OTP-verify step is intentionally disabled ("Coming soon") — confirm if that should be wired once `ContactSupportForm.jsx` actually submits somewhere (Section 15)
- [ ] Navigates to `/create-new-password` with `{ otpVerified: true, destination, method }` — this is what the (currently disabled) guard in `CreateNewPasswordForm.jsx` should check

---

## 8. `mockForgetPasswordMobile.js` — 🚩 confirmed real, separate flow

- [ ] Real, fully-built alternate reset path — needs its own real backend endpoint
- [ ] Inconsistent error handling vs. the email version — not blocking, but worth unifying

---

## 9. Create New Password — `CreateNewPasswordForm.jsx` ⚠️ see priority bugs above

- [ ] Add the actual `POST /auth/reset-password` call — nothing is sent anywhere currently
- [ ] Re-enable (and fix if needed) the commented-out OTP-verification route guard
- [ ] Password strength meter and match-validation are complete — no changes needed
- [ ] Confirm reset-token/OTP-proof needs to be included in the real submission (currently `destination`/`method` are only used for display text, not sent anywhere)

---

## 10. `api/authApi.js` — 🚩 dead/unused, conflicts with `AuthContext.jsx`

- [ ] `login()` here isn't called anywhere — `AuthContext.jsx` uses its own inline mock instead
- [ ] Decide: this becomes the real home for all auth API calls, replacing the inline mock and scattered mock files

---

## 11. API Client & Config — `lib/apiClient.js` / `lib/constants.js`

- [ ] Confirm `VITE_API_BASE_URL` points to the real FastAPI backend
- [ ] Add request interceptor for `Authorization: Bearer <token>`
- [ ] Add response interceptor for `401` → refresh or force logout
- [ ] Add endpoint path constants to `constants.js`

---

## 12. RBAC / Permissions ✅ confirmed, not actually conflicting

- [ ] `rbac/permissions.js` has real content: `{ ADMIN: 'admin', USER: 'user' }` — this is what `RoleGuard.jsx` should check against once implemented
- [ ] `lib/permissions.js` is completely empty (`{}`) — confirm with team whether to delete or build out for a different purpose
- [ ] Confirm real user roles match, or expand `PERMISSIONS` — only two roles exist currently, likely needs more granularity given how many modules this platform has (billing, data-warehouse, predictive-analytics, etc.)

---

## 13. Account Locked — `AccountLockedForm.jsx`

- [ ] Remove the dead `sessionStorage.removeItem(STORAGE_KEY)` call once attempt-tracking is consolidated to backend-driven
- [ ] "Reset Password" → `/forgot-password` and "Contact Support" → `/contact-support` links are correct, no change needed there

---

## 14. Password Reset Success — `PasswordResetSuccess.jsx` ✅ purely presentational

- [ ] No logic to integrate — static confirmation screen
- [ ] "Contact Support" text is a plain `<span>`, not a link/button (no `onClick`, unlike other screens) — minor inconsistency worth flagging to the UI team, not a backend item
- [ ] "Go to Sign in" correctly links to `/`

---

## 15. Contact Support — `ContactSupportForm.jsx` ⚠️ see priority bug above

- [ ] Add the actual support-ticket API call — currently `handleSubmit` only validates and sets local `submitted` state, nothing is sent anywhere
- [ ] Decide the real endpoint (`POST /support/tickets` or similar) and whether it needs auth (logged-in user) or works for anonymous/locked-out users too — this form is reachable from `AccountLockedForm` before login, so it likely needs to work without an auth token
- [ ] Form validation (name, email, subject dropdown, message) is complete — no changes needed there
- [ ] "Back to Sign In" button is correctly wired — no change needed

---

## 16. `SSOButton.jsx` ✅ working component, just unused

```jsx
function SSOButton({ provider, onClick }) {
  return <button onClick={onClick}>Sign in with {provider}</button>;
}
```
- [ ] This component works fine and takes exactly the props needed (`provider`, `onClick`) — but **neither `LoginForm.jsx` nor `SignupForm.jsx` use it.** Both build their own inline Google button instead, with no `onClick` at all.
- [ ] Once real SSO/OAuth is available: swap both forms' inline Google buttons for `<SSOButton provider="Google" onClick={...} />`, passing the real OAuth redirect handler
- [ ] Note: current styling is completely unstyled (plain `<button>`) — will need to match the existing inline button's CSS classes once swapped in, or the component itself should be updated to accept a `className`/style prop

---

## 17. `RoleGuard.jsx` ⚠️ no-op, see priority bug above

```jsx
function RoleGuard({ children, requiredPermission }) {
  return <>{children}</>;
}
```
- [ ] Same pattern as `ProtectedRoute` — renders children unconditionally, `requiredPermission` is accepted but never checked
- [ ] Implement the real check against the authenticated user's role/permissions once available, comparing to `rbac/permissions.js`'s `PERMISSIONS` values

---

## Summary: files with zero real logic (pure UI shells) that need to be built essentially from scratch, not "integrated"
```
src/modules/auth/components/SignupForm.jsx        (submit handler only)
src/modules/auth/components/CreateNewPasswordForm.jsx  (submit handler only)
src/modules/auth/components/ContactSupportForm.jsx (submit handler only)
src/modules/auth/hooks/useAuth.js                  (entire hook)
src/routes/ProtectedRoute.jsx                       (entire component)
src/modules/auth/rbac/RoleGuard.jsx                 (entire component)
src/modules/auth/components/MFAChallenge.jsx        (entire component — likely dead, confirm with team)
```
Everything else in this doc is a genuine mock-to-real swap, not new logic.
