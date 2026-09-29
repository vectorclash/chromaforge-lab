import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { env, OUTPUTS_DIR } from './env';
import { uploadImage } from './fal';
import { estimate } from './pricing';
import { spendState } from './spend';
import { getJob, RejectedRun, startJob } from './jobs';
import { listRuns, listSources, saveSource, sourcePath } from './outputs';
import { MODELS, getModel, defaultParams } from '../shared/models.config';
import type { AnimateRequest } from '../shared/types';

const app = new Hono().basePath('/api');
const MIME: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

// fal storage URLs for images already uploaded this session, keyed by sources/ filename.
const uploaded = new Map<string, string>();

async function uploadSource(name: string) {
  const cached = uploaded.get(name);
  if (cached) return cached;
  const bytes = new Uint8Array(await readFile(sourcePath(name)));
  const url = await uploadImage(bytes, MIME[path.extname(name).toLowerCase()] ?? 'image/png');
  uploaded.set(name, url);
  return url;
}

/** Multipart with a `file` field (drag-and-drop), or JSON { sourceFile } (picked from sources/). */
app.post('/upload', async (c) => {
  if ((c.req.header('content-type') ?? '').includes('application/json')) {
    const { sourceFile } = await c.req.json<{ sourceFile: string }>();
    return c.json({ sourceFile, imageUrl: await uploadSource(sourceFile) });
  }
  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File)) return c.json({ error: 'Expected a file field.' }, 400);
  if (!MIME[path.extname(file.name).toLowerCase()]) return c.json({ error: 'PNG, JPEG or WebP only.' }, 400);
  const sourceFile = await saveSource(new Uint8Array(await file.arrayBuffer()), file.name);
  return c.json({ sourceFile, imageUrl: await uploadSource(sourceFile) });
});

app.get('/sources', async (c) => c.json(await listSources()));
app.get('/sources/:name', async (c) => {
  const name = c.req.param('name');
  const bytes = await readFile(sourcePath(name));
  return c.body(bytes, 200, { 'Content-Type': MIME[path.extname(name).toLowerCase()] ?? 'application/octet-stream' });
});

app.get('/models', (c) =>
  c.json(
    MODELS.map(({ pricing, toApiDuration, validate, ...m }) => ({
      ...m,
      defaults: defaultParams({ pricing, toApiDuration, validate, ...m }),
      pricingSource: pricing.source,
      pricingCheckedAt: pricing.checkedAt
    }))
  )
);

/** GET /api/pricing?modelId=...&duration=6&resolution=1080p&params={json} */
app.get('/pricing', async (c) => {
  const model = getModel(c.req.query('modelId') ?? '');
  if (!model) return c.json({ error: 'Unknown modelId.' }, 400);
  const duration = Number(c.req.query('duration') ?? model.defaultDuration);
  const resolution = c.req.query('resolution') ?? model.defaultResolution;
  const params = { ...defaultParams(model), ...JSON.parse(c.req.query('params') ?? '{}') };
  return c.json(await estimate(model, duration, resolution, params));
});

app.get('/spend', (c) => c.json(spendState()));

app.post('/animate', async (c) => {
  try {
    const job = await startJob(await c.req.json<AnimateRequest>());
    return c.json(job, 202);
  } catch (err) {
    if (err instanceof RejectedRun) return c.json({ error: err.message, ...(err.detail as object) }, 400);
    throw err;
  }
});

app.get('/jobs/:id', (c) => {
  const job = getJob(c.req.param('id'));
  return job ? c.json(job) : c.json({ error: 'No such job (the server may have restarted).' }, 404);
});

app.get('/runs', async (c) => c.json(await listRuns()));
app.use('/outputs/*', serveStatic({ root: OUTPUTS_DIR, rewriteRequestPath: (p) => p.replace(/^\/api\/outputs/, '') }));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message }, 500);
});

serve({ fetch: app.fetch, port: env.PORT, hostname: '127.0.0.1' }, ({ port }) => {
  console.log(`lab api on http://127.0.0.1:${port} -- session cap $${env.SPEND_CAP_USD}`);
});
