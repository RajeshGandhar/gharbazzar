export const revalidate = 0;

import { listAllAmenities } from "@/features/admin/server/queries";
import { AddAmenityDialog } from "./add-amenity-dialog";
import { AmenityToggle } from "./amenity-toggle";

export default async function AmenitiesPage() {
  const amenities = await listAllAmenities();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Amenities
          <span className="ml-2 text-base font-normal text-muted-foreground">· {amenities.length}</span>
        </h1>
        <AddAmenityDialog />
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {[
          { href: "/admin/seeds/cities", label: "Cities" },
          { href: "/admin/seeds/areas", label: "Areas" },
          { href: "/admin/seeds/universities", label: "Universities" },
          { href: "/admin/seeds/property-types", label: "Property Types" },
          { href: "/admin/seeds/amenities", label: "Amenities" },
        ].map((link) => (
          <a key={link.href} href={link.href} className="rounded-md border border-border px-3 py-1 hover:bg-accent transition-colors">
            {link.label}
          </a>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left font-medium text-muted-foreground px-3 py-2">Name</th>
              <th className="text-left font-medium text-muted-foreground px-3 py-2">Slug</th>
              <th className="text-left font-medium text-muted-foreground px-3 py-2">Icon</th>
              <th className="text-left font-medium text-muted-foreground px-3 py-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {amenities.map((a) => (
              <tr key={a.id} className="hover:bg-accent">
                <td className="px-3 py-3 border-t border-border font-medium">{a.name}</td>
                <td className="px-3 py-3 border-t border-border font-mono text-xs text-muted-foreground">{a.slug}</td>
                <td className="px-3 py-3 border-t border-border text-muted-foreground">{a.icon ?? "—"}</td>
                <td className="px-3 py-3 border-t border-border">
                  <AmenityToggle amenityId={a.id} isActive={a.is_active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
