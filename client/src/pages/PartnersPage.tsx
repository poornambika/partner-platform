import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Shield,
  CheckCircle2,
  AlertCircle,
  Copy,
  DollarSign,
  TrendingUp,
  X,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PartnerRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  referralCode: string;
  branchName: string;
  assignedUsersCount: number;
  assignedUsers: Array<{ id: string; name: string; email: string; status: string }>;
  totalSales: number;
  simulatedCommission: number;
  joinDate: string;
}

export const PartnersPage: React.FC = () => {
  const { token, showToast } = useAuth();
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'sales' | 'name' | 'id'>('sales');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPartner, setSelectedPartner] = useState<PartnerRecord | null>(null);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (statusFilter) queryParams.set('status', statusFilter);
      queryParams.set('sortBy', sortBy);
      queryParams.set('sortOrder', sortOrder);

      const res = await fetch(`/api/partners?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
      }
    } catch (e) {
      console.error('Failed to fetch partners', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [token, search, statusFilter, sortBy, sortOrder]);

  const toggleAccountStatus = async (partnerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/users/${partnerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Account ${partnerId} status updated to ${newStatus}`);
        fetchPartners();
        if (selectedPartner && selectedPartner.id === partnerId) {
          setSelectedPartner({ ...selectedPartner, status: newStatus });
        }
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update account status', 'error');
      }
    } catch (e) {
      showToast('Error updating status', 'error');
    }
  };

  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Referral code ${code} copied to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Main Partner Directory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              10 Hub Branches
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Overview of all 10 registered main partners, attributed branch sales, and assigned customers.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          <span>PAR001 - PAR010</span>
          <span>•</span>
          <span className="text-indigo-600 font-bold">3 Users Assigned Each</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search partner by name, ID or branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('-');
              setSortBy(sb as any);
              setSortOrder(so as any);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="sales-desc">Sort by Sales (Highest)</option>
            <option value="sales-asc">Sort by Sales (Lowest)</option>
            <option value="name-asc">Sort by Name (A-Z)</option>
            <option value="id-asc">Sort by Partner ID</option>
          </select>
        </div>
      </div>

      {/* Partner Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Partner ID</th>
                <th className="px-5 py-3">Partner Name & Branch</th>
                <th className="px-5 py-3">Referral Code</th>
                <th className="px-5 py-3 text-center">Assigned Users</th>
                <th className="px-5 py-3 text-right">Attributed Sales</th>
                <th className="px-5 py-3 text-right">Simulated Comm (6%)</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Loading partner directory...
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No partner records found.
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-indigo-600">{p.id}</td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.branchName}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded w-fit">
                        <span>{p.referralCode}</span>
                        <button
                          onClick={() => copyReferralCode(p.referralCode)}
                          title="Copy Code"
                          className="text-slate-400 hover:text-indigo-600"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="font-bold text-slate-900 px-2 py-0.5 rounded-full bg-slate-100">
                        {p.assignedUsersCount} users
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">
                      ₹{p.totalSales.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-600">
                      ₹{p.simulatedCommission.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedPartner(p)}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                        >
                          Details & Branch
                        </button>
                        <button
                          onClick={() => toggleAccountStatus(p.id, p.status)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            p.status === 'ACTIVE'
                              ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                              : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                          }`}
                        >
                          {p.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Partner Details Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {selectedPartner.id.replace('PAR', 'P')}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedPartner.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedPartner.id} • {selectedPartner.branchName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPartner(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Branch KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Attributed Sales</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    ₹{selectedPartner.totalSales.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] text-emerald-700 uppercase font-semibold">Simulated Comm. (6%)</div>
                  <div className="text-lg font-bold text-emerald-700 mt-0.5">
                    ₹{selectedPartner.simulatedCommission.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                  <div className="text-[10px] text-indigo-700 uppercase font-semibold">Assigned Users</div>
                  <div className="text-lg font-bold text-indigo-700 mt-0.5">
                    {selectedPartner.assignedUsersCount} Direct Customers
                  </div>
                </div>
              </div>

              {/* 3 Assigned Users Section */}
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  Assigned Branch Customers (3 Demo Users)
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {selectedPartner.assignedUsers.map((usr) => (
                    <div key={usr.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900">{usr.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{usr.id} • {usr.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                        {usr.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal Note */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                <span className="font-bold text-slate-700">Direct Selling Compliance Note:</span> Customers are linked to {selectedPartner.name} exclusively for product service, order attribution, and customer fulfillment. Recruitment-based bonuses are not activated.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedPartner(null)}
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
