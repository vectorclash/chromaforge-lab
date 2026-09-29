// Phase 1 end to end with no UI: upload -> price -> confirm -> submit -> poll -> download -> sidecar.
// Usage: npm run smoke -- sources/<file>.png ["motion prompt"] [modelId] ['{"param":value}']
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { uploadImage } from '../server/fal';
import { estimate } from '../server/pricing';
import { startJob, getJob } from '../server/jobs';
import { spendState } from '../server/spend';
import { getModel, defaultParams, MODELS } from '../shared/models.config';

const [file, prompt = 'Slow drifting camera push-in; the stars twinkle and the geometric shards rotate gently, colors shimmer.', modelId = MODELS[0].id, paramsJson = '{}'] =
  process.argv.slice(2);
if (!file) {
  console.error('Usage: npm run smoke -- sources/<file>.png ["prompt"] [modelId]');
  process.exit(1);
}
const model = getModel(modelId);
if (!model) throw new Error(`Unknown model ${modelId}`);

const params = { ...defaultParams(model), ...JSON.parse(paramsJson) };
const duration = model.defaultDuration;
const resolution = model.defaultResolution;

const est = await estimate(model, duration, resolution, params);
console.log(`\n${model.label} (${model.id})`);
console.log(`  ${duration}s @ ${resolution ?? 'source aspect'}, params ${JSON.stringify(params)}`);
console.log(`  estimate: ${est.breakdown}  (live API: ${est.liveUnitPrice}/${est.liveUnit})`);
if (est.stale) console.log(`  WARNING: ${est.staleReason}`);
console.log(`  session cap: $${spendState().capUsd}\n`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question(`Spend ~$${est.usd.toFixed(2)} on this run? [y/N] `);
rl.close();
if (answer.trim().toLowerCase() !== 'y') process.exit(0);

const t0 = Date.now();
const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[path.extname(file).toLowerCase()];
if (!mime) throw new Error('PNG, JPEG or WebP only.');
const imageUrl = await uploadImage(new Uint8Array(await readFile(file)), mime);
console.log(`uploaded -> ${imageUrl}`);

let last = '';
const job = await startJob(
  { modelId: model.id, imageUrl, sourceFile: path.basename(file), prompt, duration, resolution, params, acceptStalePrice: est.stale },
  (j) => {
    const line = `${j.status}${j.queuePosition != null ? ` (position ${j.queuePosition})` : ''}`;
    if (line !== last) console.log(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${line}`);
    last = line;
  }
);
while (!['done', 'failed'].includes(getJob(job.id)!.status)) await new Promise((r) => setTimeout(r, 500));
const final = getJob(job.id)!;
if (final.status === 'failed') {
  console.error(`FAILED (fal request ${final.requestId}): ${final.error}`);
  process.exit(1);
}
console.log(`\ndone in ${((Date.now() - t0) / 1000).toFixed(0)}s -> outputs/${final.run!.video}`);
console.log(JSON.stringify(final.run, null, 2));
