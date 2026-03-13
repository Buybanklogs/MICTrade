import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import ProtectedRoute from './components/ProtectedRoute';
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
          
          {/* User Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/trade" element={<ProtectedRoute><P2PTrade /></ProtectedRoute>} />
          <Route path="/markets" element={<ProtectedRoute><Markets /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
          
          {/* Admin/Staff Protected Routes - Trades and Support accessible to both */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/trades" element={<ProtectedRoute requireAdmin><AdminTrades /></ProtectedRoute>} />
          <Route path="/admin/support" element={<ProtectedRoute requireAdmin><AdminSupport /></ProtectedRoute>} />
          
          {/* Admin Only Routes - Users and Rates */}
          <Route path="/admin/users" element={<ProtectedRoute requireAdminOnly><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/rates" element={<ProtectedRoute requireAdminOnly><AdminRates /></ProtectedRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
