import React from 'react';
import { Compass, Lightbulb } from 'lucide-react';

interface PlannerDecision {
  interaction_type?: string;
  agents?: string[];
  rationale?: string;
  detected_entities?: string[];
}

interface PlannerExplanationCardProps {
  planner: PlannerDecision;
}

const AGENT_COLOR: Record<string, string> = {
  ingestion:      'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  retrieval:      'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  analysis:       'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  recommendation: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  explanation:    'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
  evaluation:     'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
};

const TYPE_COLOR: Record<string, string> = {
  SALES_CALL:         'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  SUPPORT_ESCALATION: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  RENEWAL:            'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  QBR:                'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
};

export const PlannerExplanationCard: React.FC<PlannerExplanationCardProps> = ({ planner }) => {
  const typeColor = planner.interaction_type
    ? (TYPE_COLOR[planner.interaction_type] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300')
    : '';

  return (
    <div className="animate-slide-down bg-gradient-to-br from-indigo-50/80 to-violet-50/50 dark:from-indigo-950/30 dark:to-violet-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-indigo-500 flex items-center justify-center shadow-sm">
          <Compass className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Planner Agent</p>
          {planner.interaction_type && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${typeColor}`}>
              {planner.interaction_type.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Rationale */}
      {planner.rationale && (
        <div className="flex gap-2 items-start">
          <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
          <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
            "{planner.rationale}"
          </p>
        </div>
      )}

      {/* Agent routing */}
      {planner.agents && planner.agents.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Agent Routing Order:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {planner.agents.map((agent, i) => (
              <span
                key={agent}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${AGENT_COLOR[agent] ?? 'bg-slate-100 text-slate-600'}`}
              >
                <span className="opacity-60">{i + 1}.</span>
                {agent}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detected entities */}
      {planner.detected_entities && planner.detected_entities.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Detected Stakeholders:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {planner.detected_entities.map((ent, i) => (
              <span key={i} className="text-[11px] font-semibold bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg">
                {ent}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
