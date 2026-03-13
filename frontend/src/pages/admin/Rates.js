import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Save } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { rates, admin } from '../../lib/api';

const AdminRates = () => {
  const [cryptoRates, setCryptoRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await rates.getAll();
      setCryptoRates(response.data.rates);
    } catch (error) {
      toast.error('Failed to fetch rates');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRate = async (symbol, buyRate, sellRate) => {
    setSaving(true);
    try {
      await admin.updateRates({
        crypto_symbol: symbol,
        buy_rate: parseFloat(buyRate),
        sell_rate: parseFloat(sellRate)
      });
      toast.success(`${symbol} rates updated successfully`);
      fetchRates();
    } catch (error) {
      toast.error('Failed to update rates');
    } finally {
      setSaving(false);
    }
  };

  const handleRateChange = (symbol, field, value) => {
    setCryptoRates(cryptoRates.map(rate => 
      rate.symbol === symbol 
        ? { ...rate, [field]: value }
        : rate
    ));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-8">
          <Link to="/admin" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">← Back to Dashboard</Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Crypto Rates Management</h1>
          <p className="text-slate-600">Update buy and sell rates for cryptocurrencies</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {cryptoRates.map((rate) => (
              <div key={rate.symbol} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{rate.symbol}</h3>
                      <p className="text-sm text-slate-600">
                        Last updated: {rate.updated_at ? new Date(rate.updated_at).toLocaleString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor={`${rate.symbol}-buy`}>Buy Rate (NGN)</Label>
                    <Input
                      id={`${rate.symbol}-buy`}
                      type="number"
                      step="0.01"
                      value={rate.buy_rate}
                      onChange={(e) => handleRateChange(rate.symbol, 'buy_rate', e.target.value)}
                      className="h-12 text-lg mt-2"
                      data-testid={`${rate.symbol}-buy-rate`}
                    />
                    <p className="text-sm text-slate-500 mt-1">Current: ₦{parseFloat(rate.buy_rate).toLocaleString()}</p>
                  </div>

                  <div>
                    <Label htmlFor={`${rate.symbol}-sell`}>Sell Rate (NGN)</Label>
                    <Input
                      id={`${rate.symbol}-sell`}
                      type="number"
                      step="0.01"
                      value={rate.sell_rate}
                      onChange={(e) => handleRateChange(rate.symbol, 'sell_rate', e.target.value)}
                      className="h-12 text-lg mt-2"
                      data-testid={`${rate.symbol}-sell-rate`}
                    />
                    <p className="text-sm text-slate-500 mt-1">Current: ₦{parseFloat(rate.sell_rate).toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleUpdateRate(rate.symbol, rate.buy_rate, rate.sell_rate)}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid={`save-${rate.symbol}-rates`}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-2">Rate Management Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Buy rate should typically be higher than sell rate (your profit margin)</li>
            <li>• Check market rates regularly to stay competitive</li>
            <li>• Consider transaction fees when setting rates</li>
            <li>• Users see these rates immediately after you save</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminRates;