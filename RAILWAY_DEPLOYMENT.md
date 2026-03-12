# P2P Crypto Trading Platform - Railway Deployment Guide

## Prerequisites
- Railway account (https://railway.app)
- GitHub repository (optional, can deploy from local)
- PostgreSQL database on Railway

## Backend Deployment (Node.js + PostgreSQL)

### Step 1: Create New Project on Railway
1. Go to Railway.app and create a new project
2. Click "New" → "PostgreSQL" to add a database
3. Note the connection string provided by Railway

### Step 2: Prepare Backend Code

Update `/app/backend/.env`:
```env
# PostgreSQL Database (Railway provides this)
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
SENDER_EMAIL=noreply@yourdomain.com

# CORS (your frontend URL)
CORS_ORIGINS=https://your-frontend.railway.app

# Frontend URL
FRONTEND_URL=https://your-frontend.railway.app
```

### Step 3: Update database.py for PostgreSQL

In `/app/backend/database.py`, ensure PostgreSQL support:
```python
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./p2p_crypto.db')

# Railway PostgreSQL connection string format
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
```

### Step 4: Create Procfile

Create `/app/backend/Procfile`:
```
web: uvicorn server:app --host 0.0.0.0 --port $PORT
```

### Step 5: Deploy Backend

1. In Railway, click "New" → "GitHub Repo" or "Empty Service"
2. If using GitHub, connect your repository
3. Set the root directory to `/backend`
4. Railway will auto-detect Python and install dependencies
5. Add environment variables in Railway dashboard
6. Deploy!

## Frontend Deployment (React)

### Step 1: Update Frontend Environment

Update `/app/frontend/.env.production`:
```env
REACT_APP_BACKEND_URL=https://your-backend.railway.app
```

### Step 2: Build Configuration

Create `/app/frontend/package.json` scripts:
```json
{
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "serve": "serve -s build -l $PORT"
  }
}
```

Install serve:
```bash
cd /app/frontend
yarn add serve
```

### Step 3: Create Procfile

Create `/app/frontend/Procfile`:
```
web: yarn serve
```

### Step 4: Deploy Frontend

1. In Railway, click "New" → "GitHub Repo" or "Empty Service"
2. Set root directory to `/frontend`
3. Railway will auto-detect Node.js and build
4. Add environment variable: `REACT_APP_BACKEND_URL`
5. Deploy!

## Post-Deployment Setup

### 1. Initialize Database

The database will auto-initialize on first request. Test with:
```bash
curl https://your-backend.railway.app/api/health
```

### 2. Create Admin Account

Default admin credentials are created automatically:
- Email: `admin@mictrades.com`
- Password: `admin123`

**IMPORTANT**: Change this password immediately after first login!

### 3. Update Payment Settings

Login as admin and update:
- Bank account details
- Crypto wallet addresses
- Exchange rates

### 4. Configure Email (Optional)

To enable email notifications:
1. Sign up for Resend (https://resend.com)
2. Get API key
3. Add to Railway environment variables
4. Restart backend service

## Testing Deployment

### Test Backend
```bash
curl https://your-backend.railway.app/api/health
curl https://your-backend.railway.app/api/rates
```

### Test Frontend
Visit: `https://your-frontend.railway.app`

### Test Complete Flow
1. Register new user account
2. Login
3. View crypto rates
4. Create a test trade
5. Login as admin
6. Approve trade

## Environment Variables Summary

### Backend
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Railway)
- `JWT_SECRET` - Secret key for JWT tokens
- `RESEND_API_KEY` - Email service API key
- `SENDER_EMAIL` - Email sender address
- `CORS_ORIGINS` - Frontend URL
- `FRONTEND_URL` - Frontend URL

### Frontend
- `REACT_APP_BACKEND_URL` - Backend API URL

## Troubleshooting

### Database Connection Issues
- Ensure DATABASE_URL is set correctly
- Check if PostgreSQL service is running
- Verify connection string format

### CORS Errors
- Update CORS_ORIGINS in backend .env
- Ensure frontend URL matches exactly
- Restart backend service

### Build Failures
- Check Railway logs
- Verify all dependencies are in requirements.txt/package.json
- Ensure Python/Node versions are compatible

## Scaling & Monitoring

### Railway Auto-Scaling
Railway automatically scales your services based on demand.

### Monitoring
- Check Railway dashboard for logs
- Monitor database usage
- Set up alerts for service downtime

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS (Railway does this automatically)
- [ ] Set proper CORS origins
- [ ] Keep dependencies updated
- [ ] Monitor for suspicious activity
- [ ] Regular database backups

## Support

For issues:
1. Check Railway logs
2. Review application logs
3. Test API endpoints directly
4. Check database connectivity

## Estimated Costs

- Railway Free Tier: $0/month (with limitations)
- Hobby Plan: $5/month per service
- PostgreSQL: Included in service cost
- Resend Email: Free tier available

## Next Steps

1. Deploy to Railway
2. Configure production environment
3. Test all features thoroughly
4. Update crypto rates regularly
5. Monitor user activity
6. Implement email notifications
7. Add more cryptocurrencies as needed

---

**Note**: This platform is production-ready with SQLite for local testing and PostgreSQL for Railway deployment. The code automatically detects which database to use based on the DATABASE_URL environment variable.