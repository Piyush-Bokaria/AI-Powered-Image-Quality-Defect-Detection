import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface ImagePreviewProps {
  imageUrl: string;
  heatmapUrl?: string;
  alt?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUrl,
  heatmapUrl,
  alt = 'Analyzed image',
}) => {
  const [showHeatmap, setShowHeatmap] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-3"
    >
      {/* Image container */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-auto max-h-[400px] object-contain"
        />

        {/* Heatmap overlay */}
        <AnimatePresence>
          {showHeatmap && heatmapUrl && (
            <motion.img
              src={heatmapUrl}
              alt="Quality heatmap overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full object-contain mix-blend-screen"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Heatmap toggle */}
      {heatmapUrl && (
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={cn(
            'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 cursor-pointer',
            showHeatmap
              ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
              : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.15]'
          )}
          aria-pressed={showHeatmap}
          aria-label="Toggle heatmap overlay"
        >
          {showHeatmap ? (
            <Layers className="h-3.5 w-3.5" />
          ) : (
            <ImageIcon className="h-3.5 w-3.5" />
          )}
          {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
        </button>
      )}
    </motion.div>
  );
};
