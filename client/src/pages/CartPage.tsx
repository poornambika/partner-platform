import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Tag,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Cart, CartItem } from '../types';

interface CartPageProps {
  onOrderCompleted: (orderId: string) => void;
  onNavigateToCatalog: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onOrderCompleted, onNavigateToCatalog }) => {
  const { token, currentUser, showToast } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('MOCK_UPI');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(
    currentUser?.address || 'Flat 402, High View Apartments, Mumbai, Maharashtra 400050'
  );
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (e) {
      console.error('Failed to load cart', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  const updateQuantity = async (itemId: string, newQty: number) => {
    try {
      const res = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId, quantity: newQty }),
      });
      if (res.ok) {
        fetchCart();
      }
    } catch (e) {
      showToast('Failed to update quantity', 'error');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/cart/remove/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Item removed from cart');
        fetchCart();
      }
    } catch (e) {
      showToast('Error removing item', 'error');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          cartTotal: cart?.subtotal || 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setDiscountAmount(data.discountAmount);
        setAppliedCoupon(data.code);
        showToast(data.message, 'success');
      } else {
        setDiscountAmount(0);
        setAppliedCoupon(null);
        showToast(data.error || 'Invalid coupon code', 'error');
      }
    } catch (e) {
      showToast('Coupon validation error', 'error');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;
    setCheckingOut(true);

    try {
      const itemsPayload = cart.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
      }));

      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: itemsPayload,
          couponCode: appliedCoupon,
          shippingAddress,
          paymentMethod,
          simulatePaymentFailure: simulateFailure,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(`Order ${data.id} confirmed! Invoice generated.`);
        fetchCart();
        onOrderCompleted(data.id);
      } else {
        if (simulateFailure) {
          showToast(`Mock payment declined as requested (${data.order?.id})`, 'error');
          fetchCart();
          onOrderCompleted(data.order?.id);
        } else {
          showToast(data.error || 'Checkout failed', 'error');
        }
      }
    } catch (e) {
      showToast('Network error during checkout', 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  const subtotal = cart?.subtotal || 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shopping Cart & Checkout</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Mock Payment Gateway
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Simulate end-consumer orders, coupon deductions, payment states, and partner sales attribution.
          </p>
        </div>

        {currentUser?.assignedPartner && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>
              Attributed Partner:{' '}
              <strong className="text-slate-900">{currentUser.assignedPartner.name}</strong> (
              {currentUser.assignedPartner.id})
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading cart details...</div>
      ) : !cart || cart.items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Your shopping cart is empty</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Add items from the product catalogue to place a verified demo order.
          </p>
          <button
            onClick={onNavigateToCatalog}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Explore Product Catalogue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500">
                  Cart Items ({cart.items.length})
                </span>
                <span className="text-xs text-slate-400">Standard Delivery</span>
              </div>

              <div className="divide-y divide-slate-100">
                {cart.items.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.product.id}</div>
                        <h4 className="font-bold text-slate-900 text-sm">{item.product.name}</h4>
                        <div className="text-xs font-semibold text-slate-600 mt-0.5">
                          ₹{item.product.sellingPrice.toLocaleString('en-IN')}{' '}
                          <span className="text-slate-400 font-normal">each</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 text-slate-500 hover:text-slate-900"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold w-6 text-center text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 text-slate-500 hover:text-slate-900"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-20 text-right font-bold text-slate-900 text-sm">
                        ₹{(item.product.sellingPrice * item.quantity).toLocaleString('en-IN')}
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Checkout & Mock Payment Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">
                Order Summary & Mock Payment
              </h3>

              {/* Coupon Code Box */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Promo / Coupon Code
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10, PARTNER5"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono font-bold focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
                  >
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="mt-1.5 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Coupon {appliedCoupon} applied (-₹{discountAmount})
                  </div>
                )}
              </div>

              {/* Shipping Address */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Delivery Address
                </label>
                <textarea
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
                />
              </div>

              {/* Payment Simulation Mode Selector */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Simulate Payment Gateway
                </span>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="simPay"
                      checked={!simulateFailure}
                      onChange={() => setSimulateFailure(false)}
                      className="text-indigo-600"
                    />
                    <span className="font-semibold text-slate-800">Simulate Success (Normal Order)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="simPay"
                      checked={simulateFailure}
                      onChange={() => setSimulateFailure(true)}
                      className="text-rose-600"
                    />
                    <span className="font-semibold text-rose-600">Simulate Payment Failure (Testing)</span>
                  </label>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Cart Subtotal:</span>
                  <span className="font-semibold text-slate-800">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount:</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Shipping & Delivery:</span>
                  <span className="text-emerald-600 font-semibold">FREE (Demo)</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Net Payable:</span>
                  <span className="text-indigo-600">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20"
              >
                {checkingOut ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing Commercial Transaction...
                  </>
                ) : (
                  <>
                    Confirm & Place Demo Order
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-[10px] text-slate-400 text-center">
                DEMO ENVIRONMENT: Real cards or bank credentials are not collected.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
