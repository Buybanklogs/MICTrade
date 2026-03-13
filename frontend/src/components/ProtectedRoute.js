import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../lib/api';

const ProtectedRoute = ({ children, requireAdmin = false, requireAdminOnly = false, allowedRoles = null }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await auth.getMe();
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // Check for specific allowed roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user is staff trying to access admin-only route, redirect to admin dashboard
    if (user.role === 'staff') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // requireAdminOnly - strictly admin, no staff
  if (requireAdminOnly && user.role !== 'admin') {
    if (user.role === 'staff') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // requireAdmin - allows both admin and staff
  if (requireAdmin && !['admin', 'staff'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Clone children and pass user prop
  return React.cloneElement(children, { currentUser: user });
};

export default ProtectedRoute;
