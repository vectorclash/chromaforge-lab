import type { ParamValue } from './models.config';

export interface AnimateRequest {
  modelId: string;
  imageUrl: string;
  /** The file in sources/ the image came from, for the sidecar. */
  sourceFile: string;
  prompt: string;
  duration: number;
  resolution: string | null;
  params: Record<string, ParamValue>;
  /** Set when the user has seen a stale-price warning and chosen to run anyway. */
  acceptStalePrice?: boolean;
}

export interface PriceEstimate {
  modelId: string;
  usd: number;
  /** Human-readable, e.g. "6s × $0.04/s = $0.24". */
  breakdown: string;
  liveUnitPrice: number | null;
  liveUnit: string | null;
  /** True when the live pricing API no longer matches what the config was checked against. */
  stale: boolean;
  staleReason: string | null;
}

export interface SpendState {
  capUsd: number;
  spentUsd: number;
  reservedUsd: number;
  remainingUsd: number;
}

export type JobStatus = 'submitting' | 'IN_QUEUE' | 'IN_PROGRESS' | 'downloading' | 'done' | 'failed';

export interface Job {
  id: string;
  status: JobStatus;
  queuePosition: number | null;
  logs: string[];
  error: string | null;
  /** fal's request id, once submitted -- look it up in the fal dashboard. */
  requestId: string | null;
  estimate: PriceEstimate;
  startedAt: string;
  run: RunSidecar | null;
}

export interface RunSidecar {
  video: string;
  sourceFile: string;
  modelId: string;
  prompt: string;
  duration: number;
  resolution: string | null;
  params: Record<string, ParamValue>;
  /** The exact input object sent to fal. */
  falInput: Record<string, unknown>;
  timestamp: string;
  estimatedCostUsd: number;
  priceBreakdown: string;
  requestId: string;
  /** Output metadata as fal returned it (dimensions, fps, etc. when provided). */
  falVideo: Record<string, unknown>;
  seed: number | null;
}
