export const revalidate = 0;

import { listAreas, listCities } from "@/features/admin/server/queries";
import { AddAreaDialog } from "./add-area-dialog";
import { AreaToggle } from "./area-toggle";

export default async function AreasPage({
  searchParams,
}: {
  searchParams: Promise<{ city_id?: string }>;
}) {
  const sp = await searchParams;
  const cityId = sp.city_id ? Number(sp.city_id) : undefined;

  const [areas, cities] = await Promise.all([
    listAreas(cityId),
    listCities(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Areas
          <span className="ml-2 text-base font-normal text-muted-foreground">
            · {areas.length}
          </span>
        </h1>
        <AddAreaDialog cities={cities} />
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

      {/* City filter */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/admin/seeds/areas"
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${!cityId ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
        >
          All cities
        </a>
        {cities.map((c) => (
          <a
            key={c.id}
            href={`/admin/seeds/areas?city_id=${c.id}`}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${cityId === c.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
          >
            {c.name}
          </a>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {areas.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No areas found
          </p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left font-medium text-muted-foreground px-3 py-2">ID</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Name</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">City</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Pincode</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Lat/Lng</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((a) => {
                const city = a.cities as { name: string } | null;
                return (
                  <tr key={a.id} className="hover:bg-accent">
                    <td className="px-3 py-3 border-t border-border font-mono text-xs text-muted-foreground">
                      {a.id}
                    </td>
                    <td className="px-3 py-3 border-t border-border font-medium">
                      {a.name}
                    </td>
                    <td className="px-3 py-3 border-t border-border text-muted-foreground">
                      {city?.name ?? "—"}
                    </td>
                    <td className="px-3 py-3 border-t border-border text-muted-foreground">
                      {a.pincode ?? "—"}
                    </td>
                    <td className="px-3 py-3 border-t border-border text-muted-foreground font-mono text-xs">
                      {a.latitude && a.longitude
                        ? `${a.latitude.toFixed(4)}, ${a.longitude.toFixed(4)}`
                        : "—"}
                    </td>
                    <td className="px-3 py-3 border-t border-border">
                      <AreaToggle areaId={a.id} isActive={a.is_active} />
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
