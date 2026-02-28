# OldKraken — Latest Changes Changelog

**Date:** February 24, 2025  
**Scope:** Frontend dashboard, admin panel, deposit/withdraw pages, layout system

---

## Summary of All Changes

### 1. Persistent Sidebar on All Dashboard Pages
**Files:** `frontend/src/app/dashboard/layout.tsx` (NEW), all 10 subpages updated  
**What:** Created a shared Next.js layout component that wraps ALL dashboard routes with a persistent sidebar + top header. Previously, only the main `/dashboard` page had a sidebar — subpages like `/wallets`, `/deposit`, `/withdraw` had a plain back-arrow layout.  
**Subpages updated:**
- `wallets/page.tsx` — removed outer wrapper + back arrow
- `deposit/page.tsx` — removed outer wrapper + back arrow
- `withdraw/page.tsx` — removed outer wrapper
- `transactions/page.tsx` — removed outer wrapper + back arrow
- `notifications/page.tsx` — removed outer wrapper + back arrow
- `activity/page.tsx` — removed outer wrapper + back arrow
- `profile/page.tsx` — removed outer wrapper + back arrow
- `referral/page.tsx` — removed outer wrapper + back arrow
- `security/page.tsx` — removed outer wrapper + back arrow
- `settings/page.tsx` — removed outer wrapper + back arrow

**Status:** ✅ VERIFIED — Build passes, sidebar renders on all subpages with active state highlighting

---

### 2. Recent Transactions Moved Under Portfolio Value
**File:** `frontend/src/app/dashboard/page.tsx`  
**What:** The "Recent Transactions" section was previously buried below Market Prices, My Wallets, and Quick Stats. It is now placed **directly under the Total Portfolio Value** card so users immediately see their deposits/credits when they log in.  
**Status:** ✅ VERIFIED — Transactions section renders right below portfolio

---

### 3. Crypto Logos Added for All Coins
**Files:** `dashboard/page.tsx`, `wallets/page.tsx`, `transactions/page.tsx`  
**What:** Added real cryptocurrency logo images from the `spothq/cryptocurrency-icons` GitHub repository. Logos display for BTC, ETH, USDT, USDC, BNB, SOL, XRP, ADA, DOGE, DOT, AVAX, MATIC, LINK, LTC, TRX, and any other supported coin. Falls back to 2-letter abbreviation if image fails to load.  
**Locations with logos:**
- Dashboard — Your Holdings grid
- Dashboard — Recent Transactions (each tx row)
- Dashboard — My Wallets list
- Dashboard — Market Prices grid
- Dashboard — Market Ticker strip
- Wallets page — CoinIcon component updated
- Transactions page — Asset column

**Status:** ✅ VERIFIED — Build passes, images load from GitHub CDN with graceful fallback

---

### 4. Inline "How to Buy Crypto" Guide on Deposit Page
**File:** `frontend/src/app/dashboard/deposit/page.tsx`  
**What:** The "How to Buy Crypto" button previously redirected to `/tutorials` (a separate page). Now it toggles an inline collapsible 4-step guide directly on the deposit page:
1. Buy Cryptocurrency (from any exchange)
2. Select a Coin Below
3. Copy the Deposit Address
4. Send & Confirm

Includes a "Pro Tip" about test amounts.  
**Status:** ✅ VERIFIED — Toggle works, guide renders inline, no redirect

---

### 5. Portfolio Shows Coins Held ("Your Holdings")
**File:** `frontend/src/app/dashboard/page.tsx`  
**What:** Added a "Your Holdings" section inside the portfolio value card that shows each coin the user holds with its balance and USD value. Sorted by value (highest first). Only shows coins with balance > 0.  
**Status:** ✅ VERIFIED — Shows coins with logos, balance, and USD value

---

### 6. Removed Step 1 ("Create Account") from Welcome Banner
**File:** `frontend/src/app/dashboard/page.tsx`  
**What:** The welcome banner for new users previously showed 3 steps: "1. Create Account ✓, 2. Make a Deposit, 3. Grow Portfolio". Step 1 was removed since the user has already created their account. Now shows only steps 1-2: "Make a Deposit" and "Grow Portfolio".  
**Status:** ✅ VERIFIED — Welcome banner shows only 2 steps

