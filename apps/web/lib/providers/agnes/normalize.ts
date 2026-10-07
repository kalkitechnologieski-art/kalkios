// Agnes endpoint validation. The image and video APIs reject any value
// outside their whitelists with 400 — we normalize upstream so callers (UI
// recipes, persisted state, retries) never hand the gateway a bad payload.

export const AGNES_IMAGE_SIZES = ['1K', '2K', '3K', '4K'] as const;
export const AGNES_IMAGE_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'] as const;
export const AGNES_VIDEO_SIZES = ['720P'] as const;
export const AGNES_VIDEO_RATIOS = ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9'] as const;
export const AGNES_VIDEO_SECONDS = [4, 5, 6, 7, 8, 9, 10] as const;

type ImageSize = (typeof AGNES_IMAGE_SIZES)[number];
type ImageRatio = (typeof AGNES_IMAGE_RATIOS)[number];
type VideoSize = (typeof AGNES_VIDEO_SIZES)[number];
type VideoRatio = (typeof AGNES_VIDEO_RATIOS)[number];

function closest<T extends string | number>(value: number | string, allowed: readonly T[]): T {
  if (allowed.includes(value as T)) return value as T;
  if (typeof value === 'number') {
    let best: T = allowed[0]!;
    let bestDelta = Infinity;
    for (const candidate of allowed) {
      const d = Math.abs(Number(candidate) - value);
      if (d < bestDelta) {
        best = candidate;
        bestDelta = d;
      }
    }
    return best;
  }
  return allowed[0]!;
}

export interface NormalizedImageOptions {
  size: ImageSize;
  ratio: ImageRatio;
}

export function normalizeImageOptions(raw: { size?: string; ratio?: string } = {}): NormalizedImageOptions {
  const size = closest(raw.size ?? '1K', AGNES_IMAGE_SIZES);
  const ratio = closest(raw.ratio ?? '16:9', AGNES_IMAGE_RATIOS);
  return { size, ratio };
}

export interface NormalizedVideoOptions {
  size: VideoSize;
  ratio: VideoRatio;
  seconds: number;
}

export function normalizeVideoOptions(raw: { size?: string; ratio?: string; duration?: number } = {}): NormalizedVideoOptions {
  const size = closest(raw.size ?? '720P', AGNES_VIDEO_SIZES);
  const ratio = closest(raw.ratio ?? '16:9', AGNES_VIDEO_RATIOS);
  const dur = typeof raw.duration === 'number' && Number.isFinite(raw.duration)
    ? raw.duration
    : 5;
  const seconds = Math.max(AGNES_VIDEO_SECONDS[0]!, Math.min(AGNES_VIDEO_SECONDS[AGNES_VIDEO_SECONDS.length - 1]!, Math.round(dur)));
  return { size, ratio, seconds };
}

export function isAgnesRejection(err: unknown): { ok: false; userMessage: string } | { ok: true } {
  const message = err instanceof Error ? err.message : String(err);
  if (!/size|aspect_ratio|seconds|invalid_request|HTTP 400/i.test(message)) {
    return { ok: true };
  }
  return {
    ok: false,
    userMessage: 'Agnes rejected the request parameters. Defaulting to safe settings (1K / 16:9 / 720P / 5s). Please retry.',
  };
}