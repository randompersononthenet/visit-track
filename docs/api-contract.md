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
- GET `/api/analytics/visitor-forecast?window=7` (planned)

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
