import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Building,
  Clock,
  Tag,
  CheckCircle2,
  Calendar,
  ArrowRight,
  FileText,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UserDashboardPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { token, currentUser } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error('Failed to load user dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [token]);

  if (loading || !data) {
    return <div className="py-20 text-center text-slate-400 text-sm">Loading your account details...</div>;
  }

  const { profile, purchaseReminder, assignedPartner, orders } = data;
  const daysRemaining = purchaseReminder?.daysRemaining ?? 120;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome, {profile.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {profile.id} • Verified Customer
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Browse genuine FMCG and wellness products with doorstep delivery and warranty support.
          </p>
        </div>

        <button
          onClick={() => onNavigate('products')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20"
        >
          <ShoppingBag className="w-4 h-4" />
          Browse Catalogue & Shop
        </button>
      </div>

      {/* Grid: Assigned Partner + 4-Month Reminder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Assigned Partner Hub */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Assigned Regional Partner Hub
            </span>
            <div className="mt-3 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{assignedPartner?.name || 'Central Fulfillment'}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {assignedPartner?.id} • {assignedPartner?.partnerProfile?.branchName}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Your orders and inquiries are prioritized and serviced through this verified regional partner branch.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-indigo-600 flex items-center gap-1">
            <span>Branch Referral Code: {assignedPartner?.partnerProfile?.referralCode}</span>
          </div>
        </div>

        {/* 4-Month Replenishment Tracker */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                4-Month Replenishment Cycle
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {purchaseReminder?.reminderStatus || 'UP_TO_DATE'}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{daysRemaining}</span>
              <span className="text-xs font-semibold text-slate-500">days until scheduled reminder</span>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Next scheduled replenishment date:{' '}
              <strong className="text-slate-800">
                {purchaseReminder?.nextReminderDate
                  ? new Date(purchaseReminder.nextReminderDate).toLocaleDateString('en-IN', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </strong>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Voluntary Cadence Policy</span>
            <button
              onClick={() => onNavigate('reminders')}
              className="text-indigo-600 font-semibold hover:text-indigo-800"
            >
              Simulate or Manage &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Recent Orders</h2>
            <p className="text-xs text-slate-500">Order invoices marked DEMO with full VAT/GST breakdowns</p>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            All Orders &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3 text-right">Net Amount</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    You have not placed any demo orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono font-bold text-indigo-600">{ord.id}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(ord.orderDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3 text-slate-700 font-medium">
                      {ord.items.length} items
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">
                      ₹{ord.netAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => onNavigate('orders')}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium"
                      >
                        View Invoice
                      </button>
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
