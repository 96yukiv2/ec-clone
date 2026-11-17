# ec-clone

Local-first ecommerce playground: Next.js + React + TypeScript, NestJS modular monolith, PostgreSQL with Drizzle schema, plus Redis and Mailpit in Docker Compose.

## Start

Requirements: Docker Desktop / Docker Compose, with free ports 3000, 4000, 5432, 6379 and 8025.

```sh
docker compose up --build
```

- Storefront: http://localhost:3000
- API: http://localhost:4000
- Swagger: http://localhost:4000/docs
- Mailpit: http://localhost:8025

On first start Drizzle pushes the schema and seeds 150 products. Register at `/account`. Use coupon `WELCOME10` for 10% off. Add a product to your cart, create an order, and choose Mock success/failure in `/orders`.

To allow a specific **local** account to use `/admin`, register normally, then explicitly promote that account:

```sh
docker compose exec postgres psql -U ec -d ec -c "UPDATE users SET role='admin' WHERE email='your-local-email@example.test';"
```

Replace the placeholder email with the address used for registration. Do not promote arbitrary users. The admin page includes sales totals, daily revenue, low stock, popular products, product creation and shipping transitions.

## Architecture

```text
apps/
  web/        Next.js App Router storefront
  api/        NestJS modular monolith, PostgreSQL/Drizzle
compose.yaml  PostgreSQL, Redis, Mailpit, API, Web
```

The database schema lives in `apps/api/src/schema.ts`. Domain controllers are split into auth, products, customer, orders, and admin. DB operations use parameterized SQL alongside Drizzle schema definitions, specifically to make transaction behavior visible for study.

## Current features

- Product search/filter/sort, pagination, suggestions API, related products, rating aggregation
- Email/password registration, login, logout, cookie-based sessions
- Carts, favorites, browsing history, saved-address API
- Transactional checkout: locked inventory, coupon and shipping calculations, item price snapshots, idempotency key
- Mock payment success/failure, cancellation with inventory restoration
- Purchaser-only reviews, rating and helpful votes
- Admin APIs/UI for products, orders, revenue, rankings, low inventory and audit trail
- Basic responsive catalog/product/cart/account/order/admin pages; seed data

## Known unfinished work

**This is a partial, not yet runtime-tested implementation.** Requested remaining features include product variants/SKU, guest checkout, login throttling/CSRF mitigation, client address UI, image upload/storage, Redis caching and invalidation, job queues/email, recommendation algorithms, price/rating/stock filter UI, webhook simulation, proper refund accounting, production-quality role/auth handling, load tests and E2E tests. Stripe test mode is postponed by design.

The included unit test is illustrative and not sufficient to validate inventory concurrency, checkout idempotency, or security. Run `docker compose up --build`, `docker compose exec api sh -c 'corepack enable && pnpm --filter @ec/api test'`, and verify the user journeys locally.

Do not expose this project to the public Internet or enter real customer/payment data. No actual money is charged.
