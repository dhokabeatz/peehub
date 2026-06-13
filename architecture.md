# Peehub - System Architecture

## 1. Tech Stack Decision

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Full-stack in one repo, server components reduce client JS |
| Language | TypeScript | Type safety critical for wallet/transaction logic |
| Database | PostgreSQL | ACID compliance required for wallet balance integrity |
| ORM | Prisma | Type-safe queries, easy migrations, great DX |
| Auth | Passport.js + jose | passport-local for credential validation at login; jose for JWT signing and edge-runtime verification |
| Styling | Tailwind CSS | Fast utility-first styling for MVP |
| Payment | Abstracted service layer | Swap-in any provider (Paystack, Hubtel, etc.) |

---

## 2. Architecture Pattern

**Layered Monolith** — appropriate for MVP. Layers have clean boundaries so the system can be split later if needed.

```
┌─────────────────────────────────┐
│         Presentation Layer       │  Next.js pages + React components
├─────────────────────────────────┤
│          API Layer               │  Next.js Route Handlers (/api/*)
├─────────────────────────────────┤
│         Service Layer            │  Business logic — wallets, orders, bundles
├─────────────────────────────────┤
│        Repository Layer          │  Data access — Prisma queries
├─────────────────────────────────┤
│       Infrastructure Layer       │  PostgreSQL, payment provider, email/SMS
└─────────────────────────────────┘
```

**Key principle**: Services orchestrate business rules; repositories handle DB access. API routes are thin — they validate input, call a service, and return a response. No business logic lives in API routes or components.

**Framework independence rule**: `src/services/*`, `src/repositories/*`, and `src/lib/auth/*`, `src/lib/bundles/*`, `src/lib/payment/*` must have zero imports from `next/*`. These layers know nothing about HTTP, headers, cookies, or Next.js internals. The only place Next.js is imported is `src/app/*` (pages, route handlers) and `src/middleware.ts`. This boundary ensures services are portable and testable without a running Next.js server.

```
┌──────────────────────────────────────────────────────┐
│  Next.js boundary (can import next/*)                 │
│  src/app/**, src/middleware.ts                        │
├──────────────────────────────────────────────────────┤
│  Framework-free zone (zero next/* imports)            │
│  src/services/**, src/repositories/**                 │
│  src/lib/auth/**, src/lib/bundles/**, src/lib/payment/**│
└──────────────────────────────────────────────────────┘
```

---

## 2.1 Authentication Design

### Token Strategy

Authentication is **stateless JWT** with a refresh token rotation pattern. Tokens are transported as **HttpOnly Secure cookies** — JavaScript on the page can never read them.

```
┌─────────┐   POST /auth/login               ┌───────────────────────────────────┐
│  Client │ ──────────────────────────────→  │  passport-local strategy          │
│         │   { identifier, password }        │    └─→ local.provider.ts          │
│         │                                   │         └─→ bcrypt.compare()      │
│         │ ←──────────────────────────────   │  auth.service.generateTokens()    │
│         │   Set-Cookie: access_token=...    └───────────────────────────────────┘
│         │   Set-Cookie: refresh_token=...
│         │   Body: { user: { id, role, ... } }
│         │
│         │   [subsequent requests — browser sends cookies automatically]
│         │ ──────────────────────────────→  ┌───────────────────────────────────┐
│         │   Cookie: access_token=<jwt>      │  src/middleware.ts (edge runtime)  │
│         │                                   │    reads access_token cookie       │
│         │                                   │    token.verifyAccessToken(tok)   │
│         │                                   │    → sets x-user-id, x-user-role  │
│         │                                   └───────────────────────────────────┘
│         │
│         │   POST /auth/refresh               ┌───────────────────────────────────┐
│         │ ──────────────────────────────→   │  auth.service                     │
│         │   Cookie: refresh_token=...        │    rotate refresh token in DB     │
│         │ ←──────────────────────────────   │    issue new cookie pair          │
└─────────┘   Set-Cookie: access_token=...    └───────────────────────────────────┘
              Set-Cookie: refresh_token=...
```

| Token | Expiry | Cookie flags | Cookie path | Storage (server) |
|---|---|---|---|---|
| `access_token` | 15 min | `HttpOnly; Secure; SameSite=Lax` | `/` | Not stored |
| `refresh_token` | 30 days | `HttpOnly; Secure; SameSite=Strict` | `/api/auth` | `refresh_tokens` table (bcrypt-hashed) |

> `access_token` uses `SameSite=Lax` (not Strict) so the browser sends it on cross-site top-level GET navigations — required for payment provider callbacks (Paystack → our domain). `SameSite=Strict` caused users to be logged out after completing payment. `SameSite=Lax` still blocks cross-site POST/fetch requests. See ADR-011.

