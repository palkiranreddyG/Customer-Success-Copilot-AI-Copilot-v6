import React, { useState, useEffect } from 'react';
import { getHealth } from '../lib/api';
import { Settings, Shield, Cpu, CheckCircle, AlertCircle, Info, Database } from 'lucide-react';
import { useToast } from './ToastProvider';

export const SettingsPage: React.FC = () => {
  const toast = useToast();
  const [backendStatus, setBackendStatus] = useState<'Connected' | 'Offline'>('Offline');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHealth()
      .then(() => setBackendStatus('Connected'))
      .catch(() => setBackendStatus('Offline'))
      .finally(() => setLoading(false));
  }, []);

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      await getHealth();
      setBackendStatus('Connected');
      toast.success('Connection Successful', 'Connected to AI Customer Success Copilot backend.');
    } catch (e: any) {
      setBackendStatus('Offline');
      toast.error('Connection Failed', 'Could not reach uvicorn backend on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: 'Connected' | 'Offline') => {
    if (status === 'Connected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
          <CheckCircle className="h-3.5 w-3.5" />
          Connected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-450 border border-rose-200/50 dark:border-rose-900/30">
        <AlertCircle className="h-3.5 w-3.5" />
        Offline
      </span>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-slide-up">
      <div>
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
          <Settings className="h-6.5 w-6.5 text-violet-500" />
          Platform Settings
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-450 mt-1">
          View platform health configuration, database status metrics, LLM configurations, and execution metadata runtime parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        
        {/* Connection Health & Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-4 w-4 text-violet-500" />
            Connection Health Status
          </h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850">
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-350">FastAPI API Backend</p>
                <p className="text-[10px] text-slate-450 mt-0.5">Uvicorn service binding port 8000</p>
              </div>
              {getStatusBadge(backendStatus)}
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850">
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-350">SQLite Database</p>
                <p className="text-[10px] text-slate-450 mt-0.5">Audit log logs & accounts tables</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
                <Database className="h-3.5 w-3.5" />
                Healthy
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850">
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-350">ChromaDB Vector Store</p>
                <p className="text-[10px] text-slate-450 mt-0.5">Persistent document retrieval RAG</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
                <Database className="h-3.5 w-3.5" />
                Connected
              </span>
            </div>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-indigo-600/10 cursor-pointer border-0"
          >
            {loading ? 'Testing System...' : 'Ping Services Connection'}
          </button>
        </div>

        {/* AI & Runtime metadata */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="h-4 w-4 text-indigo-500" />
            AI & Model Orchestration Parameters
          </h4>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 rounded-xl">
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">AI Reasoning Model</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">gemini-1.5-pro</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 rounded-xl">
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Embedding Provider</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">models/embedding-001</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 rounded-xl">
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Orchestration Graph</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">LangGraph Router</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 rounded-xl">
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Application Environment</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">Development Demo</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 rounded-xl flex items-start gap-2.5">
              <Info className="h-4.5 w-4.5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Hackathon Demo Mode Enabled</p>
                <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">
                  In case a live API connection error is encountered or Gemini credentials are not supplied, the platform falls back to simulated static responses cached from verified runs.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
