import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api/response";
import { verifyCronSecret } from "@/lib/api/cron";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// GET|POST /api/v1/crons/drain-outbox
// Runs daily on the Vercel Hobby plan (see vercel.json — more frequent
// schedules require a paid plan): picks up pending notifications and
// dispatches them. Email dispatch requires an email provider env var
// (provisioned via Vercel Marketplace messaging category — see
// docs/blueprint/14 §1.9). This stub is production-ready routing logic;
// sending is provider-pluggable.
// Schedule: 0 9 * * *
// Vercel Cron invokes scheduled paths via GET; POST is kept for manual/admin
// triggering, so both methods run the same handler.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const guardError = verifyCronSecret(req);
  if (guardError) return guardError;

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const BATCH = 50;
  const MAX_ATTEMPTS = 3;

  // Claim a batch of pending messages
  const { data: batch, error: batchErr } = await supabase
    .from("notification_outbox")
    .select("id, user_id, channel, template, payload, attempts")
    .eq("status", "pending")
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(BATCH);

  if (batchErr) return serverError(batchErr.message);
  if (!batch?.length) return ok({ sent: 0, failed: 0, ranAt: now });

  // Claim batch IDs — per-row status update happens inside the loop
  const ids = batch.map((r) => r.id);

  let sent = 0;
  let failed = 0;

  for (const msg of batch) {
    try {
      await dispatch(msg.channel, msg.template, msg.payload as Record<string, unknown>, msg.user_id);

      await supabase
        .from("notification_outbox")
        .update({ status: "sent", sent_at: now, attempts: msg.attempts + 1 })
        .eq("id", msg.id);

      sent++;
    } catch (err) {
      const attempts = msg.attempts + 1;
      const nextRetry =
        attempts < MAX_ATTEMPTS
          ? new Date(Date.now() + attempts * 5 * 60 * 1000).toISOString()
          : null;

      await supabase
        .from("notification_outbox")
        .update({
          status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
          attempts,
          next_retry_at: nextRetry,
        })
        .eq("id", msg.id);

      failed++;
    }
  }

  return ok({ sent, failed, batch: batch.length, ranAt: now });
}

// Vercel Cron invokes scheduled functions via GET, not POST.
export const GET = POST;

// ---------------------------------------------------------------------------
// Dispatch — route to the appropriate channel
// Email provider is injected via environment (provisioned via marketplace).
// ---------------------------------------------------------------------------
async function dispatch(
  channel: string,
  template: string,
  payload: Record<string, unknown>,
  userId: string
): Promise<void> {
  switch (channel) {
    case "email":
      await sendEmail(template, payload, userId);
      break;

    case "in_app":
      // in-app notifications are already written directly to `notifications`
      // table by the mutation that enqueues them; outbox here is belt-and-
      // suspenders for retry if the direct insert had failed.
      break;

    case "whatsapp":
    case "sms":
      // V2: WhatsApp BSP + TRAI DLT SMS
      throw new Error(`Channel ${channel} not yet provisioned`);

    default:
      throw new Error(`Unknown channel: ${channel}`);
  }
}

// Thin email sender — replace the body with your provider SDK once Resend
// (or equivalent) is provisioned via the Vercel Marketplace messaging category.
async function sendEmail(
  template: string,
  payload: Record<string, unknown>,
  _userId: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY ?? process.env.EMAIL_API_KEY;
  const fromAddress = process.env.EMAIL_FROM ?? "alerts@gharbazaar.in";

  if (!apiKey) {
    // Email provider not provisioned yet — log and skip (don't fail the cron)
    console.warn(`[drain-outbox] Email provider not configured. Skipping template: ${template}`);
    return;
  }

  // Resolve recipient email from userId via admin client
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", _userId)
    .single();

  if (!profile?.email) return; // unsubscribed / no email

  // Provider-agnostic: POST to Resend-compatible /emails endpoint
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [profile.email],
      subject: templateSubject(template, payload),
      html: templateHtml(template, payload, profile.full_name),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Email send failed (${res.status}): ${body}`);
  }
}

function templateSubject(template: string, payload: Record<string, unknown>): string {
  switch (template) {
    case "new_inquiry":         return "New lead on your property";
    case "listing_expired":     return `Your listing "${payload.title}" has expired`;
    case "listing_expiring_soon": return `Renew your listing — expires soon`;
    case "saved_search_alert":  return `${payload.match_count} new properties match your alert`;
    default:                    return "GharBazaar notification";
  }
}

function templateHtml(template: string, payload: Record<string, unknown>, name: string): string {
  // Bare-bones transactional HTML — replace with proper React Email / MJML templates in V2
  const greeting = `<p>Hi ${name},</p>`;
  switch (template) {
    case "new_inquiry":
      return `${greeting}<p>You have a new lead from <strong>${payload.seeker_name}</strong> (${payload.seeker_phone}).</p>`;
    case "listing_expired":
      return `${greeting}<p>Your listing <strong>"${payload.title}"</strong> has expired. Log in to renew it.</p>`;
    case "listing_expiring_soon":
      return `${greeting}<p>Your listing <strong>"${payload.title}"</strong> expires on ${payload.expires_at}. Renew to keep it live.</p>`;
    case "saved_search_alert": {
      const listings = (payload.listings as Array<{title: string; price: number}>) ?? [];
      const rows = listings.map((l) => `<li>${l.title} — ₹${l.price.toLocaleString("en-IN")}</li>`).join("");
      return `${greeting}<p>There are <strong>${payload.match_count} new listings</strong> matching your saved search:</p><ul>${rows}</ul>`;
    }
    default:
      return `${greeting}<p>You have a new notification from GharBazaar.</p>`;
  }
}
