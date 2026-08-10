import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPropertyById } from "@/features/properties/server/queries";
import {
  getCitiesForSelect,
  getPropertyTypesForSelect,
  getAmenitiesForSelect,
} from "@/features/sellers/server/dealer-queries";
import { ListingWizard } from "@/features/sellers/components/listing-wizard";

export const revalidate = 0;

export default async function EditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dealer/listings");

  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!seller) redirect("/dealer/onboard");

  const { id } = await params;
  const sp = await searchParams;
  const currentStep = Math.min(5, Math.max(1, parseInt(sp.step ?? "1", 10) || 1));

  // Fetch property — RLS ensures only the owner can see their own drafts
  const { data: property, error } = await getPropertyById(id);

  if (error || !property) notFound();

  // Verify ownership
  const prop = property as unknown as { seller_id?: string };
  if (prop.seller_id !== user.id) notFound();

  const [citiesResult, propertyTypesResult, amenitiesResult] = await Promise.all([
    getCitiesForSelect(),
    getPropertyTypesForSelect(),
    getAmenitiesForSelect(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit listing</h1>
        <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-lg">
          {property.title}
        </p>
      </div>

      <ListingWizard
        property={property as unknown as Parameters<typeof ListingWizard>[0]["property"]}
        sellerId={seller.id}
        cities={citiesResult.data ?? []}
        propertyTypes={propertyTypesResult.data ?? []}
        amenities={amenitiesResult.data ?? []}
        currentStep={currentStep}
      />
    </div>
  );
}
