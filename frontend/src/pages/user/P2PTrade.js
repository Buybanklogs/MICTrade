import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { rates, trades, user } from '../../lib/api';

const CRYPTO_LOGOS = {
  BTC: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png',
  ETH: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png',
  USDT: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdt.png',
  BNB: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/bnb.png',
  SOL: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/sol.png',
  USDC: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdc.png',
  TRX: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/trx.png',
  XRP: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/xrp.png',
  ADA: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/ada.png',
  LTC: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/ltc.png',
  BCH: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/bch.png',
  TON: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/ton.png',
};

const ALL_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', image: CRYPTO_LOGOS.BTC },
  { symbol: 'ETH', name: 'Ethereum', image: CRYPTO_LOGOS.ETH },
  { symbol: 'USDT', name: 'Tether', image: CRYPTO_LOGOS.USDT },
  { symbol: 'BNB', name: 'BNB', image: CRYPTO_LOGOS.BNB },
  { symbol: 'SOL', name: 'Solana', image: CRYPTO_LOGOS.SOL },
  { symbol: 'USDC', name: 'USD Coin', image: CRYPTO_LOGOS.USDC },
  { symbol: 'TRX', name: 'TRON', image: CRYPTO_LOGOS.TRX },
  { symbol: 'XRP', name: 'XRP', image: CRYPTO_LOGOS.XRP },
  { symbol: 'ADA', name: 'Cardano', image: CRYPTO_LOGOS.ADA },
  { symbol: 'LTC', name: 'Litecoin', image: CRYPTO_LOGOS.LTC },
  { symbol: 'BCH', name: 'Bitcoin Cash', image: CRYPTO_LOGOS.BCH },
  { symbol: 'TON', name: 'Toncoin', image: CRYPTO_LOGOS.TON },
];

