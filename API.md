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

## Users

### `PATCH /users/role`

Promote a user to a different role (Admin only).

**Cookie required:** `session` (must be ADMIN)

**Request body:**
```json
{
  "userId": "uuid",
  "role": "SELLER"
}
```

**Response `200`:**
```json
{
  "message": "Role updated successfully"
}
```

**Errors:**
- `401 Unauthorized` — missing or invalid session
- `403 Forbidden` — caller is not an ADMIN

---

## Categories

### `POST /categories`

Create a category (Admin or Seller only).

**Cookie required:** `session`

**Request body:**
```json
{
  "name": "Electronics",
  "description": "Gadgets and devices"
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "name": "Electronics",
  "slug": "electronics",
  "description": "Gadgets and devices",
  "createdAt": "2026-07-15T00:00:00.000Z",
  "updatedAt": "2026-07-15T00:00:00.000Z"
}
```

**Errors:** `409 Conflict` — name already exists.

---

### `GET /categories`

List all categories. Public.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "Electronics",
    "slug": "electronics",
    "description": "Gadgets and devices",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

### `GET /categories/:slug`

Get a single category by slug. Public.

**Response `200`:** Single category object.

**Errors:** `404 Not Found` — slug doesn't exist.

---

### `PATCH /categories/:id`

Update a category (Admin or Seller only).

**Cookie required:** `session`

**Request body:** (partial)
```json
{
  "name": "Updated Name"
}
```

**Response `200`:** Updated category object.

**Errors:** `404 Not Found` — invalid id.

---

### `DELETE /categories/:id`

Delete a category (Admin only).

**Cookie required:** `session`

**Response `200`:**
```json
{
  "message": "Category deleted"
}
```

**Errors:** `404 Not Found` — invalid id.

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
