"""
P2P Crypto Trading API Server
FastAPI backend with SQLite/PostgreSQL support for Railway deployment
Supports admin, staff, and user roles
"""
from fastapi import FastAPI, HTTPException, Depends, status, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, validator
from datetime import date, datetime, timedelta
from typing import Optional, List
from decimal import Decimal
import os
import logging
import asyncio
import requests
import json
from dotenv import load_dotenv

from database import init_database, get_db_connection, release_db_connection, IS_POSTGRES, PARAM
from auth import get_password_hash, verify_password, create_access_token, decode_access_token

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="P2P Crypto Trading API")


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def parse_cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS", "").strip()
    frontend_url = os.getenv("FRONTEND_URL", "").strip()

    if raw_origins:
        origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    elif frontend_url:
        origins = [frontend_url]
    else:
        origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

    if "*" in origins:
        logger.warning(
            "CORS_ORIGINS contains '*'. Because allow_credentials=True requires explicit origins, "
            "falling back to FRONTEND_URL or localhost defaults."
        )
        origins = [frontend_url] if frontend_url else ["http://localhost:3000", "http://127.0.0.1:3000"]

    return origins


CORS_ORIGINS = parse_cors_origins()
COOKIE_SECURE = env_bool("COOKIE_SECURE", True)
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "none").strip().lower()
if COOKIE_SAMESITE not in {"lax", "strict", "none"}:
    COOKIE_SAMESITE = "none"

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def param(query: str) -> str:
    """Convert SQLite ? placeholders to PostgreSQL %s if needed"""
    if IS_POSTGRES:
        return query.replace('?', '%s')
    return query


def get_insert_id(cursor, table_name: str) -> int:
    """Get the last inserted ID - works for both SQLite and PostgreSQL"""
    if IS_POSTGRES:
        cursor.execute(f"SELECT currval(pg_get_serial_sequence('{table_name}', 'id'))")
        return cursor.fetchone()[0]
    else:
        return cursor.lastrowid


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
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(param("""
            SELECT id, email, firstname, lastname, username, role, is_active
            FROM users WHERE id = ?
        """), (user_id,))
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


# ============ ROLE-BASED ACCESS DEPENDENCIES ============

