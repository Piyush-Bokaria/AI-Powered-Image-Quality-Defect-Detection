import type {
  AnalysisSummary,
  HealthStatus,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function analyzeImage(file: File): Promise<any> {
  try {
    const form = new FormData();
    form.append('file', file);
    form.append('image', file);
    const raw = await apiFetch<any>('/api/analyze', {
      method: 'POST',
      body: form,
    });

    const statsData = raw.stats || raw.statistics?.classical_features || raw.statistics || {};
    const displayUrl = raw.image_url || raw.img_url || URL.createObjectURL(file);

    return {
      id: String(raw.id ?? 'analysis-' + Date.now()),
      quality_score: typeof raw.quality_score === 'number' ? raw.quality_score : 0,
      quality_label: raw.quality_label ?? 'ACCEPTABLE',
      issues: (raw.issues || []).map((iss: any) => ({
        type: iss.type ?? 'defect',
        severity: iss.severity ?? 'medium',
        confidence: typeof iss.confidence === 'number' ? iss.confidence : 0.5,
      })),
      stats: statsData,
      img_url: displayUrl,
      created_at: raw.created_at ?? new Date().toISOString(),
    };
  } catch (err) {
    return [];
  }
}

/* ── GET /api/history ───────────────────────────────────────────── */
export async function getHistory(): Promise<AnalysisSummary[]> {
  try {
    const res = await apiFetch<any>('/api/history');
    console.log(res);
    const list = Array.isArray(res) ? res : (res?.data || []);
    return list.map((item: any) => ({
      id: String(item.id),
      quality_score: typeof item.quality_score === 'number' ? item.quality_score : 0,
      quality_label: item.quality_label ?? 'ACCEPTABLE',
      image_url: item.image_url || item.img_url || '',
      img_url: item.img_url || item.image_url || '',
      created_at: item.created_at ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

/* ── GET /api/analysis/:id ──────────────────────────────────────── */
export async function getAnalysis(id: string): Promise<any> {
  try {
    const res = await apiFetch<any>(`/api/analysis/${id}`);
    console.log(res);
    const displayUrl = res.image_url || res.img_url || '';
    return {
      id: String(res.id),
      file_name: String(res.filename ?? res.file_name ?? ''),
      quality_score: typeof res.quality_score === 'number' ? res.quality_score : 0,
      quality_label: res.quality_label ?? 'ACCEPTABLE',
      issues: (res.issues || []).map((iss: any) => ({
        type: iss.type ?? 'defect',
        severity: iss.severity ?? 'medium',
        confidence: typeof iss.confidence === 'number' ? iss.confidence : 0.5,
      })),
      statistics: res.statistics || {},
      stats: res.statistics || {},
      img_url: displayUrl,
      created_at: res.created_at ?? new Date().toISOString(),
    };
  } catch {
    return [];
  }
}

/* ── GET /api/health ────────────────────────────────────────────── */
export async function getHealth(): Promise<HealthStatus> {
  try {
    const res = await apiFetch<HealthStatus>('/health');
    console.log(res);
    return res;
  } catch {
    return { status: 'down' };
  }
}
