import React from 'react';
import {
  LayoutDashboard,
  Users,
  GitFork,
  Package,
  ShoppingCart,
  FileText,
  DollarSign,
  Percent,
  Clock,
  Settings,
  Shield,
  X,
  Share2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
}) => {
  const { currentUser, switchAccount } = useAuth();
  const role = currentUser?.role || 'OWNER';

  interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    roles: Array<'OWNER' | 'PARTNER' | 'USER'>;
    badge?: string;
  }

  const navItems: NavItem[] = [
    // OWNER & GENERAL
    {
      id: 'dashboard',
      label: role === 'OWNER' ? 'Owner Overview' : role === 'PARTNER' ? 'Branch Overview' : 'Customer Account',
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ['OWNER', 'PARTNER', 'USER'],
    },
    {
      id: 'partners',
      label: 'Main Partners (10)',
      icon: <Users className="w-4 h-4" />,
      roles: ['OWNER'],
    },
    {
      id: 'referrals',
      label: 'Referral Hierarchy',
      icon: <GitFork className="w-4 h-4" />,
      roles: ['OWNER', 'PARTNER'],
      badge: 'Interactive',
    },
    {
      id: 'products',
      label: role === 'USER' ? 'Browse Products' : 'Product Catalogue',
      icon: <Package className="w-4 h-4" />,
      roles: ['OWNER', 'PARTNER', 'USER'],
    },
    {
      id: 'orders',
      label: role === 'USER' ? 'My Orders & Invoices' : role === 'PARTNER' ? 'Branch Orders' : 'All Product Orders',
      icon: <ShoppingCart className="w-4 h-4" />,
      roles: ['OWNER', 'PARTNER', 'USER'],
    },
    {
      id: 'commissions',
      label: 'Commission Simulation',
      icon: <DollarSign className="w-4 h-4" />,
      roles: ['OWNER', 'PARTNER'],
      badge: '6% Verified',
    },
    {
      id: 'financials',
      label: 'Financial Management',
      icon: <FileText className="w-4 h-4" />,
      roles: ['OWNER'],
      badge: 'P&L / Opex',
    },
    {
      id: 'coupons',
      label: role === 'USER' ? 'Special Coupons' : 'Coupon Campaigns',
      icon: <Percent className="w-4 h-4" />,
      roles: ['OWNER', 'USER'],
    },
    {
      id: 'reminders',
      label: '4-Month Cycle Tracker',
      icon: <Clock className="w-4 h-4" />,
      roles: ['OWNER', 'USER', 'PARTNER'],
      badge: 'Policy',
    },
    {
      id: 'audit',
      label: 'Compliance & Audits',
      icon: <Shield className="w-4 h-4" />,
      roles: ['OWNER'],
    },
    {
      id: 'settings',
      label: 'Platform Settings',
      icon: <Settings className="w-4 h-4" />,
      roles: ['OWNER'],
    },
  ];

  const allowedNavItems = navItems.filter((item) => item.roles.includes(role));

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden no-print"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } no-print`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20">
              A
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-wide">Apex Consumer</div>
              <div className="text-[10px] text-indigo-400 font-medium tracking-wider uppercase">
                Partner Network
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Context Banner */}
        <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Role Perspective
            </div>
            <div className="text-xs font-semibold text-white mt-0.5 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  role === 'OWNER'
                    ? 'bg-purple-400'
                    : role === 'PARTNER'
                    ? 'bg-indigo-400'
                    : 'bg-emerald-400'
                }`}
              />
              {role === 'OWNER'
                ? 'Super Admin / Owner'
                : role === 'PARTNER'
                ? `Partner (${currentUser?.id})`
                : `Customer (${currentUser?.id})`}
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700/80 text-slate-300">
            {role}
          </span>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {allowedNavItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-indigo-700 text-white'
                        : 'bg-slate-800 text-indigo-400 border border-indigo-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Role Switcher Shortcut */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 px-1 flex items-center justify-between">
            <span>Quick Role Switch</span>
            <Sparkles className="w-3 h-3 text-amber-400" />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => switchAccount('OWN001')}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold text-center border transition-all ${
                currentUser?.id === 'OWN001'
                  ? 'bg-purple-600/30 text-purple-300 border-purple-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              Owner
            </button>
            <button
              onClick={() => switchAccount('PAR001')}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold text-center border transition-all ${
                currentUser?.id === 'PAR001'
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              PAR001
            </button>
            <button
              onClick={() => switchAccount('USR001')}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold text-center border transition-all ${
                currentUser?.id === 'USR001'
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              USR001
            </button>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 text-center">
            41 Demo Accounts Available
          </div>
        </div>
      </aside>
    </>
  );
};
