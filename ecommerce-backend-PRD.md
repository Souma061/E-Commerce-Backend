# E-Commerce Backend — Product Requirements Document

**Doc version:** v0.1.2 (Draft)
**Owner:** Souma
**Stack:** NestJS, Prisma, PostgreSQL, Redis, BullMQ / Kafka
**Status:** Draft — scope not yet frozen

---

## Changelog

| Version | Date       | Changes                                                                                                           |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| v0.1.0  | 2026-07-06 | Initial draft — core scope, architecture, milestone plan                                                          |
| v0.1.1  | 2026-07-07 | Added data model (§4.7) — 12 entities with fields and relationships                                               |
| v0.1.2  | 2026-07-11 | Auth (§4.1) switched from JWT to Redis-backed session auth; added attack-surface table; JWT moved to upgrade path |

---

## 1. Purpose

A moderate-to-advanced backend project to build a working e-commerce system that deliberately exercises distributed-systems concepts (queues, event fan-out, concurrency control, idempotency) rather than a UI-focused or purely CRUD project. Primary goal is learning-by-building and portfolio depth, not production launch.

## 2. Goals

- Build a backend that would survive real concurrency problems (overselling, duplicate payments) and demonstrably fixes them.
- Apply prior project patterns (outbox pattern, circuit breaker, idempotency) in a new domain instead of learning them in isolation.
- Produce a project explainable in an interview: "here's the race condition, here's how I fixed it, here's why."

## 3. Non-Goals (v1)

- Multi-vendor marketplace logic
- Tax/shipping calculation engines
- Admin dashboard UI
- Production-grade payment compliance (PCI-DSS) — sandbox/test-mode gateway only
- Mobile clients / frontend (API-only)

## 4. Core Domain Scope

### 4.1 Auth & Authorization

**Method:** Redis-backed session auth (opaque token), email + password. Not JWT. OTP dropped for v1.

**Login flow:**

- Password verified with bcrypt (per-user salt embedded) + app-wide pepper.
- Pepper applied HMAC-first (`bcrypt(base64(HMAC_SHA256(password, PASSWORD_PEPPER)))`) to avoid bcrypt's 72-byte truncation.
- On success → random session token (`crypto.randomBytes(32).toString('base64url')`).
- Stored in Redis: `session:<token>` → `{ userId, role }`, TTL 7 days.
- Set as `httpOnly`, `secure` (prod only), `sameSite=lax` cookie.

**Session validation:**

- Every protected route uses an `AuthGuard` + `@CurrentUser()` decorator.
- Reads cookie → looks up Redis → resolves user or 401.
- Instantly revocable: delete the Redis key (fraud, password reset, admin action).

**Authorization:** role-based guards — customer / seller / admin via `CanActivate` + custom decorators, role read from the resolved session.

**Rate limiting:** per-email login limiter via Redis `INCR`+`EXPIRE` — 5 attempts / 10 min.

**Attack surface coverage:**

| Threat                             | Defense                                            |
| ---------------------------------- | -------------------------------------------------- |
| DB leaked/dumped                   | bcrypt + salt + pepper (offline attack resistance) |
| Login endpoint brute-forced        | Redis rate limiter — 5 attempts / 10 min per email |
| Session theft via XSS              | `httpOnly` cookie                                  |
| Session theft via network sniffing | `secure` (HTTPS-only) cookie                       |
| Account enumeration                | Identical error for "no user" and "wrong password" |
| Forced logout / revocation         | Delete Redis session key directly                  |

**Storage:** PostgreSQL `users` table (permanent); Redis sessions + rate-limit counters (ephemeral, TTL-based).

**Deferred (not v1):** OTP / phone login, OAuth / social login, WebAuthn / passkeys, JWT (sessions solve revocation better for e-commerce; JWT is the stated upgrade path if stateless horizontal scaling is later needed). Session versioning / forced logout on password change — requires a `session_version` column on User and a version check in AuthGuard; deferred until password-change endpoint exists.

### 4.2 Product Catalog

- Categories, product variants (size/color)
- Search & filter, keyset pagination

### 4.3 Cart

- Redis-backed, TTL-based expiry
- `cart.abandoned` event on expiry

### 4.4 Orders & Inventory