> `Path=/api/auth` on the refresh token cookie means the browser only sends it to `/api/auth/*` — it is never attached to wallet, order, or admin requests.

**API / non-browser client fallback**: The edge middleware checks the `access_token` cookie first. If absent, it falls back to the `Authorization: Bearer <token>` header. Non-browser clients (mobile apps, Postman) can use the Bearer header and pass `{ "refreshToken": "..." }` in the body for refresh/logout. Both transports produce identical server behaviour.

### Passport.js Integration

Passport is used as a **strategy adapter layer**. It does not own business logic — strategies delegate immediately into `local.provider.ts`. This preserves the framework-independence rule.

**Runtime split — this is critical:**

| Where | Runtime | Auth mechanism |
|---|---|---|
| `src/middleware.ts` | Edge (no Node.js) | `token.verifyAccessToken()` via jose — Passport cannot run in edge runtime |
| `POST /api/auth/login` route | Node.js | `passport-local` strategy → `authenticateLocal()` helper |
| `POST /api/auth/register` route | Node.js | Direct call to `auth.service` (no Passport strategy needed) |
| All other protected routes | Node.js | Read `x-user-id` / `x-user-role` headers set by edge middleware — token already verified |
| Integration tests / non-edge contexts | Node.js | `passport-jwt` strategy for standalone token verification without edge middleware |

**Strategy files:**
```
src/lib/auth/passport/
├── index.ts          # Creates passport instance, registers strategies, exports authenticate helpers
├── local.strategy.ts # passport-local: usernameField='identifier'; calls local.provider.validateCredentials()
└── jwt.strategy.ts   # passport-jwt: extracts from access_token cookie first, Bearer header as fallback
```

**Next.js adapter** — Passport's `authenticate()` is designed for Express `(req, res, next)`. We wrap it so route handlers get a plain promise:

```typescript
// src/lib/auth/passport/index.ts
export async function authenticateLocal(
  identifier: string,
  password: string
): Promise<User | null> {
  return new Promise((resolve) => {
    localStrategy._verify(identifier, password, (_err, user) => {
      resolve(user ?? null)
    })
  })
}
```

Route handlers call `authenticateLocal()` — they never see `req`, `res`, or `next`. `local.strategy.ts` has `passport` as its only non-framework import. `local.provider.ts` has no Passport import at all.

### AWS Cognito Migration Path

```
src/lib/auth/
├── passport/           ← strategy adapters (thin, delegate to providers)
├── token.ts            ← TODAY:  signAccessToken()  → jose HS256, JWT_SECRET
│                          TODAY:  verifyAccessToken() → jose, same secret
│                          FUTURE: verifyAccessToken() → aws-jwt-verify, Cognito JWKS URL
│                          signAccessToken() always uses local secret (Cognito issues its own tokens)
├── provider.ts         ← IAuthProvider interface
├── local.provider.ts   ← Implements IAuthProvider — bcrypt + DB
└── cognito.provider.ts ← (stub) Implements IAuthProvider — AWS Cognito SDK
```

`auth.service.ts` depends only on `IAuthProvider`. Switching = change `AUTH_PROVIDER` env var + wire concrete class. Passport strategies keep working because they delegate into `local.provider.ts`, which satisfies `IAuthProvider` — swapping the provider changes what they call with no strategy code changes.

### Identifier Detection (Email vs Phone)

The `identifier` field in login/register is resolved in `auth.service.ts` by format:
- Contains `@` → treat as email, query `users.email`
- All digits (with optional leading `0` or `+233`) → treat as phone, normalize to local format, query `users.phone`
- Ambiguous → attempt email first, fall back to phone

Normalization (e.g. `+233241234567` → `0241234567`) happens in `src/lib/utils/phone.ts` before any DB lookup.

### Route Protection

Next.js edge middleware (`src/middleware.ts`) intercepts all protected routes. It reads the `access_token` cookie (falls back to `Authorization: Bearer` header for API clients), calls `token.verifyAccessToken()`, and injects `x-user-id` + `x-user-role` request headers. Route handlers read those headers — they never re-verify the token.

```
/dashboard/*  → requireAuth
/api/*        → requireAuth  (except /api/auth/* and /api/payments/webhook)
/admin/*      → requireAuth + x-user-role === 'admin'
/api/admin/*  → requireAuth + x-user-role === 'admin'
```

Token absent or invalid → `401`. Token valid but role insufficient → `403`.

---

## 2.2 Bundle Provider Abstraction

The bundle fulfillment layer follows the same provider pattern as auth and payment. Today fulfillment is manual (admin does it externally). In a future version a third-party API takes over. The service layer must not need to change when that happens.

