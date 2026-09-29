import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { OUTPUTS_DIR, SOURCES_DIR } from './env';
import type { RunSidecar } from '../shared/types';

const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;

export const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Keeps a copy of every uploaded image in sources/, named with a content hash so a
 *  re-upload of the same file lands on the same name instead of piling up. */
export async function saveSource(bytes: Uint8Array<ArrayBuffer>, originalName: string): Promise<string> {
  await mkdir(SOURCES_DIR, { recursive: true });
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 10);
  const ext = path.extname(originalName).toLowerCase() || '.png';
  const base = slug(path.basename(originalName, path.extname(originalName))) || 'source';
  const name = base.endsWith(hash) ? `${base}${ext}` : `${base}-${hash}${ext}`;
  const dest = path.join(SOURCES_DIR, name);
  if (!(await exists(dest))) await writeFile(dest, bytes);
  return name;
}

export async function listSources(): Promise<string[]> {
  await mkdir(SOURCES_DIR, { recursive: true });
  return (await readdir(SOURCES_DIR)).filter((f) => IMAGE_EXT.test(f)).sort();
}

export function sourcePath(name: string): string {
  const safe = path.basename(name);
  if (safe !== name || !IMAGE_EXT.test(safe)) throw new Error(`Not a source image: ${name}`);
  return path.join(SOURCES_DIR, safe);
}

export async function downloadVideo(url: string, baseName: string): Promise<string> {
  await mkdir(OUTPUTS_DIR, { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Downloading the result failed: HTTP ${res.status}`);
  const file = `${baseName}.mp4`;
  await writeFile(path.join(OUTPUTS_DIR, file), new Uint8Array(await res.arrayBuffer()));
  return file;
}

export async function writeSidecar(baseName: string, sidecar: RunSidecar): Promise<void> {
  await writeFile(path.join(OUTPUTS_DIR, `${baseName}.json`), JSON.stringify(sidecar, null, 2) + '\n');
}

export async function listRuns(): Promise<RunSidecar[]> {
  await mkdir(OUTPUTS_DIR, { recursive: true });
  const files = (await readdir(OUTPUTS_DIR)).filter((f) => f.endsWith('.json'));
  const runs: RunSidecar[] = [];
  for (const f of files) {
    try {
      const run = JSON.parse(await readFile(path.join(OUTPUTS_DIR, f), 'utf8')) as RunSidecar;
      if (run.video) runs.push(run);
    } catch {
      // A half-written or hand-edited sidecar shouldn't take the gallery down.
    }
  }
  return runs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

async function exists(p: string) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}
