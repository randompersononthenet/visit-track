# VisitTrack

A visitor management and analytics system for facilities. This repository contains the client (React), server (Express/Sequelize), and a public pre-registration microapp.

## Key Features
- **Visitor and Personnel Registration** — Capture details, photos, and check-ins.
- **Visit Logs & Reports** — Searchable logs, trends, and export options.
- **Role-based Access** — Admin, Staff, Officer, Warden, Analyst.
- **Forecasting** — Next-day visitor forecast with Moving Average or Holt–Winters.

## Recently Updated
- **Sidebar Logo Enhancements (Client)**
  - Larger VisitTrack logo in the sidebar (`client/src/shell/AppShell.tsx`).
  - Logo is clickable and redirects to `/dashboard`.
  - Shows a welcome line with `username` and `role` when expanded.
- **Admin: Rename Users (Server + Client)**
  - New endpoint: `PATCH /api/users/:id/username` to rename accounts (admin only).
  - UI: Rename action and modal in Users management (`client/src/views/Users.tsx`).
- **Actionable Forecasts (Client + Server)**
  - Dashboard shows a colored badge and suggestion based on forecast vs baseline (`client/src/views/Dashboard.tsx`).
  - Legend toggle explains thresholds and colors; badge has an ARIA label for accessibility.
  - Server returns `baseline`, `confidence`, and `explanation` with the forecast (`server/src/routes/analytics.ts`).
- **Login UI Fix**
  - Password visibility icons now correctly reflect the show/hide state (`client/src/views/Login.tsx`).

## Forecast Categories (Client)
Mapping uses the ratio of `nextDayForecast / baseline` (baseline from the latest moving average):
- **Very Low** — < 60% (slate)
- **Low** — 60–85% (emerald)
- **Normal** — 85–115% (indigo)
- **High** — 115–140% (amber)
- **Spike** — > 140% (rose)

Each category displays a short, actionable suggestion (e.g., add an officer for High; open extra lanes for Spike).

## Forecast API Additions (Server)
`GET /api/analytics/visitor-forecast`
- Existing: `series`, `movingAverage`, `nextDayForecast`, optional Holt–Winters `smoothed`, `metrics`, etc.
- New:
  - `baseline`: number — last moving average value (rounded).
  - `confidence`: 'high' | 'medium' | 'low' — derived from MAPE.
  - `explanation`: string — concise method/params summary and fallback note if used.

## Admin: Rename User (Server)
`PATCH /api/users/:id/username` with body `{ username: string }`
- Requires admin role.
- Validates length and uniqueness; writes to audit log.

## Accessibility
- Forecast badge includes descriptive `aria-label`.
- Legend toggle provides a non-color explanation of thresholds.

## Paths Reference
- Client app shell: `client/src/shell/AppShell.tsx`
- Dashboard (forecast): `client/src/views/Dashboard.tsx`
- Login view: `client/src/views/Login.tsx`
- Users management: `client/src/views/Users.tsx`
- Forecast route: `server/src/routes/analytics.ts`
- Users route: `server/src/routes/users.ts`

## Development
- Client: Vite + React + Tailwind.
- Server: Express + Sequelize (PostgreSQL).
- Pre-registration microapp: Next.js (`prereg-online/`).

Run services as per your existing workflow. Ensure environment variables are configured for the database and JWT.
