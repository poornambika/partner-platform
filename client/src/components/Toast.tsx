import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Toast: React.FC = () => {
  const { toast } = useAuth();
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-indigo-500" />,
  };

  const bgStyles = {
    success: 'bg-white border-emerald-200 text-slate-800 shadow-emerald-50',
    error: 'bg-white border-rose-200 text-slate-800 shadow-rose-50',
    info: 'bg-white border-indigo-200 text-slate-800 shadow-indigo-50',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md max-w-md">
      <div className={`p-1.5 rounded-lg ${toast.type === 'success' ? 'bg-emerald-50' : toast.type === 'error' ? 'bg-rose-50' : 'bg-indigo-50'}`}>
        {icons[toast.type]}
      </div>
      <p className="text-sm font-medium text-slate-800 flex-1">{toast.message}</p>
    </div>
  );
};