```
src/lib/bundles/
├── provider.ts              # IBundleProvider interface
├── manual.provider.ts       # Today: bundles live in DB; fulfillOrder() is a no-op
└── api.provider.ts          # (stub) Future: calls third-party to fetch live bundles + fulfill
```

**`IBundleProvider` interface:**
```typescript
interface IBundleProvider {
  // Called at order creation time. Returns fulfillment reference or null (manual).
  fulfillOrder(order: OrderContext): Promise<{ reference: string | null }>;

  // Optional: sync live bundle catalogue from provider into DB.
  // Not used in manual mode. Called by a background job in API mode.
  syncBundles?(): Promise<void>;
}
```

**Today (`manual.provider.ts`)**: `fulfillOrder` returns `{ reference: null }`. Order status stays `pending`. Admin handles it.

**Future (`api.provider.ts`)**: `fulfillOrder` calls the third-party API, gets a transaction reference, and returns it. `order.service.ts` stores the reference in `orders.provider_reference` (new column, nullable) and sets status to `processing` immediately.

This means **one nullable column addition** is the only DB change needed when automation is enabled. The `bundle.service.ts` and all route handlers stay identical.

**`BUNDLE_PROVIDER` env var** controls which implementation is active (mirrors `AUTH_PROVIDER`).

---

## 3. Database Schema

### 3.1 Entity Relationship Overview

```
users ──< wallets ──< wallet_transactions
  │
  └──< orders >── bundles >── networks
         │
         └── wallet_transaction (deduction reference)

payment_transactions >── users
payment_transactions >── wallets
```

---

### 3.2 Table Definitions

#### `users`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
email           VARCHAR(255) UNIQUE
phone           VARCHAR(20) UNIQUE
password_hash   TEXT                              -- null when auth_provider = 'cognito'
full_name       VARCHAR(255) NOT NULL
role            ENUM('retail', 'agent', 'admin') DEFAULT 'retail'
auth_provider   ENUM('local', 'cognito') DEFAULT 'local'
cognito_sub     VARCHAR(255) UNIQUE               -- Cognito user sub, populated on migration
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```
> At least one of email or phone must be present (enforced at application layer).
> `auth_provider` lets both local and Cognito users coexist during a migration window.

---

#### `refresh_tokens`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
token_hash  TEXT NOT NULL UNIQUE          -- bcrypt hash of the raw token
expires_at  TIMESTAMPTZ NOT NULL
revoked     BOOLEAN DEFAULT false
created_at  TIMESTAMPTZ DEFAULT now()
```
> Raw token is never stored. On refresh: hash incoming token, look up, verify not revoked/expired, issue new pair, mark old token revoked (rotation). All tokens for a user can be bulk-revoked (logout all devices).

---

#### `password_reset_tokens`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
token_hash  TEXT NOT NULL UNIQUE
expires_at  TIMESTAMPTZ NOT NULL          -- short TTL: 1 hour
used        BOOLEAN DEFAULT false
created_at  TIMESTAMPTZ DEFAULT now()
```

---

#### `wallets`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID NOT NULL REFERENCES users(id) UNIQUE
balance     DECIMAL(12, 2) NOT NULL DEFAULT 0.00
created_at  TIMESTAMPTZ DEFAULT now()
updated_at  TIMESTAMPTZ DEFAULT now()
```
> One wallet per user. Balance is the source of truth — always recomputable from wallet_transactions.

---

#### `wallet_transactions`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
wallet_id       UUID NOT NULL REFERENCES wallets(id)
user_id         UUID NOT NULL REFERENCES users(id)
type            ENUM('credit', 'debit') NOT NULL
amount          DECIMAL(12, 2) NOT NULL
balance_before  DECIMAL(12, 2) NOT NULL
balance_after   DECIMAL(12, 2) NOT NULL
reference       VARCHAR(100) UNIQUE NOT NULL
description     TEXT
status          ENUM('pending', 'success', 'failed') DEFAULT 'pending'
metadata        JSONB
created_at      TIMESTAMPTZ DEFAULT now()
```
> `reference` is unique and used for idempotency. `metadata` stores payment provider responses.

---

#### `networks`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
name        VARCHAR(100) NOT NULL        -- e.g. "MTN", "Telecel", "AirtelTigo"
code        VARCHAR(20) UNIQUE NOT NULL  -- e.g. "mtn", "telecel", "airteltigo"
prefixes    TEXT[]                       -- e.g. ["024", "054", "055"] for network detection
is_active   BOOLEAN DEFAULT true
created_at  TIMESTAMPTZ DEFAULT now()
```

---

