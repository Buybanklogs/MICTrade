import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Star, Search, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/input';
import axios from 'axios';

const Markets = () => {
  const [marketData, setMarketData] = useState([]);
  const [globalData, setGlobalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMarketData();
    fetchGlobalData();
    const saved = localStorage.getItem('watchlist');
    if (saved) setWatchlist(JSON.parse(saved));
  }, []);

  const fetchMarketData = async () => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: true,
          price_change_percentage: '24h,7d'
        }
      });
      setMarketData(response.data);
    } catch (error) {
      console.error('Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalData = async () => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/global');
      setGlobalData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch global data');
    }
  };

  const toggleWatchlist = (coinId) => {
    const newWatchlist = watchlist.includes(coinId) ? watchlist.filter(id => id !== coinId) : [...watchlist, coinId];
    setWatchlist(newWatchlist);
    localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
  };

  const renderSparkline = (sparkline) => {
    if (!sparkline) return null;
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min;
    const width = 100;
    const height = 40;
    const points = sparkline.map((value, index) => {
      const x = (index / (sparkline.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    const isPositive = sparkline[sparkline.length - 1] >= sparkline[0];
    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline points={points} fill="none" stroke={isPositive ? '#10b981' : '#ef4444'} strokeWidth="2" />
      </svg>
    );
  };

  const filteredMarkets = marketData.filter(coin => 
    coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Crypto Markets</h1>
          <p className="text-lg text-slate-600">Live cryptocurrency prices and market data</p>
        </div>

        {globalData && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Market Overview</h2>
                <p className="text-sm text-slate-500">Global cryptocurrency statistics</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:grid-cols-2 sm:gap-4 sm:px-6 sm:py-5 md:grid-cols-4">
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-blue-50 p-4 sm:p-5 shadow-sm">
                <div className="text-xs font-medium text-slate-600 sm:text-sm">Market Cap</div>
                <div className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">${(globalData.total_market_cap.usd / 1e12).toFixed(2)}T</div>
              </div>
              <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-white to-purple-50 p-4 sm:p-5 shadow-sm">
                <div className="text-xs font-medium text-slate-600 sm:text-sm">24h Volume</div>
                <div className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">${(globalData.total_volume.usd / 1e9).toFixed(2)}B</div>
              </div>
              <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-white to-orange-50 p-4 sm:p-5 shadow-sm">
                <div className="text-xs font-medium text-slate-600 sm:text-sm">BTC Dominance</div>
                <div className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{globalData.market_cap_percentage.btc.toFixed(1)}%</div>
              </div>
              <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-white to-green-50 p-4 sm:p-5 shadow-sm">
                <div className="text-xs font-medium text-slate-600 sm:text-sm">Active Cryptos</div>
                <div className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{globalData.active_cryptocurrencies.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search cryptocurrencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base bg-white border-slate-300 shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 lg:px-6 py-4 text-sm font-semibold text-slate-700">Watch</th>
                    <th className="text-left px-4 lg:px-6 py-4 text-sm font-semibold text-slate-700">Coin</th>
                    <th className="text-right px-4 lg:px-6 py-4 text-sm font-semibold text-slate-700">Price</th>
                    <th className="text-right px-4 lg:px-6 py-4 text-sm font-semibold text-slate-700">24h %</th>
                    <th className="text-right px-4 lg:px-6 py-4 text-sm font-semibold text-slate-700 hidden md:table-cell">7d %</th>
                    <th className="text-right px-4 lg:px-6 py-4 text-sm font-semibold text-slate-700 hidden lg:table-cell">24h Volume</th>
                    <th className="text-right px-4 lg:px-6 py-4 text-sm font-semibold text-slate-700 hidden lg:table-cell">Market Cap</th>
                    <th className="text-center px-4 lg:px-6 py-4 text-sm font-semibold text-slate-700 hidden xl:table-cell">Last 7 Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredMarkets.map((coin) => (
                    <tr key={coin.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 lg:px-6 py-4">
                        <button onClick={() => toggleWatchlist(coin.id)} className="text-slate-400 hover:text-yellow-500 transition">
                          <Star className={`w-5 h-5 ${watchlist.includes(coin.id) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        </button>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                          <div>
                            <div className="font-semibold text-slate-900">{coin.name}</div>
                            <div className="text-sm text-slate-500">{coin.symbol.toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right font-semibold text-slate-900">${coin.current_price.toLocaleString()}</td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <div className={`inline-flex items-center space-x-1 font-bold ${coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {coin.price_change_percentage_24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span>{Math.abs(coin.price_change_percentage_24h).toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right hidden md:table-cell">
                        <span className={`font-semibold ${coin.price_change_percentage_7d_in_currency >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {coin.price_change_percentage_7d_in_currency?.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right text-slate-700 hidden lg:table-cell">${(coin.total_volume / 1e9).toFixed(2)}B</td>
                      <td className="px-4 lg:px-6 py-4 text-right text-slate-700 hidden lg:table-cell">${(coin.market_cap / 1e9).toFixed(2)}B</td>
                      <td className="px-4 lg:px-6 py-4 hidden xl:table-cell">
                        <div className="flex justify-center">{renderSparkline(coin.sparkline_in_7d?.price)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Markets;
