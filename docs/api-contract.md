# VisitTrack API Contract (Draft)

## Base URL
- Local: `http://localhost:4000`

## Auth
- POST `/api/auth/login`
  - body: `{ username, password }`
  - 200: `{ token, user: { id, username, role } }`
- GET `/api/auth/me` (Bearer)
  - 200: `{ id, username, role }`

## Visitors
- GET `/api/visitors` — query: `?q=&page=&pageSize=`
- POST `/api/visitors`
  - body: `{ firstName, middleName?, lastName, contact?, idNumber?, relation?, qrCode?, photoUrl?, blacklistStatus? }`
- GET `/api/visitors/:id`
- PATCH `/api/visitors/:id`
- DELETE `/api/visitors/:id`

## Personnel
- GET `/api/personnel` — query: `?q=&page=&pageSize=`
- POST `/api/personnel`
  - body: `{ firstName, middleName?, lastName, roleTitle?, qrCode?, photoUrl? }`
- GET `/api/personnel/:id`
- PATCH `/api/personnel/:id`
- DELETE `/api/personnel/:id`

## QR & Scanning
- POST `/api/scan`
  - body: `{ qrCode, action: 'checkin'|'checkout' }`
  - 200: `{ status: 'ok', event: 'checkin'|'checkout', at, logId, subjectType, subject, alerts }`
    - `subject`: `{ type: 'visitor'|'personnel', id, fullName, firstName?, middleName?, lastName?, roleTitle?, photoUrl? }`

## Uploads
- POST `/api/uploads/image`
  - body: `{ dataUrl }` where `dataUrl` is a `data:image/png;base64,...` or `data:image/jpeg;base64,...`
  - limits: ≤ 2 MB; content-type must be image/png or image/jpeg
  - 201: `{ url: '/uploads/<filename>' }`

### Static Files
- Images are served from `/uploads/*` (local storage during development).

## Visit Logs
- GET `/api/visit-logs`
  - query: `?subjectType=visitor|personnel&subjectId=&dateFrom=&dateTo=&page=&pageSize=`
  - returns: `{ data: VisitLog[], total, page, pageSize }`

## Violations
- GET `/api/violations`
- POST `/api/violations`
  - body: `{ visitorId, level, details }`

## Reports
- GET `/api/reports/visitors.csv?dateFrom=&dateTo=`
- GET `/api/reports/personnel.csv?dateFrom=&dateTo=`
- GET `/api/reports/visit-logs.csv?subjectType=visitor|personnel&subjectId=&dateFrom=&dateTo=&page=&pageSize=`
- GET `/api/reports/visitors.pdf` (501 for now)
- GET `/api/reports/personnel.pdf` (501 for now)

## Analytics & Forecasting
- GET `/api/analytics/summary`
  - 200: `{ totals: { visitors, personnel }, today: { checkIns }, inside: { current } }`
- GET `/api/analytics/visitor-forecast`
  - query:
    - `window` number (default 7)
    - `days` number (default 30)
    - `includePersonnel` boolean (`true|false`)
    - `algo` `ma|hw` (moving average or Holt-Winters additive), default `ma`
    - `seasonLen` number, default 7 (only for `hw`)
    - `alpha` `0.01..0.99` smoothing level (only for `hw`), default 0.3
    - `beta` `0.01..0.99` trend smoothing (only for `hw`), default 0.1
    - `gamma` `0.01..0.99` seasonal smoothing (only for `hw`), default 0.3
  - 200: `{ window, algo, seasonLen?, alpha?, beta?, gamma?, series, movingAverage, smoothed?, nextDayForecast, seriesPersonnel?, movingAveragePersonnel?, nextDayForecastPersonnel?, metrics?: { mae, rmse, mape?, ci?: { lo, hi } }, fallbackUsed? }`
- GET `/api/analytics/hourly-heatmap?days=30`
  - 200: `{ days, grid: number[7][24] }` where grid[row=Sun..Sat][col=0..23]
- GET `/api/analytics/trends?granularity=week|month&periods=12`
  - 200: `{ granularity, series: { label, count }[] }`

## Notes
- All endpoints under `/api/*` require JWT except `/health` and `/api/auth/login`.
- Roles: `admin`, `officer`, `staff`.

### RBAC Matrix (server-enforced)
- Auth: public `/api/auth/login`, token required elsewhere.
- Visitors: GET `admin|staff|officer`; POST/PATCH/DELETE `admin|staff`.
- Personnel: GET `admin|staff|officer`; POST/PATCH/DELETE `admin|staff`.
- Scan: `admin|staff|officer`.
- Visit Logs: GET `admin|staff`.
- Reports (CSV/PDF): `admin|staff`.
- Analytics Summary: `admin|staff|officer`.
