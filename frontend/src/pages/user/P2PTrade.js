import React, { useState, useEffect } from 'react';
import { ArrowDownUp, Plus, Check } from 'lucide-react';
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
  { symbol: 'TON', name: 'Toncoin' }
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
    account_name: ''
  });

  useEffect(() => {
    fetchRates();
    fetchBankAccounts();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await rates.getAll();
      setCryptoRates(response.data.rates);
    } catch (error) {
      toast.error('Failed to fetch rates');
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await user.getPaymentMethods();
      setBankAccounts(response.data.payment_methods);
    } catch (error) {
      console.error('Failed to fetch bank accounts');
    }
  };

  const getCurrentRate = () => {
    const rate = cryptoRates.find(r => r.symbol === selectedCrypto);
    return rate ? (tradeType === 'buy' ? rate.buy_rate : rate.sell_rate) : 0;
  };

  const calculateTotal = () => {
    return (parseFloat(amount) || 0) * getCurrentRate();
  };

  const handleAddBankAccount = async () => {
    try {
      await user.createPaymentMethod(newBankAccount);
      toast.success('Bank account added successfully');
      setShowAddBankDialog(false);
      setNewBankAccount({ bank_name: '', account_number: '', account_name: '' });
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

    if (tradeType === 'buy' && !walletAddress) {
      toast.error('Please enter your wallet address to receive ' + selectedCrypto);
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
        user_wallet_address: tradeType === 'buy' ? walletAddress : null,
        user_bank_account_id: tradeType === 'sell' ? selectedBankAccount : null
      });
      
      setTradeResult(response.data.trade);
      toast.success('Trade created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Trade creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">P2P Crypto Trading</h1>

        {!tradeResult ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8">
            <div className="flex gap-4 mb-8">
              <Button
                onClick={() => {
                  setTradeType('buy');
                  setSelectedBankAccount(null);
                  setWalletAddress('');
                }}
                className={`flex-1 h-12 ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                data-testid="buy-button"
              >
                Buy Crypto
              </Button>
              <Button
                onClick={() => {
                  setTradeType('sell');
                  setSelectedBankAccount(null);
                  setWalletAddress('');
                }}
                className={`flex-1 h-12 ${tradeType === 'sell' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                data-testid="sell-button"
              >
                Sell Crypto
              </Button>
            </div>

            <div className="mb-6">
              <Label>Select Cryptocurrency</Label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                {ALL_CRYPTOS.map(crypto => (
                  <button
                    key={crypto.symbol}
                    onClick={() => setSelectedCrypto(crypto.symbol)}
                    className={`p-3 rounded-lg border-2 transition ${
                      selectedCrypto === crypto.symbol
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    data-testid={`crypto-${crypto.symbol}`}
                  >
                    <div className="font-bold text-sm lg:text-base">{crypto.symbol}</div>
                    <div className="text-xs text-slate-600">{crypto.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.00000001"
                placeholder="0.00"
                className="h-12 text-lg mt-2"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                data-testid="amount-input"
              />
            </div>

            {tradeType === 'buy' && (
              <div className="mb-6">
                <Label htmlFor="wallet">Your {selectedCrypto} Wallet Address *</Label>
                <Input
                  id="wallet"
                  type="text"
                  placeholder={`Enter your ${selectedCrypto} wallet address`}
                  className="h-12 mt-2"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  data-testid="wallet-input"
                />
                <p className="text-sm text-red-600 mt-2">⚠️ Double-check your wallet address. Wrong address may result in loss of funds.</p>
              </div>
            )}

            {tradeType === 'sell' && (
              <div className="mb-6">
                <Label>Select Bank Account to Receive Payment *</Label>
                {selectedBankAccount ? (
                  <div className="mt-2 p-4 border-2 border-blue-600 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{bankAccounts.find(b => b.id === selectedBankAccount)?.bank_name}</div>
                        <div className="text-sm text-slate-600">{bankAccounts.find(b => b.id === selectedBankAccount)?.account_number}</div>
                        <div className="text-sm text-slate-600">{bankAccounts.find(b => b.id === selectedBankAccount)?.account_name}</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setShowBankDialog(true)}>Change</Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowBankDialog(true)}
                    variant="outline"
                    className="w-full h-12 mt-2"
                    data-testid="choose-bank-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Choose Bank Account
                  </Button>
                )}
              </div>
            )}

            <div className="bg-slate-50 rounded-lg p-6 mb-6">
              <div className="flex justify-between mb-4">
                <span className="text-slate-600">Rate:</span>
                <span className="font-bold">₦{getCurrentRate().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-slate-600">You will {tradeType === 'buy' ? 'pay' : 'receive'}:</span>
                <span className="font-bold text-blue-600">₦{calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            <Button
              onClick={handleTrade}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
              data-testid="trade-now-button"
            >
              {loading ? 'Processing...' : 'Trade Now'}
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowDownUp className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Trade Created Successfully!</h2>
              <p className="text-slate-600">Trade ID: #{tradeResult.id}</p>
            </div>

            <div className="bg-slate-50 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg mb-4">Payment Instructions</h3>
              
              {tradeType === 'buy' ? (
                <div className="space-y-2">
                  <p className="text-slate-600">Please transfer <span className="font-bold text-slate-900">₦{tradeResult.total_ngn.toLocaleString()}</span> to:</p>
                  <div className="bg-white rounded p-4 mt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-600">Bank Name</div>
                        <div className="font-bold">{tradeResult.payment_details.bank_name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-600">Account Number</div>
                        <div className="font-bold">{tradeResult.payment_details.account_number}</div>
                      </div>
                      <div className="col-span-full">
                        <div className="text-xs text-slate-600">Account Name</div>
                        <div className="font-bold">{tradeResult.payment_details.account_name}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-slate-600">Please send <span className="font-bold text-slate-900">{tradeResult.amount} {tradeResult.crypto_symbol}</span> to:</p>
                  <div className="bg-white rounded p-4 mt-4">
                    <div className="text-xs text-slate-600 mb-1">Wallet Address</div>
                    <div className="font-mono text-sm break-all">{tradeResult.payment_details.wallet_address}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">Your trade is pending confirmation. Admin will verify and complete the transaction.</p>
            </div>

            <Button onClick={() => { setTradeResult(null); setAmount(''); setWalletAddress(''); setSelectedBankAccount(null); }} variant="outline" className="w-full h-12">
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
            {bankAccounts.map(account => (
              <button
                key={account.id}
                onClick={() => {
                  setSelectedBankAccount(account.id);
                  setShowBankDialog(false);
                }}
                className="w-full p-4 border-2 rounded-lg hover:border-blue-600 transition text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{account.bank_name}</div>
                    <div className="text-sm text-slate-600">{account.account_number}</div>
                    <div className="text-sm text-slate-600">{account.account_name}</div>
                  </div>
                  {selectedBankAccount === account.id && <Check className="w-5 h-5 text-blue-600" />}
                </div>
              </button>
            ))}
            <Button onClick={() => { setShowBankDialog(false); setShowAddBankDialog(true); }} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
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
              <Label>Bank Name</Label>
              <Input
                value={newBankAccount.bank_name}
                onChange={(e) => setNewBankAccount({...newBankAccount, bank_name: e.target.value})}
                placeholder="e.g. First Bank of Nigeria"
              />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input
                value={newBankAccount.account_number}
                onChange={(e) => setNewBankAccount({...newBankAccount, account_number: e.target.value})}
                placeholder="0123456789"
              />
            </div>
            <div>
              <Label>Account Name</Label>
              <Input
                value={newBankAccount.account_name}
                onChange={(e) => setNewBankAccount({...newBankAccount, account_name: e.target.value})}
                placeholder="Your Full Name"
              />
              <p className="text-sm text-blue-600 mt-1">⚠️ Account name must match your registered name</p>
            </div>
            <Button onClick={handleAddBankAccount} className="w-full">
              Add Bank Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default P2PTrade;
