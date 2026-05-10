# ZeroBase Backend API Contract

Base prefix: `/api`

## Auth
- `GET /auth/csrf/`
- `POST /auth/register/student/`
- `POST /auth/register/company/`
- `POST /auth/login/`
- `POST /auth/refresh/` (uses `refresh_token` cookie)
- `POST /auth/logout/`

## Profile
- `GET /profile/` (student/company)
- `PATCH /profile/` (student/company)

## Posts / Feed
- `POST /create-post/` (company only)
- `GET /home/?search=&type=&page=1&page_size=10` (authenticated users)

## JSON Response Shape

Success:
`{ "ok": true, "data": { ... } }`

Error:
`{ "ok": false, "error": "reason" }`

## Auth Header

Use `Authorization: Bearer <access_token>` for protected endpoints.
`refresh_token` is stored in secure HttpOnly cookie and rotated on refresh.
