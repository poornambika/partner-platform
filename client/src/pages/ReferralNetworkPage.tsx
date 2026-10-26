import React, { useState, useEffect } from 'react';
import {
  GitFork,
  ChevronRight,
  ChevronDown,
  User,
  Users,
  Shield,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Smartphone,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HierarchyNode } from '../types';

export const ReferralNetworkPage: React.FC = () => {
  const { token, showToast } = useAuth();
  const [tree, setTree] = useState<HierarchyNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ OWN001: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<HierarchyNode | null>(null);
  const [highlightedBranchId, setHighlightedBranchId] = useState<string | null>(null);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/referrals/tree', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTree(data);
        // By default expand owner and first 2 partners
        const initialExpanded: Record<string, boolean> = { [data.id]: true };
        data.children.slice(0, 3).forEach((p: HierarchyNode) => {
          initialExpanded[p.id] = true;
        });
        setExpandedNodes(initialExpanded);
      }
    } catch (e) {
      console.error('Failed to load referral tree', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, [token]);

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    if (!tree) return;
    const allExp: Record<string, boolean> = { [tree.id]: true };
    tree.children.forEach((p) => {
      allExp[p.id] = true;
    });
    setExpandedNodes(allExp);
    showToast('Expanded entire network hierarchy');
  };

  const collapseAll = () => {
    if (!tree) return;
    setExpandedNodes({ [tree.id]: true });
    showToast('Collapsed all partner branches');
  };

  // Search and branch highlight logic
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim() || !tree) {
      setHighlightedBranchId(null);
      return;
    }

    const term = q.toLowerCase();
    // Check if term matches any user or partner
    for (const partner of tree.children) {
      if (
        partner.name.toLowerCase().includes(term) ||
        partner.id.toLowerCase().includes(term) ||
        (partner.referralCode && partner.referralCode.toLowerCase().includes(term))
      ) {
        setHighlightedBranchId(partner.id);
        setExpandedNodes((prev) => ({ ...prev, [partner.id]: true }));
        return;
      }
      for (const user of partner.children) {
        if (user.name.toLowerCase().includes(term) || user.id.toLowerCase().includes(term)) {
          setHighlightedBranchId(partner.id);
          setExpandedNodes((prev) => ({ ...prev, [partner.id]: true }));
          return;
        }
      }
    }
  };

  if (loading || !tree) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400 text-sm flex items-center gap-2">
          <GitFork className="w-5 h-5 animate-pulse text-indigo-500" />
          Building interactive 41-account network hierarchy...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Referral Network Hierarchy</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Live Topology
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Dynamic relational architecture: 1 Super Admin &rarr; 10 Regional Partners &rarr; 3 Assigned Users each (41 nodes).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Expand All Branches
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Search and Highlight Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search account (e.g. USR005, PAR003, Aarav)..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Owner (1)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Partners (10)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Direct Users (30)
          </span>
        </div>
      </div>

      {/* Visual Tree Canvas */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <div className="min-w-[650px] space-y-6">
          {/* LEVEL 1: Owner Node */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => setSelectedNode(tree)}
              className="p-4 rounded-2xl bg-gradient-to-b from-purple-50 to-white border-2 border-purple-300 shadow-md hover:shadow-lg transition-all cursor-pointer w-72 text-center group"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                    {tree.name}
                  </div>
                  <div className="text-[10px] text-purple-700 font-mono font-semibold">
                    {tree.id} • Super Admin
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Platform Headquarters (Mumbai)</div>
              <div className="mt-2 text-[10px] font-semibold text-purple-600 bg-purple-100/70 py-0.5 rounded-md">
                Master Node (All 10 Branches Subordinate)
              </div>
            </div>

            {/* Vertical connector line */}
            <div className="w-0.5 h-8 bg-slate-300" />
          </div>

          {/* LEVEL 2: 10 Main Partners */}
          <div className="space-y-4">
            <div className="text-xs uppercase font-bold text-slate-400 tracking-wider text-center mb-2">
              Main Regional Partners (10 Branches)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tree.children.map((partner) => {
                const isExpanded = expandedNodes[partner.id];
                const isHighlighted = highlightedBranchId === partner.id;

                return (
                  <div
                    key={partner.id}
                    className={`rounded-2xl border transition-all ${
                      isHighlighted
                        ? 'bg-indigo-50/60 border-indigo-400 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Partner Card Header */}
                    <div
                      onClick={() => setSelectedNode(partner)}
                      className="p-3.5 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {partner.id.replace('PAR', 'P')}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{partner.name}</span>
                            <span className="text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                              {partner.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {partner.branchName} • Ref:{' '}
                            <strong className="text-slate-700 font-mono">{partner.referralCode}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right hidden sm:block">
                          <div className="text-[11px] font-bold text-slate-900">
                            ₹{(partner.totalSales || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[9px] text-emerald-600 font-semibold">
                            ₹{(partner.simulatedCommission || 0).toLocaleString('en-IN')} comm.
                          </div>
                        </div>

                        <button
                          onClick={(e) => toggleExpand(partner.id, e)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Subordinate LEVEL 3: 3 Assigned Users under each Partner */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-200/80 mt-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center justify-between">
                          <span>Assigned Customers ({partner.children.length})</span>
                          <span className="text-slate-400 font-normal">Direct product consumers</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {partner.children.map((usr) => (
                            <div
                              key={usr.id}
                              onClick={() => setSelectedNode(usr)}
                              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                            >
                              <div>
                                <div className="text-[11px] font-semibold text-slate-900 truncate">
                                  {usr.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {usr.id}
                                </div>
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  ACTIVE
                                </span>
                                <span className="text-[9px] text-slate-400">4-mo policy</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Node Details Slide-Out Drawer / Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs ${
                    selectedNode.role === 'OWNER'
                      ? 'bg-purple-600'
                      : selectedNode.role === 'PARTNER'
                      ? 'bg-indigo-600'
                      : 'bg-emerald-600'
                  }`}
                >
                  {selectedNode.role === 'OWNER' ? (
                    <Shield className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedNode.name}</h3>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {selectedNode.id} • {selectedNode.role}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Account Status</div>
                  <div className="font-bold text-emerald-600 mt-0.5">{selectedNode.status}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Email</div>
                  <div className="font-medium text-slate-700 mt-0.5 truncate">{selectedNode.email}</div>
                </div>
              </div>

              {selectedNode.role === 'PARTNER' && (
                <>
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                    <div className="text-[10px] text-indigo-700 uppercase font-bold">Branch & Referral Code</div>
                    <div className="text-sm font-bold text-indigo-950 mt-0.5">{selectedNode.branchName}</div>
                    <div className="text-xs font-mono font-bold text-indigo-600 mt-1">
                      Referral Code: {selectedNode.referralCode}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Attributed Sales</div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        ₹{(selectedNode.totalSales || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Simulated Comm.</div>
                      <div className="font-bold text-emerald-600 mt-0.5">
                        ₹{(selectedNode.simulatedCommission || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedNode.role === 'USER' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">4-Month Policy Status</div>
                  <div className="text-xs font-semibold text-slate-800 mt-1">
                    Renewal status: Up-To-Date (Direct Consumer)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Assigned to regional partner branch for product orders and service.
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-400">
                Notice: Network hierarchies represent customer-partner relationships and are tracked independently of speculative financial payout structures.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedNode(null)}
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
