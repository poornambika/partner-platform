import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Building,
  DollarSign,
  Clock,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { token, currentUser, showToast } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        showToast('Platform settings saved successfully');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save settings', 'error');
      }
    } catch (e) {
      showToast('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="py-20 text-center text-slate-400 text-sm">Loading platform settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings & Policy</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              OWNER ONLY
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Corporate business profile, currency conventions, 4-month reminder cadence, and direct selling compliance parameters.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Compliance Protection Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
            <Lock className="w-4 h-4 text-amber-600" />
            Compliance Guard: Unapproved Recruitment Bonus Rule Locked (Disabled)
          </div>
          <p className="leading-relaxed">
            {settings.commissionSettings.recruitmentBonusExplanation} As required by Direct Selling and Consumer Protection regulations, payouts cannot be generated solely for enrolling members. Only verified product retail sales generate commissions.
          </p>
          <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-amber-800">
            <span className="bg-amber-200/60 px-2 py-0.5 rounded font-bold">Status: DISABLED</span>
            <span>•</span>
            <span>Proposed Headcount Bonus: ₹{settings.commissionSettings.recruitmentBonusAmount} (LOCKED)</span>
          </div>
        </div>

        {/* Business Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            Corporate Entity Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Company Registered Name</label>
              <input
                type="text"
                value={settings.businessProfile.companyName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    businessProfile: { ...settings.businessProfile, companyName: e.target.value },
                  })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Corporate Registration No (CIN)</label>
              <input
                type="text"
                value={settings.businessProfile.registrationNo}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    businessProfile: { ...settings.businessProfile, registrationNo: e.target.value },
                  })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-600 font-semibold mb-1">Registered Office Address</label>
              <input
                type="text"
                value={settings.businessProfile.registeredAddress}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    businessProfile: { ...settings.businessProfile, registeredAddress: e.target.value },
                  })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* Operational Policies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Purchase Reminder Cadence */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Direct Customer Purchase Cadence
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Cycle Interval (Months)</label>
                <input
                  type="number"
                  value={settings.purchaseReminderPolicy.intervalMonths}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      purchaseReminderPolicy: {
                        ...settings.purchaseReminderPolicy,
                        intervalMonths: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Grace Period Window (Days)</label>
                <input
                  type="number"
                  value={settings.purchaseReminderPolicy.gracePeriodDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      purchaseReminderPolicy: {
                        ...settings.purchaseReminderPolicy,
                        gracePeriodDays: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px]">
                {settings.purchaseReminderPolicy.disclosure}
              </div>
            </div>
          </div>

          {/* Currency and Tax Assumptions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              Currency & Tax Estimation Parameters
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Currency Code</label>
                  <input
                    type="text"
                    disabled
                    value={`${settings.currency.code} (${settings.currency.symbol})`}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Corporate Tax Benchmark (%)</label>
                  <input
                    type="number"
                    value={settings.taxAssumptions.corporateTaxRate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        taxAssumptions: {
                          ...settings.taxAssumptions,
                          corporateTaxRate: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Sales Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.commissionSettings.salesCommissionRate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      commissionSettings: {
                        ...settings.commissionSettings,
                        salesCommissionRate: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px]">
                {settings.taxAssumptions.disclaimer}
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Configuration Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
