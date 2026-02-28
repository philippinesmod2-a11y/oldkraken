# OldKraken Withdrawal Fee System

## Business Context
OldKraken recovers lost cryptocurrency from dormant/lost Kraken accounts. Clients log in, see their recovered crypto balances, but must pay recovery fees before withdrawing.

## Fee Flow (Per User)
1. **Stage: BLOCKED (default)** — User sees their balance but withdrawal is blocked. They must pay an 8% Recovery Fee first.
2. **Stage: FEE1_REQUIRED** — Same as blocked but with specific 8% fee messaging. Shows deposit button and tutorial.
3. **Stage: FEE1_PAID** — Admin marks 8% as paid. Now shows 5% Administration Fee requirement.
4. **Stage: FEE2_REQUIRED** — Shows 5% admin fee messaging. Deposit button and instructions.
5. **Stage: FEE2_PAID** — Admin marks 5% as paid. Could unlock or show final step.
6. **Stage: UNLOCKED** — Withdrawal form is fully accessible.

## Admin Controls
- Per-user `withdrawStage` field editable from admin panel
- All text strings customizable via Settings tab:
  - `withdraw_fee1_title` — Title for 8% fee stage
  - `withdraw_fee1_subtitle` — Subtitle for 8% fee stage
  - `withdraw_fee1_message` — Body text for 8% fee stage
  - `withdraw_fee1_percent` — Fee percentage (default 8)
  - `withdraw_fee2_title` — Title for 5% fee stage
  - `withdraw_fee2_subtitle` — Subtitle for 5% fee stage
  - `withdraw_fee2_message` — Body text for 5% fee stage
  - `withdraw_fee2_percent` — Fee percentage (default 5)
  - `withdraw_btn_deposit` — Deposit button text
  - `withdraw_btn_support` — Support button text
  - `withdraw_support_email` — Support email

## Withdrawal Page Features
- [ ] Multi-step fee system with clear progress indicator
- [ ] Large, visible "Deposit Now" button on every blocked stage
- [ ] Step-by-step tutorial: how to pay the fee
- [ ] Fee calculator showing exact amount owed
- [ ] Link to /dashboard/deposit with guide auto-open
- [ ] Contact support button
- [ ] Professional, trustworthy design (law firm style)
- [ ] Mobile-friendly large buttons and text
- [ ] FAQ section for common questions
- [ ] Progress bar showing stages (Fee 1 → Fee 2 → Withdraw)

## Deposit Page Features
- [ ] Expanded "How to Buy Crypto" guide (always visible option)
- [ ] Bigger, clearer buttons for non-tech users
- [ ] Visual step indicators with icons
- [ ] Platform comparison table for buying crypto
- [ ] Copy address button with clear confirmation
- [ ] QR code always visible
- [ ] "Need Help?" floating support section
- [ ] Beginner-friendly language throughout
- [ ] Video-style step cards with numbered steps
- [ ] Warning banners about correct network

## Backend Changes
- [ ] Add `withdrawStage` field to User model
- [ ] API endpoint: GET /users/me/withdraw-stage
- [ ] Admin endpoint: PUT /admin/users/:id/withdraw-stage
- [ ] Add withdraw fee settings to seed
- [ ] Prisma migration

## Implementation Order
1. Backend: Schema + migration + endpoints
2. Frontend: Withdraw page complete rewrite
3. Frontend: Deposit page enhancement
4. Admin: User stage control
5. Testing & documentation
