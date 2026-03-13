import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Users, HelpCircle, LogOut, DollarSign, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { auth, admin } from '../../lib/api';
import MobileNav from '../../components/MobileNav';

const AdminDashboard = ({ currentUser }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(currentUser || null);

  useEffect(() => {
    if (!currentUser) {
      fetchUser();
    }
    fetchStats();
  }, [currentUser]);

  const fetchUser = async () => {
    try {
      const response = await auth.getMe();
      setUser(response.data);
    } catch (error) {
      navigate('/signin');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await admin.getStats();
      setStats(response.data.stats);
    } catch (error) {
      toast.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
      toast.success('Logged out successfully');
      navigate('/signin');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  return (
    <div className="min-h-screen bg-slate-50">
      <MobileNav isAdmin userRole={user?.role} />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <img src="/logo.png" alt="MIC Trades" className="h-10 w-auto" />
            <span className="text-xl font-bold">MIC Trades</span>
          </div>

          <div className={`mb-4 px-4 py-2 rounded-lg ${isAdmin ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <div className={`text-xs font-medium flex items-center ${isAdmin ? 'text-blue-600' : 'text-orange-600'}`}>
              <Shield className="w-3 h-3 mr-1" />
              {isAdmin ? 'Admin Panel' : 'Staff Panel'}
            </div>
          </div>

          <nav className="space-y-2">
            <Link to="/admin" className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-600 font-medium">
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link to="/admin/trades" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
              <TrendingUp className="w-5 h-5" />
              <span>Trades</span>
            </Link>
            
            {/* Admin-only links */}
            {isAdmin && (
              <>
                <Link to="/admin/rates" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
                  <DollarSign className="w-5 h-5" />
                  <span>Rates</span>
                </Link>
                <Link to="/admin/users" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
                  <Users className="w-5 h-5" />
                  <span>Users</span>
                </Link>
              </>
            )}
            
            <Link to="/admin/support" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
              <HelpCircle className="w-5 h-5" />
              <span>Support</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 w-full">
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {isAdmin ? 'Admin Dashboard' : 'Staff Dashboard'}
          </h1>
          <p className="text-slate-600">
            {isAdmin ? 'Welcome to MIC Trades Admin Panel' : 'Welcome to MIC Trades Staff Panel'}
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 mb-8 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              {/* Only show Total Users to admin */}
              {isAdmin && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-slate-600 text-sm">Total Users</div>
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900">{stats?.total_users || 0}</div>
                </div>
              )}
              
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-slate-600 text-sm">Total Trades</div>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{stats?.total_trades || 0}</div>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-slate-600 text-sm">Pending Trades</div>
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="text-3xl font-bold text-yellow-600">{stats?.pending_trades || 0}</div>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-slate-600 text-sm">Completed</div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600">{stats?.completed_trades || 0}</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link to="/admin/trades?status=pending" className="block">
                    <button className="w-full text-left px-4 py-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-900 font-medium transition">
                      Review Pending Trades ({stats?.pending_trades || 0})
                    </button>
                  </Link>
                  
                  {/* Admin-only actions */}
                  {isAdmin && (
                    <>
                      <Link to="/admin/rates" className="block">
                        <button className="w-full text-left px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium transition">
                          Update Crypto Rates
                        </button>
                      </Link>
                      <Link to="/admin/users" className="block">
                        <button className="w-full text-left px-4 py-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-900 font-medium transition">
                          View All Users
                        </button>
                      </Link>
                    </>
                  )}
                  
                  <Link to="/admin/support" className="block">
                    <button className="w-full text-left px-4 py-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 font-medium transition">
                      Manage Support Tickets
                    </button>
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {stats?.pending_trades > 0 ? (
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                      <div className="text-sm">
                        <div className="font-medium text-slate-900">{stats.pending_trades} pending trades</div>
                        <div className="text-slate-600">Awaiting approval</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      No pending actions
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Staff Role Notice */}
            {isStaff && (
              <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-orange-900">Staff Access</div>
                    <div className="text-sm text-orange-700">
                      You have access to trade management and support tickets. 
                      User management and rate updates are restricted to administrators.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
