import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  Copy,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Building,
  User,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PartnerDashboardPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { token, currentUser, showToast } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchPartnerData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/partner', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error('Failed to load partner dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerData();
  }, [token]);

  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Referral Code ${code} copied to clipboard!`);
  };

  if (loading || !data) {
    return <div className="py-20 text-center text-slate-400 text-sm">Loading partner branch metrics...</div>;
  }

  const { profile, assignedUsers, attributedOrders, commissions } = data;

  return (
    <div className="space-y-6">
      {/* Branch Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{profile.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {profile.id} • Main Partner
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>{profile.branchName}</span>
          </p>
        </div>

        {/* Share Referral Code Box */}
        <div className="bg-indigo-50/70 border border-indigo-200 p-3 rounded-xl flex items-center gap-3">
          <div>
            <div className="text-[10px] text-indigo-700 uppercase font-bold">Your Branch Referral Code</div>
            <div className="text-sm font-mono font-black text-indigo-950">{profile.referralCode}</div>
          </div>
          <button
            onClick={() => copyReferralCode(profile.referralCode)}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors"
            title="Copy Referral Link"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Attributed Product Sales</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{profile.totalSales.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Verified Net Sales Volume</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Simulated Sales Commission</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600">
            ₹{profile.totalSimulatedCommission.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {profile.commissionRate}% Illustrative Rate (Demo)
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Assigned Customers</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-700">{assignedUsers.length} Users</div>
          <div className="text-[11px] text-slate-500 mt-1">Directly Assigned Branch Network</div>
        </div>
      </div>

      {/* 3 Assigned Branch Users */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Assigned Branch Customers (Exactly 3)</h2>
            <p className="text-xs text-slate-500">
              Direct consumers mapped to your partner branch for product orders, renewals, and support
            </p>
          </div>
          <button
            onClick={() => onNavigate('referrals')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View Hierarchy Tree &rarr;
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {assignedUsers.map((usr: any) => (
            <div key={usr.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{usr.name}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    {usr.id} • {usr.email} • {usr.phone}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase">
                  {usr.status}
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Cycle: {usr.purchaseReminder?.reminderStatus || 'UP_TO_DATE'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attributed Branch Orders */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Branch Attributed Orders</h2>
            <p className="text-xs text-slate-500">Commercial transactions credited toward your sales performance</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3 text-right">Order Net (₹)</th>
                <th className="px-5 py-3 text-right">Simulated 6% Comm. (₹)</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {attributedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No orders attributed yet.
                  </td>
                </tr>
              ) : (
                attributedOrders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono font-bold text-indigo-600">{ord.id}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(ord.orderDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{ord.user?.name}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">
                      ₹{ord.netAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-600">
                      ₹{Math.round(ord.netAmount * 0.06 * 100) / 100}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ord.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
