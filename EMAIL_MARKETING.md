# OldKraken — Email Marketing Module

## Overview

A full email marketing system built into OldKraken that lets you:
- Create customizable subscription forms with shareable links
- Collect subscribers via opt-in confirmation (double opt-in for inbox delivery)
- Import bulk email lists
- Create and send mass email campaigns to all confirmed subscribers
- Manage everything from the Admin Panel → Marketing tab

---

## How It Works (Inbox Delivery Flow)

```
1. Admin creates a Subscription Form in Admin Panel → Marketing tab
2. Admin copies the shareable link: /subscribe/{slug}
3. Admin shares link (social media, ads, email signatures, etc.)
4. Person visits link, enters name + email, clicks "Subscribe"
5. Person receives confirmation email (goes to spam first time)
6. Person clicks "Confirm Subscription" button in email
7. Person is now CONFIRMED — all future emails go to INBOX
8. Admin creates a Campaign, writes email body + subject
9. Admin clicks "Send Now" → campaign sent to all confirmed subscribers
10. Each email includes an Unsubscribe link for compliance
```

**Why double opt-in?** When a person manually clicks the confirmation link, their email provider marks future emails from your domain as wanted. This is the industry-standard method for ensuring inbox delivery instead of spam.

---

## Features Checklist

| # | Feature | Status |
|---|---------|--------|
| 1 | Subscription Form builder (admin panel) | ✅ Done |
| 2 | Public form page at `/subscribe/{slug}` | ✅ Done |
| 3 | Customizable form fields (email, firstName, lastName, phone) | ✅ Done |
| 4 | Customizable title, description, button text | ✅ Done |
| 5 | Shareable link generation + copy button | ✅ Done |
| 6 | Double opt-in confirmation email | ✅ Done |
| 7 | Confirmation page at `/subscribe/confirm?token=xxx` | ✅ Done |
| 8 | Unsubscribe page at `/unsubscribe?token=xxx` | ✅ Done |
| 9 | Subscriber management (view, delete) | ✅ Done |
| 10 | Bulk email import (paste comma/newline separated) | ✅ Done |
| 11 | Email campaign builder (name, subject, body, from name) | ✅ Done |
| 12 | HTML email body with personalization variables | ✅ Done |
| 13 | Mass send to all confirmed subscribers | ✅ Done |
| 14 | Send progress tracking (sent count, failed count) | ✅ Done |
| 15 | Campaign status (draft → sending → sent) | ✅ Done |
| 16 | Unsubscribe link in every campaign email | ✅ Done |
| 17 | Rate-limited sending (200ms delay between emails) | ✅ Done |
| 18 | Marketing stats dashboard (subscribers, campaigns, forms) | ✅ Done |
| 19 | Professional white-background email template | ✅ Done |
| 20 | Mobile-responsive subscription form | ✅ Done |

---

## Database Models

### Subscriber
- `email`, `firstName`, `lastName`, `phone`
- `status`: pending → confirmed → unsubscribed
- `source`: form / admin / import
- `confirmToken` for double opt-in
- `formId` links to which form they subscribed from

### SubscriptionForm
- `name`, `slug` (unique URL identifier)
- `title`, `description`, `buttonText`, `successMsg`
- `fields` (JSON array: which fields to show)
- `active` toggle, `requireConfirm` toggle
- `createdBy` (admin who created it)

### EmailCampaign
- `name`, `subject`, `body` (HTML)
- `fromName` (display name in email)
- `status`: draft → sending → sent
- `targetType`: all_subscribers / form (specific form)
- `sentCount`, `failedCount`

---

## API Endpoints

### Public (no auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/marketing/forms/:slug` | Get form by slug |
| POST | `/api/marketing/subscribe` | Subscribe (email, firstName, formId) |
| GET | `/api/marketing/confirm?token=xxx` | Confirm subscription |
| GET | `/api/marketing/unsubscribe?token=xxx` | Unsubscribe |

### Admin (requires JWT + ADMIN role)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/marketing/admin/stats` | Marketing stats |
| GET | `/api/marketing/admin/forms` | List all forms |
| POST | `/api/marketing/admin/forms` | Create form |
| PUT | `/api/marketing/admin/forms/:id` | Update form |
| DELETE | `/api/marketing/admin/forms/:id` | Delete form |
| GET | `/api/marketing/admin/subscribers` | List subscribers |
| POST | `/api/marketing/admin/subscribers` | Add subscriber manually |
| POST | `/api/marketing/admin/subscribers/import` | Bulk import emails |
| DELETE | `/api/marketing/admin/subscribers/:id` | Remove subscriber |
| GET | `/api/marketing/admin/campaigns` | List campaigns |
| POST | `/api/marketing/admin/campaigns` | Create campaign |
| PUT | `/api/marketing/admin/campaigns/:id` | Update campaign |
| DELETE | `/api/marketing/admin/campaigns/:id` | Delete campaign |
| POST | `/api/marketing/admin/campaigns/:id/send` | Send campaign |

---

## Personalization Variables

Use these in campaign email body:
- `{{firstName}}` — subscriber's first name (defaults to "there")
- `{{lastName}}` — subscriber's last name
- `{{email}}` — subscriber's email address

---

## Files Created

### Backend
- `backend/src/marketing/marketing.service.ts` — Business logic
- `backend/src/marketing/marketing.controller.ts` — API routes
- `backend/src/marketing/marketing.module.ts` — NestJS module
- `backend/prisma/schema.prisma` — Added Subscriber, SubscriptionForm, EmailCampaign models

### Frontend
- `frontend/src/app/subscribe/[slug]/page.tsx` — Public subscription form
- `frontend/src/app/subscribe/confirm/page.tsx` — Confirmation page
- `frontend/src/app/unsubscribe/page.tsx` — Unsubscribe page
- `frontend/src/app/admin/page.tsx` — Marketing tab added

---

## SMTP Setup for Real Inbox Delivery

For emails to actually reach the inbox (not spam), you need:

1. **Use a real SMTP provider** (not Gmail for mass sending):
   - **Amazon SES** — cheapest, $0.10 per 1000 emails
   - **SendGrid** — 100 free/day, then paid
   - **Mailgun** — 5000 free/month
   - **Postmark** — best inbox rates

2. **Set up DNS records** on your domain:
   - **SPF record** — authorizes your SMTP to send from your domain
   - **DKIM record** — cryptographically signs emails
   - **DMARC record** — tells receiving servers your policy

3. **Update .env**:
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your-ses-smtp-user
   SMTP_PASSWORD=your-ses-smtp-password
   SMTP_FROM_EMAIL=hello@yourdomain.com
   SMTP_FROM_NAME=OldKraken
   ```

4. **Double opt-in** (already implemented) ensures recipients explicitly consent, which dramatically improves inbox placement.
