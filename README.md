
# 🧾 Orders & Portfolio Service (Final Version)

## 🚀 Overview
This service manages **orders, fills, and portfolios** for ETF-style trading.  
Built with **TypeScript, Node.js, Express, and PostgreSQL (via Prisma ORM)**.  
Supports idempotent order creation, real-time portfolio tracking, and domain events.

---

## ⚙️ Features
✅ Create and list buy/sell orders (idempotent)  
✅ Apply fills and automatically update order status  
✅ Maintain real-time portfolio positions and average cost  
✅ Prevent overselling positions  
✅ In-memory domain event bus for `order.created` and `fill.applied`  
✅ Zod-based validation, clean modular structure, and Docker-ready  

---

## 📦 Folder Structure
```
src/
 ├── app/                # Express server, routes setup
 ├── core/               # Common modules (db, logging, errors, utils)
 ├── modules/
 │    ├── orders/        # Orders logic (controller, service, repo)
 │    ├── fills/         # Fills logic (controller, service)
 │    ├── portfolio/     # Portfolio computation
 │    ├── events/        # Event bus abstraction
 │    └── quotes/        # Mock price feed
 └── tests/              # Unit & integration tests
```

---

## 🧰 Tech Stack
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via Prisma ORM)
- **Validation**: Zod
- **Logging**: Pino
- **Testing**: Vitest / Jest
- **Containerization**: Docker + docker-compose

---

## 🧩 Endpoints Summary

### 1️⃣ Create Order
**POST** `/orders`
```json
{
  "symbol": "BND",
  "side": "buy",
  "qty": 100,
  "clientOrderId": "cli-20251024-001"
}
```

**Response**
```json
{
  "id": "...",
  "symbol": "BND",
  "side": "buy",
  "qty": 100,
  "status": "pending",
  "avgPrice": null
}
```

---

### 2️⃣ List Orders
**GET** `/orders?page=1&pageSize=10&symbol=BND`

**Response**
```json
{
  "items": [...],
  "page": 1,
  "pageSize": 10,
  "total": 3
}
```

---

### 3️⃣ Apply Fill
**POST** `/fills`
```json
{
  "orderId": "<uuid>",
  "price": 80.0,
  "qty": 10,
  "timestamp": "2025-10-24T07:45:00Z"
}
```

**Response**
```json
{
  "order": {
    "id": "...",
    "symbol": "BND",
    "side": "sell",
    "qty": 10,
    "status": "filled",
    "avgPrice": 80.0
  },
  "latestFill": {
    "price": 80.0,
    "qty": 10,
    "timestamp": "2025-10-24T07:45:00.000Z"
  }
}
```

---

### 4️⃣ Get Portfolio
**GET** `/portfolio`

**Response**
```json
{
  "positions": [
    { "symbol": "BND", "qty": 90, "avgCost": 73.6, "unrealizedPnL": 540 }
  ],
  "totals": { "value": 6624.0, "pnl": 540 }
}
```

---

## 🪄 Environment Setup

### Create `.env`
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
LOG_LEVEL=info
```

If you’re using **Neon.tech**:
```
DATABASE_URL=postgresql://neondb_owner:your_password@your-neon-host/neondb?sslmode=require
```

---

## 🐳 Run with Docker
```bash
docker compose up --build
```

Or manually start Postgres:
```bash
docker run --name pg -e POSTGRES_USER=app -e POSTGRES_PASSWORD=app -e POSTGRES_DB=appdb -p 5432:5432 -d postgres:16-alpine
```

Then run the app:
```bash
npm install
npm run dev
```

---

## 🧪 Testing
Run unit tests:
```bash
npm test
```

Run integration tests:
```bash
npm run test:watch
```

---

## 🧠 Key Business Logic
### Order Lifecycle
`pending → partially_filled → filled`  
Optional: `cancelled` or `rejected` via `PATCH /orders/:id`.

### Idempotency
Orders are unique by `clientOrderId`.  
Reusing the same ID returns the same response.  
Conflicting payloads → `409 Conflict`.

### Portfolio Updates
- **BUY:** Increases quantity, recalculates average cost.  
- **SELL:** Decreases quantity, retains average cost.  
- Prevents overselling beyond held quantity.

---

## 📜 Domain Events
Events are emitted via an in-memory queue:
- `order.created`
- `fill.applied`

You can log or subscribe to them for analytics or outbox dispatch.

---

## 📚 License
© 2025 Shivam Shrivastava

---

