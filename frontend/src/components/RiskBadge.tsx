import React from 'react';
import { AlertTriangle, TrendingUp, ShieldAlert, BookOpen } from 'lucide-react';

interface RiskBadgeProps {
  actionType: 'RETENTION' | 'EXPANSION' | 'ESCALATION' | 'ENABLEMENT';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ actionType }) => {
  switch (actionType) {
    case 'RETENTION':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/30">
          <ShieldAlert className="h-3 w-3" />
          CHURN RISK
        </span>
      );
    case 'EXPANSION':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/30">
          <TrendingUp className="h-3 w-3" />
          EXPANSION OPPT.
        </span>
      );
    case 'ESCALATION':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/30">
          <AlertTriangle className="h-3 w-3" />
          ESCALATION
        </span>
      );
    case 'ENABLEMENT':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/30">
          <BookOpen className="h-3 w-3" />
          ENABLEMENT
        </span>
      );
    default:
      return null;
  }
};