#### `bundles`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
network_id      UUID NOT NULL REFERENCES networks(id)
name            VARCHAR(255) NOT NULL     -- e.g. "1GB Daily"
data_size_mb    INTEGER NOT NULL          -- stored in MB for sorting/filtering
validity_days   INTEGER NOT NULL
price           DECIMAL(10, 2) NOT NULL
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

---

#### `orders`
```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id                 UUID NOT NULL REFERENCES users(id)
bundle_id               UUID NOT NULL REFERENCES bundles(id)
wallet_transaction_id   UUID REFERENCES wallet_transactions(id)
recipient_phone         VARCHAR(20) NOT NULL
network_id              UUID NOT NULL REFERENCES networks(id)
amount                  DECIMAL(10, 2) NOT NULL   -- snapshot of price at time of order
status                  ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending'
admin_note              TEXT
processed_by            UUID REFERENCES users(id) -- admin who last updated
provider_reference      VARCHAR(255)               -- populated by api.provider.ts on automated fulfillment; null in manual mode
created_at              TIMESTAMPTZ DEFAULT now()
updated_at              TIMESTAMPTZ DEFAULT now()
```
> `amount` is a snapshot — bundle prices may change, orders must preserve original price.
> `provider_reference` is null in MVP. Adding the column now avoids a schema migration when automation is introduced.

---

#### `payment_transactions`
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id             UUID NOT NULL REFERENCES users(id)
wallet_id           UUID NOT NULL REFERENCES wallets(id)
amount              DECIMAL(12, 2) NOT NULL
provider            VARCHAR(50) NOT NULL    -- e.g. "paystack", "hubtel"
provider_reference  VARCHAR(255) UNIQUE
status              ENUM('pending', 'success', 'failed') DEFAULT 'pending'
metadata            JSONB
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
```

---

### 3.3 Critical Invariants (Enforced in Service Layer)

1. **Wallet deduction is atomic**: balance check + deduction + transaction record happen in a single Prisma `$transaction()`. The wallet row is read with `SELECT ... FOR UPDATE` (row-level lock) inside the transaction to prevent TOCTOU races when two orders are placed concurrently from the same wallet.

2. **No negative balances**: service rejects orders if `wallet.balance < bundle.price`. This check happens *inside* the locked transaction (post-lock read), not before it.

3. **Order amount is immutable**: once an order is created, `orders.amount` never changes.

4. **Idempotent payments**: `wallet_transactions.reference` has a UNIQUE constraint. A duplicate webhook attempt will fail at the DB level before any balance update occurs.

5. **`wallet_transactions.status` semantics differ by flow**:
   - **Order deduction**: transaction starts and commits within one DB transaction — status is written as `success` directly. There is no intermediate `pending` state because there is no external confirmation needed.
   - **Wallet funding (payment webhook)**: `payment_transactions` is inserted as `pending` when the user initiates payment. Only when the provider webhook confirms success is the wallet credited and `payment_transactions.status` updated to `success`. These are two separate DB transactions separated by an external event.

---

## 4. End-to-End Flow Diagrams

---

### 4.1 Wallet Funding Flow

**Phase 1 — Initiation (user-triggered)**

```
FRONTEND                     API LAYER                    SERVICE LAYER              DATABASE
────────                     ─────────                    ─────────────              ────────
User enters amount
clicks "Fund Wallet"
                             POST /api/wallet/fund
                             Authorization: Bearer <tok>
                                   │
                             [edge middleware]
                             token.verifyAccessToken(tok)
                               ↓ valid → set x-user-id header
                               ↓ invalid → 401 STOP
                                   │
                             route handler reads
                             x-user-id from header
                             Zod: validate amount > 0
                               ↓ invalid → 400 STOP
                                   │
                                   └──→ wallet.service
                                        .fundInitiate(userId, amount)
                                              │
                                              └──→ payment.service
                                                   .initiatePayment()
                                                         │
                                                         ├──→ INSERT payment_transaction
                                                         │    (status='pending', reference=PHB-xxx)
                                                         │
                                                         └──→ IPaymentProvider.initiate()
                                                              (calls payment provider API)
                                                                    │
                                                              ↓ success → { paymentUrl }
                                                              ↓ provider error → 502, payment_transaction stays pending

