# PeeHub - Requirements Document

## 1. Project Overview

Peehub is a web-based platform designed to allow users (agents and retail customers) to purchase mobile data bundles across multiple networks.

The system will provide a structured and centralized way for users to:
- Fund a wallet
- Submit data bundle purchase requests
- Track transactions and order statuses

In Version 1 (MVP), bundle fulfillment will be handled manually by the admin. Future versions may integrate third-party APIs for automation.

---

## 2. Business Objective

The goal of this platform is to:
- Digitize the data-selling process
- Provide structured order tracking
- Reduce manual and unorganized transactions
- Enable scalability for future automation

---

## 3. User Types

### 3.1 Retail Users
- Individuals purchasing data bundles for personal use

### 3.2 Agents
- Users purchasing bundles for resale or multiple customers

### 3.3 Admin
- Platform operator responsible for:
  - Managing users
  - Monitoring transactions
  - Manually fulfilling bundle orders
  - Managing bundle offerings

---

## 4. Core Functional Requirements

### 4.1 Authentication
- Users must be able to:
  - Sign up (email or phone)
  - Log in
  - Reset password

### 4.2 Wallet System
- Each user has a wallet
- Users must fund wallet before placing orders
- Wallet balance must be visible
- All wallet transactions must be recorded

### 4.3 Data Bundle Purchase Flow
- Users can:
  - Select network or will be detected automatically by the app(MTN, Telecel, AirtelTigo, etc.)
  - Select available bundle
  - Enter recipient phone number
  - Submit purchase request

- System must:
  - Validate wallet balance before order
  - Deduct amount upon order submission
  - Record transaction

### 4.4 Order Management
- Orders must have statuses:
  - Pending
  - Processing
  - Completed
  - Failed
  - Cancelled

- Users must be able to:
  - View order history
  - Track order status

### 4.5 Admin Dashboard
Admin must be able to:
- View all users
- View wallet transactions
- View all orders
- Update order status manually
- Add admin notes to orders
- Manage bundle offerings (network, size, pricing)

### 4.6 Payment Integration (Wallet Funding)
- Users will fund wallet using mobile money
- Payment flow must support:
  - Initiation
  - Confirmation
  - Transaction recording

*(Exact provider to be decided later)*

---

## 5. Manual Fulfillment Requirement (MVP Constraint)

- Orders will NOT be fulfilled automatically
- Admin will:
  - View incoming orders
  - Process them externally (manual)
  - Update order status in system

This is a temporary solution for Version 1.

---

## 6. Notifications (Basic)

- Users should receive feedback for:
  - Successful order submission
  - Failed transactions
  - Status updates

*(Can be UI-based initially, extend to SMS/email later)*

---

## 7. Non-Functional Requirements

### 7.1 Performance
- System should handle multiple users placing orders concurrently

### 7.2 Security
- Passwords must be securely hashed
- Authentication must be protected
- Admin routes must be restricted

### 7.3 Maintainability
- Codebase must be modular and well-structured
- Clear separation of concerns
- Ready for future API integration

### 7.4 Scalability
- Architecture should allow future:
  - Third-party API integration
  - Increased user load
  - Feature expansion

---

## 8. Assumptions

- Third-party data provider API will be integrated in a later phase
- Payment provider will be finalized later
- Admin will handle order fulfillment manually in MVP

---

## 9. Open Questions (To be resolved later)

- Which mobile money provider will be used?
- What are pricing rules for agents vs retail users?
- Should there be transaction fees?
- Should refunds be automated or manual?

---

## 10. Success Criteria

The MVP will be considered successful if:
- Users can register and log in
- Users can fund wallet
- Users can place data bundle orders
- Admin can view and manage orders
- Transactions are recorded accurately
- Users can track order status