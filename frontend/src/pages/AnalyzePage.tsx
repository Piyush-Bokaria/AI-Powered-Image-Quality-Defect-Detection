import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanSearch, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import { DropZone } from '../components/DropZone';
import { ResultsPanel } from '../components/ResultsPanel';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { useAnalyze } from '../hooks/useAnalyze';

export const AnalyzePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { analyze, result, status, error, reset } = useAnalyze();
  const { toast } = useToast();

  const handleFileSelect = useCallback(
    (f: File) => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
      if (!validTypes.includes(f.type)) {
        toast('Please upload a valid image file (JPEG, PNG, WebP, BMP, or TIFF).', 'error');
        return;
      }

      // Validate file size (max 50MB)
      if (f.size > 50 * 1024 * 1024) {
        toast('File size exceeds 50MB limit.', 'error');
        return;
      }

      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      reset();
    },
    [reset, toast]
  );

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    try {
      await analyze(file);
      toast('Analysis complete!', 'success');
    } catch {
      toast('Analysis failed. Please try again.', 'error');
    }
  }, [file, analyze, toast]);

  const handleReset = useCallback(() => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    reset();
  }, [previewUrl, reset]);

  const isProcessing = status === 'uploading' || status === 'analyzing';

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <AnimatePresence mode="wait">
        {/* ── Idle / file selection state ───────────────────────────── */}
        {status === 'idle' && !file && (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8 text-center">
              <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
                Analyze Image Quality
              </h2>
              <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
                Upload an image to detect quality issues, defects, and get a comprehensive quality assessment.
              </p>
            </div>
            <DropZone onFileSelect={handleFileSelect} />
          </motion.div>
        )}

        {/* ── File selected, ready to analyze ──────────────────────── */}
        {(status === 'idle' && file && previewUrl) && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Preview */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
              <img
                src={previewUrl}
                alt={`Preview of ${file.name}`}
                className="w-full max-h-[400px] object-contain"
              />
            </div>

            {/* File info + actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB · {file.type.split('/')[1]?.toUpperCase()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Change
                </Button>
                <Button size="sm" onClick={handleAnalyze}>
                  <ScanSearch className="h-3.5 w-3.5" />
                  Analyze
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Processing state ─────────────────────────────────────── */}
        {isProcessing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Progress indicator */}
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="relative">
                <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
                <div className="absolute inset-0 rounded-full blur-xl bg-cyan-400/20" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-200">
                  {status === 'uploading' ? 'Uploading image…' : 'Analyzing quality…'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  This may take a few seconds
                </p>
              </div>
            </div>

            {/* Skeleton results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="aspect-video" />
              <div className="space-y-4">
                <Skeleton className="h-52" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            </div>
            <Skeleton className="h-32" />
          </motion.div>
        )}

        {/* ── Error state ──────────────────────────────────────────── */}
        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-5 py-16"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-medium text-zinc-200">
                Analysis Failed
              </h3>
              <p className="mt-1.5 max-w-sm text-sm text-zinc-500">
                {error || 'Something went wrong. Please try again.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleReset}>
                <RotateCcw className="h-3.5 w-3.5" />
                Start Over
              </Button>
              <Button onClick={handleAnalyze}>
                <ScanSearch className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Success / results state ──────────────────────────────── */}
        {status === 'success' && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Header with reset */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
                  Analysis Results
                </h2>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  ID: {result.id}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <ScanSearch className="h-3.5 w-3.5" />
                New Analysis
              </Button>
            </div>

            <ResultsPanel result={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
