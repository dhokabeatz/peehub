# Peehub - MVP Backlog

Ordered by real implementation sequence.

---

## Phase 0: Project Setup

- [x] Initialize Next.js 14 project with TypeScript + Tailwind
- [x] Configure Prisma + PostgreSQL connection
- [x] Define Prisma schema
- [x] Run initial migration
- [x] Set up folder structure
- [x] Create `.env.example`

---

## Phase 1: Authentication Core

- [x] User registration
- [x] User login with email-or-phone + password
- [x] JWT auth middleware
- [x] Admin role guard
- [x] Logout

### Later in auth
- [x] Refresh token flow
- [ ] Password reset

---

## Phase 2: Bundles & Networks Core

- [x] Seed networks (MTN, Telecel, AirtelTigo with prefixes)
- [x] Seed sample bundles per network
- [x] Public bundle listing API (filter by network)
- [x] Network auto-detection utility by phone prefix
- [ ] Admin bundle management (add/edit/deactivate)

---

## Phase 3: Wallet Core

- [x] Auto-create wallet on registration
- [x] Wallet balance display
- [x] Wallet transaction history
- [x] Atomic deduction helper
- [x] Admin manual wallet adjustment for MVP/testing

---

## Phase 4: Order System Core

- [x] Order creation flow
- [x] Wallet balance validation before order
- [x] Atomic deduct wallet + create order in one transaction
- [x] Order history page
- [x] Order detail page with status tracking

---

## Phase 5: Admin Dashboard

- [x] Admin dashboard overview
- [x] All orders table
- [x] Order detail + status update form
- [x] Admin note support
- [ ] All users list
- [ ] All wallet transactions list

---

## Phase 6: Wallet Funding Integration

- [x] Wallet funding initiation flow
- [x] Payment transaction record creation
- [x] Payment webhook handler (Paystack — HMAC verified, primary path)
- [x] Credit wallet on verified success
- [x] Idempotency protection for webhook retries (SELECT FOR UPDATE + unique reference)
- [x] Paystack hosted checkout integration (PAYMENT_PROVIDER=paystack)

---

## Phase 7: UX, Validation, and Hardening

- [x] Zod validation on all API routes
- [x] Central error handling
- [x] Toast/banner feedback
- [x] Loading/empty states
- [ ] Basic audit logging

---

## Phase 8: Deploy & Verify

- [x] Deploy to Vercel
- [x] Configure managed PostgreSQL
- [x] Configure environment variables
- [x] Smoke test all critical flows
- [x] Fix launch issues

> Both `dev.peehub.hdolabs.com` (preview) and `peehub.hdolabs.com` (production) are live.

---

## Deferred (Post-MVP)

- [ ] Third-party data bundle API integration
- [ ] SMS/email notifications
- [ ] Agent tiered pricing
- [ ] Automatic refunds
- [ ] Analytics dashboard
- [ ] Referral / loyalty system