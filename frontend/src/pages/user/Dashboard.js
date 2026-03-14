
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Wallet,
  LineChart,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

import { auth, user } from '../../lib/api';
import MobileNav from '../../components/MobileNav';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topCryptos, setTopCryptos] = useState([]);
  const [cryptoLoading, setCryptoLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchProfile(), fetchStats(), fetchTopCryptos()]);
    };
    init();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await auth.getMe();
      setProfile(response.data);
    } catch (error) {
      navigate('/signin');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await user.getStats();
      setStats(response.data.stats);
    } catch (error) {
      toast.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopCryptos = async () => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h',
        },
      });
      setTopCryptos(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch top cryptocurrencies');
    } finally {
      setCryptoLoading(false);
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

  const firstName =
    profile?.firstname ||
    profile?.first_name ||
    (profile?.email ? profile.email.split('@')[0] : 'User');

  const statCards = [
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
      icon: CheckCircle2,
      accent: 'from-emerald-500 to-green-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <MobileNav />

      <div className="flex">
        <aside className="hidden lg:flex w-72 min-h-screen flex-col border-r border-slate-200 bg-white px-6 py-8">
          <div className="mb-10">
            <div className="text-2xl font-black tracking-tight text-slate-900">MIC Trades</div>
            <p className="mt-1 text-sm text-slate-500">Trading Dashboard</p>
          </div>

          <nav className="space-y-2">
            <Link
              to="/dashboard"
              className="flex items-center space-x-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/trade"
              className="flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Wallet className="h-5 w-5" />
              <span>P2P Trade</span>
            </Link>

            <Link
              to="/markets"
              className="flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <LineChart className="h-5 w-5" />
              <span>Markets</span>
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
                  MIC Trades
                </p>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Dashboard</h1>

                <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
                  Buy and sell crypto with confidence, monitor your activity in real time, and
                  keep every transaction within easy reach.
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-blue-50 backdrop-blur">
                Welcome back! <span className="font-semibold">{firstName}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

              <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-slate-900">Quick Actions</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Jump into your most important actions in one click.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Link
                    to="/trade"
                    className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <ArrowRight className="h-6 w-6 text-blue-600" />
                    <h3 className="mt-4 text-xl font-bold text-slate-900">Start Trading</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Open a new buy or sell trade with live rates.
                    </p>
                  </Link>

                  <Link
                    to="/markets"
                    className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-blue-50/50"
                  >
                    <LineChart className="h-6 w-6 text-blue-600" />
                    <h3 className="mt-4 text-xl font-bold text-slate-900">View Markets</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Track live prices, market trends, and top movers.
                    </p>
                  </Link>
                </div>
              </section>

              <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-slate-900">Top Cryptocurrencies</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Live market prices and 24h movement.
                  </p>
                </div>

                {cryptoLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {topCryptos.map((crypto) => {
                      const isPositive = (crypto.price_change_percentage_24h || 0) >= 0;
                      return (
                        <div
                          key={crypto.id}
                          className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={crypto.image}
                                alt={crypto.symbol}
                                className="h-11 w-11 rounded-full object-cover ring-1 ring-slate-200"
                              />
                              <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                                  {crypto.symbol}
                                </h3>
                                <p className="text-sm text-slate-500">{crypto.name}</p>
                              </div>
                            </div>

                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                                isPositive
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {isPositive ? '↑' : '↓'}{' '}
                              {Math.abs(crypto.price_change_percentage_24h || 0).toFixed(2)}%
                            </span>
                          </div>

                          <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm text-slate-500">Price</span>
                              <span className="text-lg font-bold text-slate-900">
                                ${crypto.current_price?.toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                              <span className="text-sm text-slate-500">Market Cap</span>
                              <span className="text-lg font-bold text-slate-900">
                                ${(crypto.market_cap / 1e9).toFixed(2)}B
                              </span>
                            </div>
                          </div>

                          <Link
                            to="/trade"
                            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600 transition hover:text-blue-700"
                          >
                            Trade <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
