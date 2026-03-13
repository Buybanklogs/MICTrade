import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, History, Settings, HelpCircle, LogOut, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { auth, user, markets } from '../../lib/api';
import MobileNav from '../../components/MobileNav';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topCryptos, setTopCryptos] = useState([]);
  const [cryptoLoading, setCryptoLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchTopCryptos();
  }, []);

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
      const response = await markets.getAll();
      const data = response.data.markets;
      const cryptoArray = [
        { symbol: 'BTC', name: 'Bitcoin', data: data.BTC },
        { symbol: 'ETH', name: 'Ethereum', data: data.ETH },
        { symbol: 'USDT', name: 'Tether', data: data.USDT }
      ];
      setTopCryptos(cryptoArray);
    } catch (error) {
      console.error('Failed to fetch crypto data');
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

  return (
    <div className="min-h-screen bg-slate-50">
      <MobileNav />
      
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <img src="/logo.png" alt="MIC Trades" className="h-10 w-auto" />
            <span className="text-xl font-bold">MIC Trades</span>
          </div>

          <nav className="space-y-2">
            <Link to="/dashboard" className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-600 font-medium">
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link to="/trade" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
              <TrendingUp className="w-5 h-5" />
              <span>P2P Trade</span>
            </Link>
            <Link to="/markets" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
              <TrendingUp className="w-5 h-5" />
              <span>Markets</span>
            </Link>
            <Link to="/history" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
              <History className="w-5 h-5" />
              <span>History</span>
            </Link>
            <Link to="/settings" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
            <Link to="/support" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
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

      <div className="lg:ml-64 p-4 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">Welcome back to MIC Trades</p>
          </div>
          <Link to="/trade" className="mt-4 lg:mt-0">
            <Button className="bg-blue-600 hover:bg-blue-700 w-full lg:w-auto" data-testid="trade-now-btn">
              <TrendingUp className="w-5 h-5 mr-2" />
              Trade Now
            </Button>
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="text-slate-600 text-sm mb-2">Total Trades</div>
                <div className="text-3xl font-bold text-slate-900" data-testid="total-trades">{stats?.total_trades || 0}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="text-slate-600 text-sm mb-2">Pending</div>
                <div className="text-3xl font-bold text-yellow-600" data-testid="pending-trades">{stats?.pending_trades || 0}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="text-slate-600 text-sm mb-2">Completed</div>
                <div className="text-3xl font-bold text-green-600" data-testid="completed-trades">{stats?.completed_trades || 0}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/trade">
                  <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700">
                    Start Trading <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/markets">
                  <Button variant="outline" className="w-full h-12">
                    View Markets
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Top Cryptocurrencies</h2>
            </div>

            {cryptoLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {topCryptos.map((crypto) => (
                  <div key={crypto.symbol} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{crypto.name}</h3>
                        <p className="text-sm text-slate-500">{crypto.symbol}</p>
                      </div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded text-sm font-medium ${
                        crypto.data?.usd_24h_change >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {crypto.data?.usd_24h_change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        <span>{Math.abs(crypto.data?.usd_24h_change || 0).toFixed(2)}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600 text-sm">Price (USD)</span>
                        <span className="font-bold text-slate-900">${crypto.data?.usd?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 text-sm">Price (NGN)</span>
                        <span className="font-bold text-slate-900">₦{crypto.data?.ngn?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 text-sm">Market Cap</span>
                        <span className="text-sm text-slate-700">${(crypto.data?.usd_market_cap / 1e9)?.toFixed(2) || 0}B</span>
                      </div>
                    </div>
                    <Link to="/trade" className="mt-4 block">
                      <Button variant="outline" className="w-full" size="sm">
                        Trade {crypto.symbol}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
