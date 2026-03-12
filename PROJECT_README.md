# P2P Cryptocurrency Trading Platform

A complete P2P cryptocurrency exchange platform for buying and selling Bitcoin, Ethereum, and USDT with Nigerian Naira (NGN).

## 🚀 Features

### User Features
- **User Registration & Authentication** - Secure JWT-based authentication
- **P2P Crypto Trading** - Buy and sell BTC, ETH, USDT
- **Live Market Data** - Real-time crypto prices from CoinGecko
- **Trade History** - Track all your transactions
- **Payment Management** - Save bank accounts and crypto wallets
- **Support Tickets** - Get help from admin team
- **Trade Status Tracking** - Monitor pending/completed trades

### Admin Features
- **Trade Management** - Approve or cancel trades
- **Rate Management** - Set buy/sell rates for each cryptocurrency
- **User Management** - View and manage all users
- **Dashboard Analytics** - Overview of platform statistics
- **Support Ticket Management** - Respond to user inquiries
- **Payment Settings** - Configure company bank account and wallet addresses

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: JWT with HTTP-only cookies
- **Password Hashing**: bcrypt
- **API Integration**: CoinGecko (market data)
- **Email**: Resend (for notifications)

### Frontend
- **Framework**: React 19
- **Routing**: React Router v7
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: Sonner
- **HTTP Client**: Axios

## 📦 Quick Start

### Backend
```bash
cd backend
python -c "from database import init_database; init_database()"
```

### Frontend
Visit: https://crypto-desk-api.preview.emergentagent.com

### Default Admin
**Email**: admin@sfpf.com  
**Password**: admin123

## 📡 API Endpoints

- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/rates` - Get crypto rates
- `POST /api/trades` - Create trade
- `GET /api/admin/trades` - Admin: View all trades
- `PUT /api/admin/trades/{id}/approve` - Admin: Approve trade

## 🚢 Deployment

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for Railway deployment guide.

## 🔒 Security

- JWT auth with HTTP-only cookies
- bcrypt password hashing
- SQL injection protection
- Input validation

---

For detailed documentation, see full README above.
