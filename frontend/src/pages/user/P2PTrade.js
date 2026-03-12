import React, { useState, useEffect } from 'react';
import { ArrowDownUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { rates, trades } from '../../lib/api';

const P2PTrade = () => {
  const [tradeType, setTradeType] = useState('buy');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [cryptoRates, setCryptoRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tradeResult, setTradeResult] = useState(null);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await rates.getAll();
      setCryptoRates(response.data.rates);
    } catch (error) {
      toast.error('Failed to fetch rates');
    }
  };

  const getCurrentRate = () => {
    const rate = cryptoRates.find(r => r.symbol === selectedCrypto);
    return rate ? (tradeType === 'buy' ? rate.buy_rate : rate.sell_rate) : 0;
  };

  const calculateTotal = () => {
    return (parseFloat(amount) || 0) * getCurrentRate();
  };

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await trades.create({
        trade_type: tradeType,
        crypto_symbol: selectedCrypto,
        amount: parseFloat(amount)
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
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">P2P Crypto Trading</h1>

        {!tradeResult ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            {/* Trade Type Toggle */}
            <div className="flex gap-4 mb-8">
              <Button
                onClick={() => setTradeType('buy')}
                className={`flex-1 h-12 ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                data-testid="buy-button"
              >
                Buy Crypto
              </Button>
              <Button
                onClick={() => setTradeType('sell')}
                className={`flex-1 h-12 ${tradeType === 'sell' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                data-testid="sell-button"
              >
                Sell Crypto
              </Button>
            </div>

            {/* Crypto Selection */}
            <div className="mb-6">
              <Label>Select Cryptocurrency</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                {['BTC', 'ETH', 'USDT'].map(crypto => (
                  <button
                    key={crypto}
                    onClick={() => setSelectedCrypto(crypto)}
                    className={`p-4 rounded-lg border-2 transition ${
                      selectedCrypto === crypto
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    data-testid={`crypto-${crypto}`}
                  >
                    <div className="font-bold text-lg">{crypto}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <Label htmlFor="amount">Amount ({selectedCrypto})</Label>
              <Input
                id="amount"
                type="number"
                step="0.00000001"
                placeholder="0.00"
                className="h-12 text-lg"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                data-testid="amount-input"
              />
            </div>

            {/* Rate & Total */}
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
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-600">Bank Name</div>
                        <div className="font-bold">{tradeResult.payment_details.bank_name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-600">Account Number</div>
                        <div className="font-bold">{tradeResult.payment_details.account_number}</div>
                      </div>
                      <div className="col-span-2">
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

            <Button onClick={() => setTradeResult(null)} variant="outline" className="w-full h-12">
              Start New Trade
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default P2PTrade;