// The models the lab can run. Everything here was checked against fal on 2026-09-29:
// input schemas from https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=<id>,
// prices from each model's page (linked per entry).
//
// Why prices live here at all: fal's pricing API
// (GET https://api.fal.ai/v1/models/pricing?endpoint_id=...) returns ONE unit price per
// endpoint and has no estimate endpoint, but these models charge different rates by
// resolution and by audio on/off. So the per-variant rates come from the model page, and
// `apiUnitPriceAtCheck` records what the pricing API said on the same day. The server
// fetches the live price before every estimate; if it no longer matches, the estimate is
// flagged stale and the UI asks before running. Re-check the page, then update both.
//
// This file is imported by the browser bundle too, so it must never import env.

export type ParamValue = string | number | boolean;

export type ParamSpec =
  | { kind: 'enum'; key: string; label: string; options: ParamValue[]; default: ParamValue }
  | { kind: 'boolean'; key: string; label: string; default: boolean }
  | { kind: 'number'; key: string; label: string; min: number; max: number; step: number; default: number }
  | { kind: 'text'; key: string; label: string; default: string };

export interface ModelPricing {
  source: string;
  checkedAt: string;
  apiUnit: string;
  apiUnitPriceAtCheck: number;
  /** USD per second of output for the chosen params, per the model page. */
  perSecond: (p: Record<string, ParamValue>) => number;
}

export interface ModelConfig {
  id: string;
  label: string;
  tier: 'iterate' | 'premium';
  notes: string;
  /** Longest prompt the model's schema accepts, in characters. */
  maxPromptLength: number;
  /** The input field the source image goes in -- not the same name on every model. */
  imageParam: string;
  /** Offered durations, in seconds. */
  durations: number[];
  defaultDuration: number;
  /** Each model spells duration differently (6, "5", "4s"). */
  toApiDuration: (seconds: number) => ParamValue;
  /** null when the model has no resolution input (output follows the image). */
  resolutions: string[] | null;
  defaultResolution: string | null;
  /** Everything else, sent to the model under its own key. */
  params: ParamSpec[];
  /** Returns a reason the combination is invalid, or null. */
  validate?: (p: Record<string, ParamValue | null>) => string | null;
  pricing: ModelPricing;
}

// Audio is off by default everywhere: Chromaforge exports are silent by choice, and every
// model below charges more for it.
const audioOff: ParamSpec = { kind: 'boolean', key: 'generate_audio', label: 'Generate audio', default: false };

