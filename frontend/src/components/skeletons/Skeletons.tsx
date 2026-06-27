import React from 'react';

/* ── Skeleton primitives ─────────────────────────────────────── */

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton rounded ${className}`} />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBox
        key={i}
        className={`h-3 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

/* ── Recommendation card skeleton (3 cards) ──────────────────── */
export const RecommendationCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
    {/* Badge row */}
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-5 w-20" />
      <SkeletonBox className="h-5 w-16" />
    </div>
    {/* Title */}
    <SkeletonBox className="h-4 w-3/4" />
    {/* Body lines */}
    <SkeletonText lines={2} />
    {/* Buttons */}
    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
      <SkeletonBox className="h-7 flex-1 rounded-lg" />
      <SkeletonBox className="h-7 flex-1 rounded-lg" />
      <SkeletonBox className="h-7 flex-1 rounded-lg" />
    </div>
  </div>
);

export const RecommendationsSkeleton: React.FC = () => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-4 w-48" />
      <SkeletonBox className="h-4 w-20" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <RecommendationCardSkeleton />
      <RecommendationCardSkeleton />
      <RecommendationCardSkeleton />
    </div>
  </div>
);

/* ── Account card skeleton ───────────────────────────────────── */
export const AccountCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
    <div className="flex items-start justify-between">
      <div className="space-y-1.5">
        <SkeletonBox className="h-4 w-32" />
        <SkeletonBox className="h-3 w-20" />
      </div>
      <SkeletonBox className="h-6 w-16 rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <SkeletonBox className="h-12 rounded-xl" />
      <SkeletonBox className="h-12 rounded-xl" />
    </div>
  </div>
);

/* ── Stats panel skeleton ────────────────────────────────────── */
export const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-3 gap-4">
    {[0, 1, 2].map(i => (
      <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
        <SkeletonBox className="h-3 w-24" />
        <SkeletonBox className="h-7 w-16" />
      </div>
    ))}
  </div>
);
