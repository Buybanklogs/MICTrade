import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/user/Dashboard';
import P2PTrade from './pages/user/P2PTrade';
import Markets from './pages/user/Markets';
import History from './pages/user/History';
import Settings from './pages/user/Settings';
import Support from './pages/user/Support';
import AdminDashboard from './pages/admin/Dashboard';
import AdminTrades from './pages/admin/Trades';
import AdminUsers from './pages/admin/Users';
import AdminRates from './pages/admin/Rates';
import AdminSupport from './pages/admin/Support';

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* User Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trade" element={<P2PTrade />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/support" element={<Support />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/trades" element={<AdminTrades />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/rates" element={<AdminRates />} />
          <Route path="/admin/support" element={<AdminSupport />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;