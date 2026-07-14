# API Reference

**Base URL:** `http://localhost:3000`

---

## Auth

### `POST /auth/register`

Create a new user account.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "CUSTOMER",
  "createdAt": "2026-07-14T00:00:00.000Z"
}
```

**Errors:** `409 Conflict` — email already registered.

---

### `POST /auth/login`

Authenticate and receive a session cookie.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response `201`:**
```json
{
  "message": "Login successful"
}
```

**Cookie set:** `session` (httpOnly, sameSite=lax, secure=prod, maxAge=7d)

**Errors:**
- `401 Unauthorized` — invalid email or password
- `429 Too Many Requests` — 5 failed attempts in 10 minutes (per email)

---

### `POST /auth/logout`

Destroy the current session.

**Cookie required:** `session`

**Response `200`:**
```json
{
  "message": "Logout successful"
}
```

---

### `GET /auth/me`

Get the authenticated user's profile.

**Cookie required:** `session`

**Response `200`:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "CUSTOMER",
  "createdAt": "2026-07-14T00:00:00.000Z"
}
```

**Errors:** `401 Unauthorized` — missing or invalid session.

---

## Error Format

All errors return:
```json
{
  "message": "Description of the error",
  "error": "Error type",
  "statusCode": 400
}
```

---

## Rate Limiting

- **Login:** 5 attempts per 10 minutes per email (hashed Redis key `rate_limit:<sha256(email)>`)
- **Scope:** per-email, not per-IP
- **Reset:** on successful login (counter cleared)

---

## Validation

All endpoints validate input via `class-validator` + `ValidationPipe`:
- `email`: valid email, 5–50 chars
- `password`: 8–20 chars
- `name`: 2–30 chars

Unknown fields are stripped (`whitelist: true`) or rejected (`forbidNonWhitelisted: true`).
