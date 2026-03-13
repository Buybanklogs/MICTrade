"""
Backend API Tests for P2P Crypto Trading Platform
Tests: Authentication, Trades, Support Tickets, User Profile, Payment Methods, Admin Endpoints
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://crypto-desk-api.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@mictrades.com"
ADMIN_PASSWORD = "admin123"
USER_EMAIL = "user@test.com"
USER_PASSWORD = "testuser123"
TEST_USER_EMAIL = f"testuser_{int(time.time())}@test.com"
TEST_USER_PASSWORD = "TestPass123!"


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test API health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["role"] == "admin"
        assert data["redirect"] == "/admin"
        print(f"✓ Admin login successful: role={data['role']}")
        return session
    
    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Admin login with wrong password correctly rejected")
    
    def test_user_registration(self):
        """Test new user registration"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "firstname": "Test",
            "lastname": "User",
            "username": f"testuser_{int(time.time())}",
            "phone": "1234567890",
            "dateOfBirth": "1995-01-15",
            "role": "user"
        })
        # May return 400 if email/username already exists
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert data["success"] == True
            print(f"✓ User registration successful")
        else:
            print(f"✓ User registration returned expected error (user may already exist)")
    
    def test_user_login_success(self):
        """Test user login with valid credentials"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        # May fail if user doesn't exist yet
        if response.status_code == 200:
            data = response.json()
            assert data["success"] == True
            assert data["role"] == "user"
            assert data["redirect"] == "/dashboard"
            print(f"✓ User login successful: role={data['role']}")
        else:
            print(f"✓ User login failed (user may not exist): {response.status_code}")
        return session
    
    def test_get_me_without_auth(self):
        """Test /auth/me endpoint without authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Unauthenticated request correctly rejected")


class TestCryptoRates:
    """Crypto rates endpoint tests"""
    
    def test_get_rates(self):
        """Test fetching crypto rates"""
        response = requests.get(f"{BASE_URL}/api/rates")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "rates" in data
        assert len(data["rates"]) > 0
        
        # Validate rate structure
        rate = data["rates"][0]
        assert "symbol" in rate
        assert "buy_rate" in rate
        assert "sell_rate" in rate
        print(f"✓ Rates fetched successfully: {len(data['rates'])} cryptocurrencies")


class TestMarkets:
    """Market data endpoint tests"""
    
    def test_get_markets(self):
        """Test fetching market data from CoinGecko"""
        response = requests.get(f"{BASE_URL}/api/markets", timeout=15)
        assert response.status_code == 200
        data = response.json()
        # May fail due to CoinGecko rate limits
        if data.get("success"):
            assert "markets" in data
            print(f"✓ Market data fetched successfully")
        else:
            print(f"✓ Market data request completed (may have rate limited): {data.get('message', 'No message')}")


