import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { AnalysisCard } from '../components/AnalysisCard';
import { ResultsPanel } from '../components/ResultsPanel';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { useHistory } from '../hooks/useHistory';
import { useAnalysis } from '../hooks/useAnalysis';

export const HistoryPage: React.FC = () => {
  const { data, loading, error, refetch } = useHistory();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail, loading: detailLoading } = useAnalysis(selectedId);

  const handleBack = useCallback(() => {
    setSelectedId(null);
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <AnimatePresence mode="wait">
        {/* ── Detail view ──────────────────────────────────────────── */}
        {selectedId ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to History
            </Button>

            {detailLoading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Skeleton className="aspect-video" />
                  <div className="space-y-4">
                    <Skeleton className="h-52" />
                    <Skeleton className="h-20" />
                  </div>
                </div>
                <Skeleton className="h-32" />
              </div>
            ) : detail ? (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
                    Analysis Detail
                  </h2>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">
                    ID: {detail.id}
                  </p>
                </div>
                <ResultsPanel result={detail} />
              </>
            ) : (
              <EmptyState
                title="Analysis not found"
                description="This analysis may have been removed."
              />
            )}
          </motion.div>
        ) : (
          /* ── Grid view ───────────────────────────────────────────── */
          <motion.div
            key="grid"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
                  Analysis History
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {loading
                    ? 'Loading…'
                    : `${data.length} ${data.length === 1 ? 'analysis' : 'analyses'}`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4 text-center">
                <p className="text-sm text-red-400">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refetch}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Loading skeletons */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && data.length === 0 && <EmptyState />}

            {/* Grid */}
            {!loading && data.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map((item, i) => (
                  <AnalysisCard
                    key={item.id}
                    analysis={item}
                    index={i}
                    onClick={() => setSelectedId(item.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
