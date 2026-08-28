// ── Quality labels ──────────────────────────────────────────────────
export type QualityLabel = 'ACCEPTABLE' | 'DEGRADED' | 'DEFECTIVE';

// ── Issue types emitted by the analysis engine ─────────────────────
export type IssueType =
  | 'blur'
  | 'underexposure'
  | 'overexposure'
  | 'noise'
  | 'corruption'
  | 'defect';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

// ── Single detected issue ──────────────────────────────────────────
export interface Issue {
  type: IssueType;
  severity: Severity;
  confidence: number; // 0–1
}

// ── Technical statistics ───────────────────────────────────────────
export interface Stats {
  sharpness: number;
  brightness: number;
  contrast: number;
  noise_level: number;
  saturation?: number;
  dynamic_range?: number;
  [key: string]: number | undefined;
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
  status: 'ok' | 'degraded' | 'down';
}
