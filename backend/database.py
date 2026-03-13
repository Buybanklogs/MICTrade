"""
Database module for P2P Crypto Trading Platform
Supports both SQLite (local development) and PostgreSQL (production/Railway)
"""
import os
from dotenv import load_dotenv
import logging
import json

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./p2p_crypto.db')

# Determine database type
IS_POSTGRES = DATABASE_URL.startswith('postgresql') or DATABASE_URL.startswith('postgres')
IS_SQLITE = DATABASE_URL.startswith('sqlite')

# Database-specific imports
if IS_POSTGRES:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    from psycopg2.pool import SimpleConnectionPool
    pool = None
else:
    import sqlite3

# Parameter placeholder based on database type
PARAM = "%s" if IS_POSTGRES else "?"


def get_db_pool():
    """Get PostgreSQL connection pool"""
    if IS_POSTGRES:
        global pool
        if pool is None:
            # Handle Railway's DATABASE_URL format
            db_url = DATABASE_URL
            if db_url.startswith('postgres://'):
                db_url = db_url.replace('postgres://', 'postgresql://', 1)
            pool = SimpleConnectionPool(1, 20, db_url)
        return pool
    return None


def get_db_connection():
    """Get a database connection"""
    try:
        if IS_POSTGRES:
            conn_pool = get_db_pool()
            conn = conn_pool.getconn()
            return conn
        else:
            db_path = DATABASE_URL.replace('sqlite:///', '')
            conn = sqlite3.connect(db_path, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise


def release_db_connection(conn):
    """Return connection to the pool or close it"""
    if conn:
        try:
            if IS_POSTGRES:
                get_db_pool().putconn(conn)
            else:
                conn.close()
        except Exception as e:
            logger.error(f"Error releasing connection: {e}")


def execute_query(cursor, query, params=None):
    """Execute query with proper parameter substitution for the database type"""
    if IS_POSTGRES:
        # PostgreSQL uses %s for parameters
        query = query.replace('?', '%s')
    
    if params:
        cursor.execute(query, params)
    else:
        cursor.execute(query)


def init_database():
    """Initialize database tables - PostgreSQL and SQLite compatible"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if IS_POSTGRES:
            # PostgreSQL schema
            _init_postgres_schema(cursor)
        else:
            # SQLite schema
            _init_sqlite_schema(cursor)
        
        # Seed data
        _seed_initial_data(cursor, conn)
        
        conn.commit()
        logger.info(f"Database initialized successfully (PostgreSQL: {IS_POSTGRES})")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            release_db_connection(conn)


def _init_postgres_schema(cursor):
    """Initialize PostgreSQL schema"""
    
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            firstname VARCHAR(100) NOT NULL,
            lastname VARCHAR(100) NOT NULL,
            username VARCHAR(100) UNIQUE NOT NULL,
            phone VARCHAR(20) NOT NULL,
            date_of_birth DATE NOT NULL,
            role VARCHAR(20) DEFAULT 'user',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # User payment methods table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_payment_methods (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            bank_name VARCHAR(100) NOT NULL,
            account_number VARCHAR(50) NOT NULL,
            account_name VARCHAR(100) NOT NULL,
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Crypto rates table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS crypto_rates (
            id SERIAL PRIMARY KEY,
            crypto_symbol VARCHAR(10) UNIQUE NOT NULL,
            crypto_name VARCHAR(50) NOT NULL,
            buy_rate DECIMAL(20, 2) NOT NULL,
            sell_rate DECIMAL(20, 2) NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_by_admin_id INTEGER
        )
    """)
    
    # Trades table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trades (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            trade_type VARCHAR(10) NOT NULL,
            crypto_symbol VARCHAR(10) NOT NULL,
            amount DECIMAL(20, 8) NOT NULL,
            rate_used DECIMAL(20, 2) NOT NULL,
            total_ngn DECIMAL(20, 2) NOT NULL,
            user_wallet_address TEXT,
            user_bank_account_id INTEGER REFERENCES user_payment_methods(id),
            platform_payment_details TEXT,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP
        )
    """)
    
    # Payment settings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payment_settings (
            id SERIAL PRIMARY KEY,
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
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            subject VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'open',
            admin_response TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Support ticket replies table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS support_ticket_replies (
            id SERIAL PRIMARY KEY,
            ticket_id INTEGER NOT NULL REFERENCES support_tickets(id),
            user_id INTEGER REFERENCES users(id),
            message TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)


def _init_sqlite_schema(cursor):
    """Initialize SQLite schema"""
    
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
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
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


def _seed_initial_data(cursor, conn):
    """Seed initial data for crypto rates, payment settings, and admin user"""
    
    # Crypto rates data
    cryptos = [
        ('BTC', 'Bitcoin', 45000000.00, 44000000.00),
        ('ETH', 'Ethereum', 2500000.00, 2400000.00),
        ('USDT', 'Tether', 1650.00, 1600.00),
        ('BNB', 'BNB', 350000.00, 340000.00),
        ('SOL', 'Solana', 120000.00, 115000.00),
        ('USDC', 'USD Coin', 1650.00, 1600.00),
        ('TRX', 'TRON', 220.00, 210.00),
        ('XRP', 'XRP', 850.00, 820.00),
        ('ADA', 'Cardano', 550.00, 530.00),
        ('LTC', 'Litecoin', 150000.00, 145000.00),
        ('BCH', 'Bitcoin Cash', 250000.00, 240000.00),
        ('TON', 'Toncoin', 3500.00, 3400.00)
    ]
    
    for crypto in cryptos:
        if IS_POSTGRES:
            cursor.execute("""
                INSERT INTO crypto_rates (crypto_symbol, crypto_name, buy_rate, sell_rate)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (crypto_symbol) DO NOTHING
            """, crypto)
        else:
            cursor.execute("""
                INSERT OR IGNORE INTO crypto_rates (crypto_symbol, crypto_name, buy_rate, sell_rate)
                VALUES (?, ?, ?, ?)
            """, crypto)
    
    # Platform wallet addresses
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
    
    # Check if payment settings exists
    if IS_POSTGRES:
        cursor.execute("SELECT id FROM payment_settings LIMIT 1")
    else:
        cursor.execute("SELECT id FROM payment_settings LIMIT 1")
    
    if not cursor.fetchone():
        if IS_POSTGRES:
            cursor.execute("""
                INSERT INTO payment_settings (bank_name, account_number, account_name, wallet_addresses)
                VALUES (%s, %s, %s, %s)
            """, ('First Bank of Nigeria', '1234567890', 'MIC Trades Limited', json.dumps(wallet_addresses)))
        else:
            cursor.execute("""
                INSERT INTO payment_settings (bank_name, account_number, account_name, wallet_addresses)
                VALUES (?, ?, ?, ?)
            """, ('First Bank of Nigeria', '1234567890', 'MIC Trades Limited', json.dumps(wallet_addresses)))
    
    # Create default admin user
    from auth import get_password_hash
    admin_password = get_password_hash("admin123")
    
    # Check if admin exists
    if IS_POSTGRES:
        cursor.execute("SELECT id FROM users WHERE email = %s", ('admin@mictrades.com',))
    else:
        cursor.execute("SELECT id FROM users WHERE email = ?", ('admin@mictrades.com',))
    
    if not cursor.fetchone():
        if IS_POSTGRES:
            cursor.execute("""
                INSERT INTO users (email, password_hash, firstname, lastname, username, phone, date_of_birth, role)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, ('admin@mictrades.com', admin_password, 'Admin', 'User', 'admin', '1234567890', '1990-01-01', 'admin'))
        else:
            cursor.execute("""
                INSERT INTO users (email, password_hash, firstname, lastname, username, phone, date_of_birth, role)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, ('admin@mictrades.com', admin_password, 'Admin', 'User', 'admin', '1234567890', '1990-01-01', 'admin'))
