import React from 'react';

interface ConfidenceBadgeProps {
  confidence: number;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence }) => {
  const pct = Math.round(confidence * 100);
  let colorClass = 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/50 dark:border-rose-900/30';
  if (confidence >= 0.8) {
    colorClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-900/30';
  } else if (confidence >= 0.6) {
    colorClass = 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/50 dark:border-amber-900/30';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colorClass}`}>
      {pct}% Conf.
    </span>
  );
};
