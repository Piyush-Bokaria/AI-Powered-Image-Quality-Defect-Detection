import { useState, useCallback } from 'react';
import { analyzeImage } from '../api/client';
import type { AnalysisResult } from '../types';

export type AnalyzeStatus = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

export function useAnalyze() {
  const [status, setStatus] = useState<AnalyzeStatus>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (file: File) => {
    setStatus('uploading');
    setError(null);
    setResult(null);

    try {
      // Brief uploading phase then transition to analyzing
      await new Promise((r) => setTimeout(r, 400));
      setStatus('analyzing');

      const data = await analyzeImage(file);
      setResult(data);
      setStatus('success');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return { analyze, result, status, error, reset };
}
