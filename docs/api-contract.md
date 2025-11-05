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
- GET `/api/visitors`
- POST `/api/visitors`
  - body: `{ fullName, contact, idNumber, relation, blacklistStatus }`
- GET `/api/visitors/:id`
- PATCH `/api/visitors/:id`
- DELETE `/api/visitors/:id`

## Personnel
- GET `/api/personnel`
- POST `/api/personnel`
  - body: `{ fullName, roleTitle }`
- GET `/api/personnel/:id`
- PATCH `/api/personnel/:id`
- DELETE `/api/personnel/:id`

## QR & Scanning
- POST `/api/qrs/issue`
  - body: `{ subjectType: 'visitor'|'personnel', subjectId }`
  - 200: `{ qrCode }`
- POST `/api/scan`
  - body: `{ qrCode, action: 'checkin'|'checkout' }`
  - 200: `{ status: 'ok', timestamp, subject: {...}, alerts: [] }`

## Visit Logs
- GET `/api/visit-logs`
  - query: `?subjectType=visitor|personnel&subjectId=...&dateFrom&dateTo`

## Violations
- GET `/api/violations`
- POST `/api/violations`
  - body: `{ visitorId, level, details }`

## Reports
- GET `/api/reports/visitors.csv`
- GET `/api/reports/visitors.pdf`
- GET `/api/reports/personnel.csv`
- GET `/api/reports/personnel.pdf`

## Analytics & Forecasting
- GET `/api/analytics/summary`
- GET `/api/analytics/visitor-forecast?window=7`

## Notes
- All endpoints under `/api/*` require JWT except `/health` and `/api/auth/login`.
- Roles: `admin`, `officer`, `staff` (RBAC enforcement in Phase 5).
