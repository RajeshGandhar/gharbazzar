export const revalidate = 0;

import { listAllPropertyTypes } from "@/features/admin/server/queries";
import { Badge } from "@/components/ui/badge";
import { AddPropertyTypeDialog } from "./add-property-type-dialog";
import { PropertyTypeToggle } from "./property-type-toggle";

export default async function PropertyTypesPage() {
  const types = await listAllPropertyTypes();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Property Types
          <span className="ml-2 text-base font-normal text-muted-foreground">
            · {types.length}
          </span>
        </h1>
        <AddPropertyTypeDialog />
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
              <th className="text-left font-medium text-muted-foreground px-3 py-2">Category</th>
              <th className="text-left font-medium text-muted-foreground px-3 py-2">Position</th>
              <th className="text-left font-medium text-muted-foreground px-3 py-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.id} className="hover:bg-accent">
                <td className="px-3 py-3 border-t border-border font-medium">{t.name}</td>
                <td className="px-3 py-3 border-t border-border font-mono text-xs text-muted-foreground">{t.slug}</td>
                <td className="px-3 py-3 border-t border-border">
                  <Badge variant="secondary" className="text-xs capitalize">{t.category}</Badge>
                </td>
                <td className="px-3 py-3 border-t border-border text-muted-foreground">{t.position}</td>
                <td className="px-3 py-3 border-t border-border">
                  <PropertyTypeToggle typeId={t.id} isActive={t.is_active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
