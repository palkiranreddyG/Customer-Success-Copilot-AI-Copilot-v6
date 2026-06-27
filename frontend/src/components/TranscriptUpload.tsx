import React, { useState } from 'react';
import { runPipeline } from '../lib/api';
import type { Account } from '../lib/api';
import { UploadCloud, FileText, Sparkles, RefreshCw } from 'lucide-react';

interface TranscriptUploadProps {
  accounts: Account[];
  onUploadSuccess: (sessionId: string, accountId: string, text: string) => void;
}

const DEMO_TRANSCRIPT = `Customer Success Manager (CSM): Hi Sarah, thanks for hopping on our quarterly sync today. How have things been going with the platform over at TechBridge?

Sarah (TechBridge Admin): To be completely honest, we've been struggling. The recent downtime really hurt our support operations, and we are not seeing the ROI we expected. Our team is complaining about the complex interface.

CSM: I'm really sorry to hear that. I know the uptime issue last month was frustrating. Let's dive into the ROI concern. What features are they finding difficult?

Sarah: It's mostly the dashboard setup and reporting module. It takes hours to get a simple report. Because of this, my director is questioning our budget. If we can't get this resolved soon, we might have to look at other options. We're about 10 months into our 12-month contract, and renewal is definitely not guaranteed at this rate.

CSM: I completely understand. Your health score has dropped, and we want to turn this around. I'd like to schedule a dedicated training session for your team and loop in our product specialist. We can also discuss some pricing adjustments to make sure the value matches your investment.

Sarah: A training session would help, but we need concrete product improvements too. Let's see what you can pull together by next week.`;

export const TranscriptUpload: React.FC<TranscriptUploadProps> = ({ accounts, onUploadSuccess }) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set first account as default once accounts load
  React.useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleLoadDemo = () => {
    setTranscript(DEMO_TRANSCRIPT);
    // Find TechBridge or select first
    const techBridge = accounts.find(a => a.name.toLowerCase().includes('techbridge'));
    if (techBridge) {
      setSelectedAccountId(techBridge.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) {
      setError('Please select an account first.');
      return;
    }
    if (!transcript.trim()) {
      setError('Please paste or write transcript text.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await runPipeline(selectedAccountId, transcript);
      onUploadSuccess(res.session_id, selectedAccountId, transcript);
    } catch (err: any) {
      setError(err.message || 'Failed to start the pipeline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-glass p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-violet-500" />
            Upload Interaction Transcript
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Process a meeting transcript through the LangGraph AI pipeline.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadDemo}
          className="text-xs bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 text-violet-600 dark:text-violet-300 font-semibold px-3.5 py-1.5 rounded-xl border border-violet-100 dark:border-violet-800/50 transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
        >
          <FileText className="h-3.5 w-3.5" />
          Load Demo Transcript
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account Selector */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="account-selector" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Select Client Account
          </label>
          <select
            id="account-selector"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all"
          >
            {accounts.length === 0 ? (
              <option value="">No accounts found</option>
            ) : (
              accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} — Health: {acc.health_score}% | ARR: ${(acc.arr / 1000).toFixed(0)}k
                </option>
              ))
            )}
          </select>
        </div>

        {/* Transcript Textarea */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="transcript-input" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Transcript Text
          </label>
          <textarea
            id="transcript-input"
            rows={8}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste raw conversation log, meeting notes, or chat logs here..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all font-sans resize-y leading-relaxed"
          />
        </div>

        {error && (
          <div className="p-3.5 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0"></span>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedAccountId || !transcript.trim()}
          className="w-full px-5 py-3 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4.5 w-4.5 animate-spin" />
              Initializing Orchestration Graph...
            </>
          ) : (
            <>
              <Sparkles className="h-4.5 w-4.5" />
              Run Agent Pipeline
            </>
          )}
        </button>
      </form>
    </div>
  );
};