const P2PTrade = () => {
  const [tradeType, setTradeType] = useState('buy');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [showAddBankDialog, setShowAddBankDialog] = useState(false);
  const [cryptoRates, setCryptoRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tradeResult, setTradeResult] = useState(null);
  const [newBankAccount, setNewBankAccount] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
  });

  const fetchRates = useCallback(async () => {
    try {
      const response = await rates.getAll();
      setCryptoRates(response.data.rates || []);
    } catch (error) {
      toast.error('Failed to fetch rates');
    }
  }, []);

  const fetchBankAccounts = useCallback(async () => {
    try {
      const response = await user.getPaymentMethods();
      setBankAccounts(response.data.payment_methods || []);
    } catch (error) {
      console.error('Failed to fetch bank accounts', error);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    fetchBankAccounts();
  }, [fetchRates, fetchBankAccounts]);

  const currentRate = useMemo(() => {
    const rate = cryptoRates.find((r) => r.symbol === selectedCrypto);
    return rate ? (tradeType === 'buy' ? rate.buy_rate : rate.sell_rate) : 0;
  }, [cryptoRates, selectedCrypto, tradeType]);

  const total = useMemo(() => {
    return (parseFloat(amount) || 0) * currentRate;
  }, [amount, currentRate]);

  const selectedBank = useMemo(
    () => bankAccounts.find((b) => b.id === selectedBankAccount) || null,
    [bankAccounts, selectedBankAccount]
  );

  const handleAddBankAccount = async () => {
    if (!newBankAccount.bank_name || !newBankAccount.account_number || !newBankAccount.account_name) {
      toast.error('Please complete all bank account fields');
      return;
    }

    try {
      await user.createPaymentMethod(newBankAccount);
      toast.success('Bank account added successfully');
      setShowAddBankDialog(false);
      setNewBankAccount({ bank_name: '', account_number: '', account_name: '' });
      await fetchBankAccounts();
    } catch (error) {
      toast.error('Failed to add bank account');
    }
  };

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (tradeType === 'buy' && !walletAddress.trim()) {
      toast.error(`Please enter your wallet address to receive ${selectedCrypto}`);
      return;
    }

    if (tradeType === 'sell' && !selectedBankAccount) {
      toast.error('Please select a bank account to receive payment');
      return;
    }

    setLoading(true);
    try {
      const response = await trades.create({
        trade_type: tradeType,
        crypto_symbol: selectedCrypto,
        amount: parseFloat(amount),
        user_wallet_address: tradeType === 'buy' ? walletAddress.trim() : null,
        user_bank_account_id: tradeType === 'sell' ? selectedBankAccount : null,
      });

      setTradeResult(response.data.trade);
      toast.success('Trade created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Trade creation failed');
    } finally {
      setLoading(false);
    }
  };

  const resetTradeFlow = () => {
    setTradeResult(null);
    setAmount('');
    setWalletAddress('');
    setSelectedBankAccount(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">P2P Crypto Trading</h1>

          {!tradeResult ? (
            <div className="mt-8 space-y-8">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setTradeType('buy');
                      setSelectedBankAccount(null);
                      setWalletAddress('');
                    }}
                    className={`h-12 ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    data-testid="buy-button"
                  >
                    Buy Crypto
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      setTradeType('sell');
                      setSelectedBankAccount(null);
                      setWalletAddress('');
                    }}
                    className={`h-12 ${tradeType === 'sell' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    data-testid="sell-button"
                  >
                    Sell Crypto
                  </Button>
                </div>

                <div className="mt-8">
                  <Label className="text-sm font-semibold text-slate-800">Select Cryptocurrency</Label>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {ALL_CRYPTOS.map((crypto) => (
                      <button
                        key={crypto.symbol}
                        type="button"
                        onClick={() => setSelectedCrypto(crypto.symbol)}
                        className={`rounded-lg border-2 p-3 text-center transition ${
                          selectedCrypto === crypto.symbol
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        data-testid={`crypto-${crypto.symbol}`}
                      >
                        <div className="mb-2 flex justify-center">
                          <img
                            src={crypto.image}
                            alt={crypto.symbol}
                            className="h-7 w-7 rounded-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="text-2xl font-black tracking-tight text-slate-900">{crypto.symbol}</div>
                        <div className="text-sm text-slate-500">{crypto.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 space-y-6">
                  <div>
                    <Label htmlFor="amount" className="text-sm font-semibold text-slate-800">
                      Amount (USD)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-2 h-12"
                      data-testid="amount-input"
                    />
                  </div>

                  {tradeType === 'buy' && (
                    <div>
                      <Label htmlFor="walletAddress" className="text-sm font-semibold text-slate-800">
                        Your {selectedCrypto} Wallet Address *
                      </Label>
                      <Input
                        id="walletAddress"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="mt-2 h-12"
                        data-testid="wallet-input"
                      />
                      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        ⚠️ Double-check your wallet address. Wrong address may result in loss of funds.
                      </p>
                    </div>
                  )}

                  {tradeType === 'sell' && (
                    <div>
                      <Label className="text-sm font-semibold text-slate-800">
                        Select Bank Account to Receive Payment *
                      </Label>

                      {selectedBank ? (
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-base font-bold text-slate-900">{selectedBank.bank_name}</p>
                              <p className="mt-1 text-sm text-slate-500">{selectedBank.account_number}</p>
                              <p className="mt-1 text-sm text-slate-600">{selectedBank.account_name}</p>
                            </div>
                            <Button type="button" variant="outline" onClick={() => setShowBankDialog(true)}>
                              Change
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-3 h-12 w-full"
                          onClick={() => setShowBankDialog(true)}
                          data-testid="choose-bank-btn"
                        >
                          + Choose Bank Account
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Rate</span>
                      <span className="font-semibold text-slate-900">₦{Number(currentRate || 0).toLocaleString()}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-base">
                      <span className="font-medium text-slate-700">
                        You will {tradeType === 'buy' ? 'pay' : 'receive'}
                      </span>
                      <span className="text-lg font-black text-slate-900">₦{Number(total || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleTrade}
                    className="h-12 w-full"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Trade Now'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
              <h2 className="text-2xl font-black text-emerald-900">Trade Created Successfully!</h2>
              <p className="mt-2 text-sm text-emerald-800">Trade ID: #{tradeResult.id}</p>

              <div className="mt-6 rounded-2xl border border-emerald-200 bg-white p-5">
                <h3 className="text-lg font-bold text-slate-900">Payment Instructions</h3>

                {tradeType === 'buy' ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-slate-700">
                      Please transfer ₦{Number(tradeResult.total_ngn || 0).toLocaleString()} to:
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bank Name</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{tradeResult.payment_details.bank_name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account Number</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{tradeResult.payment_details.account_number}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account Name</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{tradeResult.payment_details.account_name}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-slate-700">
                      Please send {tradeResult.amount} {tradeResult.crypto_symbol} to:
                    </p>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wallet Address</p>
                      <p className="mt-1 break-all rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-900">
                        {tradeResult.payment_details.wallet_address}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <p className="mt-4 text-sm text-slate-600">
                Your trade is pending confirmation. Admin will verify and complete the transaction.
              </p>

              <Button type="button" onClick={resetTradeFlow} variant="outline" className="mt-6 h-12 w-full">
                Start New Trade
              </Button>
            </div>
          )}
        </div>

        <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Bank Account</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => {
                    setSelectedBankAccount(account.id);
                    setShowBankDialog(false);
                  }}
                  className="w-full rounded-lg border-2 border-slate-200 p-4 text-left transition hover:border-blue-600"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900">{account.bank_name}</p>
                      <p className="text-sm text-slate-500">{account.account_number}</p>
                      <p className="text-sm text-slate-600">{account.account_name}</p>
                    </div>
                    {selectedBankAccount === account.id && <Check className="h-5 w-5 text-blue-600" />}
                  </div>
                </button>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowBankDialog(false);
                  setShowAddBankDialog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Bank Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddBankDialog} onOpenChange={setShowAddBankDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={newBankAccount.bank_name}
                  onChange={(e) =>
                    setNewBankAccount({ ...newBankAccount, bank_name: e.target.value })
                  }
                  placeholder="e.g. First Bank of Nigeria"
                />
              </div>

              <div>
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={newBankAccount.account_number}
                  onChange={(e) =>
                    setNewBankAccount({ ...newBankAccount, account_number: e.target.value })
                  }
                  placeholder="0123456789"
                />
              </div>

              <div>
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  value={newBankAccount.account_name}
                  onChange={(e) =>
                    setNewBankAccount({ ...newBankAccount, account_name: e.target.value })
                  }
                  placeholder="Your Full Name"
                />
              </div>

              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                ⚠️ Account name must match your registered name
              </p>

              <Button type="button" onClick={handleAddBankAccount} className="w-full">
                Add Bank Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default P2PTrade;
