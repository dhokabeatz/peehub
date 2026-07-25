# Changelog

## Unreleased

### Rebrand

- Rebranded the product from PeeHub to Xpress Data Bundles
- Introduced centralized brand configuration for app metadata, layout copy, and public URLs
- Replaced legacy PeeHub domain references with environment-driven production and development placeholders
- Updated deployment, architecture, API, and setup documentation for the new branding model

## v0.3.0

- Added admin bundle management with soft deactivation support
- Added admin user management with activation and suspension controls
- Added user-specific discounts with order pricing snapshots
- Added admin dashboard metrics and wallet reconciliation improvements
- Hardened payment confirmation, webhook retry handling, rate limits, and refund idempotency
- Fixed Prisma runtime compatibility for Vercel deployment and restored stable production login
- Applied production database changes required for discount support and completed successful redeploy
