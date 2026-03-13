import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  ChevronLeft,
  CreditCard,
  Eye,
  Filter,
  Shield,
  Wallet,
  XCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import { admin, auth } from '../../lib/api';

const AdminTrades = ({ currentUser }) => {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [user, setUser] = useState(currentUser || null);

  const fetchUser = useCallback(async () => {
    try {
      const response = await auth.getMe();
      setUser(response.data);
    } catch (error) {
      navigate('/signin');
    }
  }, [navigate]);

  const fetchTrades = useCallback(async () => {
    try {
      setLoading(true);
      const response = await admin.getTrades(filter === 'all' ? undefined : filter);
      setTrades(response.data.trades || []);
    } catch (error) {
      toast.error('Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!currentUser) {
      fetchUser();
    } else {
      setUser(currentUser);
    }
    fetchTrades();
  }, [currentUser, fetchUser, fetchTrades]);

  const handleApprove = async (tradeId) => {
    try {
      await admin.approveTrade(tradeId);
      toast.success('Trade approved successfully');
      await fetchTrades();
      setSelectedTrade(null);
    } catch (error) {
      toast.error('Failed to approve trade');
    }
  };

  const handleCancel = async (tradeId) => {
    try {
      await admin.cancelTrade(tradeId);
      toast.success('Trade cancelled');
      await fetchTrades();
      setSelectedTrade(null);
    } catch (error) {
      toast.error('Failed to cancel trade');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  const filters = ['all', 'pending', 'completed', 'cancelled'];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/admin"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                Trade Operations
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                Trade Management
              </h1>
              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                Review, verify, and process all platform trades from a single operations view.
              </p>
            </div>

            {isStaff && (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                <Shield className="h-4 w-4" />
                Staff View
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="mr-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Filter className="h-4 w-4" />
              Filter
            </div>

            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  filter === item
                    ? item === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : item === 'completed'
                      ? 'bg-green-600 text-white'
                      : item === 'cancelled'
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : trades.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-base font-semibold text-slate-600">No trades found</p>
              <p className="mt-1 text-sm text-slate-500">
                Trades matching this filter will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Trade ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Crypto
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        NGN Total
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">
                    {trades.map((trade) => (
                      <tr key={trade.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">#{trade.id}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="font-semibold text-slate-900">{trade.user_name}</p>
                            {isAdmin && trade.user_email && (
                              <p className="text-slate-500">{trade.user_email}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              trade.trade_type === 'buy'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {trade.trade_type?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          {trade.crypto_symbol}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{trade.amount}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          ₦{Number(trade.total_ngn || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                              trade.status
                            )}`}
                          >
                            {trade.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {trade.created_at
                            ? new Date(trade.created_at).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedTrade(trade)}
                              data-testid={`view-trade-${trade.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {trade.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(trade.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                  data-testid={`approve-trade-${trade.id}`}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleCancel(trade.id)}
                                  data-testid={`cancel-trade-${trade.id}`}
                                >
                                  <XCircle className="h-4 w-4" />
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
            </div>
          )}
        </div>

        <Dialog open={!!selectedTrade} onOpenChange={(open) => !open && setSelectedTrade(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                Trade Details #{selectedTrade?.id}
                {isStaff && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    <Shield className="h-3.5 w-3.5" />
                    Staff View
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedTrade && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Trade Type
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {selectedTrade.trade_type?.toUpperCase()}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Status
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {selectedTrade.status?.toUpperCase()}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Crypto
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {selectedTrade.amount} {selectedTrade.crypto_symbol}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Total (NGN)
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      ₦{Number(selectedTrade.total_ngn || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    User Information
                  </h3>
                  <p className="mt-3 text-base font-semibold text-slate-900">
                    {selectedTrade.user_name}
                  </p>
                  {isAdmin && selectedTrade.user_email ? (
                    <p className="mt-1 text-sm text-slate-500">{selectedTrade.user_email}</p>
                  ) : null}
                  {isStaff && (
                    <p className="mt-2 text-sm text-amber-700">
                      Contact details restricted to admin.
                    </p>
                  )}
                </div>

                {selectedTrade.trade_type === 'sell' && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                        Payout To User
                      </h3>
                    </div>

                    {selectedTrade.user_bank_account ? (
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-500">Bank Name</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {selectedTrade.user_bank_account.bank_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500">Account Number</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {selectedTrade.user_bank_account.account_number}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500">Account Name</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {selectedTrade.user_bank_account.account_name}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No bank account provided for this trade.
                      </p>
                    )}
                  </div>
                )}

                {selectedTrade.trade_type === 'buy' && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-blue-600" />
                      <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                        Wallet Address For This Trade
                      </h3>
                    </div>

                    {selectedTrade.user_wallet_address ? (
                      <>
                        <p className="text-xs font-semibold text-slate-500">
                          {selectedTrade.crypto_symbol} Wallet Address
                        </p>
                        <p className="mt-2 break-all rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                          {selectedTrade.user_wallet_address}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No wallet address provided for this trade.
                      </p>
                    )}
                  </div>
                )}

                {selectedTrade.status === 'pending' && (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={() => handleApprove(selectedTrade.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Approve Trade
                    </Button>
                    <Button
                      onClick={() => handleCancel(selectedTrade.id)}
                      variant="destructive"
                      className="flex-1"
                    >
                      Cancel Trade
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminTrades;
