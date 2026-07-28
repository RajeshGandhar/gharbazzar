"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Lock } from "lucide-react";

const MACROS = [
  {
    label: "Listing rejected",
    body: "Your listing was rejected due to the reason mentioned. Please review the feedback, make the necessary corrections, and resubmit. Our team will review it within 4 business hours.",
  },
  {
    label: "How to edit a listing",
    body: "To edit your listing, please go to Dashboard > My Listings > select the listing > click Edit. Make your changes and save. The listing will be reviewed again if it was already approved.",
  },
  {
    label: "Lead not responding",
    body: "We understand that following up on leads can be challenging. Try reaching out at different times of day, and consider using WhatsApp for a quicker response. Our tips guide at /help/lead-management may be helpful.",
  },
  {
    label: "Account recovery",
    body: "To recover your account, please use the Forgot Password link on the login page. You will receive an OTP on your registered mobile number. If you still have trouble, please share your registered email/phone and we will assist you.",
  },
  {
    label: "Escalating to founder",
    body: "We appreciate your patience. I am escalating this to our founder for a faster resolution. You will hear back within 2 business hours.",
  },
];

export function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [sendingNote, setSendingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(isInternal: boolean) {
    if (!body.trim()) return;
    if (isInternal) setSendingNote(true);
    else setSendingReply(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/support/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), is_internal: isInternal }),
      });
      if (!res.ok) {
        const b = await res.json();
        throw new Error(b?.error?.message ?? "Failed");
      }
      setBody("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSendingReply(false);
      setSendingNote(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {MACROS.map((m) => (
          <button
            key={m.label}
            type="button"
            onClick={() => setBody(m.body)}
            className="rounded-full border border-border px-3 py-1 text-xs hover:bg-accent transition-colors"
          >
            {m.label}
          </button>
        ))}
      </div>
      <Textarea
        placeholder="Type your reply here…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="resize-none"
      />
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <Button
          onClick={() => send(false)}
          disabled={!body.trim() || sendingReply || sendingNote}
          className="gap-1.5"
        >
          {sendingReply ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send reply
        </Button>
        <Button
          variant="outline"
          onClick={() => send(true)}
          disabled={!body.trim() || sendingReply || sendingNote}
          className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
        >
          {sendingNote ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          Add internal note
        </Button>
      </div>
    </div>
  );
}
