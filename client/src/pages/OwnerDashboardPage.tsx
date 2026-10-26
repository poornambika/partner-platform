import React, { useEffect, useState } from 'react';
import {
  Users,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Package,
  Clock,
  ArrowUpRight,
  Briefcase,
  AlertCircle,
  Receipt,
  CheckCircle2,
  PieChart as PieIcon,
  RefreshCw,
  Percent,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';

interface OwnerDashboardData {
  kpis: {
    totalAccounts: number;
    mainPartners: number;
    regularUsers: number;
    activeAccounts: number;
    productSalesRevenue: number;
    productCost: number;
    operatingExpenses: number;
    estimatedTaxProvision: number;
    estimatedNetProfit: number;
    pendingDemoOrders: number;
    grossProfit: number;
    simulatedCommissionLiability: number;
  };
  charts: {
    monthlySalesChart: Array<{ month: string; sales: number; orders: number }>;
    salesByPartnerChart: Array<{ partnerId: string; name: string; fullName: string; sales: number; commission: number }>;
    categoryPerformanceChart: Array<{ category: string; sales: number; unitsSold: number }>;
    orderStatusDistributionChart: Array<{ name: string; value: number }>;
    commissionDistributionChart: Array<{ status: string; count: number; amount: number }>;
  };
  recentActivity: Array<{
    id: string;
    timestamp: string;
    account: string;
    accountId: string;
    activity: string;
    referenceId: string;
    status: string;
  }>;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const OwnerDashboardPage: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/owner', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load owner dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [token]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-sm font-medium text-slate-500">Calculating platform financial metrics...</span>
        </div>
      </div>
    );
  }

  const { kpis, charts, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Super Admin Overview</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              OWNER CONSOLE
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time telemetry across 1 Owner, 10 Main Partners, and 30 Direct Users (41 Seeded Accounts).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* 10 Required KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* 1. Total Accounts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Accounts</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpis.totalAccounts}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">41 Seeded Accounts</div>
        </div>

        {/* 2. Main Partners */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Main Partners</span>
            <Briefcase className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpis.mainPartners}</div>
          <div className="text-[11px] text-slate-500 mt-1">PAR001 - PAR010</div>
        </div>

        {/* 3. Regular Users */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Regular Users</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpis.regularUsers}</div>
          <div className="text-[11px] text-slate-500 mt-1">3 Per Main Partner</div>
        </div>

        {/* 4. Active Accounts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Active Accounts</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{kpis.activeAccounts}</div>
          <div className="text-[11px] text-slate-500 mt-1">Verified KYC Status</div>
        </div>

        {/* 5. Product Sales Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Product Sales</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">₹{kpis.productSalesRevenue.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Verified Net Volume</div>
        </div>

        {/* 6. Product Cost (COGS) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Product Cost (COGS)</span>
            <Package className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800">₹{kpis.productCost.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">Direct Goods Cost</div>
        </div>

        {/* 7. Operating Expenses */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Operating Expenses</span>
            <Receipt className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">₹{kpis.operatingExpenses.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">Hubs, IT & Logistics</div>
        </div>

        {/* 8. Estimated Tax Provision */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Estimated Tax</span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">₹{kpis.estimatedTaxProvision.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">25% Illustrative Demo</div>
        </div>

        {/* 9. Estimated Net Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Est. Net Profit</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className={`text-2xl font-bold ${kpis.estimatedNetProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            ₹{kpis.estimatedNetProfit.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Post-Tax & Opex Demo</div>
        </div>

        {/* 10. Pending Demo Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Pending Orders</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{kpis.pendingDemoOrders}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting Settlement</div>
        </div>
      </div>

      {/* Charts Section: 5 Visualizations Required */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Product Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">1. Monthly Product Sales (INR)</h2>
              <p className="text-xs text-slate-500">Historical performance across the trailing 6 months</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              Sales Volume
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlySalesChart}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Product Sales']} />
                <Area type="monotone" dataKey="sales" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Sales by Partner */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">2. Sales by Partner (PAR001 - PAR010)</h2>
              <p className="text-xs text-slate-500">Product sales attributed to each partner branch</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              Branch Metrics
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.salesByPartnerChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="partnerId" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `₹${Number(value).toLocaleString('en-IN')}`,
                    name === 'sales' ? 'Attributed Sales' : 'Simulated Commission',
                  ]}
                  labelFormatter={(lbl) => {
                    const p = charts.salesByPartnerChart.find((x) => x.partnerId === lbl);
                    return p ? `${p.partnerId}: ${p.fullName}` : lbl;
                  }}
                />
                <Legend />
                <Bar dataKey="sales" name="Sales" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="commission" name="Simulated Comm (6%)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Product Category Performance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">3. Product Category Performance</h2>
              <p className="text-xs text-slate-500">Sales volume by FMCG & Wellness categories</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.categoryPerformanceChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                <YAxis dataKey="category" type="category" stroke="#94A3B8" fontSize={11} width={110} />
                <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Sales']} />
                <Bar dataKey="sales" fill="#6366F1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4 & 5 Combined Row: Order Status + Commission Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Chart 4: Order Status Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">4. Order Status Distribution</h2>
              <p className="text-[11px] text-slate-500 mb-2">PAID, PENDING, and REFUNDED orders</p>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.orderStatusDistributionChart}
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {charts.orderStatusDistributionChart.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === 'PAID'
                            ? '#10B981'
                            : entry.name === 'PENDING'
                            ? '#F59E0B'
                            : '#EF4444'
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 5: Commission Ledger Status Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">5. Commission Status Distribution</h2>
              <p className="text-[11px] text-slate-500 mb-2">Simulated vs Approved vs Reversed</p>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.commissionDistributionChart}>
                  <XAxis dataKey="status" fontSize={9} tickFormatter={(v) => v.slice(0, 4)} />
                  <YAxis fontSize={9} />
                  <Tooltip formatter={(val: any) => [`₹${val}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Platform Orders & Transactions</h2>
            <p className="text-xs text-slate-500">Live operational ledger generated from seeded database records</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Showing {recentActivity.length} events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Date & Time</th>
                <th className="px-5 py-3">Account</th>
                <th className="px-5 py-3">Activity</th>
                <th className="px-5 py-3">Reference ID</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentActivity.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(act.timestamp).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{act.account}</span>
                      <span className="text-[10px] font-mono text-slate-400">({act.accountId})</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800">{act.activity}</td>
                  <td className="px-5 py-3 font-mono text-indigo-600">{act.referenceId}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        act.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : act.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {act.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
