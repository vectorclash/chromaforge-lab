import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SOURCES_DIR = path.join(ROOT, 'sources');
export const OUTPUTS_DIR = path.join(ROOT, 'outputs');

config({ path: path.join(ROOT, '.env'), quiet: true });

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`Missing ${name} in .env (see .env.example).`);
    process.exit(1);
  }
  return v;
}

const cap = Number(process.env.SPEND_CAP_USD ?? '5');
if (!Number.isFinite(cap) || cap < 0) {
  console.error('SPEND_CAP_USD must be a non-negative number.');
  process.exit(1);
}

export const env = {
  FAL_KEY: required('FAL_KEY'),
  SPEND_CAP_USD: cap,
  PORT: Number(process.env.PORT ?? '8787')
};
