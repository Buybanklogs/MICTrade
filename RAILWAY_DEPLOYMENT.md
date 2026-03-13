# MIC Trades - Railway Deployment Guide

This guide covers deploying the MIC Trades P2P Crypto Trading platform to Railway (backend + PostgreSQL) and Vercel (frontend).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                               │
├─────────────────────────────────────────────────────────────────┤
│  Vercel (Frontend)          Railway (Backend + PostgreSQL)       │
│  ┌─────────────────┐       ┌──────────────────────────────┐     │
│  │   React App     │ ──────▶│   FastAPI Backend            │     │
│  │   (Static)      │       │   ┌──────────────────────┐   │     │
│  └─────────────────┘       │   │    PostgreSQL DB     │   │     │
│                            │   └──────────────────────┘   │     │
│                            └──────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- [Railway Account](https://railway.app/)
- [Vercel Account](https://vercel.com/)
- [GitHub Repository](https://github.com/) with your code

---

## Part 1: Railway Backend Deployment

### Step 1: Create Railway Project

1. Log in to [Railway](https://railway.app/)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account and select the repository

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will provision a PostgreSQL database automatically

### Step 3: Configure Backend Service

1. Click on your deployed service
2. Go to **Settings** → **Root Directory**: Set to `backend`
3. Go to **Settings** → **Start Command**:
   ```bash
   uvicorn server:app --host 0.0.0.0 --port $PORT
   ```

### Step 4: Set Environment Variables

Go to your backend service → **Variables** tab and add:

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Auto-linked from Railway PostgreSQL |
| `JWT_SECRET_KEY` | `your-secure-random-key-min-32-chars` | JWT signing key (generate: `openssl rand -hex 32`) |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `CORS_ORIGINS` | `https://your-frontend.vercel.app` | Your Vercel frontend URL |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Frontend URL for redirects |

**Important:** Replace `your-frontend.vercel.app` with your actual Vercel domain after deployment.

### Step 5: Update requirements.txt

Ensure your `backend/requirements.txt` includes PostgreSQL driver:

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-dotenv==1.0.0
pydantic[email]==2.5.2
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
psycopg2-binary==2.9.9
requests==2.31.0
```

### Step 6: Deploy

1. Push your code to GitHub
2. Railway will auto-deploy on push
3. Monitor deployment logs in Railway dashboard
4. Note your Railway backend URL: `https://your-app.railway.app`

---

## Part 2: Vercel Frontend Deployment

### Step 1: Create Vercel Project

1. Log in to [Vercel](https://vercel.com/)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `yarn build`
   - **Output Directory**: `build`

### Step 2: Set Environment Variables

Add these environment variables in Vercel:

| Variable | Value |
|----------|-------|
| `REACT_APP_BACKEND_URL` | `https://your-app.railway.app` |

**Important:** Use your Railway backend URL from Step 1.6.

### Step 3: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your frontend
3. Note your Vercel URL: `https://your-app.vercel.app`

### Step 4: Update Railway CORS

Go back to Railway and update the `CORS_ORIGINS` variable with your actual Vercel URL.

---

## Part 3: Post-Deployment Configuration

### Update Admin Credentials (Important!)

After first deployment, immediately update the default admin password:

1. Log in with default credentials:
   - Email: `admin@mictrades.com`
   - Password: `admin123`
2. Go to Settings → Change Password
3. Set a strong, unique password

### Verify Database Migration

The database schema is automatically created on first startup. Verify by:

1. Go to Railway → PostgreSQL service
2. Click **"Data"** tab
3. Verify tables exist: `users`, `trades`, `crypto_rates`, etc.

---

## Environment Variables Reference

### Backend (.env for local development)

```env
# Database (PostgreSQL for production, SQLite for local)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT Configuration
JWT_SECRET_KEY=your-very-secure-secret-key-minimum-32-characters
JWT_ALGORITHM=HS256
JWT_EXPIRY_MINUTES=60

# CORS
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000

# Frontend URL
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (.env)

```env
REACT_APP_BACKEND_URL=https://your-app.railway.app
```

---

## Database Schema

The application automatically creates these tables on startup:

| Table | Purpose |
|-------|---------|
| `users` | User accounts (customers + admins) |
| `trades` | Buy/sell cryptocurrency trades |
| `crypto_rates` | Platform exchange rates |
| `user_payment_methods` | User bank accounts |
| `payment_settings` | Platform bank + wallet addresses |
| `support_tickets` | Customer support tickets |
| `support_ticket_replies` | Ticket conversation thread |

---

## Production Checklist

### Security
- [ ] Changed default admin password
- [ ] Generated secure JWT_SECRET_KEY (32+ chars)
- [ ] Set proper CORS_ORIGINS (no wildcards)
- [ ] SSL/HTTPS enabled (automatic on Railway/Vercel)

### Configuration
- [ ] DATABASE_URL points to Railway PostgreSQL
- [ ] REACT_APP_BACKEND_URL points to Railway backend
- [ ] CORS_ORIGINS includes Vercel frontend URL

### Testing
- [ ] User registration works
- [ ] User login works
- [ ] Admin login works
- [ ] Trade creation works
- [ ] Trade approval works
- [ ] Support tickets work

---

## Troubleshooting

### Backend won't start

**Check logs:**
```bash
# In Railway dashboard → Deployments → View Logs
```

**Common issues:**
- Missing `psycopg2-binary` in requirements.txt
- Invalid DATABASE_URL format
- Missing environment variables

### Database connection errors

**Verify DATABASE_URL format:**
```
postgresql://username:password@host:port/database
```

**Note:** Railway may provide `postgres://` URL - the app handles both formats.

### CORS errors

**Symptoms:** Frontend can't reach backend, browser console shows CORS errors.

**Fix:**
1. Check CORS_ORIGINS in Railway includes your exact Vercel URL
2. Include protocol: `https://your-app.vercel.app` (not just the domain)
3. Redeploy backend after changing CORS_ORIGINS

### Frontend shows "Backend unavailable"

1. Verify REACT_APP_BACKEND_URL is correct
2. Check Railway backend is running (green status)
3. Test backend directly: `curl https://your-app.railway.app/api/health`

---

## Scaling & Monitoring

### Railway
- Enable **Auto-scaling** for traffic spikes
- Monitor **Metrics** tab for CPU/Memory usage
- Set up **Alerts** for downtime notifications

### Vercel
- Enable **Analytics** for frontend performance
- Use **Edge Functions** for improved latency
- Set up **Custom Domain** for branding

---

## Cost Estimation

### Railway
- **Hobby Plan**: Free tier with limits
- **Pro Plan**: ~$5/month base + usage
- PostgreSQL: Included in compute costs

### Vercel
- **Hobby Plan**: Free for personal projects
- **Pro Plan**: $20/month for team features

**Estimated monthly cost:** $5-25 for small-medium traffic

---

## Support

- Railway Docs: https://docs.railway.app/
- Vercel Docs: https://vercel.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com/
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

## Quick Commands

```bash
# Local development with SQLite
cd backend
DATABASE_URL=sqlite:///./p2p_crypto.db uvicorn server:app --reload --port 8001

# Local development with PostgreSQL
cd backend
DATABASE_URL=postgresql://user:pass@localhost:5432/mictrades uvicorn server:app --reload --port 8001

# Test backend health
curl https://your-app.railway.app/api/health

# View PostgreSQL tables (Railway CLI)
railway connect postgres
\dt
```
