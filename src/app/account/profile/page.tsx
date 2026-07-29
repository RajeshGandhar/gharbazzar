import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "./profile-form";

export const revalidate = 0;

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Admin",
  seller: "Seller",
  customer: "Customer",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information</p>
      </div>

      {/* Account info */}
      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Email</span>
          <span className="text-sm font-medium">{profile.email ?? user.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Role</span>
          <Badge variant="outline" className="text-xs">
            {ROLE_LABELS[profile.role] ?? profile.role}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Member since</span>
          <span className="text-sm">
            {new Date(profile.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      <Separator />

      <ProfileForm
        initialName={profile.full_name ?? ""}
        initialPhone={profile.phone ?? ""}
      />
    </div>
  );
}
