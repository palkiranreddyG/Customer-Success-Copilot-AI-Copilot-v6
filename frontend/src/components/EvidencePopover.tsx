import React, { useState } from 'react';
import { BookOpen, HelpCircle, X, Info, Award, AlignLeft } from 'lucide-react';
import type { Recommendation } from '../lib/api';

interface EvidencePopoverProps {
  evidence: Recommendation['evidence'];
  title: string;
  businessImpact?: string;
  confidence?: number;
}

export const EvidencePopover: React.FC<EvidencePopoverProps> = ({ 
  evidence, 
  title,
  businessImpact,
  confidence 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!evidence) return null;

  const relevancePct = confidence ? Math.round(confidence * 100) : 85;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-[10px] text-indigo-650 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 align-baseline"
      >
        <BookOpen className="h-3 w-3" />
        View Cited Playbook Evidence
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border-0"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="flex items-start gap-3 pr-8 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 leading-snug">
                  Evidence Citation
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-0.5">
                  Supporting context for: <span className="font-semibold text-slate-600 dark:text-slate-350">"{title}"</span>
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-left">
              {evidence.supported ? (
                <div className="space-y-4">
                  {/* Playbook & Section metadata */}
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                      <span className="block text-[9px] text-slate-400 mb-0.5">PLAYBOOK:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono truncate block">
                        {evidence.source}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                      <span className="block text-[9px] text-slate-400 mb-0.5">SECTION:</span>
                      <span className="text-slate-700 dark:text-slate-300 truncate block">
                        {evidence.section}
                      </span>
                    </div>
                  </div>

                  {/* Quoted Evidence */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-550 dark:text-slate-450 uppercase tracking-wider flex items-center gap-1">
                      <AlignLeft className="h-3.5 w-3.5 text-slate-400" />
                      Quoted Evidence:
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-2 border-indigo-500/50 pl-3 font-serif bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl">
                      "{evidence.quoted_text}"
                    </p>
                  </div>

                  {/* Reasoning */}
                  {businessImpact && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-550 dark:text-slate-450 uppercase tracking-wider flex items-center gap-1">
                        <Info className="h-3.5 w-3.5 text-slate-400" />
                        Reasoning & Action Impact:
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10">
                        {businessImpact}
                      </p>
                    </div>
                  )}

                  {/* Relevance */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-150 dark:border-slate-850">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 text-slate-400" />
                      Platform Relevance Score:
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                      relevancePct >= 80 ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 border-emerald-200/50' : 
                      relevancePct >= 60 ? 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border-amber-200/50' : 
                      'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20 border-rose-200/50'
                    }`}>
                      {relevancePct}% Match
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl flex items-start gap-2.5 text-xs text-amber-850 dark:text-amber-300">
                  <HelpCircle className="h-4.5 w-4.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-bold">No direct playbook evidence matches this action.</p>
                    <p className="text-[11px] mt-0.5 leading-relaxed text-amber-755 dark:text-amber-400/80">
                      The CS analyst recommended this action based on general customer success principles and metrics, as no matching playbook guidelines were retrieved from ChromaDB.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 font-bold rounded-xl text-xs transition-colors cursor-pointer border-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