export const MODELS: ModelConfig[] = [
  {
    id: 'fal-ai/ltx-2.3/image-to-video/fast',
    label: 'LTX-2.3 Fast',
    tier: 'iterate',
    notes: 'Default iteration model. Audio, when on, is described in the main prompt.',
    maxPromptLength: 5000,
    imageParam: 'image_url',
    durations: [6, 8, 10, 12, 14, 16, 18, 20],
    defaultDuration: 6,
    toApiDuration: (s) => s,
    resolutions: ['1080p', '1440p', '2160p'],
    defaultResolution: '1080p',
    params: [
      { kind: 'enum', key: 'aspect_ratio', label: 'Aspect ratio', options: ['auto', '16:9', '9:16'], default: 'auto' },
      { kind: 'enum', key: 'fps', label: 'FPS', options: [24, 25, 48, 50], default: 25 },
      audioOff
    ],
    pricing: {
      source: 'https://fal.ai/models/fal-ai/ltx-2.3/image-to-video/fast',
      checkedAt: '2026-09-29',
      apiUnit: 'seconds',
      apiUnitPriceAtCheck: 0.06,
      // The page contradicts itself: one table says $0.04/$0.08/$0.16, another (and the
      // pricing API) says $0.06 at 1080p. Using the higher set so the estimate errs high.
      perSecond: ({ resolution }) => ({ '1080p': 0.06, '1440p': 0.12, '2160p': 0.24 })[String(resolution)] ?? 0.24
    }
  },
  {
    id: 'fal-ai/ltx-2/image-to-video/fast',
    label: 'LTX-2 Fast',
    tier: 'iterate',
    notes:
      'Output is 16:9. On 2026-09-29 every request failed with downstream_service_error after 6-19s (3 attempts: different sizes, audio on/off, different prompts; fal status all green; not billed).',
    maxPromptLength: 5000,
    imageParam: 'image_url',
    durations: [6, 8, 10, 12, 14, 16, 18, 20],
    defaultDuration: 6,
    toApiDuration: (s) => s,
    resolutions: ['1080p', '1440p', '2160p'],
    defaultResolution: '1080p',
    params: [{ kind: 'enum', key: 'fps', label: 'FPS', options: [25, 50], default: 25 }, audioOff],
    // Per the model page: "Durations 12-20s require 25 FPS + 1080p only".
    validate: ({ duration, resolution, fps }) =>
      Number(duration) >= 12 && (fps !== 25 || resolution !== '1080p')
        ? 'Durations of 12s and over need 25 FPS at 1080p.'
        : null,
    pricing: {
      source: 'https://fal.ai/models/fal-ai/ltx-2/image-to-video/fast',
      checkedAt: '2026-09-29',
      apiUnit: 'seconds',
      apiUnitPriceAtCheck: 0.04,
      perSecond: ({ resolution }) => ({ '1080p': 0.04, '1440p': 0.08, '2160p': 0.16 })[String(resolution)] ?? 0.16
    }
  },
  {
    id: 'fal-ai/kling-video/v3/pro/image-to-video',
    label: 'Kling v3 Pro',
    tier: 'premium',
    notes: 'Aspect ratio follows the source image. No resolution input.',
    maxPromptLength: 2500,
    imageParam: 'start_image_url',
    durations: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    defaultDuration: 5,
    toApiDuration: (s) => String(s),
    resolutions: null,
    defaultResolution: null,
    params: [
      { kind: 'text', key: 'negative_prompt', label: 'Negative prompt', default: 'blur, distort, and low quality' },
      { kind: 'number', key: 'cfg_scale', label: 'CFG scale', min: 0, max: 1, step: 0.05, default: 0.5 },
      audioOff
    ],
    pricing: {
      source: 'https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video',
      checkedAt: '2026-09-29',
      apiUnit: 'seconds',
      // The pricing API's single figure matches neither page rate ($0.112 / $0.168).
      apiUnitPriceAtCheck: 0.14,
      perSecond: ({ generate_audio }) => (generate_audio ? 0.168 : 0.112)
    }
  },
  {
    id: 'minimax/h3-max/image-to-video',
    label: 'MiniMax H3 Max',
    tier: 'premium',
    notes:
      'Newest flagship (Aug 2026). Best result so far: followed the prompt beats and built the subject from the artwork itself (2026-09-29). Aspect ratio follows the source image; 1080P is refined from 768P. Always generates sound (no switch). Prompt rewriting is off by default so your wording is what runs.',
    maxPromptLength: 50000,
    imageParam: 'image_url',
    durations: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    defaultDuration: 5,
    toApiDuration: (s) => s,
    resolutions: ['480P', '768P', '1080P'],
    defaultResolution: '1080P',
    params: [
      {
        kind: 'enum',
        key: 'prompt_expansion_mode',
        label: 'Prompt rewriting',
        options: ['disabled', 'balanced', 'quality'],
        default: 'disabled'
      }
    ],
    pricing: {
      source: 'https://fal.ai/models/minimax/h3-max/image-to-video',
      checkedAt: '2026-09-29',
      apiUnit: 'seconds',
      apiUnitPriceAtCheck: 0.025,
      // 50%-off launch rates "for a limited time", stated to end after September 30. When they
      // do, the pricing API should move and the lab will flag the estimate as stale.
      perSecond: ({ resolution }) => ({ '480P': 0.025, '768P': 0.04, '1080P': 0.08 })[String(resolution)] ?? 0.08
    }
  },
  {
    id: 'fal-ai/kling-video/o3/pro/image-to-video',
    label: 'Kling O3 Pro',
    tier: 'premium',
    notes: 'Kling\'s newer line. Aspect ratio follows the source image. No negative prompt on this one.',
    maxPromptLength: 2500,
    imageParam: 'image_url',
    durations: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    defaultDuration: 5,
    toApiDuration: (s) => String(s),
    resolutions: null,
    defaultResolution: null,
    params: [audioOff],
    pricing: {
      source: 'https://fal.ai/models/fal-ai/kling-video/o3/pro/image-to-video',
      checkedAt: '2026-09-29',
      apiUnit: 'seconds',
      apiUnitPriceAtCheck: 0.14,
      perSecond: ({ generate_audio }) => (generate_audio ? 0.14 : 0.112)
    }
  },
  {
    id: 'fal-ai/veo3.1/fast/image-to-video',
    label: 'Veo 3.1 Fast',
    tier: 'premium',
    notes: 'Aspect ratio auto / 16:9 / 9:16.',
    maxPromptLength: 20000,
    imageParam: 'image_url',
    durations: [4, 6, 8],
    defaultDuration: 8,
    toApiDuration: (s) => `${s}s`,
    resolutions: ['720p', '1080p', '4k'],
    defaultResolution: '1080p',
    params: [
      { kind: 'enum', key: 'aspect_ratio', label: 'Aspect ratio', options: ['auto', '16:9', '9:16'], default: 'auto' },
      { kind: 'text', key: 'negative_prompt', label: 'Negative prompt', default: '' },
      audioOff
    ],
    pricing: {
      source: 'https://fal.ai/models/fal-ai/veo3.1/fast/image-to-video',
      checkedAt: '2026-09-29',
      apiUnit: 'seconds',
      apiUnitPriceAtCheck: 0.15,
      perSecond: ({ resolution, generate_audio }) =>
        resolution === '4k' ? (generate_audio ? 0.35 : 0.3) : generate_audio ? 0.15 : 0.1
    }
  }
];

export function getModel(id: string): ModelConfig | undefined {
  return MODELS.find((m) => m.id === id);
}

export function defaultParams(model: ModelConfig): Record<string, ParamValue> {
  return Object.fromEntries(model.params.map((p) => [p.key, p.default]));
}
