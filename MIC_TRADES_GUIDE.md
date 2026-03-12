# MIC Trades - P2P Crypto Trading Platform

## 🎯 Quick Start Guide

### Admin Access
**Email:** admin@mictrades.com  
**Password:** admin123

⚠️ **Change password immediately after first login!**

### Test the Platform
1. Visit: https://crypto-desk-api.preview.emergentagent.com
2. Click "Get Started" to register
3. Or click "Sign In" to login with admin account

## 🚀 Features

### User Features
- Register & Login with secure authentication
- Buy/Sell BTC, ETH, USDT with NGN
- Live crypto rates with auto-calculation
- Payment instructions (bank/wallet)
- Trade history tracking
- Support tickets

### Admin Features
- View & approve/cancel trades
- Update crypto rates
- Manage users
- Handle support tickets
- Platform analytics

## 📊 Default Rates

- **BTC:** Buy ₦45,000,000 | Sell ₦44,000,000
- **ETH:** Buy ₦2,500,000 | Sell ₦2,400,000
- **USDT:** Buy ₦1,650 | Sell ₦1,600

## 💳 Default Payment Details

**Bank Account:**
- Bank: First Bank of Nigeria
- Account Number: 1234567890
- Account Name: MIC Trades Limited

**Crypto Wallets:**
- BTC: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
- ETH: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
- USDT: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

⚠️ **Update these with your actual details via admin panel!**

## 🔧 API Endpoints

**Base URL:** https://crypto-desk-api.preview.emergentagent.com

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- GET `/api/auth/me` - Get current user

### Public
- GET `/api/rates` - Get crypto rates
- GET `/api/markets` - Live market data (CoinGecko)

### User (Requires Authentication)
- POST `/api/trades` - Create trade
- GET `/api/trades` - Get user's trades
- GET `/api/trades/{id}` - Get trade details
- GET `/api/user/profile` - Get user profile
- PUT `/api/user/payment-info` - Update payment info
- POST `/api/support/tickets` - Create support ticket
- GET `/api/support/tickets` - Get user's tickets

### Admin (Requires Admin Role)
- GET `/api/admin/stats` - Platform statistics
- GET `/api/admin/trades` - All trades
- PUT `/api/admin/trades/{id}/approve` - Approve trade
- PUT `/api/admin/trades/{id}/cancel` - Cancel trade
- PUT `/api/admin/rates` - Update crypto rates
- GET `/api/admin/users` - All users
- GET `/api/admin/tickets` - All support tickets

## 📱 User Flow

### Buying Crypto
1. Sign in → Navigate to "P2P Trade"
2. Click "Buy Crypto"
3. Select cryptocurrency (BTC/ETH/USDT)
4. Enter amount
5. System calculates NGN total
6. Click "Trade Now"
7. Copy bank details
8. Transfer funds to company account
9. Wait for admin approval
10. Trade completed!

### Selling Crypto
1. Sign in → Navigate to "P2P Trade"
2. Click "Sell Crypto"
3. Select cryptocurrency
4. Enter amount
5. System calculates NGN you'll receive
6. Click "Trade Now"
7. Copy wallet address
8. Send crypto to company wallet
9. Wait for admin approval
10. Receive NGN to your bank account!

## 🔒 Security

- JWT authentication with HTTP-only cookies
- bcrypt password hashing
- Input validation on all endpoints
- SQL injection protection
- CORS configuration

## 🚢 Deployment to Railway

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for complete deployment guide.

### Quick Deploy Steps:
1. Create Railway account
2. Add PostgreSQL database
3. Deploy backend (set DATABASE_URL from Railway PostgreSQL)
4. Deploy frontend (set REACT_APP_BACKEND_URL to backend URL)
5. Database auto-initializes on first request
6. Login as admin and configure settings

### Environment Variables

**Backend:**
```env
DATABASE_URL=postgresql://... (from Railway)
JWT_SECRET=your-secret-key
RESEND_API_KEY=your-resend-key (optional)
CORS_ORIGINS=https://your-frontend.railway.app
```

**Frontend:**
```env
REACT_APP_BACKEND_URL=https://your-backend.railway.app
```

## 📝 Admin Tasks After Deployment

1. ✅ Login with admin@mictrades.com / admin123
2. ✅ Change admin password
3. ✅ Update bank account details
4. ✅ Update crypto wallet addresses
5. ✅ Set competitive crypto rates
6. ✅ Test complete trade flow
7. ✅ Configure email notifications (optional)

## 🎨 Branding

- **Logo:** MIC Trades logo (already integrated)
- **Colors:** White background, Blue primary (#2563EB)
- **Typography:** Plus Jakarta Sans (headings), DM Sans (body)

## 📞 Support

For technical issues:
- Check backend logs: `/var/log/supervisor/backend.err.log`
- Check frontend console for errors
- Verify API endpoints are responding
- Ensure database connection is working

## 🔄 Regular Maintenance

- Update crypto rates regularly (competitive with market)
- Monitor pending trades
- Review support tickets daily
- Backup database regularly
- Monitor system health

## 📈 Future Enhancements

- Email notifications for trades
- SMS notifications
- KYC verification
- Two-factor authentication
- Mobile app
- Automated rate updates from exchange APIs
- Advanced analytics dashboard
- Multi-currency support

---

**Built with ❤️ for MIC Trades**

Platform ready for Railway deployment and production use!
