import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  return ok({ status: "ok", timestamp: new Date().toISOString() });
}
