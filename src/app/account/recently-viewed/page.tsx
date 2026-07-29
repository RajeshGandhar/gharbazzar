import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatRent, formatFreshness } from "@/lib/utils/format";
import type { RecentlyViewedWithProperty } from "@/features/account/server/queries";

export const revalidate = 0;

function coverImage(images: { path: string; is_cover: boolean; position: number }[]): string | null {
  if (!images?.length) return null;
  const cover = images.find((i) => i.is_cover) ?? images.sort((a, b) => a.position - b.position)[0];
  return cover?.path ?? null;
}

export default async function RecentlyViewedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account/recently-viewed");

  const { data, error } = await supabase
    .from("recently_viewed")
    .select(`
      user_id, property_id, viewed_at,
      properties (
        id, title, slug, price, city_id, purpose, status, approval_status,
        property_images ( path, is_cover, position ),
        cities!city_id ( name )
      )
    `)
    .eq("user_id", user.id)
    .order("viewed_at", { ascending: false })
    .limit(40);

  const items = (error ? [] : (data ?? [])) as unknown as RecentlyViewedWithProperty[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recently Viewed</h1>
        <p className="text-muted-foreground mt-1">{items.length} {items.length === 1 ? "property" : "properties"}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="rounded-full bg-muted p-5">
            <History className="size-8 text-muted-foreground" />
          </div>
          <p className="font-medium">No browsing history yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Properties you view will appear here automatically.
          </p>
          <Link href="/buy" className="text-sm text-primary hover:underline">Browse listings →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((rv) => {
            const prop = rv.properties;
            if (!prop) return null;
            const imgPath = coverImage(prop.property_images);
            const isRent = prop.purpose === "rent" || prop.purpose === "student";
            return (
              <Link key={rv.property_id} href={`/property/${prop.slug}`}>
                <div className="rounded-xl border overflow-hidden hover:border-primary transition-colors">
                  <div className="relative h-36 bg-muted">
                    {imgPath ? (
                      <Image src={imgPath} alt={prop.title} fill className="object-cover" sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                    )}
                    <Badge variant="secondary" className="absolute top-1.5 left-1.5 text-[10px] capitalize">
                      {prop.purpose}
                    </Badge>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium truncate">{prop.title}</p>
                    {prop.cities?.name && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{prop.cities.name}</p>
                    )}
                    <p className="text-xs text-primary font-semibold mt-1">
                      {isRent ? formatRent(prop.price) : formatPrice(prop.price)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatFreshness(rv.viewed_at)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
