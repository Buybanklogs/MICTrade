from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, validator
from datetime import date, datetime, timedelta
from typing import Optional, List
import os
import logging
import asyncio
import requests
from dotenv import load_dotenv

from database import init_database, get_db_connection, release_db_connection
from auth import get_password_hash, verify_password, create_access_token, decode_access_token

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="P2P Crypto Trading API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('CORS_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    try:
        init_database()
        logger.info("Application started successfully")
    except Exception as e:
        logger.error(f"Startup error: {e}")

# Dependency to get current user
async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Fetch user from database
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, email, firstname, lastname, username, role, is_active
            FROM users WHERE id = %s
        """, (user_id,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {
            "id": user[0],
            "email": user[1],
            "firstname": user[2],
            "lastname": user[3],
            "username": user[4],
            "role": user[5],
            "is_active": user[6]
        }
    finally:
        release_db_connection(conn)

# Pydantic models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    firstname: str
    lastname: str
    username: str
    phone: str
    dateOfBirth: date
    role: str = "user"
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TradeCreate(BaseModel):
    trade_type: str
    crypto_symbol: str
    amount: float

class RateUpdate(BaseModel):
    crypto_symbol: str
    buy_rate: float
    sell_rate: float

class SupportTicketCreate(BaseModel):
    subject: str
    message: str

class PaymentInfoUpdate(BaseModel):
    bank_account: Optional[dict] = None
    crypto_wallets: Optional[dict] = None

# ============ AUTH ROUTES ============

@app.post("/api/auth/register")
async def register(user: UserRegister):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Check if email exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (user.email.lower(),))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Check if username exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (user.username.lower(),))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Hash password
        hashed_password = get_password_hash(user.password)
        
        # Insert user
        cursor.execute("""
            INSERT INTO users (email, password_hash, firstname, lastname, username, phone, date_of_birth, role)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user.email.lower(),
            hashed_password,
            user.firstname,
            user.lastname,
            user.username.lower(),
            user.phone,
            user.dateOfBirth,
            user.role
        ))
        
        user_id = cursor.fetchone()[0]
        conn.commit()
        
        return {
            "success": True,
            "message": "Account created successfully",
            "redirect": "/signin"
        }
    except HTTPException as e:
        conn.rollback()
        raise e
    except Exception as e:
        conn.rollback()
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")
    finally:
        release_db_connection(conn)

@app.post("/api/auth/login")
async def login(request: Request, user: UserLogin):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, password_hash, role, is_active
            FROM users WHERE email = %s
        """, (user.email.lower(),))
        
        db_user = cursor.fetchone()
        
        if not db_user or not verify_password(user.password, db_user[1]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        if not db_user[3]:
            raise HTTPException(status_code=403, detail="Account is disabled")
        
        # Create access token
        access_token = create_access_token(data={"sub": str(db_user[0]), "role": db_user[2]})
        
        # Determine redirect based on role
        redirect_url = "/admin" if db_user[2] == "admin" else "/dashboard"
        
        response = JSONResponse({
            "success": True,
            "message": "Login successful",
            "redirect": redirect_url,
            "role": db_user[2]
        })
        
        # Set HTTP-only cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=3600,
            samesite="lax"
        )
        
        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")
    finally:
        release_db_connection(conn)

@app.post("/api/auth/logout")
async def logout():
    response = JSONResponse({"success": True, "message": "Logged out successfully"})
    response.delete_cookie("access_token")
    return response

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ============ CRYPTO RATES ROUTES ============

@app.get("/api/rates")
async def get_rates():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT crypto_symbol, buy_rate, sell_rate, updated_at
            FROM crypto_rates
            ORDER BY crypto_symbol
        """)
        rates = cursor.fetchall()
        
        return {
            "success": True,
            "rates": [
                {
                    "symbol": r[0],
                    "buy_rate": float(r[1]),
                    "sell_rate": float(r[2]),
                    "updated_at": r[3].isoformat() if r[3] else None
                }
                for r in rates
            ]
        }
    finally:
        release_db_connection(conn)

# ============ MARKET DATA ROUTES ============

