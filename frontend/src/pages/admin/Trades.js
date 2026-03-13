import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Filter, Eye, ChevronLeft, CreditCard, Wallet, Shield } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { admin, auth } from '../../lib/api';

const AdminTrades = ({ currentUser }) => {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [user, setUser] = useState(currentUser || null);

  useEffect(() => {
    if (!currentUser) {
      fetchUser();
    }
    fetchTrades();
  }, [filter, currentUser]);

  const fetchUser = async () => {
    try {
      const response = await auth.getMe();
      setUser(response.data);
    } catch (error) {
      navigate('/signin');
    }
  };

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
      setSelectedTrade(null);
    } catch (error) {
      toast.error('Failed to approve trade');
    }
  };

  const handleCancel = async (tradeId) => {
    try {
      await admin.cancelTrade(tradeId);
      toast.success('Trade cancelled');
      fetchTrades();
      setSelectedTrade(null);
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

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="mb-8">
          <Link to="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-slate-900">Trade Management</h1>
            {isStaff && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                <Shield className="w-3 h-3 mr-1" />
                Staff View
              </span>
            )}
          </div>
          <p className="text-slate-600">Review and manage all platform trades</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <div className="flex flex-wrap gap-2">
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
                    <th className="text-left px-4 lg:px-6 py-4 text-sm font-medium text-slate-600">Trade ID</th>
                    <th className="text-left px-4 lg:px-6 py-4 text-sm font-medium text-slate-600">User</th>
                    <th className="text-left px-4 lg:px-6 py-4 text-sm font-medium text-slate-600">Type</th>
                    <th className="text-left px-4 lg:px-6 py-4 text-sm font-medium text-slate-600">Crypto</th>
                    <th className="text-left px-4 lg:px-6 py-4 text-sm font-medium text-slate-600">Amount</th>
                    <th className="text-left px-4 lg:px-6 py-4 text-sm font-medium text-slate-600">NGN Total</th>
                    <th className="text-left px-4 lg:px-6 py-4 text-sm font-medium text-slate-600">Status</th>
                    <th className="text-left px-4 lg:px-6 py-4 text-sm font-medium text-slate-600">Date</th>
                    <th className="text-left px-4 lg:px-6 py-4 text-sm font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {trades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-slate-50">
                      <td className="px-4 lg:px-6 py-4 text-sm font-medium text-slate-900">#{trade.id}</td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">{trade.user_name}</div>
                          {/* Only admin sees email */}
                          {isAdmin && trade.user_email && (
                            <div className="text-slate-500">{trade.user_email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${trade.trade_type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {trade.trade_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm font-medium text-slate-900">{trade.crypto_symbol}</td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-slate-900">{trade.amount}</td>
                      <td className="px-4 lg:px-6 py-4 text-sm font-medium text-slate-900">₦{trade.total_ngn.toLocaleString()}</td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                          {trade.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-slate-600">
                        {new Date(trade.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTrade(trade)}
                            data-testid={`view-trade-${trade.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {trade.status === 'pending' && (
                            <>
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
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Trade Details Modal */}
      <Dialog open={!!selectedTrade} onOpenChange={() => setSelectedTrade(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Trade Details #{selectedTrade?.id}</span>
              {isStaff && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                  Staff View
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedTrade && (
            <div className="space-y-6">
              {/* Trade Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm text-slate-600">Trade Type</div>
                  <div className={`text-lg font-bold ${selectedTrade.trade_type === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedTrade.trade_type.toUpperCase()}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm text-slate-600">Status</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTrade.status)}`}>
                    {selectedTrade.status.toUpperCase()}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm text-slate-600">Crypto</div>
                  <div className="text-lg font-bold">{selectedTrade.amount} {selectedTrade.crypto_symbol}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm text-slate-600">Total (NGN)</div>
                  <div className="text-lg font-bold">₦{selectedTrade.total_ngn.toLocaleString()}</div>
                </div>
              </div>

              {/* User Info - Limited for staff */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-600 font-medium mb-2">User Information</div>
                <div className="text-slate-900 font-medium">{selectedTrade.user_name}</div>
                {/* Only admin sees email */}
                {isAdmin && selectedTrade.user_email && (
                  <div className="text-slate-600">{selectedTrade.user_email}</div>
                )}
                {isStaff && (
                  <div className="text-xs text-blue-500 mt-1">
                    Contact details restricted to admin
                  </div>
                )}
              </div>

              {/* Payout Details - For SELL trades: show user's bank account tied to this trade */}
              {selectedTrade.trade_type === 'sell' && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Payout To User (Bank Account for this Trade)</span>
                  </div>
                  {selectedTrade.user_bank_account ? (
                    <div className="bg-white rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-slate-600">Bank Name</div>
                          <div className="font-bold text-slate-900">{selectedTrade.user_bank_account.bank_name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-600">Account Number</div>
                          <div className="font-bold text-slate-900">{selectedTrade.user_bank_account.account_number}</div>
                        </div>
                        <div className="col-span-full">
                          <div className="text-xs text-slate-600">Account Name</div>
                          <div className="font-bold text-slate-900">{selectedTrade.user_bank_account.account_name}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">No bank account provided for this trade</div>
                  )}
                </div>
              )}

              {/* Payout Details - For BUY trades: show user's wallet address tied to this trade */}
              {selectedTrade.trade_type === 'buy' && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Wallet className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-purple-600 font-medium">Payout To User (Wallet Address for this Trade)</span>
                  </div>
                  {selectedTrade.user_wallet_address ? (
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-xs text-slate-600 mb-1">{selectedTrade.crypto_symbol} Wallet Address</div>
                      <div className="font-mono text-sm break-all text-slate-900">{selectedTrade.user_wallet_address}</div>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">No wallet address provided for this trade</div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {selectedTrade.status === 'pending' && (
                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleApprove(selectedTrade.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Trade
                  </Button>
                  <Button
                    onClick={() => handleCancel(selectedTrade.id)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Trade
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTrades;
