import React from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { formatStatKey } from '../lib/utils';
import type { Stats } from '../types';

interface TechReadoutProps {
  stats: Stats;
}

export const TechReadout: React.FC<TechReadoutProps> = ({ stats }) => {
  const entries = Object.entries(stats).filter(
    ([, v]) => v !== undefined
  ) as [string, number][];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
        <Terminal className="h-3.5 w-3.5 text-cyan-400/70" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
          Technical Readout
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/[0.03]">
        {entries.map(([key, value], i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 + i * 0.05 }}
            className="bg-[#0a0a0f] px-4 py-3"
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 mb-1">
              {formatStatKey(key)}
            </p>
            <p className="font-mono text-sm font-semibold text-zinc-200 tabular-nums">
              {typeof value === 'number' && value < 1 && value >= 0
                ? value.toFixed(2)
                : typeof value === 'number'
                  ? value.toFixed(1)
                  : value}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
