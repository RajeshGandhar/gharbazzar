export const revalidate = 0;

import { notFound } from "next/navigation";
import Link from "next/link";
import { getPropertyForReview } from "@/features/admin/server/queries";
import { SlaBadge } from "@/features/admin/components/sla-badge";
import { REJECTION_REASONS } from "@/features/admin/schemas";
import { formatPrice, formatFreshness } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { ApprovalDecisionPanel } from "./decision-panel";

const SLA_4H = 14_400_000;

function ChecklistItem({
  pass,
  label,
  description,
}: {
  pass: boolean;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      {pass ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
      )}
      <div>
        <p className="text-sm font-medium">{label}</p>
        {!pass && (
          <p className="text-xs text-amber-600 mt-0.5">{description}</p>
        )}
      </div>
      <span
        className={`ml-auto text-xs font-medium ${pass ? "text-green-600" : "text-amber-600"}`}
      >
        {pass ? "Pass" : "Flag"}
      </span>
    </div>
  );
}

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPropertyForReview(id);
  if (!result) notFound();

  const { property, image_count, duplicate_count } = result;

  // 6-point checklist
  const geoOk =
    property.latitude !== null && property.longitude !== null;
  const photosOk = image_count >= 3;
  const priceOk = property.price > 0;
  const duplicateOk = duplicate_count <= 2;
  const contentOk =
    !/\b[6-9]\d{9}\b/.test(property.description ?? "") &&
    !/https?:\/\//i.test(property.description ?? "");
  const completenessOk =
    property.quality_score !== null && property.quality_score >= 50;

  const seller = property.sellers as {
    business_name: string | null;
    seller_type: string;
    kyc_status: string;
    is_verified: boolean;
    profiles: { full_name: string; email: string | null } | null;
  } | null;

  const city = property.cities as { name: string } | null;
  const area = property.areas as { name: string } | null;

  const images = (
    property.property_images as Array<{
      path: string;
      is_cover: boolean;
      position: number;
    }>
  ).sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/approvals"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Approval Queue
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: Property preview */}
        <div className="space-y-5">
          {/* Images */}
          {images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="h-40 w-56 shrink-0 rounded-lg overflow-hidden bg-muted"
                >
                  <img
                    src={img.path}
                    alt={`Photo ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          {images.length === 0 && (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
              No images uploaded
            </div>
          )}

          {/* Details */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant="outline" className="capitalize">
                  {property.purpose}
                </Badge>
                {property.rental_kind && (
                  <Badge variant="secondary" className="capitalize text-xs">
                    {property.rental_kind}
                  </Badge>
                )}
              </div>
              <h2 className="text-lg font-semibold">{property.title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {[area?.name, city?.name].filter(Boolean).join(", ")}
              </p>
            </div>

            <div className="text-2xl font-bold">
              {formatPrice(property.price)}
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              {property.bedrooms !== null && (
                <>
                  <dt className="text-muted-foreground">Bedrooms</dt>
                  <dd>{property.bedrooms}</dd>
                </>
              )}
              {property.bathrooms !== null && (
                <>
                  <dt className="text-muted-foreground">Bathrooms</dt>
                  <dd>{property.bathrooms}</dd>
                </>
              )}
              {property.built_up_area !== null && (
                <>
                  <dt className="text-muted-foreground">Built-up area</dt>
                  <dd>
                    {property.built_up_area} {property.area_unit}
                  </dd>
                </>
              )}
              {property.furnishing && (
                <>
                  <dt className="text-muted-foreground">Furnishing</dt>
                  <dd className="capitalize">
                    {property.furnishing.replace("_", " ")}
                  </dd>
                </>
              )}
              {property.floor_number !== null && (
                <>
                  <dt className="text-muted-foreground">Floor</dt>
                  <dd>
                    {property.floor_number}
                    {property.total_floors ? ` of ${property.total_floors}` : ""}
                  </dd>
                </>
              )}
              <dt className="text-muted-foreground">Quality score</dt>
              <dd>{property.quality_score ?? "—"}</dd>
              <dt className="text-muted-foreground">Geo-pin</dt>
              <dd>
                {property.latitude && property.longitude
                  ? `${property.latitude.toFixed(4)}, ${property.longitude.toFixed(4)}`
                  : "Missing"}
              </dd>
            </dl>

            {property.description && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {property.description}
                </p>
              </div>
            )}

            {seller && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Seller
                </p>
                <p className="font-medium text-sm">
                  {seller.business_name ??
                    seller.profiles?.full_name ??
                    "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {seller.seller_type.replace("_", " ")} ·{" "}
                  {seller.profiles?.email ?? "no email"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  KYC: {seller.kyc_status} ·{" "}
                  {seller.is_verified ? "Verified" : "Not verified"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Decision panel */}
        <div>
          <div className="sticky top-6 space-y-4">
            {/* Submission info */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono">{property.id.slice(0, 8)}…</span>
                <SlaBadge
                  createdAt={property.created_at}
                  slaDurationMs={SLA_4H}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Submitted {formatFreshness(property.created_at)}
              </p>
            </div>

            {/* 6-point checklist */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Checklist
              </p>
              <ChecklistItem
                pass={geoOk}
                label="Geo-pin"
                description="No geo-pin — cannot verify location"
              />
              <ChecklistItem
                pass={photosOk}
                label="Photos"
                description={`Only ${image_count} photo(s) — minimum 3 required`}
              />
              <ChecklistItem
                pass={priceOk}
                label="Price sanity"
                description="Invalid price — must be greater than 0"
              />
              <ChecklistItem
                pass={duplicateOk}
                label="Duplicate scan"
                description={`${duplicate_count} similar listing(s) by this seller recently`}
              />
              <ChecklistItem
                pass={contentOk}
                label="Content policy"
                description="Description contains phone number or URL"
              />
              <ChecklistItem
                pass={completenessOk}
                label="Completeness"
                description={`Quality score ${property.quality_score ?? "missing"} — below threshold of 50`}
              />
            </div>

            {/* Decision panel (client component) */}
            <ApprovalDecisionPanel
              propertyId={property.id}
              rejectionReasons={REJECTION_REASONS}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