- Order placement with stock decrement under concurrency safety
- Locking strategy: pessimistic (`SELECT FOR UPDATE`) as baseline; optimistic (version column) as a comparison exercise
- Saga-style flow for order → payment → inventory → shipping steps, with compensating actions on failure

### 4.5 Payments

- Sandbox gateway integration (Stripe test mode or reused Cashfree patterns)
- Idempotency keys on all charge attempts
- Circuit breaker around gateway calls

### 4.6 Events & Async Processing

- BullMQ for task-style work: payment processing, email sending
- Kafka (or Redis pub/sub as a lighter stand-in) for fan-out events: `order.created`, `payment.succeeded`, `inventory.stock-updated`
- Outbox pattern for reliable event emission alongside DB commits

### 4.7 Data Model

```
USER            — user_id, email, password_hash, role, name, created_at, updated_at
ADDRESS         — address_id, user_id, street, city, state, zip, country, phone, address_type, is_default, created_at, updated_at
CATEGORY        — category_id, name, slug, description, created_at, updated_at
PRODUCT         — product_id, category_id, seller_id, title, slug, description, price, stock_quantity, is_active, created_at, updated_at
PRODUCT_VARIANT — variant_id, product_id, sku, name, size, color, price, stock_quantity, created_at, updated_at
REVIEW          — review_id, product_id, user_id, title, content, rating, created_at
CART            — cart_id, user_id, expires_at, created_at, updated_at
CART_ITEM       — cart_item_id, cart_id, product_id, variant_id, quantity, created_at
ORDER           — order_id, user_id, address_id, status, total_amount, created_at, updated_at
ORDER_ITEM      — order_item_id, order_id, product_id, variant_id, quantity, price_at_purchase
PAYMENT         — payment_id, order_id, amount, currency, status, idempotency_key, gateway_txn_id, error_message, paid_at, created_at, updated_at
STOCK_MOVEMENT  — movement_id, product_id, change_qty, reason, created_at
```

Relationships: see `ecommerce_backend_erd.html`.

## 5. Distributed Systems Concepts to Surface

| Concept                                     | Where it appears                                   |
| ------------------------------------------- | -------------------------------------------------- |
| Race conditions                             | Concurrent stock decrement on last item            |
| Idempotency                                 | Retried payment webhook / retried queue job        |
| Saga / compensating transactions            | Order → payment → inventory → shipping             |
| Outbox pattern                              | Order creation + event emission atomicity          |
| Circuit breaker                             | Payment gateway calls                              |
| Retry with backoff                          | Queue job failures                                 |
| Consumer lag / backpressure                 | Inventory-update consumer during traffic spike     |
| Eventual consistency                        | Search index / stock count lag vs. source of truth |
| Caching & invalidation                      | Product listing cache                              |
| Sharding (exploratory, not required for v1) | Orders by `userId` or region                       |

## 6. Success Criteria

- Can demonstrate an oversell bug live, then demonstrate the fix (locking).
- Can demonstrate a duplicate payment webhook, then demonstrate idempotent handling.
- Checkout endpoint stays responsive under a simulated burst (queue absorbs load).
- README documents each distributed-systems concept with a "before/after" note.

## 7. Milestones

1. **M1 — Foundations**: Auth, RBAC, product catalog, basic cart (no Redis yet)
2. **M2 — Order core**: Order placement, naive stock decrement (deliberately racy)
3. **M3 — Concurrency fix**: Add locking, prove race is gone
4. **M4 — Async processing**: BullMQ job for payment + email, outbox pattern for order events
5. **M5 — Fan-out**: Kafka/pub-sub for `order.created` → inventory + notification consumers
6. **M6 — Resilience**: Circuit breaker, retries, rate limiting on checkout
7. **M7 — Polish**: README write-up per concept, load test / lag demo

## 8. Open Questions

- Kafka vs Redis pub/sub for v1 — full Kafka setup adds infra overhead; may start with Redis pub/sub and note Kafka as a stated upgrade path.
- Sharding: exploratory only, or actually implemented for v1? (Currently: exploratory / stretch goal.)
- Payment gateway choice: Stripe test mode (simpler docs) vs Cashfree (reuse existing familiarity).

---

_This is a living document — update the version and changelog table with each meaningful scope change rather than editing history silently._
