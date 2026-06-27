import React, { useState, useEffect } from 'react';
import { getAccountAuditLog } from '../lib/api';
import type { AuditLogEntry } from '../lib/api';
import { ArrowUpDown, Shield, Clock } from 'lucide-react';

interface AuditLogTableProps {
  accountId: string;
  refreshTrigger: number;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ accountId, refreshTrigger }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<'timestamp' | 'decision'>('timestamp');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (!accountId) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await getAccountAuditLog(accountId);
        setLogs(data);
      } catch (err) {
        console.error('Error fetching audit log:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [accountId, refreshTrigger]);

  const handleSort = (field: 'timestamp' | 'decision') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedLogs = [...logs].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'timestamp') {
      comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    } else if (sortField === 'decision') {
      comparison = a.decision.localeCompare(b.decision);
    }
    return sortAsc ? comparison : -comparison;
  });

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            APPROVED
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            REJECTED
          </span>
        );
      case 'modified':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
            MODIFIED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            {decision.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
            Human-in-the-Loop Audit Trail
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-semibold">
          Account: {accountId}
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Loading audit trail history...
        </div>
      ) : sortedLogs.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          No past human decisions recorded for this account.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs text-slate-700 dark:text-slate-350">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/30">
                <th className="px-4 py-2.5">
                  <button 
                    type="button"
                    onClick={() => handleSort('timestamp')}
                    className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer bg-transparent border-0 font-bold uppercase tracking-wider text-[10px]"
                  >
                    <Clock className="h-3 w-3" />
                    Timestamp
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-2.5">Recommendation ID</th>
                <th className="px-4 py-2.5">
                  <button 
                    type="button"
                    onClick={() => handleSort('decision')}
                    className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer bg-transparent border-0 font-bold uppercase tracking-wider text-[10px]"
                  >
                    Decision
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-2.5">Mod / Rejection note</th>
                <th className="px-4 py-2.5">Decided By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-500">
                    {log.recommendation_id}
                  </td>
                  <td className="px-4 py-3">
                    {getDecisionBadge(log.decision)}
                  </td>
                  <td className="px-4 py-3 italic max-w-xs truncate text-[11px] text-slate-600 dark:text-slate-400">
                    {log.note ? `"${log.note}"` : '—'}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-500">
                    {log.decided_by || 'Human User'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
