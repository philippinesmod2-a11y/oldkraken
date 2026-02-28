# 🐙 OldKraken Exchange — System Architecture

## Overview

OldKraken is a centralized digital asset exchange platform built for retail and early institutional users. The platform prioritizes security, manual control, and institutional-grade UX.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TailwindCSS, Zustand, Recharts |
| Backend | NestJS, Node.js, TypeScript |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| ORM | Prisma 5 |
| Auth | JWT + Refresh Tokens + bcrypt + TOTP 2FA |
| Email | Nodemailer (SMTP) |
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| Market Data | CoinGecko API (real-time) |

---

## Database Schema

### Core Tables

- **users** — User accounts with roles (USER, ADMIN, SUPER_ADMIN), KYC status, 2FA
- **sessions** — Active JWT sessions with IP tracking
- **login_history** — All login attempts (success/failure) with IP/UA
- **user_activity_logs** — User action audit trail

### Financial Tables

- **coins** — Supported cryptocurrencies with deposit/withdraw configuration
- **wallets** — Per-user, per-coin balance ledger (balance + frozenBalance)
- **transactions** — Complete ledger with before/after balances, types: DEPOSIT, WITHDRAWAL, ADMIN_CREDIT, ADMIN_DEBIT, FEE, REFERRAL_BONUS
- **deposits** — Deposit requests with status workflow (PENDING → APPROVED/REJECTED)
- **withdrawals** — Withdrawal requests with status workflow (PENDING → APPROVED/REJECTED/CANCELLED)

### System Tables

- **admin_logs** — All admin actions with timestamps
- **system_settings** — Key-value store for platform configuration
- **announcements** — Banner/notification system
- **notifications** — Per-user notification system
- **email_logs** — All sent emails with status tracking
- **support_tickets** — User support system

---

## Ledger Logic

### Core Principles
1. **No negative balances** — Every debit operation checks available balance
2. **Before/after tracking** — Every transaction records balanceBefore and balanceAfter
3. **Atomic operations** — All balance changes use Prisma transactions
4. **Frozen balance** — Pending withdrawals freeze funds to prevent double-spend
5. **Audit trail** — Every financial action creates a Transaction record

### Balance Calculation
```
Available Balance = wallet.balance - wallet.frozenBalance
```

### Credit Flow
1. Validate amount > 0
2. Get or create wallet
3. Calculate new balance
4. Atomic: update wallet + create transaction record

### Debit Flow
1. Validate amount > 0
2. Check available balance ≥ amount + fee
3. Validate resulting balance ≥ 0
4. Atomic: update wallet + create transaction record

---

## Deposit Manual Flow

1. User navigates to Deposit page for a specific coin
2. System displays admin-configured wallet address + QR code
3. User sends funds externally (off-platform)
4. User clicks "I Have Deposited" and optionally provides tx hash
5. Deposit record created with status = PENDING
6. Admin reviews in Admin Panel → Deposits section
7. Admin enters the confirmed amount
8. Admin approves → balance credited via ledger engine
9. OR Admin rejects → no balance change, reason recorded
10. User notified via in-app notification + email
11. All actions logged in admin_logs

---

## Withdrawal Manual Flow

1. User navigates to Withdraw page for a specific coin
2. System shows withdrawal form + admin-editable message
3. User enters: address, network, amount
4. System validates: coin enabled, minimum met, balance sufficient
5. System freezes (amount + fee) in user's wallet
6. Withdrawal record created with status = PENDING
7. Admin reviews in Admin Panel → Withdrawals section
8. **If Approved:**
   - Unfreeze balance
   - Debit balance via ledger engine
   - Admin optionally adds tx hash
   - User notified
9. **If Rejected:**
   - Unfreeze balance (funds returned)
   - Rejection reason recorded
   - User notified
10. User can cancel pending withdrawals (funds unfrozen)

---

## Admin Privilege System

### Roles
- **USER** — Standard user, no admin access
- **ADMIN** — Access to admin panel, manage users/deposits/withdrawals
- **SUPER_ADMIN** — Full access including system settings, coin management, email

### Admin Capabilities
- View/modify any user profile
- Freeze/unfreeze accounts
- Modify any user balance (credit/debit)
- Reset user 2FA
- Approve/reject deposits and withdrawals
- Add manual deposits
- Manage coins (add, edit, enable/disable)
- Edit system settings and messages
- Send emails to any address
- View all audit logs
- Manage announcements
- Toggle KYC status

### Protection
- All admin routes require JWT + role check (ADMIN or SUPER_ADMIN)
- Every admin action is logged with adminId, action, target, details, timestamp
- Rate limiting applied to all endpoints
- RBAC enforced at guard level

---

## Security Layers

| Layer | Implementation |
|-------|---------------|
| Authentication | JWT with short-lived access tokens (15m) + refresh tokens (7d) |
| Password | bcrypt with configurable rounds (default 12) |
| 2FA | TOTP via Google Authenticator (otplib) |
| Rate Limiting | NestJS Throttler (configurable per-endpoint) |
| Brute Force | Auto-freeze after 5 failed logins (Redis counter) |
| Headers | Helmet.js (X-Frame-Options, X-Content-Type-Options, CSP, etc.) |
| Input Validation | class-validator with whitelist + forbidNonWhitelisted |
| SQL Injection | Prisma ORM (parameterized queries) |
| XSS | React auto-escaping + CSP headers |
| CSRF | SameSite cookies + custom header validation |
| IP Tracking | All logins and admin actions record IP address |
| Token Blacklist | Redis-backed token revocation on logout |
| Session Management | Configurable expiration, forced logout capability |
| Encryption | AES-256 via HTTPS/TLS in production |

---

## Multi-Language System

