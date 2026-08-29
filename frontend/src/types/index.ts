// ── Quality labels ──────────────────────────────────────────────────
export type QualityLabel = 'ACCEPTABLE' | 'DEGRADED' | 'DEFECTIVE' | 'POTENTIALLY_DEFECTIVE' | string;

// ── Issue types emitted by the analysis engine ─────────────────────
export type IssueType =
  | 'blur'
  | 'underexposure'
  | 'overexposure'
  | 'noise'
  | 'corruption'
  | 'defect'
  | string;

export type Severity = 'critical' | 'high' | 'medium' | 'low' | string;

// ── Single detected issue ──────────────────────────────────────────
export interface Issue {
  type: IssueType;
  severity: Severity;
  confidence: number; // 0–1
}

// ── Technical statistics ───────────────────────────────────────────
export interface ClassicalFeatures {
  sharpness: number;
  brightness: number;
  contrast: number;
  noise_estimate: number;
  saturation: number;
  edge_density: number;
  entropy: number;
  colorfulness: number;
  pct_shadow_clip_15: number;
  pct_shadow_clip_30: number;
  pct_highlight_clip_240: number;
  pct_highlight_clip_225: number;
  p01: number;
  p05: number;
  p95: number;
  p99: number;
}

export interface AnomalyFeatures {
  mean_err: number;
  max_err: number;
  std_err: number;
  p90_err: number;
  p99_err: number;
  pct_anomalous: number;
  mean_grad_err: number;
  max_grad_err: number;
  p95_grad_err: number;
  local_max_err: number;
  local_std_err: number;
}

export interface Stats {
  image_width: number;
  image_height: number;
  defect_probability: number;

  classical_features: ClassicalFeatures;

  anomaly_features?: AnomalyFeatures;
}

// ── Full analysis result (POST + GET /analysis/:id) ────────────────
export interface AnalysisResult {
  id: string;
  quality_score: number; // 0–100
  quality_label: QualityLabel;
  issues: Issue[];
  stats: Stats;
  image_url: string;
  heatmap_url?: string;
  created_at: string; // ISO-8601
}

// ── Summary used in history list ───────────────────────────────────
export interface AnalysisSummary {
  id: string;
  quality_score: number;
  quality_label: QualityLabel;
  image_url: string;
  created_at: string;
}

// ── Health check ───────────────────────────────────────────────────
export interface HealthStatus {
  status: 'ok' | 'online' | 'healthy' | 'degraded' | 'down';
}
