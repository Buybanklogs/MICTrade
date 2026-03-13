import os
from dotenv import load_dotenv
import logging
import sqlite3
import json

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./p2p_crypto.db')

# Determine database type
IS_POSTGRES = DATABASE_URL.startswith('postgresql')
IS_SQLITE = DATABASE_URL.startswith('sqlite')

if IS_POSTGRES:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    from psycopg2.pool import SimpleConnectionPool
    pool = None

def get_db_pool():
    if IS_POSTGRES:
        global pool
        if pool is None:
            pool = SimpleConnectionPool(1, 20, DATABASE_URL)
        return pool
    return None

def get_db_connection():
    """Get a database connection"""
    try:
        if IS_POSTGRES:
            conn_pool = get_db_pool()
            return conn_pool.getconn()
        elif IS_SQLITE:
            db_path = DATABASE_URL.replace('sqlite:///', '')
            conn = sqlite3.connect(db_path, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise

def release_db_connection(conn):
    """Return connection to the pool"""
    if conn:
        if IS_POSTGRES:
            get_db_pool().putconn(conn)
        elif IS_SQLITE:
            conn.close()

def init_database():
    """Initialize database tables"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                firstname VARCHAR(100) NOT NULL,
                lastname VARCHAR(100) NOT NULL,
                username VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                date_of_birth DATE NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # User payment methods table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_payment_methods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                bank_name VARCHAR(100) NOT NULL,
                account_number VARCHAR(50) NOT NULL,
                account_name VARCHAR(100) NOT NULL,
                is_default BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Crypto rates table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS crypto_rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                crypto_symbol VARCHAR(10) UNIQUE NOT NULL,
                crypto_name VARCHAR(50) NOT NULL,
                buy_rate DECIMAL(20, 2) NOT NULL,
                sell_rate DECIMAL(20, 2) NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_by_admin_id INTEGER
            )
        """)
        
        # Trades table with wallet address and bank account
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                trade_type VARCHAR(10) NOT NULL,
                crypto_symbol VARCHAR(10) NOT NULL,
                amount DECIMAL(20, 8) NOT NULL,
                rate_used DECIMAL(20, 2) NOT NULL,
                total_ngn DECIMAL(20, 2) NOT NULL,
                user_wallet_address TEXT,
                user_bank_account_id INTEGER,
                platform_payment_details TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (user_bank_account_id) REFERENCES user_payment_methods(id)
            )
        """)
        
        # Platform payment settings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payment_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bank_name VARCHAR(100),
                account_number VARCHAR(50),
                account_name VARCHAR(100),
                wallet_addresses TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Support tickets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS support_tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                subject VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'open',
                admin_response TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Add admin_response column if it doesn't exist (migration for existing DBs)
        try:
            cursor.execute("ALTER TABLE support_tickets ADD COLUMN admin_response TEXT")
        except:
            pass  # Column already exists
        
        # Support ticket replies table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS support_ticket_replies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id INTEGER NOT NULL,
                user_id INTEGER,
                message TEXT NOT NULL,
                is_admin BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES support_tickets(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Insert all 12 supported cryptocurrencies
        cryptos = [
            (1, 'BTC', 'Bitcoin', 45000000.00, 44000000.00),
            (2, 'ETH', 'Ethereum', 2500000.00, 2400000.00),
            (3, 'USDT', 'Tether', 1650.00, 1600.00),
            (4, 'BNB', 'BNB', 350000.00, 340000.00),
            (5, 'SOL', 'Solana', 120000.00, 115000.00),
            (6, 'USDC', 'USD Coin', 1650.00, 1600.00),
            (7, 'TRX', 'TRON', 220.00, 210.00),
            (8, 'XRP', 'XRP', 850.00, 820.00),
            (9, 'ADA', 'Cardano', 550.00, 530.00),
            (10, 'LTC', 'Litecoin', 150000.00, 145000.00),
            (11, 'BCH', 'Bitcoin Cash', 250000.00, 240000.00),
            (12, 'TON', 'Toncoin', 3500.00, 3400.00)
        ]
        
        for crypto in cryptos:
            cursor.execute("""
                INSERT OR IGNORE INTO crypto_rates (id, crypto_symbol, crypto_name, buy_rate, sell_rate)
                VALUES (?, ?, ?, ?, ?)
            """, crypto)
        
        # Insert default platform payment settings
        wallet_addresses = {
            "BTC": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
            "ETH": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
            "USDT": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
            "BNB": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
            "SOL": "7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi",
            "USDC": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
            "TRX": "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf",
            "XRP": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
            "ADA": "addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
            "LTC": "ltc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
            "BCH": "bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a",
            "TON": "EQD-cvR0Nz6XAyRBvbhz-abTrRC6sI5tvHvvpeQraV9UAAD7"
        }
        
        cursor.execute("""
            INSERT OR IGNORE INTO payment_settings (id, bank_name, account_number, account_name, wallet_addresses)
            VALUES (1, ?, ?, ?, ?)
        """, ('First Bank of Nigeria', '1234567890', 'MIC Trades Limited', json.dumps(wallet_addresses)))
        
        # Create default admin user
        from auth import get_password_hash
        admin_password = get_password_hash("admin123")
        cursor.execute("""
            INSERT OR IGNORE INTO users (id, email, password_hash, firstname, lastname, username, phone, date_of_birth, role)
            VALUES (1, 'admin@mictrades.com', ?, 'Admin', 'User', 'admin', '1234567890', '1990-01-01', 'admin')
        """, (admin_password,))
        
        conn.commit()
        logger.info("Database initialized successfully with all 12 cryptocurrencies")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            release_db_connection(conn)
