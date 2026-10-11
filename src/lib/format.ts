// Deterministic formatting (no Intl compact notation) so server and browser render identically.
function group(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "’");
}

function compact(n: number): string {
  const abs = Math.abs(n);
  const trim = (x: number) => (Math.round(x * 10) / 10).toString();
  if (abs >= 1_000_000_000) return `${trim(n / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${trim(n / 1_000_000)}M`;
  if (abs >= 10_000) return `${trim(n / 1_000)}K`;
  return group(n);
}

export function formatMoney(amount: number | null | undefined, currency = "CHF", isCompact = true): string {
  if (amount == null) return "—";
  return `${currency} ${isCompact ? compact(amount) : group(amount)}`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return Number.isInteger(n) ? compact(n) : (Math.round(n * 10) / 10).toString();
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(d));
}

export function timeAgo(d: Date | string): string {
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function formatPrice(v: {
  priceType: "FIXED" | "RANGE" | "ON_REQUEST";
  askingPrice: number | null;
  askingPriceMin: number | null;
  askingPriceMax: number | null;
  currency: string;
}): string {
  if (v.priceType === "FIXED" && v.askingPrice != null) return formatMoney(v.askingPrice, v.currency);
  if (v.priceType === "RANGE" && v.askingPriceMin != null && v.askingPriceMax != null)
    return `${formatMoney(v.askingPriceMin, v.currency)}–${formatMoney(v.askingPriceMax, v.currency).replace(`${v.currency} `, "")}`;
  return "Price on request";
}

export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