@app.get("/api/markets")
async def get_markets():
    """Proxy to CoinGecko API for market data"""
    try:
        response = requests.get(
            "https://api.coingecko.com/api/v3/simple/price",
            params={
                "ids": "bitcoin,ethereum,tether",
                "vs_currencies": "usd,ngn",
                "include_24hr_change": "true",
                "include_market_cap": "true"
            },
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        
        return {
            "success": True,
            "markets": {
                "BTC": data.get("bitcoin", {}),
                "ETH": data.get("ethereum", {}),
                "USDT": data.get("tether", {})
            }
        }
    except Exception as e:
        logger.error(f"Market data error: {e}")
        return {
            "success": False,
            "message": "Failed to fetch market data"
        }

# ============ TRADE ROUTES ============

@app.post("/api/trades")
async def create_trade(trade: TradeCreate, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Get current rate
        cursor.execute("""
            SELECT buy_rate, sell_rate FROM crypto_rates
            WHERE crypto_symbol = %s
        """, (trade.crypto_symbol,))
        
        rate_data = cursor.fetchone()
        if not rate_data:
            raise HTTPException(status_code=400, detail="Invalid cryptocurrency symbol")
        
        rate_used = float(rate_data[0]) if trade.trade_type == "buy" else float(rate_data[1])
        total_ngn = trade.amount * rate_used
        
        # Get payment details
        cursor.execute("SELECT bank_name, account_number, account_name, wallet_addresses FROM payment_settings LIMIT 1")
        payment_info = cursor.fetchone()
        
        if trade.trade_type == "buy":
            payment_details = {
                "bank_name": payment_info[0] if payment_info else "N/A",
                "account_number": payment_info[1] if payment_info else "N/A",
                "account_name": payment_info[2] if payment_info else "N/A"
            }
        else:
            import json
            wallets = json.loads(payment_info[3]) if payment_info and payment_info[3] else {}
            payment_details = {
                "wallet_address": wallets.get(trade.crypto_symbol, "N/A")
            }
        
        # Insert trade
        cursor.execute("""
            INSERT INTO trades (user_id, trade_type, crypto_symbol, amount, rate_used, total_ngn, payment_details, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending')
            RETURNING id, created_at
        """, (
            current_user["id"],
            trade.trade_type,
            trade.crypto_symbol,
            trade.amount,
            rate_used,
            total_ngn,
            json.dumps(payment_details)
        ))
        
        trade_id, created_at = cursor.fetchone()
        conn.commit()
        
        return {
            "success": True,
            "message": "Trade created successfully",
            "trade": {
                "id": trade_id,
                "trade_type": trade.trade_type,
                "crypto_symbol": trade.crypto_symbol,
                "amount": trade.amount,
                "rate_used": rate_used,
                "total_ngn": total_ngn,
                "payment_details": payment_details,
                "status": "pending",
                "created_at": created_at.isoformat()
            }
        }
    except HTTPException as e:
        conn.rollback()
        raise e
    except Exception as e:
        conn.rollback()
        logger.error(f"Trade creation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create trade")
    finally:
        release_db_connection(conn)

@app.get("/api/trades")
async def get_user_trades(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, trade_type, crypto_symbol, amount, rate_used, total_ngn, status, created_at, completed_at
            FROM trades
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (current_user["id"],))
        
        trades = cursor.fetchall()
        
        return {
            "success": True,
            "trades": [
                {
                    "id": t[0],
                    "trade_type": t[1],
                    "crypto_symbol": t[2],
                    "amount": float(t[3]),
                    "rate_used": float(t[4]),
                    "total_ngn": float(t[5]),
                    "status": t[6],
                    "created_at": t[7].isoformat() if t[7] else None,
                    "completed_at": t[8].isoformat() if t[8] else None
                }
                for t in trades
            ]
        }
    finally:
        release_db_connection(conn)

@app.get("/api/trades/{trade_id}")
async def get_trade(trade_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, trade_type, crypto_symbol, amount, rate_used, total_ngn, payment_details, status, created_at, completed_at
            FROM trades
            WHERE id = %s AND user_id = %s
        """, (trade_id, current_user["id"]))
        
        trade = cursor.fetchone()
        if not trade:
            raise HTTPException(status_code=404, detail="Trade not found")
        
        import json
        return {
            "success": True,
            "trade": {
                "id": trade[0],
                "trade_type": trade[1],
                "crypto_symbol": trade[2],
                "amount": float(trade[3]),
                "rate_used": float(trade[4]),
                "total_ngn": float(trade[5]),
                "payment_details": json.loads(trade[6]) if trade[6] else {},
                "status": trade[7],
                "created_at": trade[8].isoformat() if trade[8] else None,
                "completed_at": trade[9].isoformat() if trade[9] else None
            }
        }
    finally:
        release_db_connection(conn)

# ============ USER PROFILE ROUTES ============

@app.get("/api/user/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT email, firstname, lastname, username, phone, date_of_birth, bank_account, crypto_wallets
            FROM users WHERE id = %s
        """, (current_user["id"],))
        
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        import json
        return {
            "success": True,
            "profile": {
                "email": user[0],
                "firstname": user[1],
                "lastname": user[2],
                "username": user[3],
                "phone": user[4],
                "date_of_birth": user[5].isoformat() if user[5] else None,
                "bank_account": json.loads(user[6]) if user[6] else None,
                "crypto_wallets": json.loads(user[7]) if user[7] else None
            }
        }
    finally:
        release_db_connection(conn)

@app.put("/api/user/payment-info")
async def update_payment_info(payment_info: PaymentInfoUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        import json
        
        updates = []
        params = []
        
        if payment_info.bank_account:
            updates.append("bank_account = %s")
            params.append(json.dumps(payment_info.bank_account))
        
        if payment_info.crypto_wallets:
            updates.append("crypto_wallets = %s")
            params.append(json.dumps(payment_info.crypto_wallets))
        
        if updates:
            params.append(current_user["id"])
            cursor.execute(f"""
                UPDATE users
                SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, tuple(params))
            conn.commit()
        
        return {"success": True, "message": "Payment information updated"}
    except Exception as e:
        conn.rollback()
        logger.error(f"Payment info update error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update payment information")
    finally:
        release_db_connection(conn)

# ============ SUPPORT ROUTES ============

@app.post("/api/support/tickets")
async def create_ticket(ticket: SupportTicketCreate, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO support_tickets (user_id, subject, message, status)
            VALUES (%s, %s, %s, 'open')
            RETURNING id, created_at
        """, (current_user["id"], ticket.subject, ticket.message))
        
        ticket_id, created_at = cursor.fetchone()
        conn.commit()
        
        return {
            "success": True,
            "message": "Support ticket created",
            "ticket_id": ticket_id
        }
    except Exception as e:
        conn.rollback()
        logger.error(f"Ticket creation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create ticket")
    finally:
        release_db_connection(conn)

@app.get("/api/support/tickets")
async def get_tickets(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, subject, message, status, admin_response, created_at, updated_at
            FROM support_tickets
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (current_user["id"],))
        
        tickets = cursor.fetchall()
        
        return {
            "success": True,
            "tickets": [
                {
                    "id": t[0],
                    "subject": t[1],
                    "message": t[2],
                    "status": t[3],
                    "admin_response": t[4],
                    "created_at": t[5].isoformat() if t[5] else None,
                    "updated_at": t[6].isoformat() if t[6] else None
                }
                for t in tickets
            ]
        }
    finally:
        release_db_connection(conn)

# ============ ADMIN ROUTES ============

async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@app.get("/api/admin/trades")
async def admin_get_trades(status: Optional[str] = None, admin: dict = Depends(require_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        if status:
            cursor.execute("""
                SELECT t.id, t.user_id, u.email, u.firstname, u.lastname, t.trade_type, t.crypto_symbol,
                       t.amount, t.rate_used, t.total_ngn, t.status, t.created_at, t.completed_at
                FROM trades t
                JOIN users u ON t.user_id = u.id
                WHERE t.status = %s
                ORDER BY t.created_at DESC
            """, (status,))
        else:
            cursor.execute("""
                SELECT t.id, t.user_id, u.email, u.firstname, u.lastname, t.trade_type, t.crypto_symbol,
                       t.amount, t.rate_used, t.total_ngn, t.status, t.created_at, t.completed_at
                FROM trades t
                JOIN users u ON t.user_id = u.id
                ORDER BY t.created_at DESC
            """)
        
        trades = cursor.fetchall()
        
        return {
            "success": True,
            "trades": [
                {
                    "id": t[0],
                    "user_id": t[1],
                    "user_email": t[2],
                    "user_name": f"{t[3]} {t[4]}",
                    "trade_type": t[5],
                    "crypto_symbol": t[6],
                    "amount": float(t[7]),
                    "rate_used": float(t[8]),
                    "total_ngn": float(t[9]),
                    "status": t[10],
                    "created_at": t[11].isoformat() if t[11] else None,
                    "completed_at": t[12].isoformat() if t[12] else None
                }
                for t in trades
            ]
        }
    finally:
        release_db_connection(conn)

@app.put("/api/admin/trades/{trade_id}/approve")
async def admin_approve_trade(trade_id: int, admin: dict = Depends(require_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE trades
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP
            WHERE id = %s AND status = 'pending'
            RETURNING id
        """, (trade_id,))
        
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Trade not found or already processed")
        
        conn.commit()
        
        # TODO: Send email notification
        
        return {"success": True, "message": "Trade approved successfully"}
    except HTTPException as e:
        conn.rollback()
        raise e
    except Exception as e:
        conn.rollback()
        logger.error(f"Trade approval error: {e}")
        raise HTTPException(status_code=500, detail="Failed to approve trade")
    finally:
        release_db_connection(conn)

@app.put("/api/admin/trades/{trade_id}/cancel")
async def admin_cancel_trade(trade_id: int, admin: dict = Depends(require_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE trades
            SET status = 'cancelled'
            WHERE id = %s AND status = 'pending'
            RETURNING id
        """, (trade_id,))
        
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Trade not found or already processed")
        
        conn.commit()
        
        return {"success": True, "message": "Trade cancelled successfully"}
    except HTTPException as e:
        conn.rollback()
        raise e
    except Exception as e:
        conn.rollback()
        logger.error(f"Trade cancellation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel trade")
    finally:
        release_db_connection(conn)

@app.put("/api/admin/rates")
async def admin_update_rates(rate: RateUpdate, admin: dict = Depends(require_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE crypto_rates
            SET buy_rate = %s, sell_rate = %s, updated_at = CURRENT_TIMESTAMP, updated_by_admin_id = %s
            WHERE crypto_symbol = %s
        """, (rate.buy_rate, rate.sell_rate, admin["id"], rate.crypto_symbol))
        
        conn.commit()
        
        return {"success": True, "message": "Rates updated successfully"}
    except Exception as e:
        conn.rollback()
        logger.error(f"Rate update error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update rates")
    finally:
        release_db_connection(conn)

@app.get("/api/admin/users")
async def admin_get_users(admin: dict = Depends(require_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, email, firstname, lastname, username, phone, role, is_active, created_at
            FROM users
            ORDER BY created_at DESC
        """)
        
        users = cursor.fetchall()
        
        return {
            "success": True,
            "users": [
                {
                    "id": u[0],
                    "email": u[1],
                    "firstname": u[2],
                    "lastname": u[3],
                    "username": u[4],
                    "phone": u[5],
                    "role": u[6],
                    "is_active": u[7],
                    "created_at": u[8].isoformat() if u[8] else None
                }
                for u in users
            ]
        }
    finally:
        release_db_connection(conn)

@app.get("/api/admin/stats")
async def admin_get_stats(admin: dict = Depends(require_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Total users
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'user'")
        total_users = cursor.fetchone()[0]
        
        # Total trades
        cursor.execute("SELECT COUNT(*) FROM trades")
        total_trades = cursor.fetchone()[0]
        
        # Pending trades
        cursor.execute("SELECT COUNT(*) FROM trades WHERE status = 'pending'")
        pending_trades = cursor.fetchone()[0]
        
        # Completed trades
        cursor.execute("SELECT COUNT(*) FROM trades WHERE status = 'completed'")
        completed_trades = cursor.fetchone()[0]
        
        return {
            "success": True,
            "stats": {
                "total_users": total_users,
                "total_trades": total_trades,
                "pending_trades": pending_trades,
                "completed_trades": completed_trades
            }
        }
    finally:
        release_db_connection(conn)

@app.get("/api/admin/tickets")
async def admin_get_tickets(admin: dict = Depends(require_admin)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT st.id, st.user_id, u.email, u.firstname, u.lastname, st.subject, st.message, st.status, st.admin_response, st.created_at
            FROM support_tickets st
            JOIN users u ON st.user_id = u.id
            ORDER BY st.created_at DESC
        """)
        
        tickets = cursor.fetchall()
        
        return {
            "success": True,
            "tickets": [
                {
                    "id": t[0],
                    "user_id": t[1],
                    "user_email": t[2],
                    "user_name": f"{t[3]} {t[4]}",
                    "subject": t[5],
                    "message": t[6],
                    "status": t[7],
                    "admin_response": t[8],
                    "created_at": t[9].isoformat() if t[9] else None
                }
                for t in tickets
            ]
        }
    finally:
        release_db_connection(conn)

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "P2P Crypto Trading API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)