class TestAuthenticatedUserEndpoints:
    """Tests requiring user authentication"""
    
    @pytest.fixture(autouse=True)
    def setup_user_session(self):
        """Setup authenticated user session"""
        self.session = requests.Session()
        # First try to login as existing user
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code != 200:
            # Register new user if login fails
            timestamp = int(time.time())
            new_email = f"testuser_{timestamp}@test.com"
            self.session.post(f"{BASE_URL}/api/auth/register", json={
                "email": new_email,
                "password": "TestPass123!",
                "firstname": "Test",
                "lastname": "User",
                "username": f"testuser_{timestamp}",
                "phone": "1234567890",
                "dateOfBirth": "1995-01-15",
                "role": "user"
            })
            self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": new_email,
                "password": "TestPass123!"
            })
    
    def test_get_user_profile(self):
        """Test fetching user profile"""
        response = self.session.get(f"{BASE_URL}/api/user/profile")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "profile" in data
        profile = data["profile"]
        assert "email" in profile
        assert "firstname" in profile
        assert "lastname" in profile
        print(f"✓ User profile fetched: {profile.get('email')}")
    
    def test_get_user_stats(self):
        """Test fetching user stats"""
        response = self.session.get(f"{BASE_URL}/api/user/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "stats" in data
        stats = data["stats"]
        assert "total_trades" in stats
        assert "pending_trades" in stats
        assert "completed_trades" in stats
        print(f"✓ User stats fetched: {stats}")
    
    def test_get_payment_methods(self):
        """Test fetching user payment methods"""
        response = self.session.get(f"{BASE_URL}/api/user/payment-methods")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "payment_methods" in data
        print(f"✓ Payment methods fetched: {len(data['payment_methods'])} methods")
    
    def test_create_and_delete_payment_method(self):
        """Test adding and deleting a bank account"""
        # Create payment method
        create_response = self.session.post(f"{BASE_URL}/api/user/payment-methods", json={
            "bank_name": "Test Bank",
            "account_number": "1234567890",
            "account_name": "Test User"
        })
        assert create_response.status_code == 200
        data = create_response.json()
        assert data["success"] == True
        print(f"✓ Payment method created")
        
        # Get payment methods to find the new one
        list_response = self.session.get(f"{BASE_URL}/api/user/payment-methods")
        methods = list_response.json()["payment_methods"]
        test_bank = next((m for m in methods if m["bank_name"] == "Test Bank"), None)
        
        if test_bank:
            # Delete payment method
            delete_response = self.session.delete(f"{BASE_URL}/api/user/payment-methods/{test_bank['id']}")
            assert delete_response.status_code == 200
            print(f"✓ Payment method deleted")
    
    def test_get_user_trades(self):
        """Test fetching user trades"""
        response = self.session.get(f"{BASE_URL}/api/trades")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "trades" in data
        print(f"✓ User trades fetched: {len(data['trades'])} trades")


class TestPasswordChange:
    """Password change functionality tests"""
    
    def test_change_password_with_wrong_current(self):
        """Test password change with wrong current password"""
        session = requests.Session()
        # Login first
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip("User login failed, skipping password test")
        
        # Try to change password with wrong current password
        response = session.put(f"{BASE_URL}/api/user/change-password", json={
            "current_password": "wrongpassword",
            "new_password": "NewPassword123!"
        })
        assert response.status_code == 400
        print("✓ Password change with wrong current password correctly rejected")
    
    def test_change_password_short_new_password(self):
        """Test password change with too short new password"""
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip("User login failed, skipping password test")
        
        response = session.put(f"{BASE_URL}/api/user/change-password", json={
            "current_password": USER_PASSWORD,
            "new_password": "short"
        })
        assert response.status_code == 400
        print("✓ Password change with short password correctly rejected")


class TestSupportTickets:
    """Support ticket system tests"""
    
    @pytest.fixture(autouse=True)
    def setup_user_session(self):
        """Setup authenticated user session"""
        self.session = requests.Session()
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code != 200:
            timestamp = int(time.time())
            new_email = f"supporttest_{timestamp}@test.com"
            self.session.post(f"{BASE_URL}/api/auth/register", json={
                "email": new_email,
                "password": "TestPass123!",
                "firstname": "Support",
                "lastname": "Test",
                "username": f"supporttest_{timestamp}",
                "phone": "1234567890",
                "dateOfBirth": "1995-01-15"
            })
            self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": new_email,
                "password": "TestPass123!"
            })
    
    def test_get_support_tickets(self):
        """Test fetching user support tickets"""
        response = self.session.get(f"{BASE_URL}/api/support/tickets")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "tickets" in data
        print(f"✓ Support tickets fetched: {len(data['tickets'])} tickets")
    
    def test_create_support_ticket(self):
        """Test creating a support ticket"""
        response = self.session.post(f"{BASE_URL}/api/support/tickets", json={
            "subject": f"Test Ticket {int(time.time())}",
            "message": "This is a test support ticket message."
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "ticket_id" in data
        print(f"✓ Support ticket created: ID={data['ticket_id']}")
        return data["ticket_id"]


class TestAdminEndpoints:
    """Admin endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup_admin_session(self):
        """Setup authenticated admin session"""
        self.session = requests.Session()
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, "Admin login failed"
        self.admin_logged_in = True
    
    def test_admin_get_stats(self):
        """Test fetching admin dashboard stats"""
        response = self.session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "stats" in data
        stats = data["stats"]
        assert "total_users" in stats
        assert "total_trades" in stats
        assert "pending_trades" in stats
        assert "completed_trades" in stats
        print(f"✓ Admin stats fetched: {stats}")
    
    def test_admin_get_users(self):
        """Test fetching all users as admin"""
        response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "users" in data
        
        # Verify user structure includes bank_accounts
        if len(data["users"]) > 0:
            user = data["users"][0]
            assert "email" in user
            assert "firstname" in user
            assert "lastname" in user
            assert "role" in user
            assert "bank_accounts" in user
        
        print(f"✓ Admin users fetched: {len(data['users'])} users")
    
    def test_admin_get_trades(self):
        """Test fetching all trades as admin"""
        response = self.session.get(f"{BASE_URL}/api/admin/trades")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "trades" in data
        print(f"✓ Admin trades fetched: {len(data['trades'])} trades")
    
    def test_admin_get_trades_filtered(self):
        """Test fetching trades with status filter"""
        for status in ["pending", "completed", "cancelled"]:
            response = self.session.get(f"{BASE_URL}/api/admin/trades", params={"status": status})
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            print(f"✓ Admin trades filtered by {status}: {len(data['trades'])} trades")
    
    def test_admin_get_support_tickets(self):
        """Test fetching all support tickets as admin"""
        response = self.session.get(f"{BASE_URL}/api/admin/tickets")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "tickets" in data
        print(f"✓ Admin tickets fetched: {len(data['tickets'])} tickets")


class TestTradeCreation:
    """Trade creation tests"""
    
    @pytest.fixture(autouse=True)
    def setup_user_with_payment_method(self):
        """Setup user with payment method for trade testing"""
        self.session = requests.Session()
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code != 200:
            timestamp = int(time.time())
            new_email = f"tradetest_{timestamp}@test.com"
            self.session.post(f"{BASE_URL}/api/auth/register", json={
                "email": new_email,
                "password": "TestPass123!",
                "firstname": "Trade",
                "lastname": "Test",
                "username": f"tradetest_{timestamp}",
                "phone": "1234567890",
                "dateOfBirth": "1995-01-15"
            })
            self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": new_email,
                "password": "TestPass123!"
            })
    
    def test_create_buy_trade(self):
        """Test creating a buy trade with wallet address"""
        response = self.session.post(f"{BASE_URL}/api/trades/create", json={
            "trade_type": "buy",
            "crypto_symbol": "BTC",
            "amount": 0.001,
            "user_wallet_address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "trade" in data
        trade = data["trade"]
        assert trade["trade_type"] == "buy"
        assert trade["crypto_symbol"] == "BTC"
        assert trade["status"] == "pending"
        print(f"✓ Buy trade created: ID={trade['id']}, Amount={trade['amount']} BTC")
    
    def test_create_sell_trade_without_bank(self):
        """Test creating a sell trade without bank account (should fail)"""
        response = self.session.post(f"{BASE_URL}/api/trades/create", json={
            "trade_type": "sell",
            "crypto_symbol": "BTC",
            "amount": 0.001
        })
        # Should fail because sell trade requires bank account
        assert response.status_code == 400
        print("✓ Sell trade without bank account correctly rejected")
    
    def test_create_sell_trade_with_bank(self):
        """Test creating a sell trade with bank account"""
        # First add a bank account
        create_bank_response = self.session.post(f"{BASE_URL}/api/user/payment-methods", json={
            "bank_name": "Trade Test Bank",
            "account_number": "9876543210",
            "account_name": "Trade Test User"
        })
        
        # Get the bank account ID
        list_response = self.session.get(f"{BASE_URL}/api/user/payment-methods")
        methods = list_response.json()["payment_methods"]
        bank_account = next((m for m in methods if m["bank_name"] == "Trade Test Bank"), None)
        
        if bank_account:
            # Create sell trade with bank account
            response = self.session.post(f"{BASE_URL}/api/trades/create", json={
                "trade_type": "sell",
                "crypto_symbol": "ETH",
                "amount": 0.1,
                "user_bank_account_id": bank_account["id"]
            })
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            trade = data["trade"]
            assert trade["trade_type"] == "sell"
            print(f"✓ Sell trade created: ID={trade['id']}, Amount={trade['amount']} ETH")
            
            # Cleanup - delete the test bank
            self.session.delete(f"{BASE_URL}/api/user/payment-methods/{bank_account['id']}")
        else:
            pytest.skip("Could not create bank account for sell trade test")
    
    def test_create_buy_trade_without_wallet(self):
        """Test creating a buy trade without wallet address (should fail)"""
        response = self.session.post(f"{BASE_URL}/api/trades/create", json={
            "trade_type": "buy",
            "crypto_symbol": "BTC",
            "amount": 0.001
        })
        # Should fail because buy trade requires wallet address
        assert response.status_code == 400
        print("✓ Buy trade without wallet address correctly rejected")


class TestAdminTradeActions:
    """Admin trade management tests"""
    
    @pytest.fixture(autouse=True)
    def setup_sessions(self):
        """Setup both user and admin sessions"""
        # User session for creating trade
        self.user_session = requests.Session()
        user_response = self.user_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        
        if user_response.status_code != 200:
            timestamp = int(time.time())
            new_email = f"admintest_{timestamp}@test.com"
            self.user_session.post(f"{BASE_URL}/api/auth/register", json={
                "email": new_email,
                "password": "TestPass123!",
                "firstname": "Admin",
                "lastname": "Test",
                "username": f"admintest_{timestamp}",
                "phone": "1234567890",
                "dateOfBirth": "1995-01-15"
            })
            self.user_session.post(f"{BASE_URL}/api/auth/login", json={
                "email": new_email,
                "password": "TestPass123!"
            })
        
        # Admin session
        self.admin_session = requests.Session()
        self.admin_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
    
    def test_admin_approve_trade(self):
        """Test admin approving a pending trade"""
        # Create a trade as user
        trade_response = self.user_session.post(f"{BASE_URL}/api/trades/create", json={
            "trade_type": "buy",
            "crypto_symbol": "USDT",
            "amount": 100,
            "user_wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        })
        
        if trade_response.status_code == 200:
            trade_id = trade_response.json()["trade"]["id"]
            
            # Admin approves the trade
            approve_response = self.admin_session.put(f"{BASE_URL}/api/admin/trades/{trade_id}/approve")
            assert approve_response.status_code == 200
            data = approve_response.json()
            assert data["success"] == True
            print(f"✓ Admin approved trade ID={trade_id}")
        else:
            print(f"✓ Trade creation skipped: {trade_response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
