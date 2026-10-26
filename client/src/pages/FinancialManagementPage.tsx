import React, { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  TrendingUp,
  Receipt,
  Plus,
  ArrowRight,
  ShieldAlert,
  Building,
  CheckCircle2,
  Clock,
  Download,
  Percent,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FinancialReport, Expense, FinancialTransferRecord } from '../types';

export const FinancialManagementPage: React.FC = () => {
  const { token, showToast } = useAuth();
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transfers, setTransfers] = useState<FinancialTransferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'EXPENSES' | 'TRANSFERS'>('SUMMARY');

  // Expense Form State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'Logistics',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
    referenceNumber: '',
    documentPlaceholder: 'voucher_receipt.pdf',
  });

  // Transfer Form State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    sendingEntity: 'Apex Retail Ventures Pvt Ltd (Parent)',
    receivingEntity: 'Apex Regional Fulfillment Hub',
    amount: '',
    businessPurpose: '',
    invoiceReference: '',
  });

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const [sumRes, expRes, txrRes] = await Promise.all([
        fetch('/api/financials/summary', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/financials/expenses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/financials/transfers', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (sumRes.ok) setReport(await sumRes.json());
      if (expRes.ok) setExpenses(await expRes.json());
      if (txrRes.ok) {
        const d = await txrRes.json();
        setTransfers(d.transfers);
      }
    } catch (e) {
      console.error('Failed to load financial records', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [token]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.description || !newExpense.referenceNumber) {
      showToast('Please fill in all expense fields', 'error');
      return;
    }

    try {
      const res = await fetch('/api/financials/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newExpense,
          amount: Number(newExpense.amount),
        }),
      });

      if (res.ok) {
        showToast('Operating expense recorded successfully');
        setShowExpenseModal(false);
        setNewExpense({
          category: 'Logistics',
          amount: '',
          expenseDate: new Date().toISOString().split('T')[0],
          description: '',
          referenceNumber: '',
          documentPlaceholder: 'voucher_receipt.pdf',
        });
        fetchFinancials();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create expense', 'error');
      }
    } catch (e) {
      showToast('Error recording expense', 'error');
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransfer.amount || !newTransfer.businessPurpose || !newTransfer.invoiceReference) {
      showToast('Please fill in all transfer fields', 'error');
      return;
    }

    try {
      const res = await fetch('/api/financials/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newTransfer,
          amount: Number(newTransfer.amount),
        }),
      });

      if (res.ok) {
        showToast('Inter-company transfer entry recorded');
        setShowTransferModal(false);
        setNewTransfer({
          sendingEntity: 'Apex Retail Ventures Pvt Ltd (Parent)',
          receivingEntity: 'Apex Regional Fulfillment Hub',
          amount: '',
          businessPurpose: '',
          invoiceReference: '',
        });
        fetchFinancials();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to record transfer', 'error');
      }
    } catch (e) {
      showToast('Error recording transfer', 'error');
    }
  };

  if (loading || !report) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        Calculating financial statements and P&L estimates...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              OWNER ONLY
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Transparent P&L accounting, operating expense ledgers, and inter-company entity transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'EXPENSES' && (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Record Expense
            </button>
          )}
          {activeTab === 'TRANSFERS' && (
            <button
              onClick={() => setShowTransferModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Record Transfer
            </button>
          )}
        </div>
      </div>

      {/* Mandatory Disclaimer Badge */}
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div>
          <strong className="font-bold">DEMO FINANCIAL ESTIMATES:</strong> {report.disclaimer}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('SUMMARY')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'SUMMARY'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          P&L Financial Statement
        </button>
        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'EXPENSES'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Operating Expenses ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('TRANSFERS')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'TRANSFERS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Inter-Company Transfer Register ({transfers.length})
        </button>
      </div>

      {/* TAB 1: P&L Statement */}
      {activeTab === 'SUMMARY' && (
        <div className="space-y-6">
          {/* 11 Item Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-600 tracking-wider">
                Comprehensive Financial Statement (INR)
              </span>
              <span className="text-xs text-slate-400">All figures in ₹ Indian Rupees</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* 1. Gross Product Sales */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                <div>
                  <span className="font-semibold text-slate-900">1. Gross Product Sales</span>
                  <p className="text-[11px] text-slate-400">Gross retail value of all placed demo customer orders</p>
                </div>
                <span className="font-bold text-slate-900 text-sm">
                  ₹{report.grossProductSales.toLocaleString('en-IN')}
                </span>
              </div>

              {/* 2. Discounts */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 text-slate-600">
                <div>
                  <span className="font-semibold text-rose-600">2. Promotional Coupon Discounts</span>
                  <p className="text-[11px] text-slate-400">WELCOME10, PARTNER5 & FESTIVE15 redeemed deductions</p>
                </div>
                <span className="font-bold text-rose-600 text-sm">
                  -₹{report.discounts.toLocaleString('en-IN')}
                </span>
              </div>

              {/* 3. Refunds & Cancellations */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 text-slate-600">
                <div>
                  <span className="font-semibold text-rose-600">3. Refunds & Cancellations</span>
                  <p className="text-[11px] text-slate-400">Simulated order cancellations and customer returns</p>
                </div>
                <span className="font-bold text-rose-600 text-sm">
                  -₹{report.refundsAndCancellations.toLocaleString('en-IN')}
                </span>
              </div>

              {/* 4. Net Sales */}
              <div className="p-4 flex items-center justify-between bg-indigo-50/40">
                <div>
                  <span className="font-bold text-indigo-900 text-sm">4. Net Product Sales</span>
                  <p className="text-[11px] text-indigo-600 font-mono">Formula: Gross Product Sales - Discounts - Refunds</p>
                </div>
                <span className="font-black text-indigo-700 text-base">
                  ₹{report.netSales.toLocaleString('en-IN')}
                </span>
              </div>

              {/* 5. Cost of Goods Sold */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">5. Cost of Goods Sold (COGS)</span>
                  <p className="text-[11px] text-slate-400">Direct manufacturing, packaging, and raw material costs</p>
                </div>
                <span className="font-bold text-slate-800 text-sm">
                  -₹{report.costOfGoodsSold.toLocaleString('en-IN')}
                </span>
              </div>

              {/* 6. Gross Profit */}
              <div className="p-4 flex items-center justify-between bg-slate-50">
                <div>
                  <span className="font-bold text-slate-900 text-sm">6. Gross Profit</span>
                  <p className="text-[11px] text-slate-500 font-mono">Formula: Net Sales - Cost of Goods Sold</p>
                </div>
                <span className="font-black text-slate-900 text-base">
                  ₹{report.grossProfit.toLocaleString('en-IN')}
                </span>
              </div>

              {/* 7. Operating Expenses */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 text-slate-600">
                <div>
                  <span className="font-semibold text-rose-600">7. Operating Expenses (Opex)</span>
                  <p className="text-[11px] text-slate-400">Warehouse hubs, IT hosting, compliance retainers & logistics</p>
                </div>
                <span className="font-bold text-rose-600 text-sm">
                  -₹{report.operatingExpenses.toLocaleString('en-IN')}
                </span>
              </div>

              {/* 8. Owner Remuneration */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">8. Owner Remuneration (Benchmark)</span>
                  <p className="text-[11px] text-slate-400">Direct executive operational drawing benchmark</p>
                </div>
                <span className="font-bold text-slate-800 text-sm">
                  -₹{report.ownerRemuneration.toLocaleString('en-IN')}
                </span>
              </div>

              {/* 9. Estimated Tax Provision */}
              <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 text-amber-700">
                <div>
                  <span className="font-semibold">9. Estimated Corporate Tax Provision</span>
                  <p className="text-[11px] text-slate-400">25% illustrative tax benchmark on positive operating profit</p>
                </div>
                <span className="font-bold text-amber-700 text-sm">
                  -₹{report.estimatedTaxProvision.toLocaleString('en-IN')}
                </span>
              </div>

              {/* 10. Estimated Net Profit */}
              <div className="p-4 flex items-center justify-between bg-emerald-50/50">
                <div>
                  <span className="font-black text-emerald-950 text-sm">10. Estimated Net Profit (Demo)</span>
                  <p className="text-[11px] text-emerald-700 font-mono">
                    Formula: Estimated Operating Profit - Estimated Tax Provision
                  </p>
                </div>
                <span className="font-black text-emerald-700 text-lg">
                  ₹{report.estimatedNetProfit.toLocaleString('en-IN')}
                </span>
              </div>

              {/* 11. Simulated Commission Liability */}
              <div className="p-4 flex items-center justify-between bg-indigo-50/30">
                <div>
                  <span className="font-bold text-indigo-900">11. Simulated Commission Liability</span>
                  <p className="text-[11px] text-slate-500">
                    6% illustrative performance commission awaiting final demonstration settlement
                  </p>
                </div>
                <span className="font-bold text-indigo-700 text-sm font-mono">
                  ₹{report.simulatedCommissionLiability.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Operating Expenses Table */}
      {activeTab === 'EXPENSES' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Expense ID</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Ref Number</th>
                  <th className="px-5 py-3 text-right">Amount (₹)</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono font-bold text-indigo-600">{exp.id}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(exp.expenseDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{exp.category}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{exp.description}</td>
                    <td className="px-5 py-3 font-mono text-slate-500">{exp.referenceNumber}</td>
                    <td className="px-5 py-3 text-right font-bold text-rose-600">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                        {exp.approvalStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Inter-Company Transfer Register */}
      {activeTab === 'TRANSFERS' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <strong>Informational Notice:</strong> This inter-company register provides transparent audit tracking for fund allocations between central corporate headquarters, regional logistics hubs, and operating subsidiaries. Does not provide tax-evasion functionality.
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Transfer Ref</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Sending Entity</th>
                    <th className="px-5 py-3">Receiving Entity</th>
                    <th className="px-5 py-3">Business Purpose</th>
                    <th className="px-5 py-3 text-right">Amount (₹)</th>
                    <th className="px-5 py-3 text-center">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {transfers.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-mono font-bold text-indigo-600">{tx.id}</td>
                      <td className="px-5 py-3 text-slate-500">
                        {new Date(tx.transferDate).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900">{tx.sendingEntity}</td>
                      <td className="px-5 py-3 font-medium text-indigo-700">{tx.receivingEntity}</td>
                      <td className="px-5 py-3 text-slate-600">{tx.businessPurpose}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900">
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                          {tx.approvalStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <form
            onSubmit={handleCreateExpense}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Record Operational Expense</h3>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Expense Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-semibold"
                >
                  <option value="Logistics">Logistics</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="IT & Software">IT & Software</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Office">Office</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Amount (₹ INR)</label>
                <input
                  type="number"
                  placeholder="e.g. 25000"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Regional distribution center freight settlement"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Reference / Invoice Number</label>
                <input
                  type="text"
                  placeholder="e.g. INV-EXP-9921"
                  value={newExpense.referenceNumber}
                  onChange={(e) => setNewExpense({ ...newExpense, referenceNumber: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Document Attachment</label>
                <input
                  type="text"
                  value={newExpense.documentPlaceholder}
                  onChange={(e) => setNewExpense({ ...newExpense, documentPlaceholder: e.target.value })}
                  className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Submit Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <form
            onSubmit={handleCreateTransfer}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Record Inter-Company Transfer</h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Sending Entity</label>
                <input
                  type="text"
                  value={newTransfer.sendingEntity}
                  onChange={(e) => setNewTransfer({ ...newTransfer, sendingEntity: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Receiving Entity</label>
                <input
                  type="text"
                  value={newTransfer.receivingEntity}
                  onChange={(e) => setNewTransfer({ ...newTransfer, receivingEntity: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Amount (₹ INR)</label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={newTransfer.amount}
                  onChange={(e) => setNewTransfer({ ...newTransfer, amount: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Business Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Inter-branch inventory distribution settlement"
                  value={newTransfer.businessPurpose}
                  onChange={(e) => setNewTransfer({ ...newTransfer, businessPurpose: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Reference / Invoice ID</label>
                <input
                  type="text"
                  placeholder="e.g. INTER-CORP-2026-04"
                  value={newTransfer.invoiceReference}
                  onChange={(e) => setNewTransfer({ ...newTransfer, invoiceReference: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Record Transfer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
