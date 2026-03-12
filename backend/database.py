import os
from dotenv import load_dotenv
import logging
import sqlite3

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
                bank_account TEXT,
                crypto_wallets TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Crypto rates table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS crypto_rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                crypto_symbol VARCHAR(10) NOT NULL,
                buy_rate DECIMAL(20, 2) NOT NULL,
                sell_rate DECIMAL(20, 2) NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_by_admin_id INTEGER
            )
        """)
        
        # Trades table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                trade_type VARCHAR(10) NOT NULL,
                crypto_symbol VARCHAR(10) NOT NULL,
                amount DECIMAL(20, 8) NOT NULL,
                rate_used DECIMAL(20, 2) NOT NULL,
                total_ngn DECIMAL(20, 2) NOT NULL,
                payment_details TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        """)
        
        # Payment settings table
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
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Insert default crypto rates if not exists
        cursor.execute("""
            INSERT OR IGNORE INTO crypto_rates (id, crypto_symbol, buy_rate, sell_rate)
            VALUES (1, 'BTC', 45000000.00, 44000000.00)
        """)
        
        cursor.execute("""
            INSERT OR IGNORE INTO crypto_rates (id, crypto_symbol, buy_rate, sell_rate)
            VALUES (2, 'ETH', 2500000.00, 2400000.00)
        """)
        
        cursor.execute("""
            INSERT OR IGNORE INTO crypto_rates (id, crypto_symbol, buy_rate, sell_rate)
            VALUES (3, 'USDT', 1650.00, 1600.00)
        """)
        
        # Insert default payment settings
        cursor.execute("""
            INSERT OR IGNORE INTO payment_settings (id, bank_name, account_number, account_name, wallet_addresses)
            VALUES (
                1,
                'First Bank of Nigeria',
                '1234567890',
                'MIC Trades Limited',
                '{"BTC": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", "ETH": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "USDT": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
            )
        """)
        
        # Create default admin user if not exists
        from auth import get_password_hash
        admin_password = get_password_hash("admin123")
        cursor.execute("""
            INSERT OR IGNORE INTO users (id, email, password_hash, firstname, lastname, username, phone, date_of_birth, role)
            VALUES (1, 'admin@mictrades.com', ?, 'Admin', 'User', 'admin', '1234567890', '1990-01-01', 'admin')
        """, (admin_password,))
        
        conn.commit()
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            release_db_connection(conn)