← 200 { paymentUrl, reference }
User is redirected to
payment provider page
```

**Phase 2 — Webhook confirmation (provider-triggered, async)**

```
PAYMENT PROVIDER             API LAYER                    SERVICE LAYER              DATABASE
────────────────             ─────────                    ─────────────              ────────
User completes
payment on provider
                             POST /api/payments/webhook
                             x-webhook-signature: <hmac>
                                   │
                             [NO auth middleware — public]
                             verify HMAC signature
                               ↓ invalid signature → 400 STOP (never touch DB)
                                   │
                             find payment_transaction
                             by provider_reference
                               ↓ not found → 404, log + alert
                               ↓ already success → 200 (idempotent, do nothing)
                                   │
                                   └──→ wallet.service
                                        .creditFromPayment(paymentTxId)
                                              │
                                              └──→ BEGIN TRANSACTION
                                                     SELECT wallet FOR UPDATE
                                                     INSERT wallet_transaction
                                                       (type='credit', status='success',
                                                        balance_before, balance_after,
                                                        reference=PHB-xxx  ← UNIQUE constraint)
                                                     UPDATE wallet.balance += amount
                                                     UPDATE payment_transaction
                                                       status='success'
                                                   COMMIT
                                                         │
                                                   ↓ UNIQUE violation on reference
                                                     → duplicate webhook → 200, ignore
                                                   ↓ DB error → rollback, return 500
                                                     provider will retry

← 200 { received: true }
```

**Failure map:**

| Failure point | Behaviour |
|---|---|
| Invalid JWT on fund initiation | 401, nothing written to DB |
| Amount ≤ 0 | 400 Zod validation, nothing written |
| Payment provider API unreachable | 502, `payment_transaction` stays `pending`, user can retry |
| Invalid webhook signature | 400, DB untouched |
| Duplicate webhook | UNIQUE constraint on `wallet_transaction.reference` blocks double-credit; returns 200 |
| DB error during credit transaction | Rollback; provider retries webhook |

---

### 4.2 Order Placement Flow

```
FRONTEND                     API LAYER                    SERVICE LAYER              DATABASE
────────                     ─────────                    ─────────────              ────────
User selects bundle,
enters recipient phone,
clicks "Buy"
                             POST /api/orders
                             Authorization: Bearer <tok>
                                   │
                             [edge middleware]
                             token.verifyAccessToken(tok)
                               ↓ invalid → 401 STOP
                                   │
                             Zod: validate bundleId (uuid),
                             recipientPhone (non-empty)
                               ↓ invalid → 400 STOP
                                   │
                                   └──→ order.service
                                        .createOrder(userId, { bundleId, recipientPhone })
                                              │
                                              ├──→ bundle.repository.findActive(bundleId)
                                              │      ↓ not found or isActive=false → 404 STOP
                                              │
                                              ├──→ phone.ts: detectNetwork(recipientPhone)
                                              │      ↓ no prefix match → 400 "Unrecognised network" STOP
                                              │
                                              └──→ BEGIN TRANSACTION
                                                     SELECT wallet
                                                       WHERE user_id = userId
                                                       FOR UPDATE          ← row-level lock
                                                                              blocks concurrent orders
                                                                              from same wallet
                                                     CHECK wallet.balance >= bundle.price
                                                       ↓ insufficient → ROLLBACK → 422 STOP
                                                     INSERT wallet_transaction
                                                       (type='debit', status='success',
                                                        amount=bundle.price,
                                                        balance_before, balance_after,
                                                        reference=PHB-ORD-xxx)
                                                     UPDATE wallet.balance -= bundle.price
                                                     INSERT order
                                                       (status='pending',
                                                        wallet_transaction_id,
                                                        amount=bundle.price,  ← snapshot
                                                        network_id,
                                                        recipient_phone)
                                                   COMMIT
                                                         │
                                                   ↓ DB error → ROLLBACK
                                                     wallet unchanged, no order created → 500
                                                         │
                                              [AFTER commit — outside transaction]
                                              IBundleProvider.fulfillOrder(order)
                                                ↓ manual provider → no-op, returns null
                                                ↓ api provider → calls third-party API
                                                     success → UPDATE order SET
                                                       provider_reference, status='processing'
                                                     api error → order stays 'pending'
                                                       (admin sees it, can retry)

← 201 {
    id, status:'pending',
    amount, bundle, recipientPhone
  }

User sees order
confirmation screen
```

**Failure map:**

| Failure point | Behaviour |
|---|---|
| Invalid JWT | 401, nothing written |
| Bundle not found / inactive | 404, no DB writes |
| Unrecognised phone prefix | 400, no DB writes |
| Wallet balance too low | 422, transaction rolled back, balance unchanged |
| Two concurrent orders same wallet | Second hits `SELECT FOR UPDATE` and waits; proceeds only if balance still sufficient after first commits |
| DB crash mid-transaction | Rollback; wallet balance unchanged; no order exists |
| `fulfillOrder()` fails (API provider) | Order exists as `pending`; wallet already deducted; admin processes manually as fallback |

---

### 4.3 Admin Order Processing Flow

```
ADMIN BROWSER                API LAYER                    SERVICE LAYER              DATABASE
─────────────                ─────────                    ─────────────              ────────
Admin logs in
(same login flow as users,
 role='admin' in JWT payload)

