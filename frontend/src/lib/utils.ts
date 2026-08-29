import type { Severity, QualityLabel } from '../types';

/* ── className merger (shadcn pattern) ───────────────────────────── */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/* ── Score → color mapping ───────────────────────────────────────── */
export function scoreColor(score: number): string {
  if (score >= 70) return '#22c55e'; // green
  if (score >= 40) return '#eab308'; // amber
  return '#ef4444';                  // red
}

export function scoreLabel(score: number): string {
  if (score >= 70) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

/* ── Severity → Tailwind color class ─────────────────────────────── */
export function severityColor(severity: Severity): string {
  const s = String(severity).toLowerCase();
  if (s === 'critical') return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (s === 'high') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  if (s === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-green-500/20 text-green-400 border-green-500/30';
}

/* ── Quality label → style ───────────────────────────────────────── */
export function qualityLabelStyle(label: QualityLabel): string {
  const l = String(label).toUpperCase();
  if (l === 'ACCEPTABLE') return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (l === 'DEGRADED') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}

/* ── Date formatter ──────────────────────────────────────────────── */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ── Format stat key from snake_case to Title Case ───────────────── */
export function formatStatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
