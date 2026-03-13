import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  HelpCircle,
  LogOut,
  DollarSign,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { auth, admin } from '../../lib/api';
import MobileNav from '../../components/MobileNav';

const AdminDashboard = ({ currentUser }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(currentUser || null);

  const fetchUser = useCallback(async () => {
    try {
      const response = await auth.getMe();
      setUser(response.data);
    } catch (error) {
      navigate('/signin');
    }
  }, [navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await admin.getStats();
      setStats(response.data.stats);
    } catch (error) {
      toast.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      fetchUser();
    } else {
      setUser(currentUser);
    }
    fetchStats();
  }, [currentUser, fetchUser, fetchStats]);

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

  const statCards = [
    ...(isAdmin
      ? [
          {
            title: 'Total Users',
            value: stats?.total_users || 0,
            icon: Users,
            accent: 'from-blue-600 to-cyan-500',
          },
        ]
      : []),
    {
      title: 'Total Trades',
      value: stats?.total_trades || 0,
      icon: LayoutDashboard,
      accent: 'from-indigo-600 to-blue-500',
    },
    {
      title: 'Pending Trades',
      value: stats?.pending_trades || 0,
      icon: TrendingUp,
      accent: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Completed',
      value: stats?.completed_trades || 0,
      icon: Shield,
      accent: 'from-emerald-500 to-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <MobileNav isAdmin userRole={user?.role || currentUser?.role || 'admin'} />

      <div className="flex">
        <aside className="hidden lg:flex w-72 min-h-screen flex-col border-r border-slate-200 bg-white px-6 py-8">
          <div className="mb-10">
            <div className="text-2xl font-black tracking-tight text-slate-900">MIC Trades</div>
            <p className="mt-1 text-sm text-slate-500">
              {isAdmin ? 'Admin Panel' : 'Staff Panel'}
            </p>
          </div>

          <nav className="space-y-2">
            <Link
              to="/admin"
              className="flex items-center space-x-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/admin/trades"
              className="flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <TrendingUp className="h-5 w-5" />
              <span>Trades</span>
            </Link>

            {isAdmin && (
              <>
                <Link
                  to="/admin/rates"
                  className="flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <DollarSign className="h-5 w-5" />
                  <span>Rates</span>
                </Link>

                <Link
                  to="/admin/users"
                  className="flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <Users className="h-5 w-5" />
                  <span>Users</span>
                </Link>
              </>
            )}

            <Link
              to="/admin/support"
              className="flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <HelpCircle className="h-5 w-5" />
              <span>Support</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 px-6 py-8 text-white shadow-xl sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                  {isAdmin ? 'Admin Console' : 'Staff Console'}
                </p>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  {isAdmin ? 'Admin Dashboard' : 'Staff Dashboard'}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
                  {isAdmin
                    ? 'Monitor platform activity, manage trades, support users, and control operations from one premium workspace.'
                    : 'Manage trades and support tickets with restricted operational access.'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-blue-50 backdrop-blur">
                Signed in as <span className="font-semibold">{user?.firstname || user?.email || '...'}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.title}
                      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">{card.title}</p>
                          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                            {card.value}
                          </p>
                        </div>
                        <div
                          className={`rounded-2xl bg-gradient-to-br ${card.accent} p-3 text-white shadow-lg`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>

              <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Jump directly into the most important operational tasks.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Link
                      to="/admin/trades"
                      className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50/50"
                    >
                      <div className="flex items-center justify-between">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          {stats?.pending_trades || 0} pending
                        </span>
                      </div>
                      <h3 className="mt-4 text-base font-bold text-slate-900">Review Trades</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Approve, cancel, and review trade settlement details.
                      </p>
                    </Link>

                    {isAdmin && (
                      <>
                        <Link
                          to="/admin/rates"
                          className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50/50"
                        >
                          <DollarSign className="h-6 w-6 text-blue-600" />
                          <h3 className="mt-4 text-base font-bold text-slate-900">Update Rates</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Adjust crypto rates and platform pricing controls.
                          </p>
                        </Link>

                        <Link
                          to="/admin/users"
                          className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50/50"
                        >
                          <Users className="h-6 w-6 text-blue-600" />
                          <h3 className="mt-4 text-base font-bold text-slate-900">View Users</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Review users, KYC-adjacent payment details, and activity.
                          </p>
                        </Link>
                      </>
                    )}

                    <Link
                      to="/admin/support"
                      className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50/50"
                    >
                      <HelpCircle className="h-6 w-6 text-blue-600" />
                      <h3 className="mt-4 text-base font-bold text-slate-900">Support Tickets</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Respond to users and close pending support requests.
                      </p>
                    </Link>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Current operational highlights from the platform.
                  </p>

                  <div className="mt-6 space-y-4">
                    {stats?.pending_trades > 0 ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-semibold text-amber-800">
                          {stats.pending_trades} pending trades
                        </p>
                        <p className="mt-1 text-sm text-amber-700">Awaiting approval or review.</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-sm font-semibold text-emerald-800">No pending actions</p>
                        <p className="mt-1 text-sm text-emerald-700">
                          Your trade queue is currently up to date.
                        </p>
                      </div>
                    )}

                    {isStaff && (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                        <p className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                          <Shield className="h-4 w-4" />
                          Staff Access
                        </p>
                        <p className="mt-1 text-sm text-blue-700">
                          You can manage trades and support tickets. User management and rate
                          updates remain restricted to administrators.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
