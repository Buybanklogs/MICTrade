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

### Core Workflow
1. User initiates a buy or sell trade
2. System displays company payment details (bank account for 'buy', crypto wallet for 'sell')
3. User completes payment externally
4. Admin manually confirms payment receipt
5. Admin releases crypto or sends Naira to the user

### Supported Cryptocurrencies (12)
BTC, ETH, USDT, BNB, SOL, USDC, TRX, XRP, ADA, LTC, BCH, TON

---

## Implementation Status

### ✅ COMPLETED - Phase 1: Core Features (March 13, 2026)

#### User Features
- [x] User Registration & Login with JWT authentication
- [x] User Dashboard with trade statistics
- [x] P2P Crypto Trading interface (buy/sell 12 cryptocurrencies)
- [x] Live Coin Markets page with CoinGecko data
- [x] Trade History with filters (all, pending, completed, cancelled)
- [x] Settings page:
  - Profile information display
  - Password change functionality
  - Bank account management (add, view, delete)
- [x] Support Ticket system (create, view, reply)
- [x] "Back to Dashboard" navigation on all inner pages

#### Admin Features
- [x] Admin Login with role-based access
- [x] Admin Dashboard with site statistics
- [x] Trade Approval Panel with payout details
- [x] Rate Management (view/update rates for all 12 cryptos)
- [x] User Management with expandable bank accounts view
- [x] Support Ticket management (view, reply, close)

### ✅ COMPLETED - Phase 2: PostgreSQL & Railway Compatibility (March 13, 2026)

#### Database Compatibility
- [x] Dual database support (SQLite local / PostgreSQL production)
- [x] PostgreSQL-compatible schema with SERIAL PRIMARY KEY
- [x] PostgreSQL connection pooling with psycopg2
- [x] Automatic database type detection via DATABASE_URL
- [x] Parameter placeholder abstraction (`?` → `%s`)
- [x] Railway DATABASE_URL format handling (`postgres://` → `postgresql://`)
- [x] Boolean handling compatible with both databases

#### Deployment Documentation
- [x] Updated RAILWAY_DEPLOYMENT.md for Python/FastAPI stack
- [x] Railway configuration guide
- [x] Vercel frontend deployment guide
- [x] Environment variables reference
- [x] Production checklist
- [x] Troubleshooting guide

---

## Database Schema

### Tables (PostgreSQL/SQLite Compatible)
| Table | Purpose |
|-------|---------|
| `users` | User accounts (SERIAL/AUTOINCREMENT PK) |
| `trades` | Buy/sell cryptocurrency trades |
| `crypto_rates` | Platform exchange rates |
| `user_payment_methods` | User bank accounts |
| `payment_settings` | Platform bank + wallet addresses |
| `support_tickets` | Customer support tickets |
| `support_ticket_replies` | Ticket conversation thread |

### Key Schema Differences Handled
| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| Auto-increment | `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL PRIMARY KEY` |
| Boolean default | `DEFAULT 1` / `DEFAULT 0` | `DEFAULT TRUE` / `DEFAULT FALSE` |
| Parameters | `?` | `%s` |
| Upsert | `INSERT OR IGNORE` | `ON CONFLICT DO NOTHING` |
| Return ID | `cursor.lastrowid` | `RETURNING id` |

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### User Routes
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/change-password` - Change password
- `GET /api/user/stats` - Get user trade statistics
- `GET /api/user/payment-methods` - Get user bank accounts
- `POST /api/user/payment-methods` - Add bank account
- `DELETE /api/user/payment-methods/{id}` - Delete bank account

### Trade Routes
- `POST /api/trades/create` - Create new trade
- `GET /api/trades` - Get user's trades
- `GET /api/trades/{id}` - Get trade details
- `GET /api/rates` - Get crypto rates
- `GET /api/markets` - Get market data from CoinGecko

### Support Routes
- `POST /api/support/tickets` - Create support ticket
- `GET /api/support/tickets` - Get user's tickets
- `GET /api/support/tickets/{id}` - Get ticket details
- `POST /api/support/tickets/{id}/reply` - Reply to ticket

### Admin Routes
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/trades` - Get all trades with filters
- `PUT /api/admin/trades/{id}/approve` - Approve trade
- `PUT /api/admin/trades/{id}/cancel` - Cancel trade
- `PUT /api/admin/rates` - Update crypto rates
- `GET /api/admin/users` - Get all users with bank accounts
- `GET /api/admin/tickets` - Get all support tickets
- `PUT /api/admin/tickets/{id}/close` - Close ticket

### Health Check
- `GET /api/health` - Returns database type and status

---

## Test Credentials
- **Admin:** admin@mictrades.com / admin123
- **User:** newuser@test.com / newuser123

---

## Deployment

### Railway (Backend + PostgreSQL)
1. Create Railway project from GitHub
2. Add PostgreSQL database service
3. Set root directory to `backend`
4. Configure start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Set environment variables (DATABASE_URL auto-linked)

### Vercel (Frontend)
1. Create Vercel project from GitHub
2. Set root directory to `frontend`
3. Set REACT_APP_BACKEND_URL to Railway URL
4. Deploy

See `RAILWAY_DEPLOYMENT.md` for detailed instructions.

---

## Files Structure
```
/app
├── backend/
│   ├── server.py          # FastAPI main (PostgreSQL-compatible)
│   ├── database.py        # Dual DB support (SQLite/PostgreSQL)
│   ├── auth.py            # JWT authentication
│   └── requirements.txt   # Includes psycopg2-binary
├── frontend/
│   ├── src/
│   │   ├── components/ui/ # Shadcn components
│   │   ├── lib/api.js     # API client
│   │   └── pages/         # User and admin pages
│   └── .env
├── RAILWAY_DEPLOYMENT.md  # Deployment guide
└── memory/PRD.md          # This file
```

---

## Pending/Future Tasks

### P1 - Email Notifications
- [ ] Integrate Resend API for email notifications
- [ ] Send trade confirmation emails
- [ ] Send status update emails

### P3 - Enhancements
- [ ] Automated rate updates from exchange API
- [ ] Two-factor authentication (2FA)
- [ ] Trade transaction email receipts
- [ ] User account verification workflow
- [ ] Mobile app (React Native)

---

## Changelog

### March 13, 2026 - P2 Complete
- Implemented dual database support (SQLite/PostgreSQL)
- Updated all queries for PostgreSQL compatibility
- Added connection pooling for production
- Created comprehensive RAILWAY_DEPLOYMENT.md
- Tested all endpoints with both database types

### March 13, 2026 - P0 Complete
- Fixed support ticket system (end-to-end)
- Fixed password change functionality
- Added admin trade details with payout info
- Added admin users with bank accounts
- Added "Back to Dashboard" navigation
