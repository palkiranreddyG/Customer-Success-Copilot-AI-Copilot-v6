import React from 'react';
import type { Account } from '../lib/api';
import { Shield, ShieldAlert, ShieldCheck, Calendar, DollarSign } from 'lucide-react';

interface AccountListProps {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  onSelectAccount?: (account: Account) => void;
  selectedAccountId?: string | null;
}

export const AccountList: React.FC<AccountListProps> = ({
  accounts,
  loading,
  error,
  onSelectAccount,
  selectedAccountId,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="animate-pulse bg-white/40 dark:bg-slate-900/40 rounded-2xl p-6 border border-white/20 h-44 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-6 w-32 bg-slate-300 dark:bg-slate-700 rounded"></div>
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="h-8 w-24 bg-slate-300 dark:bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-destructive flex items-center gap-3">
        <ShieldAlert className="h-6 w-6 shrink-0" />
        <div>
          <h3 className="font-semibold text-lg">Failed to load accounts</h3>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-muted-foreground/30 p-12 text-center text-muted-foreground">
        <p className="text-lg">No accounts found.</p>
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-success bg-success/10 border-success/20';
    if (score >= 50) return 'text-warning bg-warning/10 border-warning/20';
    return 'text-danger bg-danger/10 border-danger/20';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <ShieldCheck className="h-5 w-5" />;
    if (score >= 50) return <Shield className="h-5 w-5" />;
    return <ShieldAlert className="h-5 w-5" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {accounts.map((account) => {
        const isSelected = selectedAccountId === account.id;
        return (
          <div
            key={account.id}
            onClick={() => onSelectAccount?.(account)}
            className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between h-44 shadow-glass hover:shadow-glass-hover ${
              isSelected
                ? 'bg-primary/5 border-primary shadow-md scale-[1.02]'
                : 'bg-white/70 dark:bg-slate-900/70 border-white/20 hover:border-primary/45 hover:scale-[1.01]'
            }`}
          >
            {/* Subtle glow background */}
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-all duration-500"></div>

            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold font-sans tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">
                    {account.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{account.tenure_months} months tenure</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${getHealthColor(account.health_score)}`}>
                  {getHealthIcon(account.health_score)}
                  <span>{account.health_score}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center text-slate-500 dark:text-slate-400">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider font-semibold">ARR Value</span>
              </div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                {formatCurrency(account.arr)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
