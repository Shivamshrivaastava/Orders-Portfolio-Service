
# Orders & Portfolio Service (TypeScript + Express + Prisma + Postgres)

A clean, modular implementation of the assignment with idempotent order creation, fills settlement,
portfolio snapshot, mock quotes, and an in-memory event bus.

## Features
- **Idempotent** `POST /orders` via `Idempotency-Key` header (or `clientOrderId` fallback)
- **Filtering & pagination** on `GET /orders`
- **Fills settlement** `POST /fills` updates order status and positions atomically
- **Portfolio snapshot** `GET /portfolio` with unrealized PnL (mock quotes)
- **Mock quotes** with cache and `POST /quotes` override
- **Structured logs** (pino), env config, normalized errors, Docker
- **Tests** with Vitest + Supertest (idempotency & happy-path)

## Quickstart (Docker)
```bash
# 1) Build & run
docker compose up --build

# API will be on http://localhost:3000
```

## Quickstart (Local Dev)
```bash
# Requirements: Node.js 18+, Docker (for Postgres) or local Postgres

# 1) Install deps
npm install

# 2) Start Postgres (Docker)
docker run --name pg -e POSTGRES_USER=app -e POSTGRES_PASSWORD=app -e POSTGRES_DB=appdb -p 5432:5432 -d postgres:16-alpine

# 3) Create .env
cat > .env <<'ENV'
DATABASE_URL=postgres://app:app@localhost:5432/appdb?schema=public
PORT=3000
LOG_LEVEL=debug
ENV

# 4) Generate client & migrate
npx prisma generate
npm run db:migrate -- --name init

# 5) Run dev server
npm run dev
# => http://localhost:3000/health
```

## API Examples

### Create Order (idempotent)
```bash
curl -X POST http://localhost:3000/orders \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: idem-123' \
  -d '{"symbol":"BND","side":"buy","qty":120,"clientOrderId":"cli-20251010-0001"}'
```

### List Orders
```bash
curl 'http://localhost:3000/orders?page=1&pageSize=20&symbol=BND&status=filled&sort=createdAt:desc'
```

### Apply Fill
```bash
curl -X POST http://localhost:3000/fills \
  -H 'Content-Type: application/json' \
  -d '{"orderId":"<uuid>","price":73.5,"qty":100,"timestamp":"2025-10-10T09:00:00Z"}'
```

### Portfolio Snapshot
```bash
curl http://localhost:3000/portfolio
```

### Override Quote (tests/dev)
```bash
curl -X POST http://localhost:3000/quotes -H 'Content-Type: application/json' -d '{"symbol":"BND","price":73.8}'
```

## Project Structure
```
src/
  app/            # server, routes
  core/           # db, logging, errors, utils
  modules/
    events/       # in-memory event bus
    orders/       # controller, service, repo, validators
    fills/        # controller, service, repo
    portfolio/    # controller, service
    quotes/       # controller, service
tests/            # vitest tests
prisma/           # schema.prisma
```

## Notes & Trade-offs
- Order statuses kept as strings to match the provided sketch.
- Positions allow going negative (short) to keep logic simple when selling first.
- Realized P&L intentionally ignored (not required).
- Event bus is in-memory; can be upgraded to outbox pattern.
- Sorting allowlist enforced on `GET /orders`.

## Running Tests
```bash
# Set DATABASE_URL to a test database, then:
npm test
```
