import type {
  AnalysisResult,
  AnalysisSummary,
  HealthStatus,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

/* ═══════════════════════════════════════════════════════════════════
   MOCK DATA — used when the backend is unreachable so the UI is
   fully demo-able standalone.
   ═══════════════════════════════════════════════════════════════════ */

const MOCK_DELAY_MS = 1200;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MOCK_RESULTS: AnalysisResult[] = [
  {
    id: 'mock-1',
    quality_score: 87,
    quality_label: 'ACCEPTABLE',
    issues: [
      { type: 'noise', severity: 'low', confidence: 0.23 },
    ],
    stats: {
      sharpness: 82.4,
      brightness: 0.61,
      contrast: 0.74,
      noise_level: 0.08,
      saturation: 0.55,
      dynamic_range: 6.8,
    },
    image_url: '',
    heatmap_url: undefined,
    created_at: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: 'mock-2',
    quality_score: 42,
    quality_label: 'DEGRADED',
    issues: [
      { type: 'blur', severity: 'high', confidence: 0.81 },
      { type: 'noise', severity: 'medium', confidence: 0.54 },
      { type: 'underexposure', severity: 'medium', confidence: 0.47 },
    ],
    stats: {
      sharpness: 31.2,
      brightness: 0.29,
      contrast: 0.41,
      noise_level: 0.34,
      saturation: 0.38,
      dynamic_range: 4.2,
    },
    image_url: '',
    heatmap_url: undefined,
    created_at: new Date(Date.now() - 7200_000).toISOString(),
  },
  {
    id: 'mock-3',
    quality_score: 18,
    quality_label: 'DEFECTIVE',
    issues: [
      { type: 'corruption', severity: 'critical', confidence: 0.95 },
      { type: 'blur', severity: 'high', confidence: 0.77 },
      { type: 'overexposure', severity: 'high', confidence: 0.68 },
      { type: 'defect', severity: 'medium', confidence: 0.51 },
    ],
    stats: {
      sharpness: 12.8,
      brightness: 0.88,
      contrast: 0.22,
      noise_level: 0.62,
      saturation: 0.15,
      dynamic_range: 2.1,
    },
    image_url: '',
    heatmap_url: undefined,
    created_at: new Date(Date.now() - 86400_000).toISOString(),
  },
];

let mockIdCounter = 4;

function createMockResult(imageFile: File): AnalysisResult {
  // Randomly pick a quality profile
  const profiles = [
    { score: 91, label: 'ACCEPTABLE' as const, issues: [{ type: 'noise' as const, severity: 'low' as const, confidence: 0.18 }] },
    { score: 74, label: 'ACCEPTABLE' as const, issues: [{ type: 'blur' as const, severity: 'low' as const, confidence: 0.32 }, { type: 'noise' as const, severity: 'low' as const, confidence: 0.21 }] },
    { score: 53, label: 'DEGRADED' as const, issues: [{ type: 'blur' as const, severity: 'medium' as const, confidence: 0.61 }, { type: 'underexposure' as const, severity: 'medium' as const, confidence: 0.45 }] },
    { score: 35, label: 'DEFECTIVE' as const, issues: [{ type: 'blur' as const, severity: 'high' as const, confidence: 0.82 }, { type: 'noise' as const, severity: 'high' as const, confidence: 0.71 }, { type: 'defect' as const, severity: 'critical' as const, confidence: 0.9 }] },
  ];
  const p = profiles[Math.floor(Math.random() * profiles.length)];
  const id = `mock-${mockIdCounter++}`;
  return {
    id,
    quality_score: p.score,
    quality_label: p.label,
    issues: p.issues,
    stats: {
      sharpness: +(Math.random() * 90 + 10).toFixed(1),
      brightness: +(Math.random() * 0.8 + 0.1).toFixed(2),
      contrast: +(Math.random() * 0.7 + 0.2).toFixed(2),
      noise_level: +(Math.random() * 0.6).toFixed(2),
      saturation: +(Math.random() * 0.8 + 0.1).toFixed(2),
      dynamic_range: +(Math.random() * 6 + 2).toFixed(1),
    },
    image_url: URL.createObjectURL(imageFile),
    created_at: new Date().toISOString(),
  };
}

// Store mock analyses so history works
const mockStore: AnalysisResult[] = [...MOCK_RESULTS];

/* ═══════════════════════════════════════════════════════════════════
   API CLIENT — tries real backend, falls back to mock data
   ═══════════════════════════════════════════════════════════════════ */

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/* ── POST /api/analyze ──────────────────────────────────────────── */
export async function analyzeImage(file: File): Promise<AnalysisResult> {
  try {
    const form = new FormData();
    form.append('image', file);
    const result = await apiFetch<AnalysisResult>('/api/analyze', {
      method: 'POST',
      body: form,
    });
    return result;
  } catch {
    console.warn('[api] Backend unreachable — using mock data');
    await sleep(MOCK_DELAY_MS);
    const result = createMockResult(file);
    mockStore.unshift(result);
    return result;
  }
}

/* ── GET /api/history ───────────────────────────────────────────── */
export async function getHistory(): Promise<AnalysisSummary[]> {
  try {
    return await apiFetch<AnalysisSummary[]>('/api/history');
  } catch {
    console.warn('[api] Backend unreachable — using mock history');
    await sleep(400);
    return mockStore.map(({ id, quality_score, quality_label, image_url, created_at }) => ({
      id,
      quality_score,
      quality_label,
      image_url,
      created_at,
    }));
  }
}

/* ── GET /api/analysis/:id ──────────────────────────────────────── */
export async function getAnalysis(id: string): Promise<AnalysisResult> {
  try {
    return await apiFetch<AnalysisResult>(`/api/analysis/${id}`);
  } catch {
    console.warn('[api] Backend unreachable — using mock detail');
    await sleep(300);
    const found = mockStore.find((a) => a.id === id);
    if (!found) throw new Error(`Analysis ${id} not found`);
    return found;
  }
}

/* ── GET /api/health ────────────────────────────────────────────── */
export async function getHealth(): Promise<HealthStatus> {
  try {
    return await apiFetch<HealthStatus>('/api/health');
  } catch {
    return { status: 'down' };
  }
}