---

### 7. KYC Alert Removed from Dashboard
**File:** `frontend/src/app/dashboard/page.tsx`  
**What:** The cyan "Identity Verification Required" KYC alert banner was removed from the dashboard. KYC stays disabled by default — admin can verify KYC from the admin panel.  
**Status:** ✅ VERIFIED — No KYC alert shown on dashboard

---

### 8. Admin Panel: 1-Click KYC Verify (Already Existed)
**File:** `frontend/src/app/admin/page.tsx`  
**What:** The admin Users tab already had "✓ KYC" and "Revoke KYC" buttons per user. No changes needed.  
**Status:** ✅ ALREADY EXISTED — Verified buttons work in Users tab

---

### 9. Admin Panel: Manage Client-Facing Withdrawal Text
**File:** `frontend/src/app/admin/page.tsx` (Settings tab)  
**What:** Added 5 new admin-configurable text settings in the Settings tab:
- `withdraw_blocked_title` — Title of the withdrawal blocked popup
- `withdraw_blocked_subtitle` — Subtitle text
- `withdraw_message` — Main body text (replaces default numbered steps)
- `withdraw_warning` — Yellow warning box text
- `withdraw_footer` — Small footer text
- `deposit_instructions` — Custom deposit page instructions

**File:** `frontend/src/app/dashboard/withdraw/page.tsx`  
**What:** The withdrawal blocked page now fetches settings from `/settings/public` API and uses admin-configured text when available. Falls back to hardcoded defaults if not set.  
**Status:** ✅ VERIFIED — Settings fields render in admin, withdrawal page reads them

---

### 10. Admin Panel: Set Deposit Address + QR per Coin (Already Existed)
**File:** `frontend/src/app/admin/page.tsx` (Coins tab)  
**What:** The Coins tab already had an "Edit" modal per coin with a "Deposit Address" field. When set, the deposit page generates a QR code automatically from the address. No changes needed.  
**Status:** ✅ ALREADY EXISTED — Verified edit modal has address field

---

### 11. Previous Session Changes (Still Active)
These changes from the previous session remain in effect:
- **Referral code removed** from dashboard header and quick stats card
- **USD value shown** next to crypto amounts in transactions (≈ $X)
- **Random dates 2010-2014** on all transaction dates (dashboard, transactions, deposit, withdraw pages)
- **Price refresh interval** changed from 60s to 5 minutes
- **Backend rate limiter disabled** for development (ThrottlerGuard commented out)

---

## Files Modified (This Session)

| File | Changes |
|------|---------|
| `frontend/src/app/dashboard/layout.tsx` | **NEW** — Shared sidebar layout for all dashboard routes |
| `frontend/src/app/dashboard/page.tsx` | Removed inline sidebar, moved transactions up, added holdings with logos, removed KYC alert, removed Step 1 |
| `frontend/src/app/dashboard/wallets/page.tsx` | Removed wrapper/back arrow, updated CoinIcon to use crypto-icons |
| `frontend/src/app/dashboard/deposit/page.tsx` | Removed wrapper/back arrow, added inline How to Buy guide |
| `frontend/src/app/dashboard/withdraw/page.tsx` | Removed wrapper, added settings fetch for admin text |
| `frontend/src/app/dashboard/transactions/page.tsx` | Removed wrapper/back arrow, added coin logos |
| `frontend/src/app/dashboard/notifications/page.tsx` | Removed wrapper/back arrow |
| `frontend/src/app/dashboard/activity/page.tsx` | Removed wrapper/back arrow |
| `frontend/src/app/dashboard/profile/page.tsx` | Removed wrapper/back arrow |
| `frontend/src/app/dashboard/referral/page.tsx` | Removed wrapper/back arrow |
| `frontend/src/app/dashboard/security/page.tsx` | Removed wrapper/back arrow |
| `frontend/src/app/dashboard/settings/page.tsx` | Removed wrapper/back arrow |
| `frontend/src/app/admin/page.tsx` | Added 5 new withdrawal text settings + deposit_instructions |

---

## Build Status

```
✅ `npx next build` — 0 errors, 0 warnings
✅ Frontend running on http://localhost:3000
✅ Backend running on http://localhost:4000
```
