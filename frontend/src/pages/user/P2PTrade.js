
import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { rates, trades, user } from '../../lib/api';

const ALL_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'USDT', name: 'Tether' },
  { symbol: 'BNB', name: 'BNB' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'TRX', name: 'TRON' },
  { symbol: 'XRP', name: 'XRP' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'LTC', name: 'Litecoin' },
  { symbol: 'BCH', name: 'Bitcoin Cash' },
  { symbol: 'TON', name: 'Toncoin' },
];

const CRYPTO_ICONS = {
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

  useEffect(() => {
    fetchRates();
    fetchBankAccounts();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await rates.getAll();
      setCryptoRates(response.data?.rates || []);
    } catch (error) {
      toast.error('Failed to fetch rates');
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await user.getPaymentMethods();
      setBankAccounts(response.data?.payment_methods || []);
    } catch (error) {
      console.error('Failed to fetch bank accounts');
    }
  };

  const getCurrentRate = () => {
    const rate = cryptoRates.find((r) => r.symbol === selectedCrypto);
    if (!rate) return 0;
    return tradeType === 'buy' ? Number(rate.buy_rate || 0) : Number(rate.sell_rate || 0);
  };

  const calculateTotal = () => {
    return (parseFloat(amount) || 0) * getCurrentRate();
  };

  const handleAddBankAccount = async () => {
    if (!newBankAccount.bank_name || !newBankAccount.account_number || !newBankAccount.account_name) {
      toast.error('Please fill all bank account fields');
      return;
    }

    try {
      await user.createPaymentMethod(newBankAccount);
      toast.success('Bank account added successfully');
      setShowAddBankDialog(false);
      setNewBankAccount({
        bank_name: '',
        account_number: '',
        account_name: '',
      });
      fetchBankAccounts();
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

      setTradeResult(response.data?.trade);
      toast.success('Trade created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Trade creation failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedBank = bankAccounts.find((b) => b.id === selectedBankAccount);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
          P2P Crypto Trading
        </h1>

        {!tradeResult ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
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

            <div className="mt-10">
              <Label className="text-base font-semibold text-slate-900">
                Select Cryptocurrency
              </Label>

              <div className="mt-4 grid grid-cols-2 gap-4">
                {ALL_CRYPTOS.map((crypto) => (
                  <button
                    key={crypto.symbol}
                    type="button"
                    onClick={() => setSelectedCrypto(crypto.symbol)}
                    className={`rounded-lg border-2 p-3 transition ${
                      selectedCrypto === crypto.symbol
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    data-testid={`crypto-${crypto.symbol}`}
                  >
                    <div className="mb-2 flex justify-center">
                      <img
                        src={CRYPTO_ICONS[crypto.symbol]}
                        alt={`${crypto.name} logo`}
                        className="h-7 w-7 object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="text-2xl font-black leading-none text-slate-900">
                      {crypto.symbol}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">{crypto.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <Label htmlFor="amount" className="text-base font-semibold text-slate-900">
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
              <div className="mt-8">
                <Label htmlFor="walletAddress" className="text-base font-semibold text-slate-900">
                  Your {selectedCrypto} Wallet Address *
                </Label>
                <Input
                  id="walletAddress"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="mt-2 h-12"
                  data-testid="wallet-input"
                />
                <p className="mt-2 text-sm text-amber-600">
                  ⚠️ Double-check your wallet address. Wrong address may result in loss of funds.
                </p>
              </div>
            )}

            {tradeType === 'sell' && (
              <div className="mt-8">
                <Label className="text-base font-semibold text-slate-900">
                  Select Bank Account to Receive Payment *
                </Label>

                {selectedBank ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="font-semibold text-slate-900">{selectedBank.bank_name}</div>
                    <div className="text-sm text-slate-600">{selectedBank.account_number}</div>
                    <div className="text-sm text-slate-600">{selectedBank.account_name}</div>

                    <Button
                      type="button"
                      onClick={() => setShowBankDialog(true)}
                      variant="outline"
                      className="mt-3"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setShowBankDialog(true)}
                    variant="outline"
                    className="mt-2 h-12 w-full"
                    data-testid="choose-bank-btn"
                  >
                    Choose Bank Account
                  </Button>
                )}
              </div>
            )}

            <div className="mt-8 space-y-2 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Rate: <span className="font-semibold text-slate-900">₦{getCurrentRate().toLocaleString()}</span>
              </p>
              <p className="text-base font-semibold text-slate-900">
                You will {tradeType === 'buy' ? 'pay' : 'receive'}: ₦{calculateTotal().toLocaleString()}
              </p>
            </div>

            <Button
              type="button"
              onClick={handleTrade}
              disabled={loading}
              className="mt-8 h-12 w-full"
            >
              {loading ? 'Processing...' : 'Trade Now'}
            </Button>
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-black text-slate-900">Trade Created Successfully!</h2>
            <p className="mt-2 text-slate-600">Trade ID: #{tradeResult.id}</p>

            <div className="mt-8 rounded-2xl bg-slate-50 p-5">
              <h3 className="text-lg font-bold text-slate-900">Payment Instructions</h3>

              {tradeType === 'buy' ? (
                <div className="mt-4 space-y-3 text-slate-700">
                  <p>
                    Please transfer <span className="font-semibold">₦{Number(tradeResult.total_ngn || 0).toLocaleString()}</span> to:
                  </p>
                  <p><span className="font-semibold">Bank Name:</span> {tradeResult.payment_details?.bank_name}</p>
                  <p><span className="font-semibold">Account Number:</span> {tradeResult.payment_details?.account_number}</p>
                  <p><span className="font-semibold">Account Name:</span> {tradeResult.payment_details?.account_name}</p>
                </div>
              ) : (
                <div className="mt-4 space-y-3 text-slate-700">
                  <p>
                    Please send <span className="font-semibold">{tradeResult.amount} {tradeResult.crypto_symbol}</span> to:
                  </p>
                  <p><span className="font-semibold">Wallet Address:</span> {tradeResult.payment_details?.wallet_address}</p>
                </div>
              )}
            </div>

            <p className="mt-6 text-sm text-slate-600">
              Your trade is pending confirmation. Admin will verify and complete the transaction.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-6 h-12 w-full"
              onClick={() => {
                setTradeResult(null);
                setAmount('');
                setWalletAddress('');
                setSelectedBankAccount(null);
              }}
            >
              Start New Trade
            </Button>
          </div>
        )}

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
                  className="w-full rounded-lg border-2 p-4 text-left transition hover:border-blue-600"
                >
                  <div className="font-semibold text-slate-900">{account.bank_name}</div>
                  <div className="text-sm text-slate-600">{account.account_number}</div>
                  <div className="text-sm text-slate-600">{account.account_name}</div>
                  {selectedBankAccount === account.id && <Check className="mt-2 h-4 w-4 text-green-600" />}
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
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={newBankAccount.bank_name}
                  onChange={(e) =>
                    setNewBankAccount({ ...newBankAccount, bank_name: e.target.value })
                  }
                  placeholder="e.g. First Bank of Nigeria"
                />
              </div>

              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={newBankAccount.account_number}
                  onChange={(e) =>
                    setNewBankAccount({ ...newBankAccount, account_number: e.target.value })
                  }
                  placeholder="0123456789"
                />
              </div>

              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={newBankAccount.account_name}
                  onChange={(e) =>
                    setNewBankAccount({ ...newBankAccount, account_name: e.target.value })
                  }
                  placeholder="Your Full Name"
                />
              </div>

              <p className="text-sm text-amber-600">⚠️ Account name must match your registered name</p>

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