### Supported Languages
1. English (en) — Default
2. Spanish (es)
3. French (fr)
4. German (de)
5. Arabic (ar) — RTL support

### Implementation
- JSON translation files per language
- Zustand store for reactive locale switching
- RTL direction automatically applied for Arabic
- Language selector in navigation header
- localStorage persistence for user preference
- Scalable: add new language by creating JSON file + registering in languages array
- Admin can edit key system messages via SystemSettings

---

## Deployment Instructions

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL 16+ (or use Docker)
- Redis 7+ (or use Docker)

### Quick Start (Docker)
```bash
cp .env.example .env
# Edit .env with your settings
docker-compose up -d
```

### Local Development
```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

### Production
```bash
docker-compose -f docker-compose.yml up -d --build
```

---

## Scaling Strategy

### Horizontal Scaling
- **Frontend**: Deploy multiple Next.js instances behind Nginx load balancer
- **Backend**: Deploy multiple NestJS instances (stateless with Redis sessions)
- **Database**: PostgreSQL read replicas for read-heavy operations
- **Cache**: Redis Cluster for high availability

### Vertical Scaling
- Increase PostgreSQL connection pool size
- Increase Redis memory allocation
- Add database indexes for frequently queried columns

### CDN
- Static assets served via CDN (CloudFlare, AWS CloudFront)
- Image optimization via Next.js Image component

---

## Backup & Restore Guide

### Database Backup
```bash
# Manual backup
docker exec oldkraken-db pg_dump -U oldkraken oldkraken > backup_$(date +%Y%m%d).sql

# Automated (add to crontab)
0 2 * * * docker exec oldkraken-db pg_dump -U oldkraken oldkraken | gzip > /backups/oldkraken_$(date +\%Y\%m\%d).sql.gz
```

### Database Restore
```bash
docker exec -i oldkraken-db psql -U oldkraken oldkraken < backup.sql
```

### Redis Backup
```bash
docker exec oldkraken-redis redis-cli -a $REDIS_PASSWORD BGSAVE
docker cp oldkraken-redis:/data/dump.rdb ./backup_redis.rdb
```

---

## API Endpoints

### Public
- `GET /api/market` — Market data (top 100 coins)
- `GET /api/market/global` — Global crypto market stats
- `GET /api/market/fear-greed` — Fear & Greed Index
- `GET /api/market/trending` — Trending coins
- `GET /api/coins` — List active coins
- `GET /api/settings/public` — Public platform settings
- `GET /api/settings/announcements` — Active announcements

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login (supports 2FA)
- `POST /api/auth/refresh` — Refresh access token
- `POST /api/auth/logout` — Logout (blacklist token)
- `GET /api/auth/me` — Get current user
- `GET /api/auth/2fa/generate` — Generate 2FA secret
- `POST /api/auth/2fa/enable` — Enable 2FA
- `POST /api/auth/2fa/disable` — Disable 2FA
- `POST /api/auth/change-password` — Change password

### User
- `GET /api/users/profile` — Get full profile with wallets
- `PUT /api/users/profile` — Update profile
- `GET /api/users/login-history` — Login history
- `GET /api/users/activity` — Activity log
- `GET /api/users/notifications` — Notifications
- `PATCH /api/users/notifications/:id/read` — Mark read
- `PATCH /api/users/notifications/read-all` — Mark all read

### Wallets
- `GET /api/wallets` — Get all user wallets
- `GET /api/wallets/:coinId/balance` — Get specific balance

### Deposits
- `POST /api/deposits` — Create deposit request
- `GET /api/deposits` — List user deposits

### Withdrawals
- `POST /api/withdrawals` — Create withdrawal request
- `GET /api/withdrawals` — List user withdrawals
- `PATCH /api/withdrawals/:id/cancel` — Cancel pending withdrawal

### Transactions
- `GET /api/transactions` — List user transactions (filterable)
- `GET /api/transactions/:id` — Get transaction detail

### Admin (Requires ADMIN/SUPER_ADMIN role)
- `GET /api/admin/dashboard` — Dashboard stats
- `GET /api/admin/users` — List all users (search/filter)
- `GET /api/admin/users/:id` — User detail with wallets/history
- `PUT /api/admin/users/:id` — Update user
- `PATCH /api/admin/users/:id/freeze` — Freeze account
- `PATCH /api/admin/users/:id/unfreeze` — Unfreeze account
- `PATCH /api/admin/users/:id/notes` — Add admin note
- `POST /api/admin/users/:id/balance` — Modify balance
- `PATCH /api/admin/users/:id/reset-2fa` — Reset 2FA
- `PATCH /api/admin/users/:id/kyc` — Update KYC status
- `GET /api/admin/deposits` — All deposits
- `PATCH /api/admin/deposits/:id/approve` — Approve deposit
- `PATCH /api/admin/deposits/:id/reject` — Reject deposit
- `POST /api/admin/deposits/manual` — Manual deposit
- `GET /api/admin/withdrawals` — All withdrawals
- `PATCH /api/admin/withdrawals/:id/approve` — Approve withdrawal
- `PATCH /api/admin/withdrawals/:id/reject` — Reject withdrawal
- `POST /api/admin/coins` — Create coin
- `PUT /api/admin/coins/:id` — Update coin
- `DELETE /api/admin/coins/:id` — Soft-delete coin
- `GET /api/admin/settings` — All settings
- `PUT /api/admin/settings` — Update setting
- `POST /api/admin/announcements` — Create announcement
- `PUT /api/admin/announcements/:id` — Update announcement
- `DELETE /api/admin/announcements/:id` — Delete announcement
- `POST /api/admin/email/send` — Send email to any address
- `GET /api/admin/email/logs` — Email send logs
- `GET /api/admin/logs` — Admin audit logs
