import React, { useState } from 'react';
import { BookOpen, HelpCircle, X } from 'lucide-react';
import type { Recommendation } from '../lib/api';

interface EvidencePopoverProps {
  evidence: Recommendation['evidence'];
  title: string;
}

export const EvidencePopover: React.FC<EvidencePopoverProps> = ({ evidence, title }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!evidence) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-[10px] text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 align-baseline"
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
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border-0"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="flex items-start gap-3 pr-8">
              <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 leading-snug">
                  Evidence Citation
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-450 mt-0.5">
                  Supporting context for: <span className="font-semibold text-slate-650 dark:text-slate-350">"{title}"</span>
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-left">
              {evidence.supported ? (
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 p-4 rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <span>SOURCE:</span>
                    <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-450 px-2 py-0.5 rounded font-mono">
                      {evidence.source}
                    </span>
                    <span>SECTION:</span>
                    <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                      {evidence.section}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-450 uppercase tracking-wider">
                      Quoted Passage:
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-2 border-indigo-500/50 pl-3 font-serif bg-white dark:bg-slate-950 p-2.5 rounded shadow-sm">
                      "{evidence.quoted_text}"
                    </p>
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
