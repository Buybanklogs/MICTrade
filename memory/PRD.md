# MIC Trades - P2P Cryptocurrency Trading Platform

## Product Requirements Document (PRD)

### Project Overview
MIC Trades is a P2P cryptocurrency trading web application that enables users to buy and sell cryptocurrencies. The platform acts as the counterparty in all trades, providing a secure environment for crypto transactions.

### Technology Stack
- **Frontend:** React.js with Tailwind CSS and Shadcn/UI components
- **Backend:** Python FastAPI (PostgreSQL-compatible)
- **Database:** SQLite (local), PostgreSQL (production/Railway)
- **Authentication:** JWT-based with HTTP-only cookies
- **External APIs:** CoinGecko API for live market data

---

## Role-Based Access Control (RBAC)

### Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **admin** | Full platform control | All features + user/rate management |
| **staff** | Limited admin access | Trade + support management only |
| **user** | Regular customer | Personal trading and account features |

### Access Matrix

| Feature | User | Staff | Admin |
|---------|------|-------|-------|
| Dashboard | User dashboard | Staff dashboard | Admin dashboard |
| P2P Trading | ✅ | ❌ | ❌ |
| Markets | ✅ | ❌ | ❌ |
| Trade History | ✅ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ |
| Support Tickets (create) | ✅ | ❌ | ❌ |
| Trade Management | ❌ | ✅ | ✅ |
| Support Management | ❌ | ✅ | ✅ |
| Rate Management | ❌ | ❌ | ✅ |
| User Management | ❌ | ❌ | ✅ |

### Data Exposure Rules

| Data | User | Staff | Admin |
|------|------|-------|-------|
| User Name | Own only | Trade/ticket participants | All users |
| User Email | Own only | ❌ Hidden | All users |
| User Phone | Own only | ❌ Hidden | All users |
| User ID | Own only | ❌ Hidden | All users |
| Bank Accounts (all) | Own only | ❌ Hidden | All users |
| Bank Account (trade-specific) | Own only | ✅ For trade processing | All |
| Wallet Address (trade-specific) | Own only | ✅ For trade processing | All |

---

## Implementation Status

### ✅ COMPLETED - Staff Role (March 13, 2026)

#### Backend Changes
- [x] Added `require_admin_or_staff` dependency for shared endpoints
- [x] Protected `/api/admin/users` - admin only
- [x] Protected `/api/admin/rates` - admin only
- [x] Protected `/api/admin/trades` - admin + staff (limited data for staff)
- [x] Protected `/api/admin/tickets` - admin + staff (limited data for staff)
- [x] Staff sees: user_name, trade-specific bank/wallet details
- [x] Staff cannot see: user_id, user_email, all bank accounts

#### Frontend Changes
- [x] Updated ProtectedRoute.js with `requireAdminOnly` prop
- [x] Updated App.js with role-based route protection
- [x] Updated admin/Dashboard.js - role-aware navigation and stats
- [x] Updated admin/Trades.js - limited data display for staff
- [x] Updated admin/Support.js - limited data display for staff
- [x] Updated MobileNav.js - role-aware menu items
- [x] Updated SignIn.js - correct redirect for staff role

---

## API Endpoints by Role

### Public (No Auth)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/rates`
- `GET /api/markets`
- `GET /api/health`

### User (Authenticated)
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/user/profile`
- `PUT /api/user/change-password`
- `GET /api/user/stats`
- `GET|POST|DELETE /api/user/payment-methods`
- `GET|POST /api/trades`
- `GET|POST /api/support/tickets`

### Staff + Admin
- `GET /api/admin/stats` (staff sees limited stats)
- `GET /api/admin/trades` (staff sees limited user data)
- `PUT /api/admin/trades/{id}/approve`
- `PUT /api/admin/trades/{id}/cancel`
- `GET /api/admin/tickets` (staff sees limited user data)
- `GET /api/admin/tickets/{id}`
- `PUT /api/admin/tickets/{id}/close`

### Admin Only
- `GET /api/admin/users`
- `GET /api/admin/users/{id}/bank-accounts`
- `PUT /api/admin/rates`

---

## Test Credentials
- **Admin:** admin@mictrades.com / admin123
- **Staff:** staff@mictrades.com / staff123
- **User:** testuser@test.com / testuser123

---

## Files Changed (Staff Role Implementation)

### Backend
- `/app/backend/server.py` - Added role-based authorization

### Frontend
- `/app/frontend/src/components/ProtectedRoute.js` - Role-aware route protection
- `/app/frontend/src/components/MobileNav.js` - Role-aware navigation
- `/app/frontend/src/App.js` - Route restrictions
- `/app/frontend/src/pages/SignIn.js` - Staff redirect
- `/app/frontend/src/pages/admin/Dashboard.js` - Role-aware UI
- `/app/frontend/src/pages/admin/Trades.js` - Limited data for staff
- `/app/frontend/src/pages/admin/Support.js` - Limited data for staff

---

## Changelog

### March 13, 2026 - Staff Role Complete
- Implemented staff role with limited admin access
- Staff can manage trades and support tickets
- Staff cannot access user management or rates
- Data exposure rules enforced on both frontend and backend
- Route protection prevents URL bypass

### March 13, 2026 - P2 Complete
- PostgreSQL compatibility implemented
- Railway deployment guide updated

### March 13, 2026 - P0 Complete
- Fixed support ticket system
- Fixed password change
- Added trade payout details
- Added navigation improvements

---

## Pending/Future Tasks

### P1 - Email Notifications
- [ ] Integrate Resend API for email notifications
- [ ] Trade confirmation emails
- [ ] Status update emails

### P3 - Enhancements
- [ ] Automated rate updates from exchange API
- [ ] Two-factor authentication (2FA)
- [ ] Staff activity logging/audit trail
- [ ] Mobile app (React Native)
