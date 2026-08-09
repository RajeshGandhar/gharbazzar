import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSellerOwnProfile, getCitiesForSelect } from "@/features/sellers/server/dealer-queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/features/sellers/components/profile-form";
import { CheckCircle2 } from "lucide-react";

const sellerTypeLabels: Record<string, string> = {
  owner: "Owner",
  agent: "Real Estate Agent",
  builder: "Builder / Developer",
  property_manager: "Property Manager",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dealer/profile");

  const [profileResult, citiesResult] = await Promise.all([
    getSellerOwnProfile(user.id),
    getCitiesForSelect(),
  ]);

  if (!profileResult.data) redirect("/dealer/onboard");

  const sellerData = profileResult.data as unknown as {
    id: string;
    slug: string;
    seller_type: string;
    business_name: string | null;
    about: string | null;
    experience_years: number | null;
    office_address: string | null;
    city_id: number | null;
    whatsapp_number: string | null;
    website: string | null;
    logo_url: string | null;
    rera_number: string | null;
    kyc_status: string;
    is_verified: boolean;
    verified_at: string | null;
    avg_rating: number;
    total_reviews: number;
    profiles: {
      full_name: string;
      email: string | null;
      phone: string | null;
      avatar_url: string | null;
      role: string;
    } | null;
    cities: { id: number; name: string; slug: string } | null;
  };

  const profileData = sellerData.profiles;
  const displayName =
    sellerData.business_name ?? profileData?.full_name ?? "Seller";

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const cities = (citiesResult.data ?? []) as Array<{ id: number; name: string; slug: string; state: string }>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Update your personal and business details.
        </p>
      </div>

      {/* Profile header card */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profileData?.avatar_url ?? undefined} alt={displayName} />
          <AvatarFallback className="text-lg font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold">{displayName}</p>
          {profileData?.email && (
            <p className="text-sm text-muted-foreground">{profileData.email}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {sellerData.seller_type && (
              <Badge variant="outline" className="text-xs">
                {sellerTypeLabels[sellerData.seller_type] ?? sellerData.seller_type}
              </Badge>
            )}
            {sellerData.is_verified && (
              <Badge className="bg-green-900/30 text-green-400 gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Profile form */}
      <ProfileForm
        userId={user.id}
        profile={{
          full_name: profileData?.full_name ?? "",
          phone: profileData?.phone ?? null,
          avatar_url: profileData?.avatar_url ?? null,
          email: profileData?.email ?? null,
        }}
        seller={{
          seller_type: sellerData.seller_type,
          business_name: sellerData.business_name,
          about: sellerData.about,
          experience_years: sellerData.experience_years,
          office_address: sellerData.office_address,
          city_id: sellerData.city_id,
          whatsapp_number: sellerData.whatsapp_number,
          website: sellerData.website,
          rera_number: sellerData.rera_number,
        }}
        cities={cities.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
