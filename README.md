# Xpress Data Bundles

Xpress Data Bundles is a wallet-backed data bundle sales platform operated by Bigem Ballas and powered by HDO Labs. The application supports buyer self-service, admin operations, wallet funding, order lifecycle management, bundle management, and user-specific discounts without changing bundle base prices.

## Highlights

- Next.js App Router with TypeScript and Tailwind CSS
- Prisma ORM with PostgreSQL
- Repository → service → route architecture
- Wallet funding with Paystack or stub/manual flow
- Admin management for orders, bundles, users, payments, and discounts

## Branding

- Public product: `Xpress Data Bundles`
- Short brand: `BMB Xpress`
- Business owner: `Bigem Ballas`
- Software builder: `HDO Labs`

## Environment setup

Copy `.env.example` into your local env file and supply real values for:

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_SHORT_APP_NAME`
- `NEXT_PUBLIC_BUSINESS_OWNER`
- `NEXT_PUBLIC_SOFTWARE_BUILDER`
- `PRODUCTION_DOMAIN`
- `DEVELOPMENT_DOMAIN`
- `PRODUCTION_URL`
- `DEVELOPMENT_URL`
- `NEXT_PUBLIC_APP_URL`
- support and social variables

## Common commands

```bash
npm install
npm run dev
npx prisma generate
npm run lint
npx tsc --noEmit
npm run build
```

## Deployment notes

- Do not hardcode production domains in code.
- Keep branding values driven by environment variables where possible.
- Update Paystack callback and webhook registrations after final domain selection.

## Ownership

Copyright belongs to Bigem Ballas. Software developed by HDO Labs.

