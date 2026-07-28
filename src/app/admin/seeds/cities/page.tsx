export const revalidate = 0;

import { listCities } from "@/features/admin/server/queries";
import { Badge } from "@/components/ui/badge";
import { AddCityDialog } from "./add-city-dialog";
import { CityToggle } from "./city-toggle";

export default async function CitiesPage() {
  const cities = await listCities();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Cities
          <span className="ml-2 text-base font-normal text-muted-foreground">
            · {cities.length}
          </span>
        </h1>
        <AddCityDialog />
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
        {cities.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No cities yet
          </p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-3 py-2">ID</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Name</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Slug</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">District</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">State</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Pos</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {cities.map((c) => (
                <tr key={c.id} className="hover:bg-accent">
                  <td className="px-3 py-3 border-t border-border font-mono text-xs text-muted-foreground">
                    {c.id}
                  </td>
                  <td className="px-3 py-3 border-t border-border font-medium">
                    {c.name}
                  </td>
                  <td className="px-3 py-3 border-t border-border text-muted-foreground font-mono text-xs">
                    {c.slug}
                  </td>
                  <td className="px-3 py-3 border-t border-border text-muted-foreground">
                    {c.district}
                  </td>
                  <td className="px-3 py-3 border-t border-border text-muted-foreground">
                    {c.state}
                  </td>
                  <td className="px-3 py-3 border-t border-border text-muted-foreground">
                    {c.position}
                  </td>
                  <td className="px-3 py-3 border-t border-border">
                    <CityToggle cityId={c.id} isActive={c.is_active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
