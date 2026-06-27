import React from 'react';
import { ConfidenceBadge } from './ConfidenceBadge';
import { RiskBadge } from './RiskBadge';
import { EvidencePopover } from './EvidencePopover';
import { AlertTriangle } from 'lucide-react';
import type { Recommendation } from '../lib/api';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const { 
    action_title, 
    action_type, 
    confidence, 
    priority, 
    business_impact,
    evidence,
    evaluation_status
  } = recommendation;

  let barColor = 'bg-rose-500';
  if (confidence >= 0.8) barColor = 'bg-emerald-500';
  else if (confidence >= 0.6) barColor = 'bg-amber-500';

  return (
    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl p-4 shadow-sm hover:border-slate-200 dark:hover:border-slate-800 transition-all space-y-3 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <RiskBadge actionType={action_type} />
            {evaluation_status === 'flagged_low_confidence' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/30 animate-pulse">
                <AlertTriangle className="h-3 w-3" />
                LOW QUALITY
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded">
              P{priority}
            </span>
            <ConfidenceBadge confidence={confidence} />
          </div>
        </div>
        
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-250 leading-snug">
          {action_title}
        </h4>
        
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
          "{business_impact}"
        </p>
      </div>

      <div className="space-y-2 pt-1.5">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium">
            <span>Confidence Score</span>
            <span>{Math.round(confidence * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
            <div 
              className={`h-full ${barColor} transition-all duration-500`} 
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>

        {evidence && (
          <div className="pt-2 flex justify-start border-t border-slate-200/50 dark:border-slate-800/80">
            <EvidencePopover evidence={evidence} title={action_title} />
          </div>
        )}
      </div>
    </div>
  );
};
