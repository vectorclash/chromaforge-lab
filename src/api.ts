import type { AnimateRequest, Job, PriceEstimate, RunSidecar, SpendState } from '../shared/types';
import type { ParamValue } from '../shared/models.config';

async function call<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error ?? `HTTP ${res.status}`) as Error & { estimate?: PriceEstimate };
    err.estimate = body.estimate;
    throw err;
  }
  return body as T;
}

export type Uploaded = { sourceFile: string; imageUrl: string };

export const api = {
  uploadFile(file: File) {
    const form = new FormData();
    form.append('file', file);
    return call<Uploaded>('/api/upload', { method: 'POST', body: form });
  },
  uploadSource(sourceFile: string) {
    return call<Uploaded>('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceFile })
    });
  },
  sources: () => call<string[]>('/api/sources'),
  runs: () => call<RunSidecar[]>('/api/runs'),
  spend: () => call<SpendState>('/api/spend'),
  job: (id: string) => call<Job>(`/api/jobs/${id}`),
  pricing(modelId: string, duration: number, resolution: string | null, params: Record<string, ParamValue>) {
    const q = new URLSearchParams({ modelId, duration: String(duration), params: JSON.stringify(params) });
    if (resolution) q.set('resolution', resolution);
    return call<PriceEstimate>(`/api/pricing?${q}`);
  },
  animate: (req: AnimateRequest) =>
    call<Job>('/api/animate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req) })
};

export const sourceUrl = (name: string) => `/api/sources/${encodeURIComponent(name)}`;
export const outputUrl = (name: string) => `/api/outputs/${encodeURIComponent(name)}`;
