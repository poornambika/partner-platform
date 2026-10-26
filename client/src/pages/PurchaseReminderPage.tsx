import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FastForward,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Info,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PurchaseReminder } from '../types';

export const PurchaseReminderPage: React.FC = () => {
  const { token, currentUser, showToast } = useAuth();
  const [reminder, setReminder] = useState<PurchaseReminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchReminder = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reminders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReminder(data);
      }
    } catch (e) {
      console.error('Failed to load purchase reminder', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminder();
  }, [token]);

  const handleSimulateStatus = async (status: 'DUE_SOON' | 'OVERDUE' | 'UP_TO_DATE') => {
    setSimulating(true);
    try {
      const res = await fetch('/api/reminders/simulate-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        showToast(`Simulated status changed to: ${status}`);
        fetchReminder();
      } else {
        showToast('Failed to execute reminder simulation', 'error');
      }
    } catch (e) {
      showToast('Simulation error', 'error');
    } finally {
      setSimulating(false);
    }
  };

  if (loading || !reminder) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        Loading 4-month purchase cycle telemetry...
      </div>
    );
  }

  const daysRemaining = reminder.daysRemaining ?? 120;
  const isDueSoon = reminder.reminderStatus === 'DUE_SOON';
  const isOverdue = reminder.reminderStatus === 'OVERDUE';
  const isUpToDate = reminder.reminderStatus === 'UP_TO_DATE';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Four-Month Purchase Cycle</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Customer Retention Policy
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configurable direct-to-consumer purchase cadence tracking to support consistent product consumption.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-600 font-medium">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Configured Interval: <strong>4 Months (120 Days)</strong></span>
        </div>
      </div>

      {/* Mandatory Regulatory Disclosure */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-bold">Compliance Disclosure:</strong>
          <p className="leading-relaxed">
            The platform does not automatically deactivate customer accounts or impose compulsory charges to simulate recruitment-based earnings. This 4-month cycle is an illustrative policy reminder for voluntary consumer product replenishment and requires legal and executive sign-off before production enforcement.
          </p>
        </div>
      </div>

      {/* Main Status Display Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Status Badge Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Current Policy Status
            </span>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isUpToDate
                    ? 'bg-emerald-500'
                    : isDueSoon
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span
                className={`text-xl font-black ${
                  isUpToDate
                    ? 'text-emerald-700'
                    : isDueSoon
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}
              >
                {reminder.reminderStatus.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {isUpToDate
                ? 'Your direct consumer account is in good standing with recent qualifying orders.'
                : isDueSoon
                ? 'Your 4-month replenishment window is approaching within the next 15 days.'
                : 'Your 4-month replenishment period has elapsed. Renewal recommended for promotional benefits.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
            User ID: {currentUser?.id}
          </div>
        </div>

        {/* Days Remaining Counter */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Time Remaining in Cycle
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className={`text-4xl font-black ${
                  daysRemaining < 0
                    ? 'text-rose-600'
                    : daysRemaining <= 15
                    ? 'text-amber-600'
                    : 'text-slate-900'
                }`}
              >
                {daysRemaining}
              </span>
              <span className="text-sm font-semibold text-slate-500">days</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Calculated based on a 120-day replenishment window from your last qualifying purchase.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[11px]">
            <span className="text-slate-400">Grace Period:</span>
            <span className="font-semibold text-slate-700">15 Days Built-In</span>
          </div>
        </div>

        {/* Key Dates Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Cycle Timeline
          </span>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">
                Last Qualifying Purchase
              </div>
              <div className="font-bold text-slate-900 mt-0.5">
                {reminder.lastPurchaseDate
                  ? new Date(reminder.lastPurchaseDate).toLocaleDateString('en-IN', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'No initial purchase logged'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
              <div className="text-[10px] text-indigo-600 font-semibold uppercase">
                Next Scheduled Reminder Date
              </div>
              <div className="font-bold text-indigo-950 mt-0.5">
                {new Date(reminder.nextReminderDate).toLocaleDateString('en-IN', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Simulation Controls for Reviewer */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Interactive Simulation Test Controls
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly toggle the state machine to test DUE_SOON, OVERDUE, and UP_TO_DATE without waiting 4 months.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Testing Sandbox</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleSimulateStatus('UP_TO_DATE')}
            disabled={simulating}
            className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Set Up-To-Date (Normal)
          </button>

          <button
            onClick={() => handleSimulateStatus('DUE_SOON')}
            disabled={simulating}
            className="p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <FastForward className="w-4 h-4 text-amber-600" />
            Fast-Forward: Simulate Due Soon (10 Days)
          </button>

          <button
            onClick={() => handleSimulateStatus('OVERDUE')}
            disabled={simulating}
            className="p-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold flex items-center justify-center gap-2 transition-all"
          >
            <AlertCircle className="w-4 h-4 text-rose-600" />
            Fast-Forward: Simulate Overdue (-5 Days)
          </button>
        </div>
      </div>
    </div>
  );
};
