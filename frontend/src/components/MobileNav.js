import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutDashboard,
  TrendingUp,
  History,
  Settings,
  HelpCircle,
  LogOut,
  Users,
  DollarSign,
} from 'lucide-react';
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

  const links = isAdmin ? (userRole === 'staff' ? staffLinks : adminLinks) : userLinks;
  const isStaff = userRole === 'staff';

  const Brand = ({ compact = false }) => (
    <div className={`flex items-center ${compact ? 'gap-2.5' : 'gap-3'}`}>
      <div
        className={`overflow-hidden flex items-center justify-center ${
          compact ? 'h-9 w-9' : 'h-10 w-10'
        }`}
      >
        <img
          src="/logo.png"
          alt="MIC Trades"
          style={{
            paddingTop: '8px',
            paddingBottom: '5px',
            transform: 'scale(2.8)',
            objectFit: 'contain',
          }}
          className="h-full w-full"
        />
      </div>

      <div className="min-w-0">
        <div
          className={`truncate font-semibold tracking-tight text-slate-900 ${
            compact ? 'text-[1.15rem]' : 'text-[1.2rem]'
          }`}
        >
          MIC Trades
        </div>
        {isAdmin && !compact && (
          <div className="text-[11px] font-medium tracking-[0.14em] text-slate-400 uppercase">
            {isStaff ? 'Staff Panel' : 'Admin Panel'}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-4">
          <Brand />

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-blue-600 transition hover:bg-slate-100"
            data-testid="mobile-menu-toggle"
          >
            {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </header>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-80 max-w-[85vw] transform bg-white shadow-xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <Brand compact />
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-2 text-blue-600 transition hover:bg-slate-100"
          >
            <X className="h-6 w-6" />

              </button>
        </div>

        <div className="px-4 py-6">
          {isAdmin && (
            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              {isStaff ? 'Staff Panel' : 'Admin Panel'}
            </div>
          )}

          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 rounded-lg px-4 py-3 text-slate-600 transition hover:bg-slate-50"
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-slate-600 transition hover:bg-slate-50"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </aside>

      <div className="h-[81px] lg:hidden" />
    </>
  );
};

export default MobileNav;
