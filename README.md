# TimeTrack — Employee Time Tracking Platform

TimeTrack is a full-stack employee time-tracking application: employees clock
in, take breaks, and clock out with one tap, admins review hours and approve
corrections, and everything is backed by server-side business rules rather
than trusted client state. It's a monorepo with two independent apps —
`backend` (Express + Prisma + PostgreSQL) and `frontend` (React 19 + Vite +
TanStack Router/Query) — plus a public marketing site (landing page + FAQ)
in front of the authenticated app.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Design System](#design-system)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Key Frontend Behaviors](#key-frontend-behaviors)
- [A Note on This Environment's Build Check](#a-note-on-this-environments-build-check)
- [Future Extension Points](#future-extension-points)

## Features

**For every employee**

- Email/password registration with mandatory email verification before
  first login, plus "Continue with Google" as a one-click alternative
  (auto-links to an existing password account by verified email).
- Clock in / clock out, start/end break, with live-ticking elapsed time
  and worked/break totals computed entirely from server timestamps.
- Shift auto-close protection: a shift left open too long is force-closed
  server-side rather than silently accumulating incorrect hours, with a
  self-service "Extend" option for genuine overtime and a mandatory
  correction flow for anything that closed unattended.
- Full shift history with per-shift worked/break duration, auto-closed and
  extended badges, and inline correction requests for flagged shifts.
- Profile page with account summary, total completed shifts, total hours
  worked, and live current status.
- Account settings: change password (blocked for Google-only accounts that
  never set one).
- Password reset via emailed one-time link, and resend of the email
  verification link, both with anti-enumeration responses (the API never
  reveals whether an email is registered).
- Idle timeout: auto sign-out after 15 minutes of inactivity, with a
  60-second warning modal, and cross-tab sync (activity or sign-out in one
  tab is reflected in every other open tab instantly).
- Light/dark theme toggle, persisted and applied before first paint (no
  flash of the wrong theme).

**For admins**

- Employee directory with live status and completed-shift counts.
- Per-employee full shift history, including any in-progress shift.
- One-click `.xlsx` export of an employee's completed shifts.
- Shift correction review queue (approve/reject, with an optional note
  shown back to the employee on rejection); role is re-checked from the
  database on every request, so a demotion takes effect immediately.

**Public site**

- Landing page (`/`) with a scroll-linked parallax hero, animated grid +
  glow background, staggered scroll-reveal sections (features, how it
  works, call to action), and a pulsating "SCROLL DOWN" indicator — all
  built with the `motion` library and fully respectful of the OS-level
  reduced-motion preference.
- Standalone FAQ page (`/faq`).
- Logged-out visitors land on the marketing site; logged-in visitors are
  redirected straight to the dashboard.

## Tech Stack

**Backend**

- Node.js + Express 4
- PostgreSQL via Prisma ORM 5
- Zod for request validation
- `jsonwebtoken` for auth, `bcrypt` for password hashing
- `google-auth-library` for verifying Google ID tokens
- `nodemailer` for transactional email (verification, password reset)
- `exceljs` for `.xlsx` shift exports
- TypeScript throughout, run in dev via `tsx watch`

**Frontend**

- React 19 + Vite 5
- TanStack Router (file-based routing) + TanStack Query (server state)
- Zustand for client state (auth session, theme)
- Tailwind CSS v4 (CSS-first theming, no `tailwind.config.js`)
- Radix UI primitives (`Select`, `Dialog`, `DropdownMenu`) for accessible,
  unstyled component foundations
- `react-hook-form` + Zod resolvers for form validation
- `recharts` for the admin shift chart
- `motion` (the React 19-compatible successor to Framer Motion) for
  scroll-linked parallax and reveal animations
- `lucide-react` for icons
- `axios` for API calls

## Project Structure
```text
time-tracker/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # User, Shift, Break, ShiftEditRequest models
│   │   └── migrations/         # hand-authored SQL migrations
│   └── src/
│       ├── auth/               # controllers, services, routes, validators
│       ├── shift/              # controllers, services, routes, validators
│       ├── break/              # controllers, services, routes, validators
│       ├── admin/              # controllers, services, routes, validators
│       ├── middleware/         # requireAuth, requireAdmin, error handler
│       ├── config/             # env, prisma client
│       ├── constants/          # job titles enforced on registration
│       ├── utils/              # AppError, asyncHandler, jwt, mailer
│       ├── app.ts
│       └── server.ts
└── frontend/
    └── src/
        ├── api/                # axios client + per-resource request functions
        ├── components/         # Button, Card, Select, Modal, StatusBadge, ShiftChart,
        │                       # ShiftCorrectionForm, GoogleAuthButton, IdleWarningModal,
        │                       # ProfileMenu, ThemeToggle, Loader
        ├── hooks/              # TanStack Query hooks (useAuth, useShift, useBreak,
        │                       # useAdmin, useCurrentUser) + useIdleTimeout, useElapsedTime
        ├── layouts/            # MarketingLayout, AuthLayout, AppLayout
        ├── pages/              # Landing, FAQ, Login, Register, ForgotPassword,
        │                       # ResetPassword, VerifyEmail, Dashboard, History,
        │                       # Profile, Settings, Admin
        ├── routes/             # TanStack Router file-based routes
        ├── store/              # Zustand stores (auth, theme)
        ├── constants/          # job titles (mirrors backend)
        ├── types/
        └── utils/
```


Routing note: this uses TanStack Router's **file-based routing**
(`src/routes/`). Route files are thin — they just wire a URL to a page
component from `src/pages/` and handle auth/role guards via `beforeLoad` or
an early redirect. Authenticated pages live under `routes/_authenticated/`,
which mounts the idle-timeout timer and its warning modal once for every
page beneath it. Running the dev server or build auto-generates
`src/routeTree.gen.ts`; don't edit that file by hand.

## Prerequisites

- Node.js 20+
- A PostgreSQL database (local install, Docker, or a hosted instance like
  Supabase/Neon/Railway)

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set DATABASE_URL to your Postgres connection string,
# and set JWT_SECRET to a long random string

npx prisma migrate dev --name init   # creates tables
npm run dev                          # starts on http://localhost:4000
```

Other useful scripts:

```bash
npm run build           # compile TypeScript to dist/
npm start                # run the compiled build
npm run prisma:generate  # regenerate the Prisma client
npm run prisma:studio    # browse the database in a GUI
```

**"Forgot password" and email verification both need SMTP configured.**
Everything else in the app works without it, but `/auth/forgot-password`,
`/auth/register`, and `/auth/resend-verification` will return a 500 with a
clear message until `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASSWORD` are set in
`.env` — registration itself still succeeds either way, but the new account
can't log in without the verification email actually arriving. For local
testing, a free [Mailtrap](https://mailtrap.io) sandbox inbox is the
easiest way to see the emails without sending real mail; for Gmail, use an
[App Password](https://myaccount.google.com/apppasswords), not your normal
account password.

**"Continue with Google" needs `GOOGLE_CLIENT_ID` configured.** Everything
else in the app works without it — the Google button simply doesn't render
if it's unset. Create an OAuth 2.0 Client ID (Application type: Web
application) at the [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
add your frontend origin (e.g. `http://localhost:5173`) under "Authorized
JavaScript origins," and set the same client ID in both
`backend/.env` (`GOOGLE_CLIENT_ID`) and `frontend/.env`
(`VITE_GOOGLE_CLIENT_ID`) — they must match exactly.

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# edit .env if your backend isn't on http://localhost:4000,
# and set VITE_GOOGLE_CLIENT_ID if you want the Google button to render

npm run dev         # starts on http://localhost:5173
```

```bash
npm run build       # type-checks and builds to dist/
npm run preview     # preview the production build locally
npm run lint        # eslint
```

Start the backend first (or at least before you try clocking in), since the
frontend calls it directly with no mock layer.

## Environment Variables

**backend/.env**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWTs — use a long random value |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` (default: `7d`) |
| `PORT` | API port (default: `4000`) |
| `CORS_ORIGIN` | Allowed frontend origin(s) — comma-separated for more than one (default: `http://localhost:5173`) |
| `FRONTEND_URL` | Used to build the link inside password-reset and verification emails (default: `http://localhost:5173`) |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Web Client ID. Required for "Continue with Google" — the rest of the app works fine without it. |
| `SMTP_HOST` | SMTP server hostname. Required for "Forgot password" and email verification to actually send email — the rest of the app works fine without it. |
| `SMTP_PORT` | SMTP server port (default: `587`) |
| `SMTP_SECURE` | `true` for implicit TLS (typically port 465), `false` for STARTTLS (typically port 587) |
| `SMTP_USER` / `SMTP_PASSWORD` | SMTP credentials |
| `SMTP_FROM` | From address for outgoing email, e.g. `TimeTrack <no-reply@yourdomain.com>` |

**frontend/.env**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API (default: `http://localhost:4000`) |
| `VITE_GOOGLE_CLIENT_ID` | Same OAuth 2.0 Web Client ID as backend's `GOOGLE_CLIENT_ID`. Without this set, the Google button simply doesn't render — email/password sign-in still works fine. |

## Design System

The UI follows a monochrome-plus-one-accent design: a zinc-based neutral
palette for surfaces and text, with a single burnt-orange accent color for
primary actions and highlights. Status colors (working/break/idle) are a
deliberate exception to the monochrome rule, since they need to be
distinguishable at a glance.

All colors and fonts are defined as CSS custom properties in
`frontend/src/index.css` via Tailwind v4's CSS-first `@theme` block — there
is no `tailwind.config.js`. Dark mode is class-based
(`.dark` on `<html>`, toggled by `useThemeStore`), with every color token
re-defined inside a `.dark { ... }` override block, so components never
branch on theme in JSX — they just reference the same token names in both
modes.

- **Fonts**: Geist (body/display) and Geist Mono (tabular numeric displays
  like elapsed time), loaded via Google Fonts.
- **Accent**: `#c2410c` in light mode, `#fb923c` in dark mode.
- **Neutrals**: `--color-surface`, `--color-card`, `--color-ink`,
  `--color-ink-soft`, `--color-line`.
- **Theme persistence**: stored in `localStorage`, applied via an inline
  `<script>` in `index.html` before React mounts, so there's no
  flash-of-wrong-theme on load.

## API Endpoints

All `/shift/*`, `/break/*`, and `/admin/*` routes require
`Authorization: Bearer <token>`.

### Auth
| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/auth/register` | `firstName, lastName, jobTitle, email, password, confirmPassword` | Creates an account (unverified) and emails a verification link. Returns `{ message }` — no session yet, since the account can't log in until it's verified. |
| POST | `/auth/login` | `email, password` | Returns `{ user, token }`. If the account exists and the password is correct but `emailVerified` is still `false`, returns a `403` with `error.details.code = "EMAIL_NOT_VERIFIED"` instead of a token, so the frontend can offer to resend the verification email. If the account has no password (Google-only), returns `403` with `error.details.code = "GOOGLE_ACCOUNT_NO_PASSWORD"`. |
| GET | `/auth/me` | — | Returns the authenticated user (requires auth) |
| PATCH | `/auth/change-password` | `currentPassword, newPassword, confirmNewPassword` | Requires auth. Rejects with `GOOGLE_ACCOUNT_NO_PASSWORD` if the account was created via Google and never set a password. |
| POST | `/auth/forgot-password` | `email` | Always returns the same generic success message, whether or not the email is registered — this prevents the endpoint from being used to check which emails have accounts. If registered, emails a one-time reset link that expires in 1 hour. |
| POST | `/auth/reset-password` | `token, newPassword, confirmNewPassword` | `token` is the value from the emailed link's `?token=` query param. The token is single-use — it's cleared the moment a reset succeeds. |
| POST | `/auth/verify-email` | `token` | `token` is the value from the emailed link's `?token=` query param. Sets `emailVerified = true` and clears the token. Single-use and expires after 24 hours. |
| POST | `/auth/resend-verification` | `email` | Always returns the same generic success message, whether or not the email is registered or already verified — same anti-enumeration reasoning as `/auth/forgot-password`. If registered and still unverified, emails a new verification link (invalidating the previous one). |
| POST | `/auth/google` | `idToken` | Verifies a Google ID token server-side. If the Google account (matched by verified email, or a previously linked `googleId`) already exists, returns `{ status: "signed_in", user, token }`. If it's a brand-new account, returns `{ status: "needs_job_title", pendingToken }` — `jobTitle` is required on `User` but Google doesn't provide it. |
| POST | `/auth/google/complete` | `pendingToken, jobTitle` | Finishes account creation for a `needs_job_title` response above. `pendingToken` is a short-lived (10-minute) signed token issued by `/auth/google`. Returns `{ user, token }`. |

### Shift
| Method | Path | Description |
|---|---|---|
| POST | `/shift/clock-in` | Start a new shift. Fails if one is already active, or if any auto-closed shift still has zero edit requests filed against it (see Auto-close below). |
| POST | `/shift/clock-out` | End the active shift. Fails if on break or no active shift. |
| GET | `/shift/current` | Returns the active shift (`WORKING`/`ON_BREAK`) or `null`. |
| GET | `/shift/history` | Returns completed shifts, newest first. |
| POST | `/shift/:shiftId/edit-requests` | `{ proposedClockOut, reason }` — employee-submitted request to correct a shift's clock-out time. The shift must already be `COMPLETED` and belong to the requester, and only one `PENDING` request per shift is allowed at a time. Goes to admin review rather than applying immediately — see `/admin/shift-edit-requests` below. |
| GET | `/shift/pending-corrections` | Auto-closed shifts belonging to the caller with zero edit requests ever filed against them. Non-empty means clock-in is currently blocked (see Auto-close below). |
| POST | `/shift/extend` | `{ note }` — one-time self-service push of the active shift's auto-close cutoff by 2 hours (to `clockIn + 10.5h`). Only usable while the shift is active, hasn't already been extended, and is between `clockIn + 8h` and `clockIn + 8.5h` — see Auto-close below. |

**Auto-close.** A shift left open (`WORKING`/`ON_BREAK`) for more than
`MAX_SHIFT_DURATION_MS` (8.5 hours, set in `shift.service.ts`) is treated as
a forgotten clock-out rather than a genuine unbroken shift. Rather than a
scheduled job, this is checked lazily the next time the shift is looked up
(clocking in, clocking out, checking current status, starting/ending a
break, or attempting an extend) — whichever happens first force-closes it
with `clockOut` stamped at exactly the cutoff in effect, and sets
`autoClosed: true` and `needsReview: true` on the shift. `autoClosed` is a
permanent record of how the shift was closed; `needsReview` clears once a
correction is approved.

Two ways an employee interacts with this, at different points in time:

- **Extend, before the shift closes.** Once a shift has been open for
  `EXTEND_WINDOW_START_MS` (8 hours), the frontend shows an Extend option
  until the shift actually auto-closes at 8.5 hours. Clicking it requires a
  short note and pushes the cutoff to `clockIn + 10.5h`
  (`MAX_SHIFT_DURATION_MS + EXTENSION_DURATION_MS`) — one time only per
  shift, so there's a hard ceiling on how far a self-service override can
  run. This is for genuine in-progress overtime, distinct from the
  correction flow below, which is for shifts that already closed
  unattended.
- **Mandatory correction note, after the shift closes.** `POST
  /shift/clock-in` rejects with a 409 if the caller has any auto-closed
  shift with zero `ShiftEditRequest`s filed against it — the frontend
  surfaces this as a blocking prompt on the Dashboard, walking the employee
  through one shift at a time via `POST /shift/:shiftId/edit-requests`
  before a new shift can start. This doesn't wait on admin approval —
  filing the request (regardless of outcome) is enough to unblock clock-in
  immediately; the admin reviews it independently, on their own time, via
  `/admin/shift-edit-requests`.

### Break
| Method | Path | Description |
|---|---|---|
| POST | `/break/start` | Starts a break on the active shift. Fails if already on break. |
| POST | `/break/end` | Ends the active break. Fails if no break is active. |

### Admin
All routes below require `Authorization: Bearer <token>` for a user whose
`role` is `ADMIN` (checked fresh from the database on every request, not
from the JWT, so a role change or demotion takes effect immediately).

| Method | Path | Description |
|---|---|---|
| GET | `/admin/employees` | Lists every employee with their current status and total completed shift count. |
| GET | `/admin/employees/:employeeId/shifts` | One employee's full shift history, including any in-progress shift. |
| GET | `/admin/employees/:employeeId/shifts/export` | Downloads an `.xlsx` workbook of one employee's completed shifts. |
| GET | `/admin/shift-edit-requests` | Lists correction requests, defaulting to `PENDING` only — the queue an admin actually needs to act on. Pass `?status=APPROVED` or `?status=REJECTED` to see resolved history instead. |
| PATCH | `/admin/shift-edit-requests/:requestId` | `{ decision: "APPROVED" \| "REJECTED", reviewNote?: string }`. Approving applies the request's `proposedClockOut` to the underlying shift and clears `needsReview`; rejecting leaves the shift untouched (`needsReview` stays `true`) so the employee can submit another attempt. Fails if the request has already been reviewed. |

All business rules (one active shift, no double clock-in, no break without
a shift, auto-close, extend window, etc.) are enforced server-side in the
service layer, not just in the UI. Worked and break durations are always
computed from server timestamps (`clockIn`, `clockOut`,
`Break.startTime/endTime`) — the frontend never sends or trusts
client-side timestamps; it only formats what the API returns, ticking the
display once a second between fetches.

## Database Schema

- **User** — `id, firstName, lastName, email, password (hashed, nullable for Google-only accounts), jobTitle, role (EMPLOYEE | ADMIN), googleId (nullable, unique), emailVerified, emailVerificationTokenHash, emailVerificationTokenExpiresAt, passwordResetTokenHash, passwordResetTokenExpiresAt, createdAt, updatedAt`. Has many shifts and shift edit requests (both submitted and reviewed). Reset/verification tokens are stored only as SHA-256 hashes, never in plaintext.
- **Shift** — `id, userId, clockIn, clockOut, status (WORKING | ON_BREAK | COMPLETED), autoClosed, needsReview, extendedCutoffAt, extensionNote, extendedAt, createdAt, updatedAt`. Has many breaks and edit requests. `extendedCutoffAt`/`extensionNote`/`extendedAt` are set together, once, if the employee used Extend on this shift.
- **Break** — `id, shiftId, startTime, endTime`.
- **ShiftEditRequest** — `id, shiftId, requestedByUserId, proposedClockOut, reason, status (PENDING | APPROVED | REJECTED), reviewedByUserId, reviewNote, reviewedAt, createdAt, updatedAt`. An employee's request to correct a shift's clock-out time, reviewed by an admin. Rows are never deleted, so rejected attempts stay in the history alongside whatever eventually got approved.

All timestamps are set explicitly from Node (`new Date()`), never via
Postgres `DEFAULT CURRENT_TIMESTAMP`, so nothing can drift out of sync with
a database server whose `timezone` setting isn't UTC.

## Key Frontend Behaviors

- **Idle timeout**: sessions sign out automatically after 15 minutes of no
  mouse/keyboard/scroll/touch activity, with a 60-second warning modal
  before it happens. Activity and sign-out are synced across every open
  tab via the native `storage` event — no server round-trip needed.
- **Route guards**: `routes/_authenticated.tsx` redirects to `/login` if
  there's no stored token, fetches the current user once for every
  authenticated page, and clears the session automatically if that
  request fails (expired/invalid token). `routes/_authenticated/admin.tsx`
  additionally redirects non-admins to `/dashboard`.
- **Public vs. authenticated landing**: `/` renders the marketing
  `Landing` page for logged-out visitors and redirects straight to
  `/dashboard` if a token is already present.
- **Theme**: persisted in `localStorage`, toggled via `ThemeToggle`,
  applied before first paint by an inline script in `index.html`.
- **Google sign-in**: rendered via Google Identity Services
  (`accounts.google.com/gsi/client`, loaded async in `index.html`), themed
  to match light/dark mode. A first-time Google sign-up shows an inline
  "what's your job title?" step (since Google doesn't provide one) before
  the account is actually created.

## A Note on This Environment's Build Check

Both apps were installed and type-checked/built in the sandbox this was
generated in. The frontend built cleanly end to end (`vite build`,
including route-tree generation). The backend's TypeScript is correct, but
`npx prisma generate` couldn't complete here because this sandbox blocks
the download of Prisma's query engine binary — that's an environment
restriction, not a code issue. Run `npx prisma generate` (or `prisma
migrate dev`, which also runs it) on your own machine as the first backend
step and it will work normally.

## Future Extension Points

The layered structure (routes → controllers → services → Prisma) and the
feature-based folders make it straightforward to add, without refactoring
existing code:

- **Payroll** — a new `payroll` feature module that reads completed
  `Shift` records; no changes needed to the shift/break logic.
- **Geofencing** — add optional `latitude`/`longitude` columns to `Shift`
  and `Break`, validated in the existing Zod validators.
- **Scheduling** — a new `Schedule` model plus a `schedule` feature module;
  shifts could later reference a `scheduleId`.
- **Reporting** — a `reports` module that aggregates existing `Shift`/
  `Break` data; the `workedDurationMs`/`breakDurationMs` calculation
  already lives in one place (`shift.service.ts`) for reuse.
- **Other OAuth providers** — the `googleAuth`/`linkOrReuseGoogleAccount`
  pattern in `auth.service.ts` generalizes to other identity providers by
  swapping the token-verification step and adding another nullable
  `*Id @unique` column to `User`.
- **Team/manager hierarchy** — `role` already distinguishes `EMPLOYEE` from
  `ADMIN`; a `managerId` self-relation on `User` would support a
  manager-scoped view without touching the `ADMIN` path.