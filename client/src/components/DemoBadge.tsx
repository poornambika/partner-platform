import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const DemoBadge: React.FC = () => {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between no-print">
      <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <div>
          <span className="font-semibold">DEMO SIMULATION PROTOTYPE:</span> Evaluates product-based partner network (1 Owner + 10 Partners + 30 Users = 41 Accounts). Illustrative 6% commission on verified sales. Headcount/recruitment bonuses are strictly UNAPPROVED and disabled.
        </div>
      </div>
    </div>
  );
};
