# Peehub - MVP Backlog

Ordered by real implementation sequence.

---

## Phase 0: Project Setup

- [ ] Initialize Next.js 14 project with TypeScript + Tailwind
- [ ] Configure Prisma + PostgreSQL connection
- [ ] Define Prisma schema
- [ ] Run initial migration
- [ ] Set up folder structure
- [ ] Create `.env.example`

---

## Phase 1: Authentication Core

- [ ] User registration
- [ ] User login with email-or-phone + password
- [ ] JWT auth middleware
- [ ] Admin role guard
- [ ] Logout

### Later in auth
- [ ] Refresh token flow
- [ ] Password reset

---

## Phase 2: Bundles & Networks Core

- [ ] Seed networks (MTN, Telecel, AirtelTigo with prefixes)
- [ ] Seed sample bundles per network
- [ ] Public bundle listing API (filter by network)
- [ ] Network auto-detection utility by phone prefix
- [ ] Admin bundle management (add/edit/deactivate)

---

## Phase 3: Wallet Core

- [ ] Auto-create wallet on registration
- [ ] Wallet balance display
- [ ] Wallet transaction history
- [ ] Atomic deduction helper
- [ ] Admin manual wallet adjustment for MVP/testing

---

## Phase 4: Order System Core

- [ ] Order creation flow
- [ ] Wallet balance validation before order
- [ ] Atomic deduct wallet + create order in one transaction
- [ ] Order history page
- [ ] Order detail page with status tracking

---

## Phase 5: Admin Dashboard

- [ ] Admin dashboard overview
- [ ] All orders table
- [ ] Order detail + status update form
- [ ] Admin note support
- [ ] All users list
- [ ] All wallet transactions list

---

## Phase 6: Wallet Funding Integration

- [ ] Wallet funding initiation flow
- [ ] Payment transaction record creation
- [ ] Payment webhook handler
- [ ] Credit wallet on verified success
- [ ] Idempotency protection for webhook retries

---

## Phase 7: UX, Validation, and Hardening

- [ ] Zod validation on all API routes
- [ ] Central error handling
- [ ] Toast/banner feedback
- [ ] Loading/empty states
- [ ] Basic audit logging

---

## Phase 8: Deploy & Verify

- [ ] Deploy to Vercel
- [ ] Configure managed PostgreSQL
- [ ] Configure environment variables
- [ ] Smoke test all critical flows
- [ ] Fix launch issues

---

## Deferred (Post-MVP)

- [ ] Third-party data bundle API integration
- [ ] SMS/email notifications
- [ ] Agent tiered pricing
- [ ] Automatic refunds
- [ ] Analytics dashboard
- [ ] Referral / loyalty system