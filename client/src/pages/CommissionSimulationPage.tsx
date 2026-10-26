import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Download,
  Filter,
  Search,
  CheckCircle2,
  RotateCcw,
  Building,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CommissionLedger } from '../types';

export const CommissionSimulationPage: React.FC = () => {
  const { token, currentUser, showToast } = useAuth();
  const [ledgers, setLedgers] = useState<CommissionLedger[]>([]);
  const [partnerSummaries, setPartnerSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'PARTNERS' | 'RULES'>('LEDGER');

  const isOwner = currentUser?.role === 'OWNER';

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const [ledgerRes, summaryRes] = await Promise.all([
        fetch('/api/commissions/ledger', { headers: { Authorization: `Bearer ${token}` } }),
        isOwner
          ? fetch('/api/commissions/partner-summaries', { headers: { Authorization: `Bearer ${token}` } })
          : Promise.resolve(null),
      ]);

      if (ledgerRes.ok) setLedgers(await ledgerRes.json());
      if (summaryRes && summaryRes.ok) setPartnerSummaries(await summaryRes.json());
    } catch (e) {
      console.error('Failed to load commissions', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [token]);

  const handleManualReversal = async (id: string) => {
    if (!window.confirm('Simulate administrative reversal of this commission entry?')) return;
    try {
      const res = await fetch(`/api/commissions/reverse/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'Manual audit compliance reversal' }),
      });

      if (res.ok) {
        showToast(`Commission entry ${id} reversed successfully`);
        fetchCommissions();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to reverse commission', 'error');
      }
    } catch (e) {
      showToast('Error executing reversal', 'error');
    }
  };

  const handleExportCSV = () => {
    window.open(`/api/commissions/export-csv`, '_blank');
    showToast('Simulated commission ledger exported to CSV');
  };

  const filteredLedgers = ledgers.filter((l) => {
    if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.id.toLowerCase().includes(q) ||
        l.orderId.toLowerCase().includes(q) ||
        l.beneficiaryId.toLowerCase().includes(q)
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Commission Simulation Module</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              6% Verified Sales Simulation
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Transparent simulation ledger for verified customer product sales. Recruitment-based bonuses are strictly unapproved.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Compliance Warning & Unapproved Rule Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-indigo-950">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Approved Simulation: 6.0% Verified Product Sales Rule
          </div>
          <p className="text-slate-600 leading-relaxed">
            Illustrative performance commission credited to regional branches strictly on delivered end-consumer product sales (Example: ₹2,500 sale &rarr; ₹150 simulated commission).
          </p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Strictly Unapproved: ₹30 Headcount Recruitment Rule
          </div>
          <p className="text-amber-800 leading-relaxed">
            The proposal mentioned ₹30 per recruited member. This rule is <strong>permanently disabled</strong> to strictly comply with Consumer Protection Direct Selling guidelines.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'LEDGER'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Commission Ledger ({ledgers.length})
        </button>
        {isOwner && (
          <button
            onClick={() => setActiveTab('PARTNERS')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'PARTNERS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Partner Summaries (10 Branches)
          </button>
        )}
      </div>

      {/* TAB 1: Ledger Table */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto w-full sm:w-auto">
              {['ALL', 'SIMULATED', 'PENDING_REVIEW', 'APPROVED_DEMO', 'REVERSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    statusFilter === st ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ledger ID, order ID, or partner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Ledger ID</th>
                    <th className="px-5 py-3">Order ID</th>
                    <th className="px-5 py-3">Beneficiary Partner</th>
                    <th className="px-5 py-3 text-right">Eligible Sales (₹)</th>
                    <th className="px-5 py-3 text-center">Rate</th>
                    <th className="px-5 py-3 text-right">Simulated Comm. (₹)</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    {isOwner && <th className="px-5 py-3 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400">
                        Loading commission ledger...
                      </td>
                    </tr>
                  ) : filteredLedgers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400">
                        No commission entries found.
                      </td>
                    </tr>
                  ) : (
                    filteredLedgers.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-indigo-600">{l.id}</td>
                        <td className="px-5 py-3 font-mono text-slate-700">{l.orderId}</td>
                        <td className="px-5 py-3 font-mono font-semibold text-slate-900">
                          {l.beneficiaryId}
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-slate-900">
                          ₹{l.eligibleSalesAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3 text-center font-bold text-slate-600">
                          {l.illustrativeRate}%
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-emerald-600">
                          ₹{l.calculatedAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              l.status === 'APPROVED_DEMO'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : l.status === 'SIMULATED' || l.status === 'PENDING_REVIEW'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {l.status}
                          </span>
                          {l.reversalRef && (
                            <div className="text-[9px] text-rose-500 font-mono mt-0.5">
                              {l.reversalRef}
                            </div>
                          )}
                        </td>
                        {isOwner && (
                          <td className="px-5 py-3 text-right">
                            {l.status !== 'REVERSED' && (
                              <button
                                onClick={() => handleManualReversal(l.id)}
                                className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[10px] font-bold border border-rose-200"
                              >
                                Reverse
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Partner Summaries */}
      {activeTab === 'PARTNERS' && isOwner && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Partner ID</th>
                  <th className="px-5 py-3">Partner Name & Branch</th>
                  <th className="px-5 py-3 text-center">Assigned Users</th>
                  <th className="px-5 py-3 text-right">Eligible Sales (₹)</th>
                  <th className="px-5 py-3 text-right">Approved Comm (₹)</th>
                  <th className="px-5 py-3 text-right">Pending/Simulated (₹)</th>
                  <th className="px-5 py-3 text-right">Total Comm. (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {partnerSummaries.map((ps) => (
                  <tr key={ps.partnerId} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono font-bold text-indigo-600">{ps.partnerId}</td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900">{ps.name}</div>
                      <div className="text-[10px] text-slate-500">{ps.branch}</div>
                    </td>
                    <td className="px-5 py-3 text-center font-bold text-slate-800">
                      {ps.assignedUsersCount} users
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">
                      ₹{ps.totalEligibleSales.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-600">
                      ₹{ps.approvedDemoCommission.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-amber-600">
                      ₹{(ps.simulatedCommission + ps.pendingReviewCommission).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-right font-black text-indigo-600">
                      ₹{ps.totalCalculatedCommission.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
