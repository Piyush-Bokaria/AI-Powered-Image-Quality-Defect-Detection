import React from 'react';
import { motion } from 'framer-motion';
import { cn, qualityLabelStyle, scoreColor, formatDate } from '../lib/utils';
import type { AnalysisSummary } from '../types';

interface AnalysisCardProps {
  analysis: AnalysisSummary;
  onClick: () => void;
  index?: number;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({
  analysis,
  onClick,
  index = 0,
}) => {
  const color = scoreColor(analysis.quality_score);

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] text-left transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 cursor-pointer w-full"
      aria-label={`View analysis ${analysis.id}, score ${analysis.quality_score}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-white/[0.02]">
        {analysis.image_url ? (
          <img
            src={analysis.image_url}
            alt={`Analysis ${analysis.id}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-3xl text-zinc-700">📷</span>
          </div>
        )}

        {/* Score badge (top-right) */}
        <div
          className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-xl text-sm font-mono font-bold"
          style={{
            backgroundColor: `${color}15`,
            borderColor: `${color}30`,
            color,
          }}
        >
          {analysis.quality_score}
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span
          className={cn(
            'rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            qualityLabelStyle(analysis.quality_label)
          )}
        >
          {analysis.quality_label}
        </span>
        <span className="text-[11px] font-mono text-zinc-500">
          {formatDate(analysis.created_at)}
        </span>
      </div>
    </motion.button>
  );
};
