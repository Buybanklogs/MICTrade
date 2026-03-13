# MIC Trades - P2P Cryptocurrency Trading Platform

## Product Requirements Document (PRD)

### Project Overview
MIC Trades is a P2P cryptocurrency trading web application that enables users to buy and sell cryptocurrencies. The platform acts as the counterparty in all trades, providing a secure environment for crypto transactions.

### Technology Stack
- **Frontend:** React.js with Tailwind CSS and Shadcn/UI components
- **Backend:** Python FastAPI
- **Database:** SQLite (local), PostgreSQL-ready for Railway deployment
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

### ✅ COMPLETED FEATURES (March 13, 2026)

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
- [x] Trade Approval Panel with:
  - View all trades with filters
  - Trade details modal showing user payout info:
    - Bank account for SELL trades
    - Wallet address for BUY trades
  - Approve/Cancel actions
- [x] Rate Management (view/update rates for all 12 cryptos)
- [x] User Management with expandable bank accounts view
- [x] Support Ticket management (view, reply, close)

---

## Database Schema

### Tables
1. **users** - id, email, password_hash, firstname, lastname, username, phone, date_of_birth, role, is_active, created_at, updated_at
2. **trades** - id, user_id, trade_type, crypto_symbol, amount, rate_used, total_ngn, user_wallet_address, user_bank_account_id, platform_payment_details, status, created_at, completed_at
3. **crypto_rates** - id, crypto_symbol, crypto_name, buy_rate, sell_rate, updated_at, updated_by_admin_id
4. **user_payment_methods** - id, user_id, bank_name, account_number, account_name, is_default, created_at
5. **payment_settings** - id, bank_name, account_number, account_name, wallet_addresses, updated_at
6. **support_tickets** - id, user_id, subject, message, status, admin_response, created_at, updated_at
7. **support_ticket_replies** - id, ticket_id, user_id, message, is_admin, created_at

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
- `GET /api/admin/users/{id}/bank-accounts` - Get user's bank accounts
- `GET /api/admin/tickets` - Get all support tickets
- `GET /api/admin/tickets/{id}` - Get ticket details
- `PUT /api/admin/tickets/{id}/close` - Close ticket

---

## Test Credentials
- **Admin:** admin@mictrades.com / admin123
- **User:** user@test.com / testuser123

---

## Testing Status (March 13, 2026)
- **Backend:** 27/27 tests passed (100%)
- **Frontend:** All features verified (100%)
- **Test Report:** `/app/test_reports/iteration_1.json`

---

## Pending/Future Tasks

### P1 - Email Notifications
- [ ] Integrate Resend API for email notifications
- [ ] Send trade confirmation emails
- [ ] Send status update emails

### P2 - PostgreSQL Migration (for Railway)
- [ ] Update database.py for PostgreSQL compatibility
- [ ] Test all queries with PostgreSQL
- [ ] Update RAILWAY_DEPLOYMENT.md

### P3 - Enhancements
- [ ] Automated rate updates from exchange API
- [ ] Two-factor authentication (2FA)
- [ ] Trade transaction email receipts
- [ ] User account verification workflow
- [ ] Mobile app (React Native)

---

## Files Structure
```
/app
├── backend/
│   ├── .env                  # Environment variables
│   ├── server.py             # FastAPI main application
│   ├── database.py           # Database schema and init
│   ├── auth.py               # JWT authentication
│   └── tests/
│       └── test_p2p_crypto.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Shadcn components
│   │   │   ├── MobileNav.js
│   │   │   └── ProtectedRoute.js
│   │   ├── lib/
│   │   │   └── api.js        # API client
│   │   ├── pages/
│   │   │   ├── admin/        # Admin pages
│   │   │   │   ├── Dashboard.js
│   │   │   │   ├── Trades.js
│   │   │   │   ├── Users.js
│   │   │   │   ├── Rates.js
│   │   │   │   └── Support.js
│   │   │   └── user/         # User pages
│   │   │       ├── Dashboard.js
│   │   │       ├── P2PTrade.js
│   │   │       ├── Markets.js
│   │   │       ├── History.js
│   │   │       ├── Settings.js
│   │   │       └── Support.js
│   │   ├── App.js            # Main router
│   │   └── index.js          # Entry point
│   └── .env
├── test_reports/
│   └── iteration_1.json
├── RAILWAY_DEPLOYMENT.md
└── PROJECT_README.md
```
