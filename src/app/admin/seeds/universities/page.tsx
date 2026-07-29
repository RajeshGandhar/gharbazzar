export const revalidate = 0;

import { listAllUniversities, listCities } from "@/features/admin/server/queries";
import { Badge } from "@/components/ui/badge";
import { AddUniversityDialog } from "./add-university-dialog";
import { UniversityToggle } from "./university-toggle";

export default async function UniversitiesPage() {
  const [universities, cities] = await Promise.all([
    listAllUniversities(),
    listCities(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Universities
          <span className="ml-2 text-base font-normal text-muted-foreground">
            · {universities.length}
          </span>
        </h1>
        <AddUniversityDialog cities={cities} />
      </div>

      {/* Seed sub-nav */}
      <div className="flex flex-wrap gap-2 text-sm">
        {[
          { href: "/admin/seeds/cities", label: "Cities" },
          { href: "/admin/seeds/areas", label: "Areas" },
          { href: "/admin/seeds/universities", label: "Universities" },
          { href: "/admin/seeds/property-types", label: "Property Types" },
          { href: "/admin/seeds/amenities", label: "Amenities" },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-md border border-border px-3 py-1 hover:bg-accent transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {universities.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No universities yet
          </p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Name</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Slug</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">City</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Type</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Geo</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {universities.map((u) => {
                const city = u.cities as unknown as { name: string } | null;
                return (
                  <tr key={u.id} className="hover:bg-accent">
                    <td className="px-3 py-3 border-t border-border font-medium">
                      {u.name}
                    </td>
                    <td className="px-3 py-3 border-t border-border font-mono text-xs text-muted-foreground">
                      {u.slug}
                    </td>
                    <td className="px-3 py-3 border-t border-border text-muted-foreground">
                      {city?.name ?? "—"}
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {u.institution_type.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 border-t border-border text-muted-foreground font-mono text-xs">
                      {u.latitude && u.longitude
                        ? `${u.latitude.toFixed(4)}, ${u.longitude.toFixed(4)}`
                        : "—"}
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <UniversityToggle uniId={u.id} isActive={u.is_active} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
