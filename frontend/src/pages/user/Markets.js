import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';
import axios from 'axios';

const Markets = () => {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    fetchMarketData();
    const saved = localStorage.getItem('watchlist');
    if (saved) setWatchlist(JSON.parse(saved));
  }, []);

  const fetchMarketData = async () => {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 20,
            page: 1,
            sparkline: true,
            price_change_percentage: '24h,7d'
          }
        }
      );
      setMarketData(response.data);
    } catch (error) {
      console.error('Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = (coinId) => {
    const newWatchlist = watchlist.includes(coinId)
      ? watchlist.filter(id => id !== coinId)
      : [...watchlist, coinId];
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
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          strokeWidth="2"
        />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Crypto Markets</h1>
          <p className="text-slate-600">Live cryptocurrency prices and market data</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 lg:px-6 py-4 text-sm font-medium text-slate-600">Watch</th>
                    <th className="text-left px-4 lg:px-6 py-4 text-sm font-medium text-slate-600">Coin</th>
                    <th className="text-right px-4 lg:px-6 py-4 text-sm font-medium text-slate-600">Price</th>
                    <th className="text-right px-4 lg:px-6 py-4 text-sm font-medium text-slate-600">24h %</th>
                    <th className="text-right px-4 lg:px-6 py-4 text-sm font-medium text-slate-600 hidden md:table-cell">7d %</th>
                    <th className="text-right px-4 lg:px-6 py-4 text-sm font-medium text-slate-600 hidden lg:table-cell">24h Volume</th>
                    <th className="text-right px-4 lg:px-6 py-4 text-sm font-medium text-slate-600 hidden lg:table-cell">Market Cap</th>
                    <th className="text-center px-4 lg:px-6 py-4 text-sm font-medium text-slate-600 hidden xl:table-cell">Last 7 Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {marketData.map((coin) => (
                    <tr key={coin.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 lg:px-6 py-4">
                        <button
                          onClick={() => toggleWatchlist(coin.id)}
                          className="text-slate-400 hover:text-yellow-500 transition"
                        >
                          <Star
                            className={`w-5 h-5 ${watchlist.includes(coin.id) ? 'fill-yellow-500 text-yellow-500' : ''}`}
                          />
                        </button>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                          <div>
                            <div className="font-medium text-slate-900">{coin.name}</div>
                            <div className="text-sm text-slate-500">{coin.symbol.toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right font-medium text-slate-900">
                        ${coin.current_price.toLocaleString()}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <div className={`flex items-center justify-end space-x-1 ${
                          coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {coin.price_change_percentage_24h >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="font-medium">{Math.abs(coin.price_change_percentage_24h).toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right hidden md:table-cell">
                        <span className={`font-medium ${
                          coin.price_change_percentage_7d_in_currency >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {coin.price_change_percentage_7d_in_currency?.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right text-slate-700 hidden lg:table-cell">
                        ${(coin.total_volume / 1e9).toFixed(2)}B
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right text-slate-700 hidden lg:table-cell">
                        ${(coin.market_cap / 1e9).toFixed(2)}B
                      </td>
                      <td className="px-4 lg:px-6 py-4 hidden xl:table-cell">
                        <div className="flex justify-center">
                          {renderSparkline(coin.sparkline_in_7d?.price)}
                        </div>
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
