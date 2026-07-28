// ---------------------------------------------------------------------------
// Pagination helpers for Route Handlers
// ---------------------------------------------------------------------------

export interface PaginationParams {
  page: number;    // 1-based
  perPage: number;
}

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, parseInt(searchParams.get("per_page") ?? String(DEFAULT_PER_PAGE), 10) || DEFAULT_PER_PAGE)
  );
  return { page, perPage };
}

/** Convert PaginationParams to Supabase range() arguments */
export function toRange(p: PaginationParams): { from: number; to: number } {
  const from = (p.page - 1) * p.perPage;
  const to = from + p.perPage - 1;
  return { from, to };
}
