import React from 'react';
import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No analyses yet',
  description = 'Upload an image on the Analyze page to get started.',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-5">
        <Inbox className="h-7 w-7 text-zinc-600" />
      </div>
      <h3 className="text-base font-medium text-zinc-400">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-zinc-600">{description}</p>
    </motion.div>
  );
};
