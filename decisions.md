# Peehub - Architecture Decision Records

## ADR-001: Next.js Full-Stack Monolith for MVP

**Status**: Accepted

**Context**: Need to ship an MVP quickly. Separate frontend/backend repos add deployment and coordination overhead.

**Decision**: Use Next.js 14 (App Router) as both the frontend and API layer in a single repo.

**Consequences**: Faster to develop and deploy. Easy to extract backend to a standalone service post-MVP if needed.

---

## ADR-002: PostgreSQL over NoSQL

**Status**: Accepted

**Context**: Wallet balance integrity requires ACID transactions — deducting from a wallet and recording the transaction must be atomic.

**Decision**: PostgreSQL with Prisma ORM.

**Consequences**: Safe concurrent wallet operations. Prisma provides type-safe queries and migration management.

---

## ADR-003: Service + Repository Layering

**Status**: Accepted

**Context**: API routes should not contain business logic. Mixing DB queries and business rules in route handlers makes testing and future API integration harder.

**Decision**: API routes → Services → Repositories. Each layer has a single responsibility.

**Consequences**: Services are testable without HTTP. Repositories can be swapped independently. More boilerplate upfront, pays off at scale.

---

## ADR-004: Wallet Balance as Materialized Value

**Status**: Accepted

**Context**: Balance could be computed by summing wallet_transactions on every read, or stored directly on the wallet row.

**Decision**: Store balance on `wallets.balance`, updated atomically alongside every `wallet_transaction` insert inside a Prisma `$transaction()`.

**Consequences**: O(1) balance reads. Risk of drift mitigated by enforcing all balance updates go through `wallet.service.ts` only. Can reconcile from transactions if needed.

---

## ADR-005: Abstracted Payment Service

**Status**: Accepted

**Context**: Payment provider (Paystack, Hubtel, etc.) is not finalized for MVP.

**Decision**: `payment.service.ts` exposes a stable interface (`initiatePayment`, `verifyWebhook`). The concrete implementation is swappable via env config.

**Consequences**: MVP ships with a stub. Real provider plugs in without touching wallet or order logic.

---

## ADR-006: Custom JWT Auth over NextAuth

**Status**: Accepted (supersedes initial NextAuth decision)

**Context**: NextAuth is tightly coupled to Next.js session handling and cookie-based flows. The system needs to be usable by non-browser clients (mobile apps, future third-party integrations) and must be migratable to AWS Cognito without rewriting every route.

**Decision**: Custom JWT using `jose` (Web Crypto API-compatible). Access token (15m) + refresh token (30d, stored hashed in DB). All API routes authenticate via `Authorization: Bearer` header. Auth logic lives behind an `IAuthProvider` interface with a `local.provider.ts` implementation today.

**Consequences**: Any HTTP client can authenticate. Refresh token rotation means stolen tokens are detectable. Cognito migration = swap `local.provider.ts` for `cognito.provider.ts` and change one env var. No changes to API contracts or route handlers.

---

## ADR-007: Passport.js as Strategy Adapter Layer

**Status**: Accepted

**Context**: Rolling a fully custom credential validation flow in the login route handler is error-prone and non-standard. Passport.js provides a well-tested, extensible strategy pattern for exactly this. However, Next.js App Router's edge middleware cannot load Node.js modules, and Passport's `authenticate()` middleware is designed for Express `(req, res, next)`, not `NextRequest/NextResponse`.

**Decision**: Use Passport.js with a clear runtime split:
- `passport-local` strategy handles credential validation in the `/api/auth/login` route handler (Node.js runtime). The strategy calls `local.provider.validateCredentials()` — it owns no logic itself.
- `passport-jwt` strategy is used in non-edge contexts (integration tests, potential future Express extraction).
- Edge middleware (`src/middleware.ts`) calls `token.verifyAccessToken()` (from `src/lib/auth/token.ts`) — Passport does not run in edge runtime.
- An `authenticateLocal()` helper wraps the strategy's verify callback as a plain async call, removing the Express `(req, res, next)` dependency from route handlers.

**Consequences**: Strategies are thin and replaceable. `local.provider.ts` has no Passport import — it remains pure and testable. Adding a new strategy (e.g. OAuth, OTP) means adding one file in `src/lib/auth/passport/` with zero changes to services or repositories. The edge-vs-Node.js runtime split is explicit and documented.

---

## ADR-008: Bundle Provider Abstraction for Third-Party Integration

**Status**: Accepted

**Context**: MVP fulfillment is manual. A future version will integrate a third-party data bundle API. If fulfillment logic is baked into `order.service.ts`, adding the API requires rewriting order creation logic.

**Decision**: Introduce `IBundleProvider` in `src/lib/bundles/provider.ts` with `fulfillOrder()` and optional `syncBundles()`. `manual.provider.ts` implements a no-op today. `api.provider.ts` is a stub. `order.service.ts` calls `provider.fulfillOrder()` and stores the returned reference in `orders.provider_reference` (nullable column, present from day one). Active provider controlled by `BUNDLE_PROVIDER` env var.

**Consequences**: Switching to automated fulfillment = implement `api.provider.ts` + change env var. Zero changes to order creation logic, API contract, or DB schema.

---

## ADR-009: Framework Independence for Service Layer

**Status**: Accepted

**Context**: Services co-located with a Next.js project risk accumulating Next.js-specific imports (`next/headers`, `NextRequest`, etc.), which makes them untestable without a Next.js runtime and harder to extract later.

**Decision**: Enforce a hard rule: `src/services/*`, `src/repositories/*`, and `src/lib/**` must contain zero `next/*` imports. The only permitted boundary crossing is in `src/app/*` (route handlers, pages) and `src/middleware.ts`. This is documented as an architectural rule, not just convention.

**Consequences**: Services are testable with plain Jest, no HTTP setup needed. The backend can be extracted to a standalone Express/Fastify app without touching service or repository code.

---

## ADR-010: Network Detection by Phone Prefix

**Status**: Accepted

**Context**: Scope requires network auto-detection by phone number.

**Decision**: Store prefixes array on the `networks` table. `phone.ts` utility matches recipient phone prefix against DB records at order creation time. Admin can update prefixes without code changes.

**Consequences**: Detection logic is data-driven and easy to maintain.

---

## ADR-011: HttpOnly Secure Cookie Token Transport

**Status**: Accepted

**Context**: Returning tokens in response bodies requires the client to store them (localStorage, sessionStorage, or in-memory state). Any XSS vulnerability on the page can read localStorage and steal tokens. In-memory storage is lost on page refresh, requiring token re-issuance logic on the client.

**Decision**: The server issues both tokens exclusively as `HttpOnly; Secure; SameSite=Strict` cookies on all auth responses (register, login, refresh). The browser sends them automatically; JavaScript cannot read them. Cookie flags:
- `access_token`: `Path=/`, `Max-Age=900` (15 min)
- `refresh_token`: `Path=/api/auth`, `Max-Age=2592000` (30 days) — scoped so it is never sent to wallet, order, or admin endpoints
- `Secure` flag active when `COOKIE_SECURE=true` (production); omittable for local HTTP dev
- Edge middleware reads `access_token` cookie; falls back to `Authorization: Bearer` header for non-browser clients

**Consequences**: XSS cannot steal tokens. CSRF is mitigated by `SameSite=Strict`. Non-browser API clients retain full functionality via the Authorization header + body refresh token fallback. Response bodies no longer carry token values — only the `user` object is returned. Logout clears both cookies by setting `Max-Age=0`.
