type RateEntry = {
  hits: number;
  expiresAt: number;
};

const buckets = new Map<string, RateEntry>();

type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
};

export const consumeRateLimit = ({ key, limit, windowMs }: RateLimitInput) => {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.expiresAt <= now) {
    buckets.set(key, { hits: 1, expiresAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (current.hits >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: current.expiresAt - now,
    };
  }

  current.hits += 1;
  buckets.set(key, current);
  return { ok: true, remaining: Math.max(0, limit - current.hits) };
};
