import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSimilarProperties } from "@/features/properties/server/queries";
import { PropertyCard } from "@/components/properties/property-card";

interface SimilarPropertiesProps {
  excludeId: string;
  cityId: number;
  purpose: "sale" | "rent" | "lease";
  price: number;
  citySlug: string;
  purposePath: string;
}

export async function SimilarProperties({
  excludeId,
  cityId,
  purpose,
  price,
  citySlug,
  purposePath,
}: SimilarPropertiesProps) {
  const properties = await getSimilarProperties({ excludeId, cityId, purpose, price, limit: 4 });

  if (properties.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Similar properties</h2>
        <Link
          href={`/${purposePath}/${citySlug}`}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </section>
  );
}
