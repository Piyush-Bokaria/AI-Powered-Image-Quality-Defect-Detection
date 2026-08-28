import { useState, useEffect, useCallback } from 'react';
import { getAnalysis } from '../api/client';
import type { AnalysisResult } from '../types';

export function useAnalysis(id: string | null) {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getAnalysis(id);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
