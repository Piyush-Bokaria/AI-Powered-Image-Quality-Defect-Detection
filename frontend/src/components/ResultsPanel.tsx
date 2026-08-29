import React from 'react';
import { motion } from 'framer-motion';
import { QualityGauge } from './QualityGauge';
import { IssueList } from './IssueList';
import { TechReadout } from './TechReadout';
import { ImagePreview } from './ImagePreview';
import { cn, qualityLabelStyle } from '../lib/utils';

interface ResultsPanelProps {
  result: any;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ result }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Top section: Image + Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Image */}
        {(result.image_url || result.img_url) && (
          <ImagePreview
            imageUrl={result.image_url || result.img_url}
            heatmapUrl={result.heatmap_url}
            alt="Analyzed image"
          />
        )}

        {/* Right: Score + Label + Issues */}
        <div className="space-y-6">
          {/* Score card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-6"
          >
            <QualityGauge score={result.quality_score} />

            {/* Label badge */}
            <span
              className={cn(
                'rounded-lg border px-3 py-1 text-xs font-bold uppercase tracking-[0.15em]',
                qualityLabelStyle(result.quality_label)
              )}
            >
              {result.quality_label}
            </span>
          </motion.div>

          {/* Issues */}
          <IssueList issues={result.issues} />
        </div>
      </div>

      {/* Technical readout */}
      <TechReadout stats={result.stats || result.statistics} />
    </motion.div>
  );
};
