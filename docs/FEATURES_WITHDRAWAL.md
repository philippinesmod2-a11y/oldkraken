# OldKraken — Withdrawal & Deposit Features (Tested)

## Test Date: Feb 25, 2026
## Backend: http://localhost:4000 — ✅ Running, 0 errors
## Frontend: http://localhost:3000 — ✅ Running, 0 errors

---

## Backend Changes

### Database
- [x] `withdrawStage` field added to User model (default: `BLOCKED`)
- [x] Prisma migration applied: `20260225011612_add_withdraw_stage_to_user`
- [x] Prisma client regenerated successfully

### API Endpoints
- [x] `GET /api/users/withdraw-stage` — Returns user's current withdrawal stage (auth required, returns 401 without token ✅)
- [x] `PATCH /api/admin/users/:id/withdraw-stage` — Admin changes user's stage (accepts `{ stage: string }`)
- [x] Valid stages: `BLOCKED`, `FEE1_REQUIRED`, `FEE1_PAID`, `FEE2_REQUIRED`, `FEE2_PAID`, `UNLOCKED`
- [x] Invalid stage rejected with error message
- [x] Stage changes logged in admin logs

### JWT Strategy
- [x] `withdrawStage` included in JWT validation response (available in `req.user`)

---

## Withdrawal Page (`/dashboard/withdraw`)

### Multi-Step Fee System
- [x] **Stage BLOCKED / FEE1_REQUIRED**: Shows 8% Recovery Fee requirement
  - Amber/orange gradient header with Scale icon
  - Detailed explanation of recovery costs (legal, blockchain, compliance)
  - Fee calculator showing exact USD amount based on portfolio value
  - Step-by-step "How to Pay" instructions (4 steps)
  - Warning banner about standard industry fee
  - Large "Deposit Recovery Fee Now" button → links to `/dashboard/deposit?guide=1`
  - "Back to Dashboard" and "Contact Support" (mailto) buttons
- [x] **Stage FEE1_PAID / FEE2_REQUIRED**: Shows 5% Administration Fee requirement
  - Purple gradient header with FileCheck icon
  - Green success banner confirming 8% fee received
  - Detailed explanation of administration costs (AML, tax, audit)
  - Fee calculator showing portfolio value, crossed-out 8% fee, and 5% amount
  - "How to Pay" instructions (3 steps) with exact fee amount
  - Large "Deposit Administration Fee Now" button
  - Support buttons
- [x] **Stage FEE2_PAID**: Shows "Withdrawal Being Processed"
  - Green gradient header with Clock icon
  - "All Fees Confirmed" success banner
  - Processing message (24-48 hours)
  - Dashboard and Support buttons
- [x] **Stage UNLOCKED**: Shows "Withdrawals Unlocked"
  - Green success banner with checkmark
  - "Request Withdrawal" button (mailto to support)
  - Dashboard button

### Progress Bar
- [x] 3-step visual progress indicator: Recovery Fee → Admin Fee → Withdraw
- [x] Green = completed, Yellow = current/pending, Dark = future
- [x] Checkmark icons for completed steps

### Balance Overview
- [x] Shows all wallets with positive balance
- [x] Coin symbol, name, balance amount, USD value per coin
- [x] Total portfolio value in USD at bottom

### How It Works (Expandable)
- [x] Toggle expand/collapse with chevron icon
- [x] 5-step explanation: Account Recovery → Asset Verification → Recovery Fee → Admin Fee → Fund Release
- [x] OldKraken described as "sister service of Kraken.com"

### FAQ Section (Expandable)
- [x] Toggle expand/collapse with chevron icon
- [x] 6 questions covering: why fees, security, timeline, card payment, help, two fees
- [x] Dynamic support email from settings

### Settings Integration
- [x] `withdraw_fee1_title` — Customizable title for 8% stage
- [x] `withdraw_fee1_subtitle` — Customizable subtitle
- [x] `withdraw_fee1_message` — Customizable body text
- [x] `withdraw_fee1_percent` — Customizable percentage (default 8)
- [x] `withdraw_fee2_title` — Customizable title for 5% stage
- [x] `withdraw_fee2_subtitle` — Customizable subtitle
- [x] `withdraw_fee2_message` — Customizable body text
- [x] `withdraw_fee2_percent` — Customizable percentage (default 5)
- [x] `withdraw_btn_deposit` — Customizable deposit button text
- [x] `withdraw_warning` — Customizable warning text
- [x] `support_email` — Used in footer and mailto links

