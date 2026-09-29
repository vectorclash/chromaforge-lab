import { createFalClient } from '@fal-ai/client';
import { env } from './env';

export const fal = createFalClient({ credentials: env.FAL_KEY });

export async function uploadImage(bytes: Uint8Array<ArrayBuffer>, mime: string): Promise<string> {
  return fal.storage.upload(new Blob([bytes], { type: mime }));
}
