import React, { useState } from 'react';
import { X, Search, Shield, Users, User, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { demoAccounts, currentUser, switchAccount } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'OWNER' | 'PARTNERS' | 'USERS'>('ALL');
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSwitch = async (userId: string) => {
    setSwitchingId(userId);
    await switchAccount(userId);
    setSwitchingId(null);
    onClose();
  };

  const allAccounts = [
    ...(demoAccounts?.owner ? [demoAccounts.owner] : []),
    ...(demoAccounts?.partners || []),
    ...(demoAccounts?.users || []),
  ];

  const filtered = allAccounts.filter((acc) => {
    const matchesSearch =
      acc.name.toLowerCase().includes(search.toLowerCase()) ||
      acc.id.toLowerCase().includes(search.toLowerCase()) ||
      acc.email.toLowerCase().includes(search.toLowerCase()) ||
      (acc.partnerProfile?.branchName && acc.partnerProfile.branchName.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeTab === 'OWNER') return acc.role === 'OWNER';
    if (activeTab === 'PARTNERS') return acc.role === 'PARTNER';
    if (activeTab === 'USERS') return acc.role === 'USER';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Demo Account Switcher (41 Seeded Accounts)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly toggle sessions between 1 Super Admin, 10 Main Partners, and 30 Direct Users.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by ID (e.g. PAR001, USR015), name, or branch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
            {(['ALL', 'OWNER', 'PARTNERS', 'USERS'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL'
                  ? `All (41)`
                  : tab === 'OWNER'
                  ? `Owner (1)`
                  : tab === 'PARTNERS'
                  ? `Partners (10)`
                  : `Users (30)`}
              </button>
            ))}
          </div>
        </div>

        {/* Account List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No demo accounts match your search filter.
            </div>
          ) : (
            filtered.map((acc) => {
              const isCurrent = currentUser?.id === acc.id;
              const isOwner = acc.role === 'OWNER';
              const isPartner = acc.role === 'PARTNER';

              return (
                <div
                  key={acc.id}
                  onClick={() => !isCurrent && handleSwitch(acc.id)}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-50/70 border-indigo-200 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isOwner
                          ? 'bg-purple-100 text-purple-700'
                          : isPartner
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isOwner ? <Shield className="w-5 h-5" /> : isPartner ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{acc.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md font-mono font-medium bg-slate-100 text-slate-600">
                          {acc.id}
                        </span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                            isOwner
                              ? 'bg-purple-100 text-purple-800'
                              : isPartner
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {acc.role}
                        </span>
                        {acc.status === 'SUSPENDED' && (
                          <span className="text-[10px] font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                            SUSPENDED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{acc.email}</span>
                        {acc.partnerProfile?.branchName && (
                          <span className="text-indigo-600 font-medium">
                            • {acc.partnerProfile.branchName} ({acc.partnerProfile.referralCode})
                          </span>
                        )}
                        {acc.assignedPartner && (
                          <span className="text-slate-500">
                            • Assigned to: <strong className="text-slate-700">{acc.assignedPartner.name}</strong> ({acc.assignedPartner.id})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrent ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-100/70 px-3 py-1.5 rounded-lg">
                        <Check className="w-4 h-4" /> Active Session
                      </span>
                    ) : (
                      <button
                        disabled={switchingId === acc.id}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        {switchingId === acc.id ? 'Switching...' : 'Switch Session'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>Seeded Architecture: 1 Owner (OWN001) | 10 Partners (PAR001-PAR010) | 30 Users (USR001-USR030)</span>
          <span className="font-mono text-slate-400">Total: 41 Accounts</span>
        </div>
      </div>
    </div>
  );
};
