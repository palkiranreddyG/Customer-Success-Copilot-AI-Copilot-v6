import React, { useState } from 'react';
import { Check, X, Edit, Send, Loader2 } from 'lucide-react';
import { RecommendationCard } from './RecommendationCard';
import { postRecommendationDecision } from '../lib/api';
import type { Recommendation } from '../lib/api';
import { useToast } from './ToastProvider';

interface ApprovalQueueProps {
  recommendations: Recommendation[];
  onDecisionRecorded: () => void;
}

const DECISION_COLORS = {
  approved: {
    badge: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    icon: <Check className="h-3.5 w-3.5" />,
    label: 'APPROVED',
  },
  rejected: {
    badge: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-900/40 text-rose-700 dark:text-rose-300',
    icon: <X className="h-3.5 w-3.5" />,
    label: 'REJECTED',
  },
  modified: {
    badge: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200/60 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    icon: <Edit className="h-3.5 w-3.5" />,
    label: 'MODIFIED',
  },
};

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ recommendations, onDecisionRecorded }) => {
  const { success, error: toastError } = useToast();
  const [decisions, setDecisions] = useState<Record<string, { decision: string; note?: string }>>({});
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [pendingDecision, setPendingDecision] = useState<'rejected' | 'modified' | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleApprove = async (recId: string, title: string) => {
    if (!recId) return;
    setSubmittingId(recId);
    try {
      await postRecommendationDecision(recId, 'approved');
      setDecisions(prev => ({ ...prev, [recId]: { decision: 'approved' } }));
      success('Decision recorded', `"${title}" marked as approved.`);
      onDecisionRecorded();
    } catch (err) {
      toastError('Decision failed', 'Could not record approval. Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  const startNoteInput = (recId: string, type: 'rejected' | 'modified') => {
    setActiveNoteId(recId);
    setPendingDecision(type);
    setNoteText('');
  };

  const submitNoteDecision = async (recId: string, title: string) => {
    if (!recId || !pendingDecision) return;
    setSubmittingId(recId);
    try {
      await postRecommendationDecision(recId, pendingDecision, noteText);
      setDecisions(prev => ({ ...prev, [recId]: { decision: pendingDecision, note: noteText } }));
      setActiveNoteId(null);
      setPendingDecision(null);
      setNoteText('');
      if (pendingDecision === 'rejected') {
        success('Decision recorded', `"${title}" rejected — will be excluded from future runs.`);
      } else {
        success('Decision recorded', `"${title}" modified and saved to audit log.`);
      }
      onDecisionRecorded();
    } catch (err) {
      toastError('Decision failed', 'Could not record decision. Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  const pending = recommendations.filter(r => !decisions[r.id || '']).length;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
          Recommendation Approval Queue
        </h3>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
          pending > 0
            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
            : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
        }`}>
          {pending > 0 ? `${pending} Pending` : 'All Reviewed'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec) => {
          const recId = rec.id || '';
          const decisionState = decisions[recId];
          const isSubmitting = submittingId === recId;

          return (
            <div
              key={recId || rec.action_title}
              className="card-lift bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-4"
            >
              <RecommendationCard recommendation={rec} />

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                {decisionState ? (
                  // Decided state — show badge
                  <div className={`flex items-start gap-2 p-2.5 rounded-xl border ${DECISION_COLORS[decisionState.decision as keyof typeof DECISION_COLORS]?.badge}`}>
                    <span className="shrink-0 mt-0.5">
                      {DECISION_COLORS[decisionState.decision as keyof typeof DECISION_COLORS]?.icon}
                    </span>
                    <div>
                      <p className="text-[10px] font-bold">
                        {DECISION_COLORS[decisionState.decision as keyof typeof DECISION_COLORS]?.label}
                      </p>
                      {decisionState.note && (
                        <p className="text-[9px] opacity-75 italic mt-0.5">"{decisionState.note}"</p>
                      )}
                    </div>
                  </div>
                ) : activeNoteId === recId ? (
                  // Note input state
                  <div className="space-y-2 animate-slide-down">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Reason for {pendingDecision === 'rejected' ? 'Rejection' : 'Modification'}:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && noteText.trim() && submitNoteDecision(recId, rec.action_title)}
                        placeholder="e.g. Too aggressive for this account…"
                        className="flex-1 text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                        disabled={isSubmitting}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => submitNoteDecision(recId, rec.action_title)}
                        disabled={isSubmitting || !noteText.trim()}
                        className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 border-0"
                      >
                        {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setActiveNoteId(null); setPendingDecision(null); }}
                        disabled={isSubmitting}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-lg cursor-pointer border-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Action buttons
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleApprove(recId, rec.action_title)}
                      className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 border border-emerald-200/50 dark:border-emerald-900/30 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => startNoteInput(recId, 'rejected')}
                      className="flex-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 border border-rose-200/50 dark:border-rose-900/30 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => startNoteInput(recId, 'modified')}
                      className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 border border-slate-200/50 dark:border-slate-800/30 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <Edit className="h-3 w-3" />
                      Modify
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
