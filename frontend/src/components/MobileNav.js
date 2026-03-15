import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, TrendingUp, History, Settings, HelpCircle, LogOut, Users, DollarSign, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '../lib/api';

const MobileNav = ({ isAdmin = false, userRole = 'user' }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const userLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/trade', icon: TrendingUp, label: 'P2P Trade' },
    { to: '/markets', icon: TrendingUp, label: 'Markets' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
    { to: '/support', icon: HelpCircle, label: 'Support' },
  ];

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/trades', icon: TrendingUp, label: 'Trades' },
    { to: '/admin/rates', icon: DollarSign, label: 'Rates' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/support', icon: HelpCircle, label: 'Support' },
  ];

  const staffLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/trades', icon: TrendingUp, label: 'Trades' },
    { to: '/admin/support', icon: HelpCircle, label: 'Support' },
  ];

  let links;
  if (isAdmin) {
    links = userRole === 'staff' ? staffLinks : adminLinks;
  } else {
    links = userLinks;
  }

  const isStaff = userRole === 'staff';

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">

          {/* Logo container */}
          <div className="overflow-hidden h-8 w-8 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="MIC Trades"
              style={{
                paddingTop: "8px",
                paddingBottom: "5px",
                transform: "scale(2.8)",
                objectFit: "contain"
              }}
              className="w-full h-full"
            />
          </div>

          <span className="text-lg font-bold">MIC Trades</span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-slate-100"
          data-testid="mobile-menu-toggle"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">

          {/* Sidebar Logo */}
          <div className="flex items-center space-x-2 mb-8">

            <div className="overflow-hidden h-10 w-10 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="MIC Trades"
                style={{
                  paddingTop: "8px",
                  paddingBottom: "5px",
                  transform: "scale(2.8)",
                  objectFit: "contain"
                }}
                className="w-full h-full"
              />
            </div>

            <span className="text-xl font-bold">MIC Trades</span>
          </div>
<div className={`mb-4 px-4 py-2 rounded-lg ${isStaff ? 'bg-orange-50' : 'bg-blue-50'}`}>
              <div className={`text-xs font-medium flex items-center ${isStaff ? 'text-orange-600' : 'text-blue-600'}`}>
                <Shield className="w-3 h-3 mr-1" />
                {isStaff ? 'Staff Panel' : 'Admin Panel'}
              </div>
            </div>
          )}

          <nav className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            ))}

            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </nav>

        </div>
      </div>

      {/* Spacer for mobile header */}
      <div className="lg:hidden h-16" />
    </>
  );
};

export default MobileNav;

          {isAdmin && (
