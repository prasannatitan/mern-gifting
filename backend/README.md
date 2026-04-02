## Backend (Bun + Prisma) for Tanishq Multivendor MVP

This is the backend for the multivendor bulk-order e‑commerce MVP for Tanishq franchises, built with **Bun**, **Prisma**, and **PostgreSQL**.

### Tech stack

- **Runtime**: Bun
- **DB**: PostgreSQL + Prisma
- **Auth**: JWT (via `jsonwebtoken`) + password hashing (`bcryptjs`)

### Main modules

- `src/core`
  - `router.ts`: minimal HTTP router, JSON helpers, role guard.
  - `auth.ts`: JWT sign/verify, token extraction.
- `src/modules/auth`
  - `service.ts`: register/login logic with hashing & Prisma.
  - `routes.ts`: `/auth/register`, `/auth/login`, `/auth/bootstrap-admin`.
- `src/modules/products`
  - `routes.ts`: vendor product creation and CEE approval, public product listing.
- `src/modules/orders`
  - `routes.ts`: full order lifecycle (place order, CEE approve, vendor accept, estimate, payment verify) and role-based queues.
- `src/modules/shipments`
  - `routes.ts`: shipment creation/update and webhook-ready endpoint.
- `src/modules/emails`
  - `service.ts`: email abstraction that logs to `EmailLog` (plug in real provider later).
- `src/health.ts`: `/health` endpoint.

### Environment variables

Create `.env` in `backend` (Prisma already created one) and set:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/tanishq_mvp"
JWT_SECRET="a-strong-random-secret"
```

**Product images (Cloudflare R2)** — required when vendors upload images:

```bash
R2_ACCOUNT_ID="your_cloudflare_account_id"
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="your-bucket-name"
# Public URL where objects are readable (R2 public bucket URL or custom domain), no trailing slash
R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"
```

Create an R2 bucket, API token with **Object Read & Write**, and enable **public access** (or use a custom domain) so `R2_PUBLIC_URL` matches how browsers load images.

### Database

Run Prisma migrations and generate the client:

```bash
bun run prisma:generate
bun run prisma:migrate --name init
```

### Running the API

Development with hot reload:

```bash
bun run dev
```

Or plain start:

```bash
bun run start
```

The server runs on `http://localhost:3000`.

### Deploying on Render

**Option A: Docker (recommended — Bun is not a native Render runtime)**

1. Create a **Web Service**, connect your repo, and set **Root Directory** to `backend`.
2. **Environment**: choose **Docker**. Render will build and run using the repo’s `Dockerfile`; no Build or Start command needed in the dashboard.
3. Set **Environment variables**: `DATABASE_URL`, `JWT_SECRET` (and optionally `CORS_ORIGIN`). `PORT` is set by Render; the app uses it automatically.

**Option B: Native (if Bun were available)**

1. **Build Command**: `bun install && bun run build`
2. **Start Command**: `bunx prisma migrate deploy && bun run start`
3. Same env vars as above.

**Environment variables** (required for both):

- `DATABASE_URL` – PostgreSQL connection string (e.g. from Render Postgres).
- `JWT_SECRET` – strong random secret for JWT signing.
- `PORT` – set automatically by Render.
- `CORS_ORIGIN` (optional) – e.g. `https://your-frontend.onrender.com`.

### High-level API overview

- **Auth**
  - `POST /auth/register` – create a user with role (`SUPER_ADMIN`, `CEE`, `VENDOR`, `STORE_OWNER`).
  - `POST /auth/login` – returns `{ token, user }` (JWT).
  - `POST /auth/bootstrap-admin` – helper to create initial users.
- **Health**
  - `GET /health`
- **Products**
  - `POST /vendors/products` (VENDOR) – create product `PENDING_APPROVAL`.
  - `POST /products/approve` (CEE / SUPER_ADMIN) – approve/reject product.
  - `GET /products` – list approved products (store catalog).
- **Orders**
  - `POST /stores/orders` (STORE_OWNER) – place order (`PENDING_CEE_APPROVAL`).
  - `POST /orders/cee-approval` (CEE / SUPER_ADMIN) – approve/reject order.
  - `POST /orders/vendor-decision` (VENDOR) – accept/reject order.
  - `POST /orders/estimate` (VENDOR) – create/update estimate and mark `ESTIMATE_SENT`.
  - `POST /orders/payment-verify` (VENDOR) – mark offline payment verified (`PAYMENT_CONFIRMED`).
  - `GET /admin/orders/pending-cee` (CEE / SUPER_ADMIN) – approval queue.
  - `GET /vendors/me/orders` (VENDOR) – vendor’s orders.
  - `GET /stores/me/orders` (STORE_OWNER) – store’s orders with shipment + estimate.
- **Shipments**
  - `POST /orders/shipment` (VENDOR) – add courier + tracking and set status to `SHIPPED`.
  - `POST /webhooks/shipment/:provider` – webhook stub for future courier integration.

# backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
