import "server-only";

// ---------------------------------------------------------------------------
// Best-effort, in-memory, per-instance rate limiter.
//
// Serverless function instances are ephemeral and can scale out across many
// instances, so this does not provide a hard distributed guarantee — a
// determined attacker spreading requests across instances/regions can still
// get through. It does meaningfully throttle the common case (a script
// hammering a single warm instance) with zero new infrastructure. Replace
// with a shared store (e.g. Upstash Redis, or Vercel Firewall rate-limit
// rules) if a stronger guarantee is needed.
// ---------------------------------------------------------------------------

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let checksSinceSweep = 0;

/** Returns true if the request is allowed, false if the limit was exceeded. */
export function checkRateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): boolean {
  const now = Date.now();

  // Opportunistically prune expired entries so the map doesn't grow
  // unbounded on a long-lived warm instance.
  checksSinceSweep += 1;
  if (checksSinceSweep >= 500) {
    checksSinceSweep = 0;
    for (const [k, b] of buckets) {
      if (now >= b.resetAt) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return true;
  }

  if (bucket.count >= opts.limit) return false;

  bucket.count += 1;
  return true;
}

/** Best-effort client IP extraction behind Vercel's proxy. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
