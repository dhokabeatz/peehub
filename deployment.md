# Xpress Data Bundles - Deployment

## MVP Target

| Service | Provider |
|---|---|
| App hosting | Vercel (CLI-driven via GitHub Actions) |
| Database | Neon (serverless PostgreSQL) |
| Domain | Environment-defined custom domains |

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

# Payment provider
PAYMENT_PROVIDER=paystack          # stub | paystack
PAYSTACK_SECRET_KEY=sk_live_...    # from Paystack dashboard → Settings → API Keys
# NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY= # client-side key (safe to expose)

# Branding and URLs
NEXT_PUBLIC_APP_NAME=Xpress Data Bundles
NEXT_PUBLIC_SHORT_APP_NAME=BMB Xpress
NEXT_PUBLIC_BUSINESS_OWNER=Bigem Ballas
NEXT_PUBLIC_SOFTWARE_BUILDER=HDO Labs
PRODUCTION_DOMAIN=xpress.hdolabs.com
DEVELOPMENT_DOMAIN=dev-xpress.hdolabs.com
PRODUCTION_URL=https://xpress.hdolabs.com
DEVELOPMENT_URL=https://dev-xpress.hdolabs.com
NEXT_PUBLIC_APP_URL=https://xpress.hdolabs.com
NEXT_PUBLIC_DEV_APP_URL=https://dev-xpress.hdolabs.com
NEXT_PUBLIC_COPYRIGHT_NAME=Bigem Ballas
NEXT_PUBLIC_SEO_DESCRIPTION="Buy fast, affordable and reliable mobile data bundles through Xpress Data Bundles, operated by Bigem Ballas."
NEXT_PUBLIC_SEO_KEYWORDS="data bundles, mobile data, MTN data bundles, affordable data, Ghana data bundles, BMB Xpress, Xpress Data Bundles"

# Support contact — shown in app footer
NEXT_PUBLIC_SUPPORT_PHONE=+233204767094
NEXT_PUBLIC_SUPPORT_EMAIL=engineering@hdolabs.com
NEXT_PUBLIC_WHATSAPP_NUMBER=+233204767094
NEXT_PUBLIC_BUSINESS_ADDRESS=
NEXT_PUBLIC_BUSINESS_HOURS=
NEXT_PUBLIC_X_URL=
NEXT_PUBLIC_FACEBOOK_URL=
NEXT_PUBLIC_INSTAGRAM_URL=
NEXT_PUBLIC_TIKTOK_URL=
NEXT_PUBLIC_LOGO_PATH=
NEXT_PUBLIC_FAVICON_PATH=
NEXT_PUBLIC_OPEN_GRAPH_IMAGE_PATH=
```

---

---

## CI/CD Architecture

Deployments are driven by GitHub Actions using the **Vercel CLI** directly.
Vercel's automatic Git integration is intentionally **disabled** — all deploys
go through the workflows in `.github/workflows/`.

> **Vercel Hobby plan note:** Custom Vercel environments are a Pro/Team feature.
> The `develop` branch deploys as a standard **Preview** deployment.
> `dev-xpress.hdolabs.com` is assigned to the `develop` branch in Vercel Domains
> so Preview deployments from that branch resolve to the correct domain.

| Branch | GitHub Environment | Vercel deployment type | Domain |
|---|---|---|---|
| `develop` | `dev` | Preview | `dev-xpress.hdolabs.com` |
| `main` | `prod` | Production | `xpress.hdolabs.com` |

---

## One-Time Setup

### 1. Link the local repo to Vercel

Run this once in the project root. It creates `.vercel/project.json` (gitignored)
which stores the org and project IDs that the CLI needs.

```bash
npm install --global vercel
vercel login
vercel link
```

After linking, retrieve the IDs:

```bash
cat .vercel/project.json
# { "orgId": "team_xxx", "projectId": "prj_xxx" }
```

You'll need these values for the GitHub secrets below.

---

### 2. Configure GitHub Actions environments

In **GitHub → Settings → Environments**, create two environments:

#### `dev` environment
Add these secrets:

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | Your Vercel personal access token (vercel.com → Account Settings → Tokens) |
| `VERCEL_ORG_ID` | `orgId` from `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `projectId` from `.vercel/project.json` |

