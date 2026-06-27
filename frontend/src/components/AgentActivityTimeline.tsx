import React from 'react';
import {
  Compass, FileCheck, Database, Brain, Award, FlaskConical, ShieldCheck,
  CheckCircle2, Loader2, Circle,
} from 'lucide-react';
import type { PipelineStatusResponse } from '../lib/api';

interface Step {
  key: string;
  label: string;
  summary: (data: PipelineStatusResponse) => string;
  icon: React.ReactNode;
  isDone: (data: PipelineStatusResponse) => boolean;
  isActive: (data: PipelineStatusResponse) => boolean;
}

const STEPS: Step[] = [
  {
    key: 'planner',
    label: 'Planner',
    icon: <Compass className="h-3 w-3" />,
    isDone:   d => !!(d.planner_decision?.interaction_type),
    isActive: d => d.status === 'running' && !d.planner_decision?.interaction_type,
    summary:  d => d.planner_decision
      ? `Classified as ${d.planner_decision.interaction_type} · routing ${d.planner_decision.agents?.length ?? 0} agents`
      : 'Classifying interaction type and planning agent routes…',
  },
  {
    key: 'ingestion',
    label: 'Ingestion',
    icon: <FileCheck className="h-3 w-3" />,
    isDone:   d => !!(d.planner_decision?.detected_entities !== undefined),
    isActive: d => d.status === 'running' && !!(d.planner_decision?.interaction_type) && d.planner_decision?.detected_entities === undefined,
    summary:  d => d.planner_decision?.detected_entities !== undefined
      ? `Cleaned transcript · ${d.planner_decision.detected_entities?.length ?? 0} entities detected`
      : 'Normalising speaker turns and extracting entities…',
  },
  {
    key: 'retrieval',
    label: 'Retrieval',
    icon: <Database className="h-3 w-3" />,
    isDone:   d => (d.retrieved_chunks?.length ?? 0) > 0,
    isActive: d => d.status === 'running' && (d.retrieved_chunks?.length ?? 0) === 0 && !!(d.planner_decision?.detected_entities !== undefined),
    summary:  d => (d.retrieved_chunks?.length ?? 0) > 0
      ? `Retrieved ${d.retrieved_chunks.length} playbook chunks from KB + memory`
      : 'Querying ChromaDB knowledge base and account memory…',
  },
  {
    key: 'analysis',
    label: 'Analysis',
    icon: <Brain className="h-3 w-3" />,
    isDone:   d => !!(d.analysis && Object.keys(d.analysis).length > 0),
    isActive: d => d.status === 'running' && (d.retrieved_chunks?.length ?? 0) > 0 && !(d.analysis && Object.keys(d.analysis).length > 0),
    summary:  d => d.analysis?.risks?.length
      ? `${d.analysis.risks.length} risks · ${d.analysis.opportunities?.length ?? 0} opportunities identified`
      : 'Analysing risks, opportunities, and missing context…',
  },
  {
    key: 'recommendation',
    label: 'Recommendation',
    icon: <Award className="h-3 w-3" />,
    isDone:   d => (d.recommendations?.length ?? 0) > 0,
    isActive: d => d.status === 'running' && !!(d.analysis) && (d.recommendations?.length ?? 0) === 0,
    summary:  d => (d.recommendations?.length ?? 0) > 0
      ? `${d.recommendations.length} ranked next-best actions generated`
      : 'Generating ranked recommendations with memory-aware conflict avoidance…',
  },
  {
    key: 'explanation',
    label: 'Explanation',
    icon: <FlaskConical className="h-3 w-3" />,
    isDone:   d => (d.recommendations?.length ?? 0) > 0 && d.recommendations.some(r => r.evidence),
    isActive: d => d.status === 'running' && (d.recommendations?.length ?? 0) > 0 && !d.recommendations.some(r => r.evidence),
    summary:  d => d.recommendations?.some(r => r.evidence)
      ? `Evidence passages cited for ${d.recommendations.filter(r => r.evidence).length} recommendations`
      : 'Retrieving citation evidence for each recommendation…',
  },
  {
    key: 'evaluation',
    label: 'Evaluation',
    icon: <ShieldCheck className="h-3 w-3" />,
    isDone:   d => d.status === 'complete',
    isActive: d => d.status === 'running' && d.recommendations?.some(r => r.evidence) === true,
    summary:  d => d.status === 'complete'
      ? `Quality gate passed · ${d.recommendations?.filter(r => r.evaluation_passed).length ?? 0}/${d.recommendations?.length ?? 0} recommendations approved`
      : 'Running evaluation quality gate checks…',
  },
];

interface AgentActivityTimelineProps {
  statusData: PipelineStatusResponse;
  isRunning: boolean;
}

export const AgentActivityTimeline: React.FC<AgentActivityTimelineProps> = ({ statusData, isRunning }) => {
  return (
    <div className="space-y-0">
      {STEPS.map((step, idx) => {
        const done   = step.isDone(statusData);
        const active = isRunning && step.isActive(statusData);
        const pending = !done && !active;

        return (
          <div
            key={step.key}
            className={`relative flex gap-3 ${idx < STEPS.length - 1 ? 'pb-5' : ''} animate-step-appear`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className="absolute left-[13px] top-7 bottom-0 w-px"
                style={{
                  background: done
                    ? 'linear-gradient(to bottom, rgb(99 102 241 / 0.5), rgb(99 102 241 / 0.15))'
                    : 'linear-gradient(to bottom, rgb(148 163 184 / 0.25), rgb(148 163 184 / 0.1))',
                }}
              />
            )}

            {/* Step icon bubble */}
            <div className={`
              relative z-10 shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-white shadow-sm
              ${done   ? 'bg-indigo-500' : ''}
              ${active ? 'bg-amber-500 animate-pulse-dot' : ''}
              ${pending ? 'bg-slate-300 dark:bg-slate-700' : ''}
            `}>
              {done   && <CheckCircle2 className="h-3.5 w-3.5" />}
              {active && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {pending && <Circle className="h-3 w-3 opacity-50" />}
            </div>

            {/* Step content */}
            <div className="flex-1 pt-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`
                  text-xs font-bold uppercase tracking-wide
                  ${done   ? 'text-indigo-600 dark:text-indigo-400' : ''}
                  ${active ? 'text-amber-600 dark:text-amber-400' : ''}
                  ${pending ? 'text-slate-400 dark:text-slate-600' : ''}
                `}>
                  {step.label}
                </span>
                {done && (
                  <span className="text-[10px] px-1.5 py-0.25 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 font-semibold">
                    Done
                  </span>
                )}
                {active && (
                  <span className="text-[10px] px-1.5 py-0.25 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold animate-pulse">
                    Running
                  </span>
                )}
              </div>
              <p className={`
                text-[11px] mt-0.5 leading-relaxed
                ${done   ? 'text-slate-600 dark:text-slate-400' : ''}
                ${active ? 'text-amber-700 dark:text-amber-300/80 italic' : ''}
                ${pending ? 'text-slate-400 dark:text-slate-600' : ''}
              `}>
                {step.summary(statusData)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