async def require_admin(current_user: dict = Depends(get_current_user)):
    """Requires admin role only - blocks staff and users"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def require_admin_or_staff(current_user: dict = Depends(get_current_user)):
    """Allows both admin and staff roles"""
    if current_user["role"] not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Admin or staff access required")
    return current_user


# ============ PYDANTIC MODELS ============

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


class TradeCreateWithPayment(BaseModel):
    trade_type: str
    crypto_symbol: str
    amount: float
    user_wallet_address: Optional[str] = None
    user_bank_account_id: Optional[int] = None


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


class PaymentMethodCreate(BaseModel):
    bank_name: str
    account_number: str
    account_name: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class TicketReplyCreate(BaseModel):
    ticket_id: int
    message: str


# ============ AUTH ROUTES ============

@app.post("/api/auth/register")
async def register(user: UserRegister):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Check if email exists
        cursor.execute(param("SELECT id FROM users WHERE email = ?"), (user.email.lower(),))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Check if username exists
        cursor.execute(param("SELECT id FROM users WHERE username = ?"), (user.username.lower(),))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Hash password
        hashed_password = get_password_hash(user.password)
        
        # Insert user - role is always 'user' for public registration
        if IS_POSTGRES:
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
                "user"  # Force user role for public registration
            ))
            user_id = cursor.fetchone()[0]
        else:
            cursor.execute("""
                INSERT INTO users (email, password_hash, firstname, lastname, username, phone, date_of_birth, role)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user.email.lower(),
                hashed_password,
                user.firstname,
                user.lastname,
                user.username.lower(),
                user.phone,
                user.dateOfBirth,
                "user"  # Force user role for public registration
            ))
            user_id = cursor.lastrowid
        
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
        cursor.execute(param("""
            SELECT id, password_hash, role, is_active
            FROM users WHERE email = ?
        """), (user.email.lower(),))
        
        db_user = cursor.fetchone()
        
        if not db_user or not verify_password(user.password, db_user[1]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        if not db_user[3]:
            raise HTTPException(status_code=403, detail="Account is disabled")
        
        # Create access token
        access_token = create_access_token(data={"sub": str(db_user[0]), "role": db_user[2]})
        
        # Determine redirect based on role
        role = db_user[2]
        if role == "admin":
            redirect_url = "/admin"
        elif role == "staff":
            redirect_url = "/admin"  # Staff goes to admin panel with limited access
        else:
            redirect_url = "/dashboard"
        
        response = JSONResponse({
            "success": True,
            "message": "Login successful",
            "redirect": redirect_url,
            "role": role
        })
        
        # Set HTTP-only cookie for Vercel (frontend) <-> Railway (backend) cross-site auth.
        # We force Secure + SameSite=None because cross-site session cookies will not persist
        # reliably with Lax/Strict in this deployment setup.
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=3600,
            path="/"
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
    return {"success": True, "message": "Logged out successfully"}


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
                    "updated_at": str(r[3]) if r[3] else None
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

@app.get("/api/trades")
async def get_user_trades(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(param("""
            SELECT id, trade_type, crypto_symbol, amount, rate_used, total_ngn, status, created_at, completed_at
            FROM trades
            WHERE user_id = ?
            ORDER BY created_at DESC
        """), (current_user["id"],))
        
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
                    "created_at": str(t[7]) if t[7] else None,
                    "completed_at": str(t[8]) if t[8] else None
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
        cursor.execute(param("""
            SELECT id, trade_type, crypto_symbol, amount, rate_used, total_ngn, platform_payment_details, status, created_at, completed_at
            FROM trades
            WHERE id = ? AND user_id = ?
        """), (trade_id, current_user["id"]))
        
        trade = cursor.fetchone()
        if not trade:
            raise HTTPException(status_code=404, detail="Trade not found")
        
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
                "created_at": str(trade[8]) if trade[8] else None,
                "completed_at": str(trade[9]) if trade[9] else None
            }
        }
    finally:
        release_db_connection(conn)


