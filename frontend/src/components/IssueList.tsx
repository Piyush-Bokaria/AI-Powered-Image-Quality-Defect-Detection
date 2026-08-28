import React from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Sun,
  SunDim,
  Zap,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { cn, severityColor } from '../lib/utils';
import type { Issue, IssueType } from '../types';

const issueIcons: Record<IssueType, React.ReactNode> = {
  blur: <Eye className="h-4 w-4" />,
  overexposure: <Sun className="h-4 w-4" />,
  underexposure: <SunDim className="h-4 w-4" />,
  noise: <Zap className="h-4 w-4" />,
  corruption: <AlertTriangle className="h-4 w-4" />,
  defect: <Search className="h-4 w-4" />,
};

const issueLabels: Record<IssueType, string> = {
  blur: 'Blur',
  overexposure: 'Overexposure',
  underexposure: 'Underexposure',
  noise: 'Noise',
  corruption: 'Corruption',
  defect: 'Defect',
};

interface IssueListProps {
  issues: Issue[];
}

export const IssueList: React.FC<IssueListProps> = ({ issues }) => {
  if (issues.length === 0) {
    return (
      <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.04] p-4 text-center">
        <p className="text-sm text-green-400">No issues detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500 mb-3">
        Detected Issues
      </h3>
      {issues.map((issue, i) => (
        <motion.div
          key={`${issue.type}-${i}`}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, duration: 0.3 }}
          className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
        >
          {/* Icon */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400">
            {issueIcons[issue.type]}
          </div>

          {/* Label */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200">
              {issueLabels[issue.type]}
            </p>
            {/* Confidence bar */}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-cyan-400/60"
                  initial={{ width: 0 }}
                  animate={{ width: `${issue.confidence * 100}%` }}
                  transition={{ delay: i * 0.08 + 0.2, duration: 0.5 }}
                />
              </div>
              <span className="text-[10px] font-mono text-zinc-500 tabular-nums w-8 text-right">
                {Math.round(issue.confidence * 100)}%
              </span>
            </div>
          </div>

          {/* Severity badge */}
          <span
            className={cn(
              'shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
              severityColor(issue.severity)
            )}
          >
            {issue.severity}
          </span>
        </motion.div>
      ))}
    </div>
  );
};
