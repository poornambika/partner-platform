import React, { useState } from 'react';
import { Menu, ShoppingBag, ShieldCheck, UserCheck, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AccountSwitcherModal } from './AccountSwitcherModal';

interface NavbarProps {
  onToggleSidebar: () => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, cartCount, onOpenCart }) => {
  const { currentUser, logout } = useAuth();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-200">
              A
            </div>
            <span className="font-bold text-base text-slate-900 tracking-tight hidden sm:inline">
              Apex Network
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase">
              Demo Prototype
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Cart Icon for User */}
          {currentUser?.role === 'USER' && (
            <button
              onClick={onOpenCart}
              className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-scale-in">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Quick Demo Switcher Button */}
          <button
            onClick={() => setSwitcherOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Switch Account</span>
            <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded font-mono">
              41
            </span>
          </button>

          {/* Active User Pill */}
          {currentUser && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                {currentUser.role === 'OWNER' ? (
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                ) : (
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <span>{currentUser.id}</span>
                  <span>•</span>
                  <span className="font-semibold text-indigo-600">{currentUser.role}</span>
                </div>
              </div>

              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <AccountSwitcherModal isOpen={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </>
  );
};
