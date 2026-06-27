import React, { useEffect, useState } from 'react';
import { getPipelineStatus } from '../lib/api';
import type { PipelineStatusResponse } from '../lib/api';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Cpu 
} from 'lucide-react';
import { AgentActivityTimeline } from './AgentActivityTimeline';
import { PlannerExplanationCard } from './PlannerExplanationCard';
import { EmptyState } from './EmptyState';

interface AgentActivityStreamProps {
  sessionId: string | null;
  onStatusChange?: (data: PipelineStatusResponse | null) => void;
}

export const AgentActivityStream: React.FC<AgentActivityStreamProps> = ({ 
  sessionId, 
  onStatusChange
}) => {
  const [statusData, setStatusData] = useState<PipelineStatusResponse | null>(null);
  const [polling, setPolling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState<boolean>(false);

  useEffect(() => {
    if (!sessionId) {
      setStatusData(null);
      setError(null);
      setPolling(false);
      if (onStatusChange) onStatusChange(null);
      return;
    }

    setPolling(true);
    setError(null);

    // Initial fetch
    fetchStatus();

    // Poll every 2s
    const interval = setInterval(() => {
      fetchStatus();
    }, 2000);

    async function fetchStatus() {
      try {
        const data = await getPipelineStatus(sessionId!);
        setStatusData(data);
        if (onStatusChange) onStatusChange(data);
        
        if (data.status === 'complete' || data.status === 'partial_complete' || data.status === 'failed') {
          setPolling(false);
          clearInterval(interval);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error polling pipeline state.');
      }
    }

    return () => clearInterval(interval);
  }, [sessionId]);

  if (!sessionId) {
    return <EmptyState variant="pipeline" />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-105 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/30 animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            Executing Agents...
          </span>
        );
      case 'partial_complete':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/30">
            <CheckCircle className="h-3 w-3" />
            Completed (Phase 2)
          </span>
        );
      case 'complete':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/30">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/30">
            <AlertCircle className="h-3 w-3" />
            Execution Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {status}
          </span>
        );
    }
  };

  const errors = statusData?.errors || [];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-glass p-6 space-y-6 overflow-hidden flex flex-col h-full min-h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-500" />
            Agent Activity Stream
            {polling && <span className="text-xs font-normal text-slate-400 animate-pulse">(polling...)</span>}
          </h3>
          <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
            Session: {sessionId}
          </p>
        </div>
        {statusData && getStatusBadge(statusData.status)}
      </div>

      {error && (
        <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Timeline and Rationale Views */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 leading-relaxed">
        {statusData ? (
          <>
            {statusData.planner_decision && (
              <PlannerExplanationCard planner={statusData.planner_decision} />
            )}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-850">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                Execution Steps Progress:
              </p>
              <AgentActivityTimeline statusData={statusData} isRunning={polling} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-sm gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            <span>Initializing pipeline run...</span>
          </div>
        )}

        {/* Errors/Warnings Display */}
        {errors.length > 0 && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl p-4 space-y-1.5 text-xs text-rose-700 dark:text-rose-300">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" />
              Warnings / Errors reported:
            </p>
            <ul className="list-disc pl-4 space-y-1 font-mono">
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Raw JSON Toggle Block */}
      {statusData && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 shrink-0">
          <button
            type="button"
            onClick={() => setShowJson(!showJson)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {showJson ? 'Hide Raw JSON State Steps' : 'View Raw JSON State Steps'}
            </span>
            {showJson ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          
          {showJson && (
            <div className="mt-3 bg-slate-950 text-slate-350 p-4 rounded-xl text-[10px] font-mono overflow-auto max-h-48 border border-slate-900 shadow-inner">
              <pre className="text-emerald-400 leading-relaxed">
                {JSON.stringify(statusData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