─── Viewing orders ───

Admin navigates to
/admin/orders
                             GET /api/admin/orders
                             ?status=pending
                             Authorization: Bearer <tok>
                                   │
                             [edge middleware]
                             token.verifyAccessToken(tok)
                             x-user-role = 'admin'?
                               ↓ not admin → 403 STOP
                               ↓ not authenticated → 401 STOP
                                   │
                                   └──→ order.service
                                        .listAllOrders({ status:'pending' })
                                              │
                                              └──→ order.repository
                                                   .findMany({ status, page })
                                                   ← includes user.fullName, bundle.name

← 200 { data: [...], total, page }

Admin clicks on order
to see full detail
                             GET /api/admin/orders/:id
                                   │
                             [same middleware check]
                                   │
                                   └──→ order.service.getOrderDetail(orderId)
                                              │
                                              └──→ order.repository.findByIdWithRelations()
                                                   ← joins: user, bundle, network,
                                                     wallet_transaction, processedBy

← 200 { full order + user identity }

─── Manual fulfillment ───

Admin processes bundle
externally (e.g. via
MTN/Telecel portal),
then updates status
                             PATCH /api/admin/orders/:id
                             { status:'completed',
                               adminNote:'Sent at 10:15am' }
                                   │
                             [edge middleware — role check]
                                   │
                             Zod: validate status is valid
                             enum value
                               ↓ invalid → 400 STOP
                                   │
                                   └──→ order.service
                                        .updateStatus(adminId, orderId, { status, adminNote })
                                              │
                                              ├── validate transition is legal:
                                              │   pending → processing ✓
                                              │   processing → completed ✓
                                              │   processing → failed ✓
                                              │   completed → anything ✗ → 422 STOP
                                              │   failed → pending ✓ (allows retry)
                                              │
                                              └──→ UPDATE orders SET
                                                     status='completed',
                                                     admin_note='Sent at 10:15am',
                                                     processed_by=adminId,
                                                     updated_at=now()

← 200 { id, status, adminNote, updatedAt }

─── User sees update ───

