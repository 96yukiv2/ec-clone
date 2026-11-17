# ec-clone

Local-first EC learning playground, with a Next.js frontend, NestJS backend, PostgreSQL + Drizzle, Redis, Mailpit and Docker Compose.

## Run

Requirements: Docker Desktop and Docker Compose.

```sh
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:4000
- Swagger UI: http://localhost:4000/docs
- Mailpit: http://localhost:8025

Register a user in the account page. Catalog seed includes 150 products and coupon code `WELCOME10` (10% off).

## Current implemented subset

- Product catalog: filtering by category, keyword and price, ordering, pagination, suggestions and related products APIs
- Cookie sessions with scrypt password hashes and registration/login/logout
- PostgreSQL cart, favorites, history and address APIs
- Transactional checkout with stock row locks, order snapshots, coupons, shipping, and idempotency keys
- Mock payment success/failure, cancellation and stock return
- Purchaser-only review submission and helpful votes API
- Basic web pages for catalog, product details, account, cart and orders

## Still incomplete

This is an initial, **unverified implementation**, not a finished Amazon clone. Missing work includes: admin UI + API, robust input validation and security hardening (CSRF/rate limiting), product variants/SKU, recommendation algorithms, upload/storage, Redis caching, background jobs/email, analytics, performance tests, full E2E/unit tests, webhook simulation, guest checkout and responsive UI polish. Stripe testing is explicitly postponed.

No production deployment is intended. Mock checkout never charges a card. Do not store real personal information.

## Architecture

- `apps/web`: Next.js App Router
- `apps/api`: NestJS controller-based modular monolith
- `apps/api/src/schema.ts`: Drizzle table definitions
- `apps/api/src/db.ts`: transactional PostgreSQL access; some domain queries use parameterized SQL for concurrency education
- `apps/api/src/seed.ts`: idempotent sample catalog

Note: Local startup / compile checks have not yet been run in this environment.
