import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, CheckCircle2 } from 'lucide-react';
import { getPlatformStats } from '../lib/api';
import type { PlatformStats } from '../lib/api';
import { StatsSkeleton } from './skeletons/Skeletons';

interface PlatformStatsPanelProps {
  refreshKey?: number;
}

export const PlatformStatsPanel: React.FC<PlatformStatsPanelProps> = ({ refreshKey = 0 }) => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPlatformStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <StatsSkeleton />;

  if (!stats) return null;

  const approvalPct = Math.round(stats.approval_rate * 100);
  const avgConf = Math.round(stats.avg_confidence * 100);

  const cards = [
    {
      label: 'Total Pipeline Runs',
      value: stats.total_runs.toLocaleString(),
      icon: <Activity className="h-4 w-4 text-indigo-500" />,
      sub: 'across all accounts',
      color: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'Avg Confidence',
      value: `${avgConf}%`,
      icon: <TrendingUp className="h-4 w-4 text-violet-500" />,
      sub: avgConf >= 80 ? 'High quality signals' : avgConf >= 60 ? 'Moderate signals' : 'Low confidence',
      color: avgConf >= 80 ? 'text-emerald-600 dark:text-emerald-400' : avgConf >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Approval Rate',
      value: `${approvalPct}%`,
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      sub: approvalPct >= 70 ? 'Strong human alignment' : 'Room to improve',
      color: approvalPct >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-up">
      {cards.map((card) => (
        <div
          key={card.label}
          className="card-lift bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm"
        >
          <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
            {card.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {card.label}
            </p>
            <p className={`text-xl font-bold leading-tight ${card.color}`}>{card.value}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{card.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
