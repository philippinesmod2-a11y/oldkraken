# OldKraken — Server Deployment Guide

**Complete step-by-step guide to deploy OldKraken on a real server.**

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Server Setup (Ubuntu/Debian)](#2-server-setup)
3. [Clone & Configure](#3-clone--configure)
4. [Database Setup](#4-database-setup)
5. [Backend Deployment](#5-backend-deployment)
6. [Frontend Deployment](#6-frontend-deployment)
7. [Nginx & SSL Setup](#7-nginx--ssl-setup)
8. [Docker Deployment (Alternative)](#8-docker-deployment-alternative)
9. [Post-Deploy Checklist](#9-post-deploy-checklist)
10. [Language System](#10-language-system)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

**Server Requirements:**
- Ubuntu 22.04+ or Debian 12+ (recommended)
- 2+ CPU cores, 2GB+ RAM
- 20GB+ disk space
- A domain name (e.g., `oldkraken.com`)
- SSH access to the server

**Software needed on server:**
- Node.js 20+ (LTS)
- npm 10+
- Nginx
- Git
- Certbot (for SSL)
- PM2 (process manager)

---

## 2. Server Setup

SSH into your server and run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v    # Should show v20.x.x
npm -v     # Should show 10.x.x

# Install essential tools
sudo apt install -y git nginx certbot python3-certbot-nginx

# Install PM2 globally (process manager to keep app running)
sudo npm install -g pm2

# Create app directory
sudo mkdir -p /var/www/oldkraken
sudo chown $USER:$USER /var/www/oldkraken
```

---

## 3. Clone & Configure

```bash
# Clone the repo to your server (or upload via SCP/SFTP)
cd /var/www/oldkraken
git clone <your-repo-url> .

# OR upload from your local machine:
# scp -r C:\Users\Altin\Desktop\OLDKRAKEN\* user@server:/var/www/oldkraken/
```

### Configure Environment Variables

```bash
# Copy and edit the environment file
cp backend/.env backend/.env.production
nano backend/.env.production
```

**Edit these values in `.env.production`:**

```env
# ============================================
# PRODUCTION ENVIRONMENT
# ============================================

# Database (SQLite - file-based, no separate DB server needed)
DATABASE_URL=file:./prod.db

# JWT - CHANGE THESE TO RANDOM STRINGS (64+ chars)
JWT_SECRET=GENERATE-A-RANDOM-64-CHAR-STRING-HERE
JWT_REFRESH_SECRET=GENERATE-ANOTHER-RANDOM-64-CHAR-STRING-HERE
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# 2FA
TWO_FA_APP_NAME=OldKraken

# SMTP Email (use your real SMTP credentials)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-real-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM_NAME=OldKraken Exchange
SMTP_FROM_EMAIL=noreply@yourdomain.com

# API
COINGECKO_API_URL=https://api.coingecko.com/api/v3

# URLs - CHANGE TO YOUR REAL DOMAIN
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_WS_URL=wss://yourdomain.com
NEXT_PUBLIC_APP_NAME=OldKraken
NEXT_PUBLIC_DEFAULT_LOCALE=en

# Backend
BACKEND_PORT=4000
NODE_ENV=production

# Admin credentials - CHANGE THE PASSWORD
ADMIN_DEFAULT_EMAIL=admin@yourdomain.com
ADMIN_DEFAULT_PASSWORD=YourSecurePassword123!

# Security
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=12

# Platform
PLATFORM_NAME=OldKraken
PLATFORM_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
MAINTENANCE_MODE=false
REGISTRATION_ENABLED=true
PLATFORM_ENABLED=true
```

**Generate random JWT secrets:**
```bash
# Run this twice for both secrets
openssl rand -hex 64
```

### Frontend Environment

```bash
# Create frontend environment file
nano frontend/.env.production
```

```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_WS_URL=wss://yourdomain.com
NEXT_PUBLIC_APP_NAME=OldKraken
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

---

## 4. Database Setup

OldKraken uses **SQLite** — no separate database server needed. The database is a single file.

```bash
cd /var/www/oldkraken/backend

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma migrate deploy

# Seed initial data (creates admin user, coins, settings)
npx ts-node prisma/seed.ts

# Verify the database was created
ls -la prisma/prod.db
```

### Database Backup

```bash
# To backup the database (run periodically via cron)
cp /var/www/oldkraken/backend/prisma/prod.db /backups/oldkraken-$(date +%Y%m%d).db

# To restore from backup
cp /backups/oldkraken-YYYYMMDD.db /var/www/oldkraken/backend/prisma/prod.db
```

### Upload Existing Database

If you already have a database from development:

```bash
# From your Windows machine, upload the dev database
scp C:\Users\Altin\Desktop\OLDKRAKEN\backend\prisma\dev.db user@server:/var/www/oldkraken/backend/prisma/prod.db
```

Then update `DATABASE_URL` in `.env.production` to point to `prod.db`:
```env
DATABASE_URL=file:./prod.db
```

---

## 5. Backend Deployment

```bash
cd /var/www/oldkraken/backend

# Install production dependencies
npm ci --production=false

# Generate Prisma client
npx prisma generate

# Build the NestJS backend
npm run build

# Test that it starts correctly
NODE_ENV=production node dist/main.js
# Should see "Application is running on: http://[::]:4000"
# Press Ctrl+C to stop

# Start with PM2 (keeps it running forever, auto-restarts on crash)
pm2 start dist/main.js --name oldkraken-backend \
  --env production \
  --max-memory-restart 500M \
  --log /var/log/oldkraken/backend.log

# Save PM2 config so it starts on server reboot
pm2 save
pm2 startup
# Run the command PM2 outputs (starts with "sudo env PATH=...")
```

---

## 6. Frontend Deployment

```bash
cd /var/www/oldkraken/frontend

# Install dependencies
npm ci

# Build the Next.js frontend (production optimized)
npm run build

# Start with PM2
pm2 start npm --name oldkraken-frontend -- start
pm2 save
```

**Verify both are running:**
```bash
pm2 status
# Should show:
# oldkraken-backend  │ online │ 0% │ ~150MB
# oldkraken-frontend │ online │ 0% │ ~100MB
```

---

## 7. Nginx & SSL Setup

### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/oldkraken
```

Paste this configuration (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL will be configured by Certbot
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    client_max_body_size 10m;

    # API backend
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -sf /etc/nginx/sites-available/oldkraken /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Install SSL Certificate (Free with Let's Encrypt)

```bash
# Make sure your domain's DNS A record points to your server IP first!
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts, enter your email
# Certbot will auto-configure SSL in the nginx config

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 8. Docker Deployment (Alternative)

If you prefer Docker instead of manual setup:

```bash
cd /var/www/oldkraken

# Create root .env file with all variables
cp backend/.env .env
nano .env
# Edit all values as described in step 3

# Build and start all containers
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop everything
docker compose down

# Rebuild after code changes
docker compose up -d --build
```

**Docker services:**
- `postgres` — PostgreSQL 16 database (port 5432)
- `redis` — Redis cache (port 6379)
- `backend` — NestJS API (port 4000)
- `frontend` — Next.js app (port 3000)
- `nginx` — Reverse proxy (ports 80, 443)

> **Note:** If using Docker, change `DATABASE_URL` in `.env` to:
> `DATABASE_URL=postgresql://oldkraken:oldkraken_secret@postgres:5432/oldkraken`
> And update the Prisma schema `datasource` from `sqlite` to `postgresql`.

---

## 9. Post-Deploy Checklist

Run through this checklist after deployment:

```
[ ] Server responds at https://yourdomain.com
[ ] SSL certificate is valid (green lock in browser)
[ ] Landing page loads with live market prices
[ ] Registration works — create a test user
[ ] Login works — can access dashboard
[ ] Language switcher works (sidebar dropdown, 5 languages)
[ ] Deposit page shows coin logos
[ ] "How to Buy Crypto" link in sidebar opens guide
[ ] Withdrawal page shows admin-configured text
[ ] Admin panel accessible at /admin
[ ] Admin can change settings (withdrawal text, platform name, etc.)
[ ] Admin can manage coins (add, edit deposit address)
[ ] Admin can verify/revoke KYC for users
[ ] Mobile responsive — test on phone
[ ] Email notifications work (if SMTP configured)
[ ] Database backup cron set up
```

---

## 10. Language System

OldKraken has a built-in i18n (internationalization) system with 5 languages.

### Supported Languages

| Code | Language | Direction | Flag |
|------|----------|-----------|------|
| `en` | English | LTR | 🇺🇸 |
| `es` | Español | LTR | 🇪🇸 |
| `fr` | Français | LTR | 🇫🇷 |
| `de` | Deutsch | LTR | 🇩🇪 |
| `ar` | العربية | RTL | 🇸🇦 |

### How It Works

- **Store:** Zustand store at `frontend/src/lib/i18n/index.ts`
- **Translations:** JSON files at `frontend/src/lib/i18n/translations/`
- **Persistence:** Saved to `localStorage` key `oldkraken-locale`
- **RTL Support:** Arabic automatically sets `document.dir = 'rtl'`

### Where Users Can Change Language

1. **Landing page** — Language switcher in navigation header (if implemented)
2. **Dashboard** — Language switcher at the bottom of the sidebar (above "Sign Out")

### Adding a New Language

1. Create a new JSON file: `frontend/src/lib/i18n/translations/XX.json` (copy `en.json` and translate)
2. Import it in `frontend/src/lib/i18n/index.ts`:
   ```ts
   import xx from './translations/xx.json';
   ```
3. Add to the `languages` array:
   ```ts
   { code: 'xx', name: 'Language Name', flag: '🏳️', dir: 'ltr' },
   ```
4. Add to `translations` object:
   ```ts
   const translations: Record<string, any> = { en, es, fr, de, ar, xx };
   ```

### Translation Keys Structure

```
nav.*          — Navigation items
hero.*         — Landing page hero section
market.*       — Market/prices section
trust.*        — Trust/security section
auth.*         — Login/register pages
dashboard.*    — Dashboard labels
wallet.*       — Wallet page
deposit_page.* — Deposit page
withdraw_page.* — Withdraw page
footer.*       — Footer
common.*       — Shared labels (buttons, statuses, etc.)
```

### Default Locale

Set via environment variable:
```env
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

---

## 11. Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs oldkraken-backend --lines 50

# Common fixes:
cd /var/www/oldkraken/backend
npx prisma generate       # Regenerate Prisma client
npm run build              # Rebuild
pm2 restart oldkraken-backend
```

### Frontend build fails
```bash
# Check for errors
cd /var/www/oldkraken/frontend
npm run build 2>&1 | tail -20

# Make sure .env.production exists with correct API URL
cat .env.production
```

### Database issues
```bash
# Reset database (WARNING: deletes all data)
cd /var/www/oldkraken/backend
rm prisma/prod.db
npx prisma migrate deploy
npx ts-node prisma/seed.ts
pm2 restart oldkraken-backend
```

### Nginx 502 Bad Gateway
```bash
# Check if backend/frontend are running
pm2 status

# Check nginx error log
sudo tail -20 /var/log/nginx/error.log

# Restart everything
pm2 restart all
sudo systemctl restart nginx
```

### SSL Certificate issues
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Update the Application
```bash
# Pull latest code
cd /var/www/oldkraken
git pull

# Rebuild backend
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart oldkraken-backend

# Rebuild frontend
cd ../frontend
npm ci
npm run build
pm2 restart oldkraken-frontend
```

---

## Quick Deploy Commands (Copy-Paste)

For a fresh server, run these commands in order:

```bash
# 1. System setup
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx certbot python3-certbot-nginx
sudo npm install -g pm2

# 2. Create directory and upload code
sudo mkdir -p /var/www/oldkraken
sudo chown $USER:$USER /var/www/oldkraken
cd /var/www/oldkraken
# Upload your code here (git clone or scp)

# 3. Configure environment
cp backend/.env backend/.env.production
nano backend/.env.production
# Edit all values (JWT secrets, domain, SMTP, admin password)

nano frontend/.env.production
# Set NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# 4. Backend
cd /var/www/oldkraken/backend
npm ci
npx prisma generate
npx prisma migrate deploy
npx ts-node prisma/seed.ts
npm run build
pm2 start dist/main.js --name oldkraken-backend

# 5. Frontend
cd /var/www/oldkraken/frontend
npm ci
npm run build
pm2 start npm --name oldkraken-frontend -- start

# 6. PM2 startup
pm2 save
pm2 startup
# Run the sudo command it outputs

# 7. Nginx
sudo nano /etc/nginx/sites-available/oldkraken
# Paste the nginx config from step 7 above
sudo ln -sf /etc/nginx/sites-available/oldkraken /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 8. SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 9. Verify
curl https://yourdomain.com
pm2 status
```

---

**Your OldKraken exchange is now live! 🐙**
