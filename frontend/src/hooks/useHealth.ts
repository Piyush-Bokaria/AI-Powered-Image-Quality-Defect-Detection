import { useState, useEffect, useRef } from 'react';
import { getHealth } from '../api/client';

export type SystemStatus = 'online' | 'offline' | 'checking';

export function useHealth(intervalMs = 30_000) {
  const [status, setStatus] = useState<SystemStatus>('checking');
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const health = await getHealth();
        if (!cancelled) {
          const s = health.status?.toLowerCase();
          setStatus(s === 'ok' || s === 'online' || s === 'healthy' ? 'online' : 'offline');
        }
      } catch {
        if (!cancelled) setStatus('offline');
      }
    };

    check();
    timer.current = setInterval(check, intervalMs);

    return () => {
      cancelled = true;
      if (timer.current) clearInterval(timer.current);
    };
  }, [intervalMs]);

  return status;
}
