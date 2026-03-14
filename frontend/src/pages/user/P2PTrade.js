import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { rates, trades, user } from '../../lib/api';

const ALL_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
  { symbol: 'ETH', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
  { symbol: 'USDT', name: 'Tether', image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png' },
  { symbol: 'BNB', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
  { symbol: 'SOL', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
  { symbol: 'USDC', name: 'USD Coin', image: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png' },
  { symbol: 'TRX', name: 'TRON', image: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png' },
  { symbol: 'XRP', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
  { symbol: 'ADA', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
  { symbol: 'LTC', name: 'Litecoin', image: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png' },
  { symbol: 'BCH', name: 'Bitcoin Cash', image: 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png' },
  { symbol: 'TON', name: 'Toncoin', image: 'https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png' },
];

const initialBankForm = {
  bank_name: '',
  account_number: '',
  account_name: '',
};

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
  const [newBankAccount, setNewBankAccount] = useState(initialBankForm);

  const fetchRates = useCallback(async () => {
    try {
      const response = await rates.getAll();
      setCryptoRates(response.data?.rates || []);
    } catch (error) {
      toast.error('Failed to fetch rates');
    }
  }, []);

  const fetchBankAccounts = useCallback(async () => {
    try {
      const response = await user.getPaymentMethods();
      setBankAccounts(response.data?.payment_methods || []);
    } catch (error) {
      console.error('Failed to fetch bank accounts', error);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    fetchBankAccounts();
  }, [fetchRates, fetchBankAccounts]);

  const currentRate = useMemo(() => {
    const rate = cryptoRates.find((item) => item.symbol === selectedCrypto);
    if (!rate) return 0;
    return tradeType === 'buy' ? Number(rate.buy_rate || 0) : Number(rate.sell_rate || 0);
  }, [cryptoRates, selectedCrypto, tradeType]);

  const totalAmount = useMemo(() => {
    return (parseFloat(amount) || 0) * currentRate;
  }, [amount, currentRate]);

  const selectedBank = useMemo(
    () => bankAccounts.find((account) => account.id === selectedBankAccount) || null,
    [bankAccounts, selectedBankAccount]
  );

  const selectedCoin = useMemo(
    () => ALL_CRYPTOS.find((crypto) => crypto.symbol === selectedCrypto),
    [selectedCrypto]
  );

  const resetTradeForm = () => {
    setAmount('');
    setWalletAddress('');
    setSelectedBankAccount(null);
  };

  const handleSwitchTradeType = (type) => {
    setTradeType(type);
    resetTradeForm();
  };

  const handleAddBankAccount = async () => {
    if (!newBankAccount.bank_name || !newBankAccount.account_number || !newBankAccount.account_name) {
      toast.error('Please complete all bank account fields');
      return;
    }

    try {
      await user.createPaymentMethod(newBankAccount);
      toast.success('Bank account added successfully');
      setShowAddBankDialog(false);
      setNewBankAccount(initialBankForm);
      await fetchBankAccounts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add bank account');
    }
  };

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (tradeType === 'buy' && !walletAddress.trim()) {
      toast.error(`Please enter your ${selectedCrypto} wallet address`);
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

      setTradeResult(response.data?.trade || null);
      toast.success('Trade created successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Trade creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <h1 className="mb-8 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          P2P Crypto Trading
        </h1>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          {!tradeResult ? (
            <>
              <div className="mb-8 grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  onClick={() => handleSwitchTradeType('buy')}
                  className={`h-14 rounded-xl text-lg font-semibold ${
                    tradeType === 'buy'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  data-testid="buy-button"
                >
                  Buy Crypto
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSwitchTradeType('sell')}
                  className={`h-14 rounded-xl text-lg font-semibold ${
                    tradeType === 'sell'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  data-testid="sell-button"
                >
                  Sell Crypto
                </Button>
              </div>

              <div className="mb-6">
                <h2 className="mb-5 text-2xl font-bold text-slate-900">Select Cryptocurrency</h2>

                <div className="grid grid-cols-2 gap-4">
                  {ALL_CRYPTOS.map((crypto) => {
                    const isSelected = selectedCrypto === crypto.symbol;

                    return (
                      <button
                        key={crypto.symbol}
                        type="button"
                        onClick={() => setSelectedCrypto(crypto.symbol)}
                        className={`rounded-2xl border-2 p-4 text-left transition ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                        data-testid={`crypto-${crypto.symbol}`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={crypto.image}
                            alt={`${crypto.name} logo`}
                            className="h-6 w-6 flex-shrink-0 rounded-full object-contain"
                            loading="lazy"
                          />

                          <div className="min-w-0">
                            <div className="text-2xl font-black leading-none text-slate-900">
                              {crypto.symbol}
                            </div>
                            <div className="mt-1 truncate text-sm text-slate-500">{crypto.name}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="amount" className="mb-2 block text-base font-semibold text-slate-900">
                    Amount (USD)
                  </Label>
                  <Input
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    data-testid="amount-input"
                    className="h-12"
                  />
                </div>

                {tradeType === 'buy' && (
                  <div>
                    <Label htmlFor="wallet-address" className="mb-2 block text-base font-semibold text-slate-900">
                      Your {selectedCrypto} Wallet Address *
                    </Label>
                    <Input
                      id="wallet-address"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder={`Enter your ${selectedCrypto} wallet address`}
                      data-testid="wallet-input"
                      className="h-12"
                    />
                    <p className="mt-2 text-sm text-amber-600">
                      ⚠️ Double-check your wallet address. Wrong address may result in loss of funds.
                    </p>
                  </div>
                )}

                {tradeType === 'sell' && (
                  <div>
                    <Label className="mb-2 block text-base font-semibold text-slate-900">
                      Select Bank Account to Receive Payment *
                    </Label>

                    {selectedBank ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{selectedBank.bank_name}</p>
                            <p className="text-sm text-slate-600">{selectedBank.account_number}</p>
                            <p className="text-sm text-slate-500">{selectedBank.account_name}</p>
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
                        className="h-12 w-full justify-center"
                        onClick={() => setShowBankDialog(true)}
                        data-testid="choose-bank-btn"
                      >
                        + Choose Bank Account
                      </Button>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    {selectedCoin ? (
                      <img
                        src={selectedCoin.image}
                        alt={`${selectedCoin.name} logo`}
                        className="h-8 w-8 rounded-full object-contain"
                        loading="lazy"
                      />
                    ) : null}
                    <div>
                      <p className="text-sm font-medium text-slate-500">Rate</p>
                      <p className="text-lg font-bold text-slate-900">₦{currentRate.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-500">
                      You will {tradeType === 'buy' ? 'pay' : 'receive'}
                    </p>
                    <p className="text-2xl font-black tracking-tight text-slate-900">
                      ₦{totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  className={`h-12 w-full text-base font-semibold ${
                    tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                  onClick={handleTrade}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Trade Now'}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <h2 className="text-2xl font-bold text-emerald-800">Trade Created Successfully!</h2>
                <p className="mt-2 text-sm text-emerald-700">Trade ID: #{tradeResult.id}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="mb-4 text-xl font-bold text-slate-900">Payment Instructions</h3>

                {tradeType === 'buy' ? (
                  <div className="space-y-3">
                    <p className="text-slate-700">
                      Please transfer <span className="font-bold">₦{Number(tradeResult.total_ngn || 0).toLocaleString()}</span> to:
                    </p>

                    <div>
                      <p className="text-sm text-slate-500">Bank Name</p>
                      <p className="font-semibold text-slate-900">{tradeResult.payment_details?.bank_name}</p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Account Number</p>
                      <p className="font-semibold text-slate-900">{tradeResult.payment_details?.account_number}</p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">Account Name</p>
                      <p className="font-semibold text-slate-900">{tradeResult.payment_details?.account_name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-slate-700">
                      Please send <span className="font-bold">{tradeResult.amount} {tradeResult.crypto_symbol}</span> to:
                    </p>

                    <div>
                      <p className="text-sm text-slate-500">Wallet Address</p>
                      <p className="break-all font-semibold text-slate-900">
                        {tradeResult.payment_details?.wallet_address}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-600">
                Your trade is pending confirmation. Admin will verify and complete the transaction.
              </p>

              <Button
                type="button"
                variant="outline"
                className="h-12 w-full"
                onClick={() => {
                  setTradeResult(null);
                  resetTradeForm();
                }}
              >
                Start New Trade
              </Button>
            </div>
          )}
        </div>

        <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
          <DialogContent className="sm:max-w-md">
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
                  className="w-full rounded-xl border-2 border-slate-200 p-4 text-left transition hover:border-blue-600"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{account.bank_name}</p>
                      <p className="text-sm text-slate-600">{account.account_number}</p>
                      <p className="text-sm text-slate-500">{account.account_name}</p>
                    </div>

                    {selectedBankAccount === account.id ? <Check className="h-5 w-5 text-blue-600" /> : null}
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="bank-name">Bank Name</Label>
                <Input
                  id="bank-name"
                  value={newBankAccount.bank_name}
                  onChange={(e) =>
                    setNewBankAccount((prev) => ({ ...prev, bank_name: e.target.value }))
                  }
                  placeholder="e.g. First Bank of Nigeria"
                />
              </div>

              <div>
                <Label htmlFor="account-number">Account Number</Label>
                <Input
                  id="account-number"
                  value={newBankAccount.account_number}
                  onChange={(e) =>
                    setNewBankAccount((prev) => ({ ...prev, account_number: e.target.value }))
                  }
                  placeholder="0123456789"
                />
              </div>

              <div>
                <Label htmlFor="account-name">Account Name</Label>
                <Input
                  id="account-name"
                  value={newBankAccount.account_name}
                  onChange={(e) =>
                    setNewBankAccount((prev) => ({ ...prev, account_name: e.target.value }))
                  }
                  placeholder="Your Full Name"
                />
              </div>

              <p className="text-sm text-amber-600">
                ⚠️ Account name must match your registered name
              </p>

              <Button type="button" className="w-full" onClick={handleAddBankAccount}>
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
