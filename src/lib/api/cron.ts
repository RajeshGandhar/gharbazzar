import { NextRequest } from "next/server";
import { unauthorized } from "./response";
import type { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Cron job guard — verifies the request comes from Vercel's cron scheduler.
// Vercel sets Authorization: Bearer <CRON_SECRET> on cron invocations.
// ---------------------------------------------------------------------------

export function verifyCronSecret(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // In development without a cron secret, allow localhost calls
    if (process.env.NODE_ENV === "development") return null;
    return unauthorized("CRON_SECRET not configured");
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return unauthorized("Invalid cron secret");
  }

  return null; // authorized
}
