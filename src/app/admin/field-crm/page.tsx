export const revalidate = 0;

import { listProspects } from "@/features/admin/server/queries";

type Prospect = {
  id: string;
  prospect_name: string;
  prospect_phone: string;
  seller_type: string;
  city_id: number | null;
  locality_note: string | null;
  stage: string;
  notes: string | null;
  next_action_at: string | null;
  assignee_id: string | null;
  seller_id: string | null;
  created_at: string;
  updated_at: string;
  cities?: { name: string } | null;
  profiles?: { full_name: string } | null;
};
import { formatFreshness } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { AddProspectDialog } from "./add-prospect-dialog";
import { ProspectCard } from "./prospect-card";
import { createAdminClient } from "@/lib/supabase/admin";

const STAGES = ["identified", "visited", "onboarded", "active"] as const;
type Stage = typeof STAGES[number];

const stageLabel: Record<Stage, string> = {
  identified: "Identified",
  visited: "Visited",
  onboarded: "Onboarded",
  active: "Active",
};

export default async function FieldCrmPage() {
  const supabase = createAdminClient();
  const [prospectsRaw, admins] = await Promise.all([
    listProspects(),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "super_admin"),
  ]);

  const prospects = prospectsRaw as unknown as Prospect[];

  const byStage = STAGES.reduce(
    (acc, s) => {
      acc[s] = prospects.filter((p) => p.stage === s);
      return acc;
    },
    {} as Record<Stage, Prospect[]>
  );

  // Today's counts per admin
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const adminQuota = (admins.data ?? []).map((admin) => {
    const todayOnboarded = prospects.filter(
      (p) =>
        p.assignee_id === admin.id &&
        p.stage === "onboarded" &&
        new Date(p.updated_at) >= todayStart
    ).length;
    const todayActive = prospects.filter(
      (p) =>
        p.assignee_id === admin.id &&
        p.stage === "active" &&
        new Date(p.updated_at) >= todayStart
    ).length;
    return { ...admin, todayOnboarded, todayActive };
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Field CRM</h1>
        <AddProspectDialog admins={admins.data ?? []} />
      </div>

      {/* Agent quota tracker */}
      {adminQuota.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Agent quota (today, target = 10)</h2>
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Agent</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Onboarded</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Active</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Progress</th>
              </tr>
            </thead>
            <tbody>
              {adminQuota.map((a) => {
                const pct = Math.min(100, Math.round(((a.todayOnboarded + a.todayActive) / 10) * 100));
                return (
                  <tr key={a.id} className="hover:bg-accent">
                    <td className="px-3 py-3 border-t border-border font-medium">{a.full_name}</td>
                    <td className="px-3 py-3 border-t border-border">{a.todayOnboarded}</td>
                    <td className="px-3 py-3 border-t border-border">{a.todayActive}</td>
                    <td className="px-3 py-3 border-t border-border w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Kanban board */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((stage) => {
          const cards = byStage[stage];
          return (
            <div key={stage} className="rounded-xl border border-border bg-muted/30">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold">{stageLabel[stage]}</h2>
                <Badge variant="secondary" className="text-xs">
                  {cards.length}
                </Badge>
              </div>
              <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
                {cards.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-6">
                    Empty
                  </p>
                ) : (
                  cards.map((p) => (
                    <ProspectCard key={p.id} prospect={p} currentStage={stage} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
