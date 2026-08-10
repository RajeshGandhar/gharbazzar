import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Smart routing for "Post Property":
 * - Not logged in → login with redirect back here
 * - Logged in, no seller profile → dealer onboard with redirect to listing wizard
 * - Logged in, has seller profile → straight to listing wizard
 */
export default async function ListPropertyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/list-property");
  }

  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!seller) {
    redirect("/dealer/onboard?next=/dealer/listings/new");
  }

  redirect("/dealer/listings/new");
}
