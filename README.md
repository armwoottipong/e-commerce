# Thai Fashion Marketplace MVP

Next.js full-stack MVP for a Thai fashion marketplace with seller approval, product approval, multi-seller checkout, stock reservation, and mock payment.

## Quick Start

Run everything with Docker:

```bash
docker compose up --build
```

This builds and runs the Next.js app in production mode, so page loads are much faster than `next dev` inside Docker. Then open `http://localhost:3000`.

For local Next.js development with Docker Postgres:

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm db:push
pnpm db:seed
pnpm dev
```

Docker services:

- `web`: Next.js app on `http://localhost:3000`
- `postgres`: PostgreSQL on `localhost:5432`

Set `SEED_DATABASE=false` for the `web` service if you do not want seed data to run on container start.

Seed accounts:

- Admin: `admin@market.test` / `password123`
- Seller: `seller@market.test` / `password123`
- Customer: `customer@market.test` / `password123`

## MVP Rules

- Seller must be approved before selling.
- Product must be approved before public listing.
- Cart can contain multiple sellers; checkout creates one order with seller orders.
- Shipping is 50 THB per seller order.
- Commission is 10% of seller subtotal, excluding shipping.
- Payment is mocked but uses a payment session and idempotent confirmation flow.

## Authentication

- Sessions are stored in PostgreSQL and referenced by a 256-bit HTTP-only cookie.
- Logout revokes the database session immediately.
- Sessions expire after 30 days and stale sessions are cleaned automatically.
- Login is limited to 5 failed attempts per email/IP within 15 minutes.
- Guest carts merge into the customer cart after login or registration.

## JSON API

API discovery is available at `GET /api/v1`. All responses use:

```json
{ "ok": true, "data": {} }
```

Errors use `{ "ok": false, "error": { "code": "...", "message": "..." } }` with an appropriate HTTP status. Public catalog endpoints require no session. Account, seller, and admin endpoints use the same HTTP-only session as the app. Mutations require an `Origin` matching `APP_URL`.

Payout endpoints only update manual tracking status. They never initiate a bank transfer.
