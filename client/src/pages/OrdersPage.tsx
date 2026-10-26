import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';

interface OrdersPageProps {
  initialSelectedOrderId?: string | null;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ initialSelectedOrderId }) => {
  const { token, currentUser, showToast } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        if (initialSelectedOrderId) {
          const match = data.find((o: Order) => o.id === initialSelectedOrderId);
          if (match) setSelectedOrder(match);
        }
      }
    } catch (e) {
      console.error('Failed to fetch orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleSimulateRefund = async (orderId: string) => {
    if (!window.confirm('Simulate cancellation and refund for this order? This will restock inventory and reverse the attributed 6% partner commission.')) {
      return;
    }
    setRefundingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel-refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'Simulated customer return / order cancellation' }),
      });

      if (res.ok) {
        const updated = await res.json();
        showToast(`Order ${orderId} refunded. Stock restored & commission reversed.`);
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updated);
        }
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to process refund', 'error');
      }
    } catch (e) {
      showToast('Error communicating with refund service', 'error');
    } finally {
      setRefundingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.invoiceNumber.toLowerCase().includes(q) ||
        o.user.name.toLowerCase().includes(q) ||
        (o.partnerId && o.partnerId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Orders & Invoices</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {currentUser?.role === 'OWNER'
                ? 'All Platform Orders'
                : currentUser?.role === 'PARTNER'
                ? 'Branch Attributed Orders'
                : 'Customer Purchase History'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review commercial orders, DEMO invoices, payment telemetry, and test cancellation/refund workflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Refresh Orders
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto w-full sm:w-auto">
          {['ALL', 'PAID', 'PENDING', 'REFUNDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === st ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by order ID, invoice, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Attributed Partner</th>
                <th className="px-5 py-3 text-right">Net Amount</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No orders matching filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-indigo-600">
                      <div>{ord.id}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{ord.invoiceNumber}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(ord.orderDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900">{ord.user.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{ord.userId}</div>
                    </td>
                    <td className="px-5 py-3">
                      {ord.partnerId ? (
                        <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {ord.partnerId}
                        </span>
                      ) : (
                        <span className="text-slate-400">Direct / Unattributed</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">
                      ₹{ord.netAmount.toLocaleString('en-IN')}
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
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                        >
                          DEMO Invoice
                        </button>
                        {ord.status === 'PAID' && (
                          <button
                            onClick={() => handleSimulateRefund(ord.id)}
                            disabled={refundingId === ord.id}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                          >
                            {refundingId === ord.id ? 'Refunding...' : 'Refund & Reverse'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEMO Invoice Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-slate-900 text-sm">Commercial Invoice Preview</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                  {selectedOrder.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
                  title="Print / Save PDF"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700" id="printable-invoice">
              {/* Prominent Watermark / Stamp */}
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center font-bold text-amber-900 uppercase tracking-widest text-xs">
                DEMO INVOICE — SIMULATED COMMERCIAL TRANSACTION
              </div>

              {/* Company & Invoice Meta */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-black text-base text-slate-900">Apex Consumer Network Pvt. Ltd.</div>
                  <div className="text-slate-500 mt-0.5">Corporate Tower A, BKC, Mumbai 400051</div>
                  <div className="text-slate-400 font-mono mt-0.5">GSTIN: 27AABCA1234F1Z5 (Demo)</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900">{selectedOrder.invoiceNumber}</div>
                  <div className="text-slate-500">Order ID: {selectedOrder.id}</div>
                  <div className="text-slate-500">
                    Date:{' '}
                    {new Date(selectedOrder.orderDate).toLocaleDateString('en-IN', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Customer & Partner attribution */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Bill To Customer:</span>
                  <div className="font-bold text-slate-900 mt-1">{selectedOrder.user.name}</div>
                  <div className="text-slate-500 font-mono">{selectedOrder.userId}</div>
                  <div className="text-slate-600 mt-1">{selectedOrder.shippingAddress}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Attributed Branch Partner:
                  </span>
                  <div className="font-bold text-indigo-700 mt-1">
                    {selectedOrder.partnerId || 'Direct / Head Office'}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Commission Model: 6.0% Verified Sales Simulation
                  </div>
                  <div className="text-slate-500 mt-0.5 font-mono">
                    Payment Method: {selectedOrder.paymentMethod}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left">
                <thead className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOrder.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2.5 font-semibold text-slate-900">{it.product.name}</td>
                      <td className="py-2.5 text-center">{it.quantity}</td>
                      <td className="py-2.5 text-right">₹{it.unitPrice.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        ₹{it.subtotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Calculation */}
              <div className="flex justify-end pt-2 border-t border-slate-200">
                <div className="w-64 space-y-1.5 text-right">
                  <div className="flex justify-between text-slate-500">
                    <span>Gross Total:</span>
                    <span className="font-semibold text-slate-800">
                      ₹{selectedOrder.grossAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount ({selectedOrder.couponCode || 'PROMO'}):</span>
                      <span>-₹{selectedOrder.discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Net Invoice Amount:</span>
                    <span className="text-indigo-600">
                      ₹{selectedOrder.netAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and telemetry */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Payment Status
                  </span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {selectedOrder.paymentStatus}
                  </span>
                </div>
                {selectedOrder.refundSimulation && (
                  <div className="text-right">
                    <span className="text-[10px] text-rose-500 uppercase font-bold block">
                      Refund Processed
                    </span>
                    <span className="font-mono text-rose-600 font-bold">
                      {selectedOrder.refundSimulation.refundRef}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {selectedOrder.status === 'PAID' ? (
                <button
                  onClick={() => handleSimulateRefund(selectedOrder.id)}
                  disabled={refundingId === selectedOrder.id}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Simulate Cancellation & Restock
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
