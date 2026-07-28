import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCitiesForSelect,
  getPropertyTypesForSelect,
  getAmenitiesForSelect,
} from "@/features/sellers/server/dealer-queries";
import { ListingWizard } from "@/features/sellers/components/listing-wizard";

export const revalidate = 0;

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dealer/listings/new");

  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!seller) redirect("/dealer/onboard");

  const [citiesResult, propertyTypesResult, amenitiesResult] = await Promise.all([
    getCitiesForSelect(),
    getPropertyTypesForSelect(),
    getAmenitiesForSelect(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add new listing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Complete all steps to publish your property.
        </p>
      </div>

      <ListingWizard
        property={null}
        sellerId={seller.id}
        cities={citiesResult.data ?? []}
        propertyTypes={propertyTypesResult.data ?? []}
        amenities={amenitiesResult.data ?? []}
        currentStep={1}
      />
    </div>
  );
}
