
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { auth, user } from '../../lib/api';
import MobileNav from '../../components/MobileNav';

const formatCurrency = (value) => {
  const num = Number(value || 0);
  if (num >= 1_000_000_000_000) return `$${(num / 1_000_000_000_000).toFixed(2)}T`;
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${num.toLocaleString()}`;
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const UserDashboard = ({ currentUser }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(currentUser || null);
  const [stats, setStats] = useState({
    total_trades: 0,
    pending_trades: 0,
    completed_trades: 0,
  });
  const [topCryptos, setTopCryptos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await auth.getMe();
      setProfile(response.data);
    } catch (error) {
      navigate('/signin');
      throw error;
    }
  }, [navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await user.getStats();
      setStats(
        response.data?.stats || {
          total_trades: 0,
          pending_trades: 0,
          completed_trades: 0,
        }
      );
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
    }
  }, []);

  const fetchTopCryptos = useCallback(async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch top cryptocurrencies');
      }

      const coins = await response.json();
      setTopCryptos(Array.isArray(coins) ? coins : []);
    } catch (error) {
      toast.error('Failed to fetch top cryptocurrencies');
      setTopCryptos([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);

        if (!currentUser) {
          await fetchProfile();
        } else if (mounted) {
          setProfile(currentUser);
        }

        await Promise.all([fetchStats(), fetchTopCryptos()]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [currentUser, fetchProfile, fetchStats, fetchTopCryptos]);

  const handleLogout = async () => {
    try {
      await auth.logout();
      toast.success('Logged out successfully');
      navigate('/signin');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const statCards = [
    {
      title: 'Total Trades',
      value: stats.total_trades || 0,
      icon: LayoutDashboard,
      accent: 'from-indigo-600 to-blue-500',
    },
    {
      title: 'Pending Trades',
      value: stats.pending_trades || 0,
      icon: TrendingUp,
      accent: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Completed',
      value: stats.completed_trades || 0,
      icon: CheckCircle,
      accent: 'from-emerald-500 to-green-600',
    },
  ];

  const desktopLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, active: true },
    { to: '/trade', label: 'Trade', icon: TrendingUp },
    { to: '/markets', label: 'Markets', icon: TrendingUp },
    { to: '/history', label: 'History', icon: History },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/support', label: 'Support', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <MobileNav />

      <div className="flex">
        <aside className="hidden lg:flex w-60 min-h-screen flex-col border-r border-slate-200 bg-white px-5 py-8">
          <div className="mb-10">
            <div className="text-2xl font-black tracking-tight text-slate-900">MIC Trades</div>
            <p className="mt-1 text-sm text-slate-500">User Dashboard</p>
          </div>

          <nav className="space-y-2">
            {desktopLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    link.active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

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

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 px-6 py-8 text-white shadow-xl sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                  MIC Trades
                </p>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Dashboard</h1>
                <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
                  Buy and sell crypto with confidence, monitor your activity in real time, and keep every transaction within easy reach.
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-blue-50 backdrop-blur">
                Welcome back!{' '}
                <span className="font-semibold">
                  {profile?.firstname || currentUser?.firstname || 'User'}
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                {statCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.title}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-3xl sm:p-5 md:p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 sm:text-sm">{card.title}</p>
                          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:mt-3 sm:text-3xl">
                            {card.value}
                          </p>
                        </div>

                        <div className={`rounded-2xl bg-gradient-to-br ${card.accent} p-2.5 text-white shadow-lg sm:p-3`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>

              <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Quick Actions</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Jump into your most important actions in one click.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Link
                    to="/trade"
                    className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50/40"
                  >
                    <ArrowRight className="h-6 w-6 text-blue-600" />
                    <h3 className="mt-5 text-xl font-bold text-slate-900">Start Trading</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Open a new buy or sell trade with live rates.
                    </p>
                  </Link>

                  <Link
                    to="/markets"
                    className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50/40"
                  >
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                    <h3 className="mt-5 text-xl font-bold text-slate-900">View Markets</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Track live prices, market trends, and top movers.
                    </p>
                  </Link>
                </div>
              </section>

              <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Top Cryptocurrencies
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Live market prices and 24h movement.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
                  {topCryptos.map((crypto) => {
                    const isPositive = Number(crypto.price_change_percentage_24h || 0) >= 0;

                    return (
                      <div
                        key={crypto.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-blue-200 hover:bg-white hover:shadow-sm sm:rounded-3xl sm:p-4 md:p-5"
                      >
                        <div className="flex items-start justify-between gap-1.5 sm:gap-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={crypto.image}
                              alt={crypto.symbol}
                              className="h-8 w-8 rounded-full object-cover sm:h-10 sm:w-10"
                            />
                            <div>
                              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 sm:text-xl">
                                {crypto.symbol}
                              </h3>
                              <p className="text-xs text-slate-500 sm:text-sm">{crypto.name}</p>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold sm:px-2.5 sm:py-0.5 sm:text-xs md:px-3 md:py-1 md:text-sm ${
                              isPositive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isPositive ? '↑' : '↓'}{' '}
                            {Math.abs(Number(crypto.price_change_percentage_24h || 0)).toFixed(2)}%
                          </span>
                        </div>

                        <div className="mt-3 space-y-2 text-[13px] sm:mt-5 sm:space-y-2.5 sm:text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500">Price</span>
                            <span className="font-semibold text-slate-900">
                              {formatCurrency(crypto.current_price)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500">Market Cap</span>
                            <span className="font-semibold text-slate-900">
                              {formatCurrency(crypto.market_cap)}
                            </span>
                          </div>
                        </div>

                        <Link
                          to="/trade"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 transition hover:text-blue-700 sm:mt-5 sm:text-sm sm:gap-2"
                        >
                          Trade
                          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
