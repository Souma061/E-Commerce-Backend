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

## Products

### `POST /products`

Create a product (Admin or Seller only).

**Cookie required:** `session`

**Request body:**
```json
{
  "categoryId": "uuid",
  "title": "MacBook Pro 14",
  "description": "Laptop with M3 chip",
  "price": "1999.99",
  "stockQuantity": 10,
  "variants": [
    {
      "sku": "MBP14-SPACE-GRAY",
      "name": "Space Gray 16GB",
      "color": "Space Gray",
      "price": "1999.99",
      "stockQuantity": 5
    }
  ]
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "title": "MacBook Pro 14",
  "slug": "macbook-pro-14",
  "price": "1999.99",
  "stockQuantity": 10,
  "isActive": true,
  "categoryId": "uuid",
  "sellerId": "uuid",
  "variants": [
    {
      "id": "uuid",
      "sku": "MBP14-SPACE-GRAY",
      "name": "Space Gray 16GB",
      "price": "1999.99",
      "stockQuantity": 5
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Errors:**
- `404 Not Found` — category doesn't exist
- `409 Conflict` — SKU already exists

---

### `GET /products`

List active products. Public.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "title": "MacBook Pro 14",
    "slug": "macbook-pro-14",
    "price": "1999.99",
    "category": { "id": "uuid", "name": "Electronics", "slug": "electronics" },
    "variants": [ { "id": "uuid", "sku": "MBP14-SPACE-GRAY", "name": "Space Gray 16GB", "price": "1999.99" } ],
    "createdAt": "..."
  }
]
```

---

### `GET /products/:slug`

Get a product by slug. Public.

**Response `200`:** Single product object (with category + variants).

**Errors:** `404 Not Found`

---

### `PATCH /products/:id`

Update a product (Admin or Seller only). Seller can only update their own products.

**Cookie required:** `session`

**Request body:** (partial)
```json
{
  "title": "Updated Title",
  "price": "1499.99"
}
```

Variants are **fully replaced** on update — all existing variants are deleted and recreated from the payload.

**Response `200`:** Updated product with category + variants.

**Errors:**
- `401 Unauthorized` — missing/invalid session
- `403 Forbidden` — seller trying to update another seller's product
- `404 Not Found` — invalid id

---

### `DELETE /products/:id`

Delete a product (Admin or Seller only). Seller can only delete their own products.

**Cookie required:** `session`

**Response `200`:**
```json
{
  "message": "Product deleted"
}
```

**Errors:**
- `404 Not Found` — invalid id
- `403 Forbidden` — seller trying to delete another seller's product

---

## CSRF Protection

All state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) require a CSRF token.

**How it works:**
1. Server sets `csrf-token` cookie (non-httpOnly, readable by JS) with an HMAC-signed value on first visit
2. Client reads `csrf-token` cookie and sends its value in the `x-csrf-token` header on state-changing requests
3. Server validates the header matches the signed cookie

**Headers:**
- `Cookie: csrf-token=<value>` (set automatically by browser)
- `x-csrf-token: <value>` (must match cookie value)

**Errors:**
- `403 Forbidden` — missing or invalid CSRF token

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
