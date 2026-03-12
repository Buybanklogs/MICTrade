import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, History, Settings, HelpCircle, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { auth } from '../../lib/api';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.logout();
      toast.success('Logged out successfully');
      navigate('/signin');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">SF</span>
            </div>
            <span className="text-xl font-bold">SFPF Global</span>
          </div>

          <nav className="space-y-2">
            <Link to="/dashboard" className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-600 font-medium">
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link to="/trade" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
              <TrendingUp className="w-5 h-5" />
              <span>P2P Trade</span>
            </Link>
            <Link to="/markets" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
              <TrendingUp className="w-5 h-5" />
              <span>Markets</span>
            </Link>
            <Link to="/history" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
              <History className="w-5 h-5" />
              <span>History</span>
            </Link>
            <Link to="/settings" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
            <Link to="/support" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50">
              <HelpCircle className="w-5 h-5" />
              <span>Support</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 w-full">
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Dashboard</h1>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-slate-600 text-sm mb-2">Total Trades</div>
            <div className="text-3xl font-bold text-slate-900">0</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-slate-600 text-sm mb-2">Pending</div>
            <div className="text-3xl font-bold text-yellow-600">0</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-slate-600 text-sm mb-2">Completed</div>
            <div className="text-3xl font-bold text-green-600">0</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/trade">
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700">
                Start Trading
              </Button>
            </Link>
            <Link to="/markets">
              <Button variant="outline" className="w-full h-12">
                View Markets
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;