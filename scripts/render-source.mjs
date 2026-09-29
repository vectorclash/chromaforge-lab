// Renders a Chromaforge artwork into sources/ using the app's own render-service bundle,
// imported read-only from the sibling repo (nothing there is copied or modified).
// Usage: npm run render-source -- [seed] [width] [height]
// The render-service bundle is frozen at its last `npm run build` in that repo.
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const CHROMAFORGE = path.resolve(here, '../../chromaforge');
const { renderDesign, GENERATOR_VERSION } = await import(path.join(CHROMAFORGE, 'render-service/render.js'));

const seed = process.argv[2] || Math.random().toString(36).slice(2, 10);
const width = Number(process.argv[3] || 1920);
const height = Number(process.argv[4] || 1080);
// The studio's own defaults for a fresh design: geometry on, larger shapes, stars in front.
const settings = { geometry: { present: true, spread: 0.7, starsOnTop: true } };

const png = await renderDesign({ seed, colors: [], settings, width, height });
const commit = execSync('git rev-parse --short HEAD', { cwd: CHROMAFORGE }).toString().trim();
const dir = path.resolve(here, '../sources');
await mkdir(dir, { recursive: true });
const name = `cf-${seed}-${width}x${height}`;
await writeFile(path.join(dir, `${name}.png`), png);
await writeFile(
  path.join(dir, `${name}.design.json`),
  JSON.stringify({ generatorVersion: GENERATOR_VERSION, seed, colors: [], settings, width, height, chromaforgeCommit: commit }, null, 2) + '\n'
);
console.log(`sources/${name}.png (generator v${GENERATOR_VERSION}, chromaforge ${commit})`);
