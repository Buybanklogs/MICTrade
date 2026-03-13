import React, { useEffect, useState } from 'react';
import { User, CreditCard, Trash2, Plus, Lock, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { user } from '../../lib/api';
import axios from 'axios';

const Settings = () => {
  const [profile, setProfile] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBank, setShowAddBank] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [newBank, setNewBank] = useState({ bank_name: '', account_number: '', account_name: '' });

  useEffect(() => {
    fetchProfile();
    fetchPaymentMethods();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await user.getProfile();
      setProfile(response.data.profile);
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await user.getPaymentMethods();
      setPaymentMethods(response.data.payment_methods);
    } catch (error) {
      console.error('Failed to fetch payment methods');
    }
  };

  const handleAddBank = async () => {
    try {
      await user.createPaymentMethod(newBank);
      toast.success('Bank account added successfully');
      setShowAddBank(false);
      setNewBank({ bank_name: '', account_number: '', account_name: '' });
      fetchPaymentMethods();
    } catch (error) {
      toast.error('Failed to add bank account');
    }
  };

  const handleDeleteBank = async (id) => {
    if (window.confirm('Are you sure you want to delete this bank account?')) {
      try {
        await user.deletePaymentMethod(id);
        toast.success('Bank account deleted');
        fetchPaymentMethods();
      } catch (error) {
        toast.error('Failed to delete bank account');
      }
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      await axios.put(`${API_URL}/api/user/change-password`, {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      }, {
        withCredentials: true
      });
      toast.success('Password changed successfully');
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Settings</h1>
          <p className="text-lg text-slate-600">Manage your account and preferences</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-6">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-900">Profile Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Email</Label>
                  <Input value={profile?.email || ''} disabled className="mt-2 bg-slate-50" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Username</Label>
                  <Input value={profile?.username || ''} disabled className="mt-2 bg-slate-50" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">First Name</Label>
                  <Input value={profile?.firstname || ''} disabled className="mt-2 bg-slate-50" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Last Name</Label>
                  <Input value={profile?.lastname || ''} disabled className="mt-2 bg-slate-50" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Phone</Label>
                  <Input value={profile?.phone || ''} disabled className="mt-2 bg-slate-50" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Date of Birth</Label>
                  <Input value={profile?.date_of_birth || ''} disabled className="mt-2 bg-slate-50" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h2 className="text-2xl font-bold text-slate-900">Payment Methods</h2>
                </div>
                <Button onClick={() => setShowAddBank(true)} size="sm" className="shadow">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bank
                </Button>
              </div>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No bank accounts added yet</div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition">
                      <div>
                        <p className="font-semibold text-slate-900">{method.bank_name}</p>
                        <p className="text-sm text-slate-600">{method.account_number}</p>
                        <p className="text-sm text-slate-600">{method.account_name}</p>
                        {method.is_default && (
                          <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">Default</span>
                        )}
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteBank(method.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <Lock className="w-5 h-5 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-900">Security</h2>
              </div>
              <p className="text-slate-600 mb-4">Keep your account secure with a strong password</p>
              <Button onClick={() => setShowChangePassword(true)} className="shadow">
                Change Password
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showAddBank} onOpenChange={setShowAddBank}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bank Name</Label>
              <Input value={newBank.bank_name} onChange={(e) => setNewBank({ ...newBank, bank_name: e.target.value })} placeholder="e.g. First Bank of Nigeria" className="mt-2" />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input value={newBank.account_number} onChange={(e) => setNewBank({ ...newBank, account_number: e.target.value })} placeholder="0123456789" className="mt-2" />
            </div>
            <div>
              <Label>Account Name</Label>
              <Input value={newBank.account_name} onChange={(e) => setNewBank({ ...newBank, account_name: e.target.value })} placeholder="Your Full Name" className="mt-2" />
              <p className="text-sm text-blue-600 mt-1">⚠️ Must match your registered name</p>
            </div>
            <Button onClick={handleAddBank} className="w-full">Add Bank Account</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <Input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} placeholder="Enter current password" className="mt-2" />
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} placeholder="Enter new password (min 8 characters)" className="mt-2" />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} placeholder="Confirm new password" className="mt-2" />
            </div>
            <Button onClick={handleChangePassword} className="w-full">Change Password</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
