import React, { useState, useEffect } from 'react';
import {
  Percent,
  Plus,
  Tag,
  Calendar,
  CheckCircle2,
  Copy,
  ToggleLeft,
  ToggleRight,
  X,
  AlertCircle,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Coupon } from '../types';

export const CouponManagementPage: React.FC = () => {
  const { token, currentUser, showToast } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isOwner = currentUser?.role === 'OWNER';

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderValue: '500',
    maxDiscount: '200',
    maxRedemptions: '100',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coupons', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (e) {
      console.error('Failed to load coupons', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [token]);

  const handleToggleCoupon = async (id: string) => {
    try {
      const res = await fetch(`/api/coupons/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Coupon status updated');
        fetchCoupons();
      } else {
        showToast('Failed to toggle coupon', 'error');
      }
    } catch (e) {
      showToast('Error toggling coupon', 'error');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discountValue) {
      showToast('Please provide code and discount value', 'error');
      return;
    }

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: newCoupon.code.toUpperCase(),
          discountType: newCoupon.discountType,
          discountValue: Number(newCoupon.discountValue),
          minOrderValue: Number(newCoupon.minOrderValue) || 0,
          maxDiscount: newCoupon.maxDiscount ? Number(newCoupon.maxDiscount) : undefined,
          maxRedemptions: Number(newCoupon.maxRedemptions) || 100,
          startDate: newCoupon.startDate,
          expiryDate: newCoupon.expiryDate,
        }),
      });

      if (res.ok) {
        showToast(`Coupon ${newCoupon.code.toUpperCase()} created successfully!`);
        setShowCreateModal(false);
        setNewCoupon({
          code: '',
          discountType: 'PERCENTAGE',
          discountValue: '',
          minOrderValue: '500',
          maxDiscount: '200',
          maxRedemptions: '100',
          startDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
        fetchCoupons();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create coupon', 'error');
      }
    } catch (e) {
      showToast('Error creating coupon', 'error');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Coupon code ${code} copied to clipboard!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Coupon Campaigns</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Promotional Discounts
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage discount codes, redemptions, minimum order thresholds, and expiry schedules.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        )}
      </div>

      {/* Coupons Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading active campaigns...</div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          No promotional coupons available.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coupons.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                c.isActive ? 'border-slate-200/80' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg">
                      {c.code}
                    </span>
                    <button
                      onClick={() => copyCode(c.code)}
                      className="p-1 text-slate-400 hover:text-indigo-600"
                      title="Copy Code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isOwner ? (
                    <button
                      onClick={() => handleToggleCoupon(c.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="space-y-1 mt-2">
                  <div className="text-xl font-black text-slate-900">
                    {c.discountType === 'PERCENTAGE'
                      ? `${c.discountValue}% OFF`
                      : `₹${c.discountValue} FLAT OFF`}
                  </div>
                  <p className="text-xs text-slate-500">
                    Minimum order: <strong className="text-slate-800">₹{c.minOrderValue}</strong>
                    {c.maxDiscount ? ` • Max discount: ₹${c.maxDiscount}` : ''}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Expires {new Date(c.expiryDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>

                {isOwner && (
                  <span className="font-semibold text-slate-700">
                    {c.currentRedemptions} / {c.maxRedemptions} redeemed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Coupon Modal (Owner) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <form
            onSubmit={handleCreateCoupon}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Create New Coupon Campaign</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. FLASH20"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold uppercase focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Discount Type</label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Discount Value</label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={newCoupon.minOrderValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, minOrderValue: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max Cap Discount (₹)</label>
                  <input
                    type="number"
                    value={newCoupon.maxDiscount}
                    onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={newCoupon.expiryDate}
                  onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Publish Coupon
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
