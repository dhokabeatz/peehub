# Peehub - Deployment

## MVP Target

| Service | Provider |
|---|---|
| App hosting | Vercel |
| Database | Neon (serverless PostgreSQL) or Supabase |
| Domain | TBD |

---

## Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://...

# Auth — JWT (local provider)
AUTH_PROVIDER=local
JWT_SECRET=<random 32+ char string, e.g. openssl rand -hex 32>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
COOKIE_SECURE=true                   # must be true in production (HTTPS); false for local HTTP dev

# Auth — AWS Cognito (leave blank until migration)
# AWS_REGION=
# COGNITO_USER_POOL_ID=
# COGNITO_CLIENT_ID=
# COGNITO_CLIENT_SECRET=

# Bundle fulfillment
BUNDLE_PROVIDER=manual
# BUNDLE_API_BASE_URL=
# BUNDLE_API_KEY=

# Payment provider (finalize before launch)
PAYMENT_PROVIDER=hubtel
PAYMENT_API_KEY=
PAYMENT_WEBHOOK_SECRET=
```

---

## Deploy Steps

1. Push repo to GitHub
2. Connect repo to Vercel
3. Set all env vars in Vercel dashboard
4. Provision Neon/Supabase PostgreSQL instance
5. Run `npx prisma migrate deploy` against production DB
6. Run seed script for networks + initial bundles
7. Verify auth, wallet fund, and order flows manually
8. Set webhook URL in payment provider dashboard: `https://yourdomain.com/api/payments/webhook`

---

## Post-Deploy Checklist

- [ ] Admin account created (direct DB insert or seed script)
- [ ] Networks seeded (MTN, Telecel, AirtelTigo with prefixes)
- [ ] At least one bundle per network active
- [ ] Payment webhook URL registered with provider
- [ ] Webhook signature verification tested
- [ ] Order creation + wallet deduction tested end-to-end