@app.post("/api/trades/create")
async def create_trade_with_payment(trade: TradeCreateWithPayment, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Validate payment details based on trade type
        if trade.trade_type == "buy" and not trade.user_wallet_address:
            raise HTTPException(status_code=400, detail="Wallet address required for buy trades")
        
        if trade.trade_type == "sell" and not trade.user_bank_account_id:
            raise HTTPException(status_code=400, detail="Bank account required for sell trades")
        
        # Get current rate
        cursor.execute(param("""
            SELECT buy_rate, sell_rate FROM crypto_rates
            WHERE crypto_symbol = ?
        """), (trade.crypto_symbol,))
        
        rate_data = cursor.fetchone()
        if not rate_data:
            raise HTTPException(status_code=400, detail="Invalid cryptocurrency symbol")
        
        rate_used = float(rate_data[0]) if trade.trade_type == "buy" else float(rate_data[1])
        total_ngn = trade.amount * rate_used
        
        # Get platform payment details
        cursor.execute("SELECT bank_name, account_number, account_name, wallet_addresses FROM payment_settings LIMIT 1")
        payment_info = cursor.fetchone()
        
        if trade.trade_type == "buy":
            platform_payment_details = {
                "bank_name": payment_info[0] if payment_info else "N/A",
                "account_number": payment_info[1] if payment_info else "N/A",
                "account_name": payment_info[2] if payment_info else "N/A"
            }
        else:
            wallets = json.loads(payment_info[3]) if payment_info and payment_info[3] else {}
            platform_payment_details = {
                "wallet_address": wallets.get(trade.crypto_symbol, "N/A")
            }
        
        # Insert trade
        if IS_POSTGRES:
            cursor.execute("""
                INSERT INTO trades (user_id, trade_type, crypto_symbol, amount, rate_used, total_ngn, 
                                  user_wallet_address, user_bank_account_id, platform_payment_details, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                RETURNING id, created_at
            """, (
                current_user["id"],
                trade.trade_type,
                trade.crypto_symbol,
                trade.amount,
                rate_used,
                total_ngn,
                trade.user_wallet_address,
                trade.user_bank_account_id,
                json.dumps(platform_payment_details)
            ))
            result = cursor.fetchone()
            trade_id = result[0]
            created_at = result[1]
        else:
            cursor.execute("""
                INSERT INTO trades (user_id, trade_type, crypto_symbol, amount, rate_used, total_ngn, 
                                  user_wallet_address, user_bank_account_id, platform_payment_details, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            """, (
                current_user["id"],
                trade.trade_type,
                trade.crypto_symbol,
                trade.amount,
                rate_used,
                total_ngn,
                trade.user_wallet_address,
                trade.user_bank_account_id,
                json.dumps(platform_payment_details)
            ))
            trade_id = cursor.lastrowid
            cursor.execute(param("SELECT created_at FROM trades WHERE id = ?"), (trade_id,))
            created_at = cursor.fetchone()[0]
        
        conn.commit()
        
        return {
            "success": True,
            "message": "Trade created successfully",
            "trade": {
                "id": trade_id,
                "trade_type": trade.trade_type,
                "crypto_symbol": trade.crypto_symbol,
                "amount": float(trade.amount),
                "rate_used": float(rate_used),
                "total_ngn": float(total_ngn),
                "payment_details": platform_payment_details,
                "status": "pending",
                "created_at": str(created_at) if created_at else None
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


# ============ USER PROFILE ROUTES ============

@app.get("/api/user/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(param("""
            SELECT email, firstname, lastname, username, phone, date_of_birth
            FROM users WHERE id = ?
        """), (current_user["id"],))
        
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "success": True,
            "profile": {
                "email": user[0],
                "firstname": user[1],
                "lastname": user[2],
                "username": user[3],
                "phone": user[4],
                "date_of_birth": str(user[5]) if user[5] else None
            }
        }
    finally:
        release_db_connection(conn)


@app.put("/api/user/change-password")
async def change_password(password_data: PasswordChange, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Verify current password
        cursor.execute(param("SELECT password_hash FROM users WHERE id = ?"), (current_user["id"],))
        user = cursor.fetchone()
        
        if not user or not verify_password(password_data.current_password, user[0]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        if len(password_data.new_password) < 8:
            raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
        
        # Update password
        new_hash = get_password_hash(password_data.new_password)
        cursor.execute(param("UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"), 
                      (new_hash, current_user["id"]))
        conn.commit()
        
        return {"success": True, "message": "Password changed successfully"}
    except HTTPException as e:
        conn.rollback()
        raise e
    except Exception as e:
        conn.rollback()
        logger.error(f"Password change error: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")
    finally:
        release_db_connection(conn)


@app.get("/api/user/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        cursor.execute(param("SELECT COUNT(*) FROM trades WHERE user_id = ?"), (current_user["id"],))
        total_trades = cursor.fetchone()[0]
        
        cursor.execute(param("SELECT COUNT(*) FROM trades WHERE user_id = ? AND status = 'pending'"), (current_user["id"],))
        pending_trades = cursor.fetchone()[0]
        
        cursor.execute(param("SELECT COUNT(*) FROM trades WHERE user_id = ? AND status = 'completed'"), (current_user["id"],))
        completed_trades = cursor.fetchone()[0]
        
        return {
            "success": True,
            "stats": {
                "total_trades": total_trades,
                "pending_trades": pending_trades,
                "completed_trades": completed_trades
            }
        }
    finally:
        release_db_connection(conn)


# ============ USER PAYMENT METHODS ROUTES ============

@app.post("/api/user/payment-methods")
async def create_payment_method(payment_method: PaymentMethodCreate, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Check if this is the first payment method
        cursor.execute(param("SELECT COUNT(*) FROM user_payment_methods WHERE user_id = ?"), (current_user["id"],))
        count = cursor.fetchone()[0]
        is_default = True if count == 0 else False
        
        cursor.execute(param("""
            INSERT INTO user_payment_methods (user_id, bank_name, account_number, account_name, is_default)
            VALUES (?, ?, ?, ?, ?)
        """), (current_user["id"], payment_method.bank_name, payment_method.account_number, payment_method.account_name, is_default))
        
        conn.commit()
        return {"success": True, "message": "Payment method added successfully"}
    except Exception as e:
        conn.rollback()
        logger.error(f"Payment method creation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to add payment method")
    finally:
        release_db_connection(conn)


@app.get("/api/user/payment-methods")
async def get_payment_methods(current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(param("""
            SELECT id, bank_name, account_number, account_name, is_default, created_at
            FROM user_payment_methods
            WHERE user_id = ?
            ORDER BY is_default DESC, created_at DESC
        """), (current_user["id"],))
        
        methods = cursor.fetchall()
        
        return {
            "success": True,
            "payment_methods": [
                {
                    "id": m[0],
                    "bank_name": m[1],
                    "account_number": m[2],
                    "account_name": m[3],
                    "is_default": bool(m[4]),
                    "created_at": str(m[5]) if m[5] else None
                }
                for m in methods
            ]
        }
    finally:
        release_db_connection(conn)


@app.delete("/api/user/payment-methods/{method_id}")
async def delete_payment_method(method_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(param("""
            DELETE FROM user_payment_methods
            WHERE id = ? AND user_id = ?
        """), (method_id, current_user["id"]))
        
        conn.commit()
        return {"success": True, "message": "Payment method deleted"}
    except Exception as e:
        conn.rollback()
        logger.error(f"Payment method deletion error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete payment method")
    finally:
        release_db_connection(conn)


# ============ SUPPORT ROUTES ============

@app.post("/api/support/tickets")
async def create_ticket(ticket: SupportTicketCreate, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        if IS_POSTGRES:
            cursor.execute("""
                INSERT INTO support_tickets (user_id, subject, message, status)
                VALUES (%s, %s, %s, 'open')
                RETURNING id, created_at
            """, (current_user["id"], ticket.subject, ticket.message))
            result = cursor.fetchone()
            ticket_id = result[0]
        else:
            cursor.execute("""
                INSERT INTO support_tickets (user_id, subject, message, status)
                VALUES (?, ?, ?, 'open')
            """, (current_user["id"], ticket.subject, ticket.message))
            ticket_id = cursor.lastrowid
        
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
        cursor.execute(param("""
            SELECT id, subject, message, status, admin_response, created_at, updated_at
            FROM support_tickets
            WHERE user_id = ?
            ORDER BY created_at DESC
        """), (current_user["id"],))
        
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
                    "created_at": str(t[5]) if t[5] else None,
                    "updated_at": str(t[6]) if t[6] else None
                }
                for t in tickets
            ]
        }
    finally:
        release_db_connection(conn)


@app.get("/api/support/tickets/{ticket_id}")
async def get_ticket_details(ticket_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        cursor.execute(param("""
            SELECT id, subject, message, status, created_at, updated_at
            FROM support_tickets
            WHERE id = ? AND user_id = ?
        """), (ticket_id, current_user["id"]))
        
        ticket = cursor.fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Get replies
        cursor.execute(param("""
            SELECT sr.id, sr.message, sr.is_admin, sr.created_at, u.firstname, u.lastname
            FROM support_ticket_replies sr
            JOIN users u ON sr.user_id = u.id
            WHERE sr.ticket_id = ?
            ORDER BY sr.created_at ASC
        """), (ticket_id,))
        
        replies = cursor.fetchall()
        
        return {
            "success": True,
            "ticket": {
                "id": ticket[0],
                "subject": ticket[1],
                "message": ticket[2],
                "status": ticket[3],
                "created_at": str(ticket[4]) if ticket[4] else None,
                "updated_at": str(ticket[5]) if ticket[5] else None
            },
            "replies": [
                {
                    "id": r[0],
                    "message": r[1],
                    "is_admin": bool(r[2]),
                    "created_at": str(r[3]) if r[3] else None,
                    "author_name": f"{r[4]} {r[5]}"
                }
                for r in replies
            ]
        }
    finally:
        release_db_connection(conn)


@app.post("/api/support/tickets/{ticket_id}/reply")
async def reply_to_ticket(ticket_id: int, reply: TicketReplyCreate, current_user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Verify ticket exists and belongs to user or is admin/staff
        cursor.execute(param("SELECT user_id FROM support_tickets WHERE id = ?"), (ticket_id,))
        ticket = cursor.fetchone()
        
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Allow ticket owner, admin, or staff to reply
        if ticket[0] != current_user["id"] and current_user["role"] not in ["admin", "staff"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        is_admin = current_user["role"] in ["admin", "staff"]
        
        cursor.execute(param("""
            INSERT INTO support_ticket_replies (ticket_id, user_id, message, is_admin)
            VALUES (?, ?, ?, ?)
        """), (ticket_id, current_user["id"], reply.message, is_admin))
        
        cursor.execute(param("UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?"), (ticket_id,))
        
        conn.commit()
        
        return {"success": True, "message": "Reply added successfully"}
    except HTTPException as e:
        conn.rollback()
        raise e
    except Exception as e:
        conn.rollback()
        logger.error(f"Ticket reply error: {e}")
        raise HTTPException(status_code=500, detail="Failed to add reply")
    finally:
        release_db_connection(conn)


# ============ ADMIN ROUTES (Admin Only) ============

@app.get("/api/admin/stats")
async def admin_get_stats(staff_user: dict = Depends(require_admin_or_staff)):
    """Get platform stats - accessible by admin and staff"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Staff gets limited stats (no user count)
        is_admin = staff_user["role"] == "admin"
        
        cursor.execute("SELECT COUNT(*) FROM trades")
        total_trades = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM trades WHERE status = 'pending'")
        pending_trades = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM trades WHERE status = 'completed'")
        completed_trades = cursor.fetchone()[0]
        
        stats = {
            "total_trades": total_trades,
            "pending_trades": pending_trades,
            "completed_trades": completed_trades
        }
        
        # Only admin sees total users
        if is_admin:
            cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'user'")
            stats["total_users"] = cursor.fetchone()[0]
        else:
            stats["total_users"] = None  # Hidden for staff
        
        return {
            "success": True,
            "stats": stats
        }
    finally:
        release_db_connection(conn)


@app.get("/api/admin/trades")
async def admin_get_trades(status: Optional[str] = None, staff_user: dict = Depends(require_admin_or_staff)):
    """Get trades - accessible by admin and staff with different data exposure"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        is_admin = staff_user["role"] == "admin"
        
        if status:
            cursor.execute(param("""
                SELECT t.id, t.user_id, u.email, u.firstname, u.lastname, t.trade_type, t.crypto_symbol,
                       t.amount, t.rate_used, t.total_ngn, t.status, t.created_at, t.completed_at,
                       t.user_wallet_address, t.user_bank_account_id, t.platform_payment_details
                FROM trades t
                JOIN users u ON t.user_id = u.id
                WHERE t.status = ?
                ORDER BY t.created_at DESC
            """), (status,))
        else:
            cursor.execute("""
                SELECT t.id, t.user_id, u.email, u.firstname, u.lastname, t.trade_type, t.crypto_symbol,
                       t.amount, t.rate_used, t.total_ngn, t.status, t.created_at, t.completed_at,
                       t.user_wallet_address, t.user_bank_account_id, t.platform_payment_details
                FROM trades t
                JOIN users u ON t.user_id = u.id
                ORDER BY t.created_at DESC
            """)
        
        trades = cursor.fetchall()
        
        result = []
        for t in trades:
            trade_data = {
                "id": t[0],
                "user_id": t[1] if is_admin else None,  # Only admin sees user_id
                "user_email": t[2] if is_admin else None,  # Only admin sees email
                "user_name": f"{t[3]} {t[4]}",  # Staff can see name for operations
                "trade_type": t[5],
                "crypto_symbol": t[6],
                "amount": float(t[7]),
                "rate_used": float(t[8]),
                "total_ngn": float(t[9]),
                "status": t[10],
                "created_at": str(t[11]) if t[11] else None,
                "completed_at": str(t[12]) if t[12] else None,
                "user_wallet_address": None,
                "user_bank_account": None,
                "platform_payment_details": None
            }
            
            # Parse platform payment details
            if t[15]:
                try:
                    trade_data["platform_payment_details"] = json.loads(t[15])
                except:
                    pass
            
            # For SELL trades: show ONLY the bank account tied to this trade (staff and admin)
            if t[5] == "sell" and t[14]:
                cursor.execute(param("""
                    SELECT bank_name, account_number, account_name
                    FROM user_payment_methods WHERE id = ?
                """), (t[14],))
                bank = cursor.fetchone()
                if bank:
                    trade_data["user_bank_account"] = {
                        "bank_name": bank[0],
                        "account_number": bank[1],
                        "account_name": bank[2]
                    }
            
            # For BUY trades: show ONLY the wallet address tied to this trade (staff and admin)
            if t[5] == "buy" and t[13]:
                trade_data["user_wallet_address"] = t[13]
            
            result.append(trade_data)
        
        return {
            "success": True,
            "trades": result
        }
    finally:
        release_db_connection(conn)


@app.put("/api/admin/trades/{trade_id}/approve")
async def admin_approve_trade(trade_id: int, staff_user: dict = Depends(require_admin_or_staff)):
    """Approve trade - accessible by admin and staff"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        if IS_POSTGRES:
            cursor.execute("""
                UPDATE trades
                SET status = 'completed', completed_at = CURRENT_TIMESTAMP
                WHERE id = %s AND status = 'pending'
                RETURNING id
            """, (trade_id,))
        else:
            cursor.execute("""
                UPDATE trades
                SET status = 'completed', completed_at = CURRENT_TIMESTAMP
                WHERE id = ? AND status = 'pending'
            """, (trade_id,))
            cursor.execute(param("SELECT id FROM trades WHERE id = ? AND status = 'completed'"), (trade_id,))
        
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Trade not found or already processed")
        
        conn.commit()
        
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
async def admin_cancel_trade(trade_id: int, staff_user: dict = Depends(require_admin_or_staff)):
    """Cancel trade - accessible by admin and staff"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        if IS_POSTGRES:
            cursor.execute("""
                UPDATE trades
                SET status = 'cancelled'
                WHERE id = %s AND status = 'pending'
                RETURNING id
            """, (trade_id,))
        else:
            cursor.execute("""
                UPDATE trades
                SET status = 'cancelled'
                WHERE id = ? AND status = 'pending'
            """, (trade_id,))
            cursor.execute(param("SELECT id FROM trades WHERE id = ? AND status = 'cancelled'"), (trade_id,))
        
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
    """Update rates - ADMIN ONLY"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(param("""
            UPDATE crypto_rates
            SET buy_rate = ?, sell_rate = ?, updated_at = CURRENT_TIMESTAMP, updated_by_admin_id = ?
            WHERE crypto_symbol = ?
        """), (rate.buy_rate, rate.sell_rate, admin["id"], rate.crypto_symbol))
        
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
    """Get all users with full details - ADMIN ONLY"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, email, firstname, lastname, username, phone, role, is_active, created_at
            FROM users
            ORDER BY created_at DESC
        """)
        
        users = cursor.fetchall()
        
        result = []
        for u in users:
            user_data = {
                "id": u[0],
                "email": u[1],
                "firstname": u[2],
                "lastname": u[3],
                "username": u[4],
                "phone": u[5],
                "role": u[6],
                "is_active": bool(u[7]),
                "created_at": str(u[8]) if u[8] else None,
                "bank_accounts": []
            }
            
            # Get user's bank accounts - full access for admin
            cursor.execute(param("""
                SELECT id, bank_name, account_number, account_name, is_default
                FROM user_payment_methods WHERE user_id = ?
            """), (u[0],))
            banks = cursor.fetchall()
            user_data["bank_accounts"] = [
                {
                    "id": b[0],
                    "bank_name": b[1],
                    "account_number": b[2],
                    "account_name": b[3],
                    "is_default": bool(b[4])
                }
                for b in banks
            ]
            
            result.append(user_data)
        
        return {
            "success": True,
            "users": result
        }
    finally:
        release_db_connection(conn)


@app.get("/api/admin/users/{user_id}/bank-accounts")
async def admin_get_user_bank_accounts(user_id: int, admin: dict = Depends(require_admin)):
    """Get user bank accounts - ADMIN ONLY"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(param("""
            SELECT id, bank_name, account_number, account_name, is_default, created_at
            FROM user_payment_methods WHERE user_id = ?
            ORDER BY is_default DESC, created_at DESC
        """), (user_id,))
        
        banks = cursor.fetchall()
        
        return {
            "success": True,
            "bank_accounts": [
                {
                    "id": b[0],
                    "bank_name": b[1],
                    "account_number": b[2],
                    "account_name": b[3],
                    "is_default": bool(b[4]),
                    "created_at": str(b[5]) if b[5] else None
                }
                for b in banks
            ]
        }
    finally:
        release_db_connection(conn)


@app.get("/api/admin/tickets")
async def admin_get_tickets(staff_user: dict = Depends(require_admin_or_staff)):
    """Get all support tickets - accessible by admin and staff with different data exposure"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        is_admin = staff_user["role"] == "admin"
        
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
                    "user_id": t[1] if is_admin else None,  # Only admin sees user_id
                    "user_email": t[2] if is_admin else None,  # Only admin sees email
                    "user_name": f"{t[3]} {t[4]}",  # Staff can see name for operations
                    "subject": t[5],
                    "message": t[6],
                    "status": t[7],
                    "admin_response": t[8],
                    "created_at": str(t[9]) if t[9] else None
                }
                for t in tickets
            ]
        }
    finally:
        release_db_connection(conn)


@app.get("/api/admin/tickets/{ticket_id}")
async def admin_get_ticket_details(ticket_id: int, staff_user: dict = Depends(require_admin_or_staff)):
    """Get ticket details - accessible by admin and staff"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        is_admin = staff_user["role"] == "admin"
        
        cursor.execute(param("""
            SELECT st.id, st.subject, st.message, st.status, st.created_at, st.updated_at,
                   u.firstname, u.lastname, u.email
            FROM support_tickets st
            JOIN users u ON st.user_id = u.id
            WHERE st.id = ?
        """), (ticket_id,))
        
        ticket = cursor.fetchone()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        cursor.execute(param("""
            SELECT sr.id, sr.message, sr.is_admin, sr.created_at, u.firstname, u.lastname
            FROM support_ticket_replies sr
            JOIN users u ON sr.user_id = u.id
            WHERE sr.ticket_id = ?
            ORDER BY sr.created_at ASC
        """), (ticket_id,))
        
        replies = cursor.fetchall()
        
        return {
            "success": True,
            "ticket": {
                "id": ticket[0],
                "subject": ticket[1],
                "message": ticket[2],
                "status": ticket[3],
                "created_at": str(ticket[4]) if ticket[4] else None,
                "updated_at": str(ticket[5]) if ticket[5] else None,
                "user_name": f"{ticket[6]} {ticket[7]}",
                "user_email": ticket[8] if is_admin else None  # Only admin sees email
            },
            "replies": [
                {
                    "id": r[0],
                    "message": r[1],
                    "is_admin": bool(r[2]),
                    "created_at": str(r[3]) if r[3] else None,
                    "author_name": f"{r[4]} {r[5]}"
                }
                for r in replies
            ]
        }
    finally:
        release_db_connection(conn)


@app.put("/api/admin/tickets/{ticket_id}/close")
async def admin_close_ticket(ticket_id: int, staff_user: dict = Depends(require_admin_or_staff)):
    """Close ticket - accessible by admin and staff"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(param("UPDATE support_tickets SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?"), (ticket_id,))
        
        conn.commit()
        return {"success": True, "message": "Ticket closed"}
    except Exception as e:
        conn.rollback()
        logger.error(f"Ticket close error: {e}")
        raise HTTPException(status_code=500, detail="Failed to close ticket")
    finally:
        release_db_connection(conn)


# ============ HEALTH CHECK ============

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "P2P Crypto Trading API", "database": "PostgreSQL" if IS_POSTGRES else "SQLite"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
