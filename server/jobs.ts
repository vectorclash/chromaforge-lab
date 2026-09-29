import { randomUUID } from 'node:crypto';
import { fal } from './fal';
import { estimate } from './pricing';
import { reserve } from './spend';
import { downloadVideo, slug, stamp, writeSidecar } from './outputs';
import { getModel } from '../shared/models.config';
import type { AnimateRequest, Job } from '../shared/types';

const jobs = new Map<string, Job>();
const POLL_MS = 2500;

export const getJob = (id: string) => jobs.get(id);

/** Thrown for problems the caller should fix (bad params, stale price, spend cap), as
 *  opposed to fal failing mid-run. */
export class RejectedRun extends Error {
  constructor(message: string, readonly detail?: unknown) {
    super(message);
  }
}

export function buildFalInput(req: AnimateRequest): Record<string, unknown> {
  const model = getModel(req.modelId)!;
  const input: Record<string, unknown> = {
    prompt: req.prompt,
    [model.imageParam]: req.imageUrl,
    duration: model.toApiDuration(req.duration)
  };
  if (model.resolutions && req.resolution) input.resolution = req.resolution;
  for (const spec of model.params) {
    const v = req.params[spec.key] ?? spec.default;
    // Empty optional text (e.g. no negative prompt) is left out rather than sent as "".
    if (spec.kind === 'text' && String(v).trim() === '') continue;
    input[spec.key] = v;
  }
  return input;
}

/** Validates, prices, reserves spend and submits. Returns once fal has accepted the
 *  request; the rest runs in the background and is observable through getJob(). */
export async function startJob(req: AnimateRequest, onUpdate?: (job: Job) => void): Promise<Job> {
  const model = getModel(req.modelId);
  if (!model) throw new RejectedRun(`Unknown model: ${req.modelId}`);
  if (!req.imageUrl) throw new RejectedRun('No image uploaded.');
  if (!req.prompt.trim()) throw new RejectedRun('A motion prompt is required.');
  if (req.prompt.length > model.maxPromptLength)
    throw new RejectedRun(`${model.label} accepts prompts up to ${model.maxPromptLength} characters; this one is ${req.prompt.length}.`);
  if (!model.durations.includes(req.duration))
    throw new RejectedRun(`${model.label} takes ${model.durations.join('/')}s, not ${req.duration}s.`);
  if (model.resolutions && !model.resolutions.includes(req.resolution ?? ''))
    throw new RejectedRun(`${model.label} takes ${model.resolutions.join('/')}.`);
  const params = { ...Object.fromEntries(model.params.map((p) => [p.key, p.default])), ...req.params };
  const invalid = model.validate?.({ ...params, duration: req.duration, resolution: req.resolution });
  if (invalid) throw new RejectedRun(invalid);

  const est = await estimate(model, req.duration, req.resolution, params);
  if (est.stale && !req.acceptStalePrice)
    throw new RejectedRun(`Price estimate may be out of date: ${est.staleReason}`, { estimate: est });

  let reservation;
  try {
    reservation = reserve(est.usd);
  } catch (err) {
    throw new RejectedRun((err as Error).message, { estimate: est });
  }

  const job: Job = {
    id: randomUUID(),
    status: 'submitting',
    queuePosition: null,
    logs: [],
    error: null,
    requestId: null,
    estimate: est,
    startedAt: new Date().toISOString(),
    run: null
  };
  jobs.set(job.id, job);
  const update = (patch: Partial<Job>) => {
    Object.assign(job, patch);
    onUpdate?.(job);
  };

  const falInput = buildFalInput({ ...req, params });
  let requestId: string;
  try {
    ({ request_id: requestId } = await fal.queue.submit(model.id, { input: falInput }));
  } catch (err) {
    reservation.release();
    update({ status: 'failed', error: falError(err) });
    throw new RejectedRun(`fal rejected the request: ${falError(err)}`);
  }
  update({ status: 'IN_QUEUE', requestId });

  void (async () => {
    let completed = false;
    try {
      for (;;) {
        const s = await fal.queue.status(model.id, { requestId, logs: true });
        if (s.status === 'IN_QUEUE') update({ status: 'IN_QUEUE', queuePosition: s.queue_position });
        else if (s.status === 'IN_PROGRESS')
          update({ status: 'IN_PROGRESS', queuePosition: null, logs: (s.logs ?? []).map((l) => l.message) });
        else break;
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
      const result = await fal.queue.result(model.id, { requestId });
      // From here fal has produced the video, so the run counts as spent even if the
      // download below fails.
      completed = true;
      reservation.settle();
      const data = result.data as { video?: { url?: string } & Record<string, unknown>; seed?: number };
      if (!data.video?.url) throw new Error(`fal returned no video: ${JSON.stringify(result.data).slice(0, 300)}`);
      update({ status: 'downloading' });
      const baseName = `${stamp()}-${slug(model.label)}`;
      const video = await downloadVideo(data.video.url, baseName);
      const run = {
        video,
        sourceFile: req.sourceFile,
        modelId: model.id,
        prompt: req.prompt,
        duration: req.duration,
        resolution: req.resolution,
        params,
        falInput,
        timestamp: new Date().toISOString(),
        estimatedCostUsd: est.usd,
        priceBreakdown: est.breakdown,
        requestId,
        falVideo: data.video,
        seed: typeof data.seed === 'number' ? data.seed : null
      };
      await writeSidecar(baseName, run);
      update({ status: 'done', run });
    } catch (err) {
      // A request fal reported as failed is assumed unbilled and its reservation freed.
      if (!completed) reservation.release();
      update({ status: 'failed', error: falError(err) });
    }
  })();

  return job;
}

function falError(err: unknown): string {
  const e = err as { message?: string; status?: number; body?: unknown };
  const body = e.body ? ` ${JSON.stringify(e.body).slice(0, 500)}` : '';
  return `${e.status ? `HTTP ${e.status}: ` : ''}${e.message ?? String(err)}${body}`;
}