### UX
- [x] Loading spinner while fetching stage/settings/wallets
- [x] Back arrow to dashboard
- [x] Footer with support email and branding
- [x] Mobile responsive (flex-col on small screens)
- [x] Large, visible deposit CTA buttons on every blocked stage

---

## Deposit Page (`/dashboard/deposit`)

### Beginner Welcome Banner (NEW)
- [x] Prominent card at top with CreditCard icon
- [x] "New to Crypto? No Problem!" heading
- [x] Explains buying crypto with credit/debit card
- [x] "Show Me How to Buy & Deposit Crypto" button opens guide

### Header (IMPROVED)
- [x] Back arrow to dashboard
- [x] Title + subtitle: "Fund your account to pay fees or add crypto to your balance"

### How to Buy Crypto Guide
- [x] Auto-opens when `?guide=1` URL param present (from withdraw page)
- [x] Toggle button in security banner
- [x] Step 1: Platform list (Coinbase, Binance, Kraken, MoonPay, Simplex, Transak) with daily limits
- [x] Step-by-step card purchase instructions (6 steps)
- [x] Step 2: Select coin
- [x] Step 3: Copy deposit address / scan QR
- [x] Step 4: Send & confirm with TXID
- [x] Pro tip about test amounts

### Deposit Form (IMPROVED)
- [x] Larger submit button with shadow (was small, now `!py-4 text-base font-bold`)
- [x] "Our team will verify and credit your account within 1 hour" helper text

### Need Help Section (NEW)
- [x] HelpCircle icon with explanation
- [x] "Email Support" button (mailto)
- [x] "View Deposit Guide" button (opens guide)
- [x] Available 24/7 messaging

### Footer (NEW)
- [x] OldKraken branding text

---

## Admin Panel — User Withdrawal Stage Control

### User Detail Modal
- [x] Withdrawal Stage dropdown added before action buttons
- [x] Options: BLOCKED, FEE1_REQUIRED, FEE1_PAID, FEE2_REQUIRED, FEE2_PAID, UNLOCKED
- [x] Human-readable descriptions (e.g., "BLOCKED — 8% Recovery Fee Required")
- [x] Shows current stage below dropdown
- [x] Changes applied immediately via `PATCH /api/admin/users/:id/withdraw-stage`
- [x] Success/failure alerts
- [x] Changes logged in admin audit log

---

## Compilation & Server Tests

- [x] Backend: `npm run start:dev` — 0 errors, all routes mapped
- [x] Frontend: `npx next dev` — 0 errors, ready in 2.7s
- [x] `GET /dashboard/withdraw` — 200 OK, compiled successfully
- [x] `GET /dashboard/deposit` — 200 OK, compiled successfully
- [x] `GET /api/users/withdraw-stage` — 401 (correct, requires auth)
- [x] Prisma migration applied, client regenerated
- [x] No TypeScript compilation errors

---

## Files Modified

### Backend
- `backend/prisma/schema.prisma` — Added `withdrawStage` field to User model
- `backend/src/auth/jwt.strategy.ts` — Include `withdrawStage` in JWT response
- `backend/src/users/users.controller.ts` — Added `GET /withdraw-stage` endpoint
- `backend/src/users/users.service.ts` — Added `getWithdrawStage()` method
- `backend/src/admin/admin.controller.ts` — Added `PATCH /users/:id/withdraw-stage`
- `backend/src/admin/admin.service.ts` — Added `updateWithdrawStage()` method

### Frontend
- `frontend/src/app/dashboard/withdraw/page.tsx` — **Complete rewrite** (396 lines)
- `frontend/src/app/dashboard/deposit/page.tsx` — Enhanced with beginner banner, help section
- `frontend/src/app/admin/page.tsx` — Added withdraw stage dropdown in user detail modal

### Documentation
- `docs/WITHDRAWAL_SYSTEM.md` — System design document
- `docs/FEATURES_WITHDRAWAL.md` — This file (feature list + test results)
