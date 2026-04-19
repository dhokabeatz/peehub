# Peehub - API Contract

All endpoints are prefixed with `/api`. All request/response bodies are JSON.

**Authentication**: Tokens are issued as **HttpOnly Secure cookies** by the server.

| Cookie | Flags | Path | Max-Age |
|---|---|---|---|
| `access_token` | `HttpOnly; Secure; SameSite=Lax` | `/` | 900s (15 min) |
| `refresh_token` | `HttpOnly; Secure; SameSite=Strict` | `/api/auth` | 2592000s (30 days) |

> `access_token` is `SameSite=Lax` so the browser sends it after cross-site redirects from payment providers (e.g. Paystack checkout → our callback). `SameSite=Strict` caused post-payment redirects to land on the login page.

Browser clients send cookies automatically on every request — no extra code needed. The server reads and sets them transparently.

**API / non-browser client fallback**: If the `access_token` cookie is absent, the middleware also accepts `Authorization: Bearer <token>`. For refresh and logout, non-browser clients may pass `{ "refreshToken": "..." }` in the request body instead of relying on the cookie.

Public endpoints (no authentication required): `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `POST /api/auth/reset-password/*`, `GET /api/networks`, `GET /api/networks/[code]/bundles`, `GET /api/payments/callback`, `POST /api/payments/webhook`.

---

## Auth

### POST /api/auth/register
```json
// Request — at least one of email or phone required
{
  "fullName": "Kofi Mensah",
  "email": "kofi@example.com",    // optional if phone provided
  "phone": "0241234567",          // optional if email provided
  "password": "securepassword123"
}

// Response 201
// Set-Cookie: access_token=eyJ...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=900
// Set-Cookie: refresh_token=a3f9...; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=2592000
{
  "user": {
    "id": "uuid",
    "fullName": "Kofi Mensah",
    "email": "kofi@example.com",
    "phone": null,
    "role": "retail"
  }
}
```

---

### POST /api/auth/login
```json
// Request — identifier is email or phone (system detects which)
{
  "identifier": "kofi@example.com",   // or "0241234567"
  "password": "securepassword123"
}

// Response 200
// Set-Cookie: access_token=eyJ...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=900
// Set-Cookie: refresh_token=a3f9...; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=2592000
{
  "user": {
    "id": "uuid",
    "fullName": "Kofi Mensah",
    "role": "retail"
  }
}

// Response 401
{ "error": "Invalid credentials" }
```

---

### POST /api/auth/refresh
```json
// Request
// Browser clients: no body needed — refresh_token cookie sent automatically (Path=/api/auth)
// API clients:     { "refreshToken": "a3f9..." }

// Response 200 — old refresh token revoked, new cookie pair issued
// Set-Cookie: access_token=eyJ...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900
// Set-Cookie: refresh_token=b7d2...; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=2592000
{}

// Response 401
{ "error": "Invalid or expired refresh token" }
```

---

### POST /api/auth/logout
```json
// Request
// Browser clients: no body needed — refresh_token cookie sent automatically (Path=/api/auth)
// API clients:     { "refreshToken": "a3f9..." }

// Response 200 — refresh token revoked, both cookies cleared
// Set-Cookie: access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0
// Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=0
{ "message": "Logged out" }

// Response 400
{ "error": "No active session" }
```

---

### POST /api/auth/reset-password/request
```json
// Request — works with email or phone
{ "identifier": "kofi@example.com" }

// Response 200 (always, to prevent enumeration)
{ "message": "Reset instructions sent if account exists" }
```

---

### POST /api/auth/reset-password/confirm
```json
// Request
{
  "token": "reset-token-from-link",
  "newPassword": "newSecurePassword123"
}

// Response 200
{ "message": "Password updated" }

// Response 400
{ "error": "Invalid or expired reset token" }
```

---

## Wallet

### GET /api/wallet
```json
// Response 200
{
  "balance": "150.00",
  "transactions": [
    {
      "id": "uuid",
      "type": "debit",
      "amount": "25.00",
      "description": "Order #xyz - MTN 1GB",
      "status": "success",
      "createdAt": "2026-04-14T10:00:00Z"
    }
  ]
}
```

### POST /api/wallet/fund
```json
// Request
{ "amount": "50.00" }

// Response 200
{
  "paymentUrl": "https://provider.com/pay/abc123",
  "reference": "PHB-20260414-XXXX"
}
```

### POST /api/payments/webhook
```
// Headers: x-webhook-signature (provider-specific)
// Body: provider-specific payload
// Response 200: { "received": true }
```

---

## Bundles

### GET /api/bundles?network=mtn
```json
// Response 200
[
  {
    "id": "uuid",
    "name": "1GB Daily",
    "dataSizeMb": 1024,
    "validityDays": 1,
    "price": "5.00",
    "network": { "id": "uuid", "name": "MTN", "code": "mtn" }
  }
]
```

### GET /api/bundles/networks
```json
// Response 200
[
  { "id": "uuid", "name": "MTN", "code": "mtn" },
  { "id": "uuid", "name": "Telecel", "code": "telecel" },
  { "id": "uuid", "name": "AirtelTigo", "code": "airteltigo" }
]
```

---

## Orders

### POST /api/orders
```json
// Request
{
  "bundleId": "uuid",
  "recipientPhone": "0241234567"
}

// Response 201
{
  "id": "uuid",
  "status": "pending",
  "amount": "5.00",
  "bundle": { "name": "1GB Daily", "network": "MTN" },
  "recipientPhone": "0241234567",
  "createdAt": "2026-04-14T10:00:00Z"
}

// Response 422 (insufficient balance)
{ "error": "Insufficient wallet balance" }
```

### GET /api/orders
```json
// Response 200
[
  {
    "id": "uuid",
    "status": "completed",
    "amount": "5.00",
    "bundle": { "name": "1GB Daily", "network": "MTN" },
    "recipientPhone": "0241234567",
    "createdAt": "2026-04-14T10:00:00Z"
  }
]
```

### GET /api/orders/:id
```json
// Response 200
// adminNote is intentionally visible to users — it serves as a status message from admin.
// processedBy and internal fields are NOT exposed here.
{
  "id": "uuid",
  "status": "processing",
  "amount": "5.00",
  "bundle": { "name": "1GB Daily", "network": "MTN" },
  "recipientPhone": "0241234567",
  "adminNote": "Being processed — check back shortly",
  "createdAt": "2026-04-14T10:00:00Z",
  "updatedAt": "2026-04-14T10:05:00Z"
}
```

---

## Admin

All `/api/admin/*` endpoints require a valid `access_token` cookie (or `Authorization: Bearer` header for API clients). The token payload must encode `role: "admin"` — verified by edge middleware before the route handler runs. A missing or invalid token returns `401`; a valid token with a non-admin role returns `403`.

### GET /api/admin/orders?status=pending&network=mtn&page=1
```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "status": "pending",
      "amount": "5.00",
      "recipientPhone": "0241234567",
      "adminNote": null,
      "providerReference": null,
      "createdAt": "2026-04-14T10:00:00Z",
      "bundle": { "name": "1GB Daily", "network": "MTN" },
      "user": { "id": "uuid", "fullName": "Kofi Mensah", "phone": "0241234567", "email": null }
    }
  ],
  "total": 42,
  "page": 1
}
```

### GET /api/admin/orders/:id
```json
// Response 200 — full order detail with user identity (admin-only view)
{
  "id": "uuid",
  "status": "processing",
  "amount": "5.00",
  "recipientPhone": "0241234567",
  "adminNote": "Sent via MTN portal at 10:15am",
  "providerReference": null,
  "bundle": { "id": "uuid", "name": "1GB Daily", "network": "MTN" },
  "user": { "id": "uuid", "fullName": "Kofi Mensah", "email": "kofi@example.com", "phone": "0241234567", "role": "retail" },
  "walletTransaction": { "id": "uuid", "reference": "PHB-xxx", "amount": "5.00" },
  "processedBy": { "id": "uuid", "fullName": "Admin Name" },
  "createdAt": "2026-04-14T10:00:00Z",
  "updatedAt": "2026-04-14T10:05:00Z"
}
```

### PATCH /api/admin/orders/:id
```json
// Request — status transitions: pending→processing→completed|failed|cancelled
{
  "status": "completed",
  "adminNote": "Sent via MTN portal at 10:15am"
}

// Response 200
{
  "id": "uuid",
  "status": "completed",
  "adminNote": "Sent via MTN portal at 10:15am",
  "updatedAt": "2026-04-14T10:20:00Z"
}

// Response 422 (invalid transition)
{ "error": "Cannot transition from completed to pending" }
```

---

### GET /api/admin/users?page=1&role=retail
```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "fullName": "Kofi Mensah",
      "email": "kofi@example.com",
      "phone": "0241234567",
      "role": "retail",
      "isActive": true,
      "createdAt": "2026-04-14T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1
}
```

### PATCH /api/admin/users/:id
```json
// Request — admin can deactivate users or change role
{
  "isActive": false,      // optional
  "role": "agent"         // optional — retail | agent (admin role cannot be set via API)
}

// Response 200
{ "id": "uuid", "isActive": false, "role": "agent" }

// Response 403 (attempt to set role to admin)
{ "error": "Admin role cannot be assigned via API" }
```

---

### GET /api/admin/transactions?page=1&type=credit
```json
// Response 200 — all wallet transactions across all users
{
  "data": [
    {
      "id": "uuid",
      "type": "credit",
      "amount": "50.00",
      "balanceBefore": "100.00",
      "balanceAfter": "150.00",
      "reference": "PHB-20260414-XXXX",
      "description": "Wallet funded via Hubtel",
      "status": "success",
      "createdAt": "2026-04-14T10:00:00Z",
      "user": { "id": "uuid", "fullName": "Kofi Mensah" }
    }
  ],
  "total": 200,
  "page": 1
}
```

---

### POST /api/admin/bundles
```json
// Request
{
  "networkId": "uuid",
  "name": "2GB Weekly",
  "dataSizeMb": 2048,
  "validityDays": 7,
  "price": "12.00"
}
// Response 201: bundle object
```

### PATCH /api/admin/bundles/:id
```json
// Request (partial)
{ "price": "10.00", "isActive": false }
// Response 200: updated bundle object
```

### DELETE /api/admin/bundles/:id
```json
// Soft-delete: sets isActive = false. Hard delete not allowed (orders reference bundles).
// Response 200
{ "id": "uuid", "isActive": false }
```

---

## Error Format

All error responses follow:
```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE"    // optional
}
```

Common HTTP status codes:
- `400` Bad request / validation error
- `401` Not authenticated
- `403` Forbidden (wrong role)
- `404` Resource not found
- `422` Business rule violation (e.g. insufficient balance)
- `500` Internal server error
