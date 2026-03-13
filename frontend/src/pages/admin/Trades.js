import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { admin } from '../../lib/api';

const AdminTrades = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTrades();
  }, [filter]);

  const fetchTrades = async () => {
    try {
      const response = await admin.getTrades(filter === 'all' ? null : filter);
      setTrades(response.data.trades);
    } catch (error) {
      toast.error('Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tradeId) => {
    try {
      await admin.approveTrade(tradeId);
      toast.success('Trade approved successfully');
      fetchTrades();
    } catch (error) {
      toast.error('Failed to approve trade');
    }
  };

  const handleCancel = async (tradeId) => {
    try {
      await admin.cancelTrade(tradeId);
      toast.success('Trade cancelled');
      fetchTrades();
    } catch (error) {
      toast.error('Failed to cancel trade');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <Link to="/admin" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">← Back to Dashboard</Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Trade Management</h1>
          <p className="text-slate-600">Review and manage all platform trades</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All Trades
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilter('cancelled')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'cancelled' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Cancelled
              </button>
            </div>
          </div>
        </div>

        {/* Trades List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No trades found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Trade ID</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">User</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Type</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Crypto</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Amount</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">NGN Total</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Date</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {trades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">#{trade.id}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">{trade.user_name}</div>
                          <div className="text-slate-500">{trade.user_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${trade.trade_type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {trade.trade_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{trade.crypto_symbol}</td>
                      <td className="px-6 py-4 text-sm text-slate-900">{trade.amount}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">₦{trade.total_ngn.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                          {trade.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(trade.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {trade.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(trade.id)}
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`approve-trade-${trade.id}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancel(trade.id)}
                              data-testid={`cancel-trade-${trade.id}`}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTrades;