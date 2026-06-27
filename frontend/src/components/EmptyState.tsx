import React from 'react';
import { Cpu, FileText, AlertCircle, Search, Users } from 'lucide-react';

type EmptyVariant = 'pipeline' | 'noHistory' | 'noAccounts' | 'noResults' | 'noRecs';

interface EmptyStateProps {
  variant: EmptyVariant;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const CONFIGS: Record<EmptyVariant, { icon: React.ReactNode; title: string; desc: string }> = {
  pipeline: {
    icon: <Cpu className="h-10 w-10 text-slate-300 dark:text-slate-700" />,
    title: 'No Active Pipeline Execution',
    desc: 'Upload a transcript above to trigger and inspect the LangGraph agent orchestration.',
  },
  noHistory: {
    icon: <FileText className="h-10 w-10 text-slate-300 dark:text-slate-700" />,
    title: 'No Decision History Yet',
    desc: 'Approve or reject recommendations to build this account\'s human-in-the-loop audit trail.',
  },
  noAccounts: {
    icon: <Users className="h-10 w-10 text-slate-300 dark:text-slate-700" />,
    title: 'No Accounts Found',
    desc: 'Seed the database first: run python scripts/seed_chroma.py from the backend directory.',
  },
  noResults: {
    icon: <Search className="h-10 w-10 text-slate-300 dark:text-slate-700" />,
    title: 'No Search Results',
    desc: 'Try a different query such as "churn risk health score" or "renewal discount".',
  },
  noRecs: {
    icon: <AlertCircle className="h-10 w-10 text-slate-300 dark:text-slate-700" />,
    title: 'No Recommendations Generated',
    desc: 'The pipeline completed but no recommendations were produced. Check for evaluation failures.',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({ variant, title, description, action }) => {
  const cfg = CONFIGS[variant];
  return (
    <div className="animate-slide-up flex flex-col items-center justify-center py-10 px-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 space-y-3 min-h-[200px]">
      <div className="opacity-60">{cfg.icon}</div>
      <div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{title ?? cfg.title}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto mt-1">{description ?? cfg.desc}</p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
};
