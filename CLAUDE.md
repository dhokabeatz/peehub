# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build        # production build + type check + lint
npm run lint         # ESLint only
npm run seed         # run prisma/seed.ts via tsx (uses .env)

npx prisma generate  # regenerate Prisma client after schema changes
npx prisma db push   # push schema to DB (no migration files — this project uses db push)
npx prisma studio    # open DB browser

SEED_MODE=prod npx prisma db seed   # seed networks + bundles + admin only
SEED_MODE=dev  npx prisma db seed   # seed everything including demo data (default)

./scripts/seed-prod.sh  # interactive script: swaps .env to prod credentials, runs db push + seed, restores .env
```

**No test suite exists yet.** `npm test` will fail.

## Environment

Prisma CLI reads `.env`. Next.js reads `.env.local` (takes precedence at runtime). Both are gitignored. See `.env.example` for all required variables.

Key vars: `DATABASE_URL` (pooler), `DIRECT_URL` (direct), `JWT_SECRET`, `COOKIE_SECURE`, `SEED_MODE`, `AUTH_PROVIDER=local`, `PAYMENT_PROVIDER` (`stub` | `paystack`), `PAYSTACK_SECRET_KEY`.

## Architecture

### Layer boundaries (strict — enforced by ADR-009)

```
src/app/*          — Next.js only: pages, route handlers, middleware
src/services/*     — business logic, zero next/* imports
src/repositories/* — DB access via Prisma, zero next/* imports
src/lib/**         — shared utilities, zero next/* imports
```

Route handlers are thin: validate input → call service → return response. Business logic lives in services. DB queries live in repositories.

### Auth flow

- Custom JWT (`jose`) with httpOnly cookies: `access_token` (15m, `SameSite=lax`, `Path=/`) and `refresh_token` (30d, `SameSite=strict`, `Path=/api/auth`).
- `access_token` is `SameSite=lax` (not strict) so the browser sends it on cross-site top-level redirects — required for payment provider callbacks (Paystack → our domain).
- Edge middleware (`src/middleware.ts`) verifies `access_token` cookie or `Authorization: Bearer` header, injects `x-user-id` and `x-user-role` headers for downstream route handlers.
- `/api/payments/` is in `PUBLIC_API_ROUTES` — callback and webhook must be reachable by Paystack without user auth.
- `src/app/_lib/auth.ts` — `getServerSession()` for server components (reads cookie directly, no HTTP call).
- Passport.js wraps credential validation in the login route only. Services have no Passport dependency.
- `COOKIE_SECURE=false` for local HTTP dev; `true` in production.

### Server components → data

Server components call service/repository functions **directly** — they do not use `serverFetch` to call internal API routes. `serverFetch` exists only for edge cases where a server component truly needs to hit an external URL.

### Wallet ledger

Every wallet mutation (debit, credit, refund) happens inside `db.$transaction()` with `SELECT FOR UPDATE` on the wallet row. `wallets.balance` is a materialized value updated atomically alongside every `wallet_transactions` insert. All amounts use Prisma `Decimal` internally; services serialize to `string` before returning to the UI layer.

### Order lifecycle

`pending → processing → completed | failed | cancelled`  
Terminal states have no outgoing transitions. Marking an order `failed` auto-refunds the original debit via a locked `$transaction` — guarded by `Order.refundWalletTransactionId @unique` (double-refund prevention).

### Key files

| File | Purpose |
|---|---|
| `src/middleware.ts` | Edge auth guard — injects user identity headers |
| `src/lib/auth/token.ts` | JWT sign/verify (`jose/jwt/sign`, `jose/jwt/verify`) |
| `src/lib/auth/cookies.ts` | Cookie options (`COOKIE_SECURE` flag) |
| `src/services/order.service.ts` | Order placement + admin status updates + auto-refund |
| `src/services/wallet.service.ts` | Balance reads + fund initiation + payment confirmation |
| `src/repositories/wallet.repository.ts` | `debitWalletTx`, `creditWalletTx` (transaction-aware) |
| `src/lib/payments/paystack.ts` | Paystack HTTP client — `initializeTransaction`, `verifyTransaction`, `verifyWebhookSignature` |
| `src/lib/errors/payment.errors.ts` | `PaymentNotFoundError`, `PaymentAlreadyProcessedError`, `PaystackVerificationError` |
| `src/app/api/payments/callback/route.ts` | Paystack UX redirect — verifies + credits, redirects to `/wallet?funded=true` |
| `src/app/api/payments/webhook/route.ts` | Paystack primary confirmation — HMAC verified, `runtime = 'nodejs'` (raw body) |
| `prisma/schema.prisma` | Single source of truth for DB shape |
| `prisma/seed.ts` | Idempotent seed (SEED_MODE-aware, Decimal arithmetic) |

### Paystack payment flow

`PAYMENT_PROVIDER=paystack` activates Paystack wallet funding. Flow:
1. `POST /api/wallet/fund` → `walletService.fundWallet(userId, input, req.nextUrl.origin)` — creates a `pending` PaymentTransaction, calls Paystack initialize, returns `authorization_url`
2. Browser redirects to Paystack hosted checkout
3. On payment: Paystack fires `POST /api/payments/webhook` (primary path — HMAC-SHA512 verified, raw body read before JSON parse) and redirects browser to `GET /api/payments/callback`
4. Both paths call `verifyAndConfirmPaystackPayment(reference)` — validates status, reference, currency, and amount in pesewas, then calls `confirmFunding()` which uses `SELECT FOR UPDATE` for idempotency
5. Callback redirects to `req.nextUrl.origin + /wallet?funded=true` — origin-relative so the redirect always lands on the same deployment

The `callbackUrl` passed to Paystack is `req.nextUrl.origin + /api/payments/callback` (passed from route handler → service). Never derive it from `NEXT_PUBLIC_APP_URL` or `VERCEL_URL` — those won't match the deployment the user's session is on.

### Provider abstractions

Two env-controlled abstractions exist for future swap-out:
- `BUNDLE_PROVIDER=manual` — no-op fulfillment today; will become `api` when third-party integration lands
- `PAYMENT_PROVIDER=stub` — manual/stub; `paystack` activates Paystack integration

Switching provider = implement the new provider file + change one env var. Zero changes to services.

## CI/CD

GitHub Actions → Vercel CLI (not Vercel's automatic Git integration, which is disabled).

| Branch | Workflow | Vercel type | Domain |
|---|---|---|---|
| `develop` | `deploy-dev.yml` | Preview | `dev.peehub.hdolabs.com` |
| `main` | `deploy-prod.yml` | Production | `peehub.hdolabs.com` |

Required GitHub secrets per environment (`dev` / `prod`): `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

The Vercel project is on the **Hobby plan** — no custom environments. `develop` maps to a Preview deployment; the domain is assigned in Vercel → Domains with a branch filter.

## Database

Neon serverless PostgreSQL. No migration files — schema is managed via `prisma db push`. The `binaryTargets` in `schema.prisma` includes `rhel-openssl-3.0.x` for Vercel's serverless runtime alongside `native` for local dev.