User refreshes order page
                             GET /api/orders/:id
                             Authorization: Bearer <user-tok>
                                   │
                             [edge middleware — user token OK]
                             Verify order.user_id = x-user-id
                               ↓ mismatch → 403 (cannot view another user's order)
                                   │
                                   └──→ order.repository.findById()

← 200 { status:'completed', adminNote:'Sent at 10:15am' }
```

**Failure map:**

| Failure point | Behaviour |
|---|---|
| Non-admin token hits `/api/admin/*` | 403, edge middleware rejects before route handler runs |
| Order not found | 404 |
| Invalid status transition (e.g. completed → pending) | 422 with message describing the illegal move |
| Admin marks order `failed` for a legitimate charge | Wallet deduction stands — refund is a separate manual flow (out of MVP scope); `admin_note` should document reason |
| User tries to view another user's order | `order.user_id` checked against `x-user-id` in the user route; 403 if mismatch |

---

## 5. API Route Structure

```
POST   /api/auth/register                    -- email or phone + password
POST   /api/auth/login                       -- identifier (email or phone) + password
POST   /api/auth/refresh                     -- rotate refresh token → new token pair
POST   /api/auth/logout                      -- revoke current refresh token
POST   /api/auth/reset-password/request      -- send reset token to email/phone
POST   /api/auth/reset-password/confirm      -- token + new password

GET    /api/wallet                    -- get balance + recent transactions
POST   /api/wallet/fund               -- initiate payment (returns authorization_url for Paystack)
GET    /api/payments/callback         -- Paystack UX redirect after checkout (public — no auth)
POST   /api/payments/webhook          -- Paystack event handler, primary confirmation path (public — HMAC verified)

GET    /api/bundles                   -- list active bundles (optionally ?network=mtn)
GET    /api/bundles/networks          -- list active networks

POST   /api/orders                    -- create order
GET    /api/orders                    -- user's order history
GET    /api/orders/:id                -- single order

# Admin (requires admin role)
GET    /api/admin/users
PATCH  /api/admin/users/:id           -- activate/deactivate, change role (not to admin)
GET    /api/admin/orders
GET    /api/admin/orders/:id          -- full order detail including user identity
PATCH  /api/admin/orders/:id          -- update status + admin_note
GET    /api/admin/transactions        -- all wallet transactions across all users
POST   /api/admin/bundles
PATCH  /api/admin/bundles/:id
DELETE /api/admin/bundles/:id         -- soft delete (sets isActive=false)
```

---

## 6. Folder Structure

```
peehub/
├── prisma/
│   ├── schema.prisma               # All table definitions
│   └── migrations/                 # Auto-generated migration files
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Route group — no shared layout
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   │
│   │   ├── (dashboard)/            # Route group — user dashboard layout
│   │   │   ├── layout.tsx          # Sidebar + auth guard
│   │   │   ├── dashboard/page.tsx  # Overview: balance, recent orders
│   │   │   ├── buy/page.tsx        # Bundle selection + order form
│   │   │   ├── wallet/page.tsx     # Balance + transaction history
│   │   │   └── orders/
│   │   │       ├── page.tsx        # Order history list
│   │   │       └── [id]/page.tsx   # Order detail + status
│   │   │
│   │   ├── (admin)/                # Route group — admin layout
│   │   │   ├── layout.tsx          # Admin sidebar + role guard
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx        # Admin overview
│   │   │   │   ├── orders/
│   │   │   │   │   ├── page.tsx    # All orders table
│   │   │   │   │   └── [id]/page.tsx  # Order detail + update form
│   │   │   │   ├── users/page.tsx
│   │   │   │   ├── bundles/page.tsx
│   │   │   │   └── transactions/page.tsx
│   │   │
│   │   └── api/                    # API route handlers
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   ├── login/route.ts
│   │       │   ├── refresh/route.ts
│   │       │   ├── logout/route.ts
│   │       │   └── reset-password/
│   │       │       ├── request/route.ts
│   │       │       └── confirm/route.ts
│   │       ├── wallet/
│   │       │   ├── route.ts        # GET balance/transactions
│   │       │   └── fund/route.ts   # POST initiate payment
│   │       ├── payments/
│   │       │   └── webhook/route.ts
│   │       ├── bundles/
│   │       │   ├── route.ts
│   │       │   └── networks/route.ts
│   │       ├── orders/
│   │       │   ├── route.ts        # GET list, POST create
│   │       │   └── [id]/route.ts
│   │       └── admin/
│   │           ├── users/
│   │           │   ├── route.ts        # GET list
│   │           │   └── [id]/route.ts   # PATCH (activate/deactivate, role)
│   │           ├── orders/
│   │           │   ├── route.ts        # GET all orders (cross-user)
│   │           │   └── [id]/route.ts   # GET full detail + PATCH status
│   │           ├── bundles/
│   │           │   ├── route.ts        # POST create
│   │           │   └── [id]/route.ts   # PATCH + DELETE (soft)
│   │           └── transactions/
│   │               └── route.ts        # GET all wallet transactions (cross-user)
│   │
│   ├── services/                   # Business logic — one file per domain
│   │   ├── auth.service.ts
│   │   ├── wallet.service.ts       # balance checks, deductions, funding
│   │   ├── order.service.ts        # order creation, status transitions
│   │   ├── bundle.service.ts       # bundle listing, network detection
│   │   └── payment.service.ts      # payment initiation, webhook handling
│   │
│   ├── repositories/               # All DB access via Prisma — no raw SQL in services
│   │   ├── user.repository.ts
│   │   ├── wallet.repository.ts
│   │   ├── order.repository.ts
│   │   └── bundle.repository.ts
│   │
│   ├── lib/                        # Framework-free infrastructure helpers
│   │   ├── db.ts                   # Prisma client singleton
│   │   ├── auth/                   # No next/* imports (passport/ may import passport only)
│   │   │   ├── passport/
│   │   │   │   ├── index.ts        # Registers strategies; exports authenticateLocal() helper
│   │   │   │   ├── local.strategy.ts  # passport-local → calls local.provider.validateCredentials()
│   │   │   │   └── jwt.strategy.ts    # passport-jwt → calls token.verifyAccessToken() with JWT_SECRET
│   │   │   ├── token.ts            # signAccessToken(), verifyAccessToken() via jose (edge-compatible)
│   │   │   │                       # Edge middleware imports verifyAccessToken from here
│   │   │   │                       # FUTURE: swap verifyAccessToken for aws-jwt-verify on Cognito migration
│   │   │   ├── provider.ts         # IAuthProvider interface
│   │   │   ├── local.provider.ts   # Implements IAuthProvider — bcrypt + DB (no passport import)
│   │   │   └── cognito.provider.ts # (stub) Implements IAuthProvider — AWS Cognito SDK
│   │   ├── bundles/                # No next/* imports
│   │   │   ├── provider.ts         # IBundleProvider interface
│   │   │   ├── manual.provider.ts  # fulfillOrder() no-op — admin handles externally
│   │   │   └── api.provider.ts     # (stub) Third-party API fulfillment
│   │   ├── payments/               # No next/* imports
│   │   │   ├── paystack.ts         # initializeTransaction, verifyTransaction, verifyWebhookSignature (HMAC-SHA512)
│   │   │   └── (stub logic lives in wallet.service.ts for the manual/stub path)
│   │   ├── errors/
│   │   │   └── payment.errors.ts   # PaymentNotFoundError, PaymentAlreadyProcessedError, PaystackVerificationError
│   │   └── utils/
│   │       ├── phone.ts            # Identifier detection + normalization
│   │       └── reference.ts        # Unique reference generator
│   │
│   ├── middleware.ts               # Next.js edge middleware (src/middleware.ts)
│   │                               # Reads Bearer token → sets x-user-id, x-user-role headers
│   │                               # Only place next/server is imported outside app/
│   │
│   ├── components/
│   │   ├── ui/                     # Primitive: Button, Input, Badge, Modal
│   │   ├── forms/                  # OrderForm, FundWalletForm, LoginForm
│   │   ├── layout/                 # DashboardShell, AdminShell, Footer
│   │   └── shared/                 # OrderStatusBadge, TransactionRow, BundleCard
│   │
│   ├── types/
│   │   ├── order.ts
│   │   ├── wallet.ts
│   │   └── user.ts
│   │
│   └── constants/
│       ├── order-status.ts
│       └── roles.ts
│
├── public/
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 7. Security Considerations

- **Passwords**: bcrypt with cost factor ≥ 12. `password_hash` must be non-null for `auth_provider = 'local'`; null only for future Cognito users.
- **Access tokens**: HS256 JWT signed by `token.signAccessToken()` (jose), 15-minute expiry. Payload: `{ sub: userId, role, iat, exp }`. Verified by `token.verifyAccessToken()` in `src/middleware.ts`.
- **Refresh tokens**: random 64-byte value, bcrypt-hashed before storage in `refresh_tokens` table. Raw token is never persisted. Rotated on every use — old row marked `revoked=true`, new row inserted. A second use of a revoked token is detectable.
- **Cookie transport**: both tokens are issued as HttpOnly Secure cookies. `access_token` has `Path=/`, `Max-Age=900`, and `SameSite=Lax`. `refresh_token` has `Path=/api/auth`, `Max-Age=2592000`, and `SameSite=Strict`. The `Secure` flag is set in production (`COOKIE_SECURE=true`); omitted in local dev over HTTP. `access_token` is `Lax` (not `Strict`) to survive cross-site top-level GET redirects from payment providers like Paystack — see ADR-011.
- **No tokens in JS**: `HttpOnly` ensures tokens are never accessible via `document.cookie` or any client-side JS. XSS cannot steal them.
- **API client fallback**: edge middleware accepts `Authorization: Bearer <token>` if the `access_token` cookie is absent, enabling non-browser clients without weakening browser security.
- **Route protection**: `src/middleware.ts` (edge runtime) intercepts all `/(dashboard|admin|api)/*` paths, reads `access_token` cookie (or Bearer header), calls `token.verifyAccessToken()`, and injects `x-user-id` and `x-user-role` headers. Route handlers read those headers; they never re-verify the token.
- **Admin authorisation**: edge middleware checks `x-user-role === 'admin'` for all `/admin/*` and `/api/admin/*` paths. Returns `403` before any route handler executes if the role is not `admin`.
- **Webhook verification**: HMAC signature checked against `PAYMENT_WEBHOOK_SECRET` before any DB operation.
- **Wallet operations**: every balance change runs inside `prisma.$transaction()` with a `SELECT ... FOR UPDATE` row lock. Balance is never updated without a matching `wallet_transaction` row.
- **Input validation**: Zod schemas on every API route input.
- **Logout and revocation**: `POST /api/auth/logout` revokes the supplied refresh token. `auth.service.revokeAllTokens(userId)` bulk-revokes all sessions (available to admins and on password change).

---

## 8. Environment Variables

```env
DATABASE_URL=

# Auth — local JWT (MVP)
AUTH_PROVIDER=local                  # local | cognito
JWT_SECRET=                          # min 32 chars, random
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
COOKIE_SECURE=true                   # set false for local HTTP dev; true in production

# Auth — AWS Cognito (future, leave blank until migration)
AWS_REGION=
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
COGNITO_CLIENT_SECRET=

# Bundle fulfillment provider
BUNDLE_PROVIDER=manual              # manual | api
BUNDLE_API_BASE_URL=               # leave blank until third-party is onboarded
BUNDLE_API_KEY=

# Payment provider
PAYMENT_PROVIDER=paystack            # stub | paystack
PAYSTACK_SECRET_KEY=sk_live_...      # HMAC signing + API calls
# NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=   # client-side (safe to expose)

# Support contact (shown in app footer)
NEXT_PUBLIC_SUPPORT_PHONE=
NEXT_PUBLIC_SUPPORT_EMAIL=
```
