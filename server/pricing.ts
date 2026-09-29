import { env } from './env';
import type { ModelConfig } from '../shared/models.config';
import type { PriceEstimate } from '../shared/types';
import type { ParamValue } from '../shared/models.config';

type LivePrice = { unit_price: number; unit: string; currency: string };
const cache = new Map<string, { at: number; price: LivePrice | null }>();
const TTL_MS = 10 * 60 * 1000;

export async function livePrice(endpointId: string): Promise<LivePrice | null> {
  const hit = cache.get(endpointId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.price;
  const res = await fetch(
    `https://api.fal.ai/v1/models/pricing?endpoint_id=${encodeURIComponent(endpointId)}`,
    { headers: { Authorization: `Key ${env.FAL_KEY}` } }
  );
  if (!res.ok) throw new Error(`fal pricing API ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { prices: (LivePrice & { endpoint_id: string })[] };
  const price = body.prices.find((p) => p.endpoint_id === endpointId) ?? null;
  cache.set(endpointId, { at: Date.now(), price });
  return price;
}

const usd = (n: number) => `$${n.toFixed(n < 1 ? 3 : 2).replace(/0$/, '')}`;

export async function estimate(
  model: ModelConfig,
  duration: number,
  resolution: string | null,
  params: Record<string, ParamValue>
): Promise<PriceEstimate> {
  const rate = model.pricing.perSecond({ ...params, resolution: resolution ?? '' });
  const total = Math.round(rate * duration * 10000) / 10000;
  let live: LivePrice | null = null;
  let staleReason: string | null = null;
  try {
    live = await livePrice(model.id);
    if (!live) staleReason = 'fal returned no price for this endpoint.';
    else if (live.unit !== model.pricing.apiUnit || live.currency !== 'USD')
      staleReason = `fal now prices this in "${live.unit}" (${live.currency}), not "${model.pricing.apiUnit}".`;
    else if (Math.abs(live.unit_price - model.pricing.apiUnitPriceAtCheck) > 1e-9)
      staleReason = `fal's price changed from ${model.pricing.apiUnitPriceAtCheck} to ${live.unit_price} since ${model.pricing.checkedAt}.`;
  } catch (err) {
    staleReason = `Couldn't reach fal's pricing API: ${(err as Error).message}`;
  }
  return {
    modelId: model.id,
    usd: total,
    breakdown: `${duration}s × ${usd(rate)}/s = ${usd(total)}`,
    liveUnitPrice: live?.unit_price ?? null,
    liveUnit: live?.unit ?? null,
    stale: staleReason !== null,
    staleReason: staleReason && `${staleReason} Check ${model.pricing.source}`
  };
}