#### `prod` environment
Add the **same three secrets** with the same names. You can use the same token and IDs — the environment boundary in GitHub provides the deployment protection rules.

Optionally add required reviewers or wait timers to `prod` for manual gate control.

---

### 3. Configure Vercel project

#### Disable automatic Git deployments
In Vercel → Project → Settings → Git, disconnect or disable auto-deployments.
This prevents Vercel from deploying on push independently of GitHub Actions.

#### Assign the develop branch domain
In Vercel → Project → Settings → Domains, add `dev-xpress.hdolabs.com` and set
its **Git branch** to `develop`. Vercel will then route Preview deployments from
the `develop` branch to this domain automatically.

| Domain | Git branch |
|---|---|
| `xpress.hdolabs.com` | *(production — no branch filter needed)* |
| `dev-xpress.hdolabs.com` | `develop` |

#### Preview environment variables
On the Hobby plan there is one shared **Preview** environment for all non-production
deployments. Set Preview env vars in Vercel → Project → Settings → Environment Variables,
choosing the **Preview** scope. If `develop` needs different values from other preview
branches (e.g. a separate DB URL), Vercel Hobby supports per-branch overrides on
individual variables via the "Add another" option on each variable row.

---

### 4. DNS setup

Add these records in your DNS provider for your chosen apex domain:

| Type | Name | Value |
|---|---|---|
| `CNAME` | `<prod-subdomain>` | `cname.vercel-dns.com` |
| `CNAME` | `<dev-subdomain>` | `cname.vercel-dns.com` |

Vercel will issue TLS certificates automatically once the DNS records propagate.

---

## Environment Variables

Set these in Vercel under the appropriate scope — **Production** for `main`,
**Preview** for `develop`. Values should differ between scopes (separate DB URLs,
JWT secrets, etc.).

```env
# Database (use separate Neon branches or databases per scope)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# App URLs
NEXT_PUBLIC_APP_URL=https://xpress.hdolabs.com          # Production scope
# NEXT_PUBLIC_APP_URL=https://dev-xpress.hdolabs.com    # Preview scope
NEXT_PUBLIC_DEV_APP_URL=https://dev-xpress.hdolabs.com

# Auth — JWT
AUTH_PROVIDER=local
JWT_SECRET=<openssl rand -hex 32>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
COOKIE_SECURE=true

# Bundle fulfillment
BUNDLE_PROVIDER=manual

# Payment provider
PAYMENT_PROVIDER=stub
# PAYMENT_API_KEY=
# PAYMENT_WEBHOOK_SECRET=
```

---

## Workflow Summary

```
push to develop
  └─ deploy-dev.yml
       ├─ npm ci
       ├─ npx prisma generate
       ├─ npm run build              ← fails fast if build is broken
       ├─ vercel pull --environment=preview
       ├─ vercel build               ← preview artifact (no --prod)
       └─ vercel deploy --prebuilt   ← preview deployment
            └─ Vercel routes develop branch → dev-xpress.hdolabs.com

push to main
  └─ deploy-prod.yml
       ├─ npm ci
       ├─ npx prisma generate
       ├─ npm run build              ← fails fast if build is broken
       ├─ vercel pull --environment=production
       ├─ vercel build --prod
       └─ vercel deploy --prebuilt --prod
            └─ promotes xpress.hdolabs.com
```

Concurrency control is enabled per branch — a newer push cancels any
in-progress run on the same branch, preventing stale deploys from racing.

---

## Post-Deploy Checklist

- [ ] Admin account seeded (`npx prisma db seed` against production DB)
- [ ] Networks and bundles seeded (MTN, Telecel, AirtelTigo)
- [ ] `COOKIE_SECURE=true` confirmed in Vercel production environment
- [ ] `NEXT_PUBLIC_APP_URL` set correctly in each Vercel environment
- [ ] Domain DNS propagated and TLS certificates issued by Vercel
- [ ] Auth, wallet fund, and order flows tested manually on each environment
- [ ] Payment webhook URL registered with provider: `https://xpress.hdolabs.com/api/payments/webhook`
