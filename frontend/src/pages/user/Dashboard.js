import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, History, Settings, HelpCircle, LogOut, ArrowRight, ArrowUp, ArrowDown, ChevronLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { auth, user } from '../../lib/api';
import axios from 'axios';
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
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h'
        }
      });
      setTopCryptos(response.data);
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
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">MIC Trades</span>
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
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-lg text-slate-600 mt-2">Welcome back to MIC Trades</p>
          </div>

        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="text-slate-600 text-sm font-medium mb-2">Total Trades</div>
                <div className="text-4xl font-bold text-slate-900" data-testid="total-trades">{stats?.total_trades || 0}</div>
              </div>
              <div className="bg-gradient-to-br from-white to-yellow-50 rounded-2xl border border-yellow-200 p-6 shadow-sm">
                <div className="text-slate-600 text-sm font-medium mb-2">Pending</div>
                <div className="text-4xl font-bold text-yellow-600" data-testid="pending-trades">{stats?.pending_trades || 0}</div>
              </div>
              <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl border border-green-200 p-6 shadow-sm">
                <div className="text-slate-600 text-sm font-medium mb-2">Completed</div>
                <div className="text-4xl font-bold text-green-600" data-testid="completed-trades">{stats?.completed_trades || 0}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/trade">
                  <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 shadow">
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

            <div className="mb-6">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Top Cryptocurrencies</h2>
              <p className="text-slate-600">Live market prices and trends</p>
            </div>

            {cryptoLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {topCryptos.map((crypto) => (
                  <div key={crypto.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all hover:border-blue-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <img src={crypto.image} alt={crypto.name} className="w-8 h-8 rounded-full" />
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{crypto.symbol.toUpperCase()}</h3>
                          <p className="text-xs text-slate-500">{crypto.name}</p>
                        </div>
                      </div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-bold ${
                        crypto.price_change_percentage_24h >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {crypto.price_change_percentage_24h >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        <span>{Math.abs(crypto.price_change_percentage_24h || 0).toFixed(2)}%</span>
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div>
                        <span className="text-xs text-slate-500">Price</span>
                        <div className="font-bold text-slate-900">${crypto.current_price?.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Market Cap</span>
                        <div className="text-sm text-slate-700">${(crypto.market_cap / 1e9)?.toFixed(2)}B</div>
                      </div>
                    </div>
                    <Link to="/trade">
                      <Button variant="outline" className="w-full" size="sm">Trade</Button>
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
