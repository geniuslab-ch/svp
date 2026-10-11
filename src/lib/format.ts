export function formatMoney(amount: number | null | undefined, currency = "CHF", compact = true): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-CH", {
    style: "currency",
    currency,
    notation: compact && Math.abs(amount) >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: compact && Math.abs(amount) >= 10_000 ? 1 : 0,
  }).format(amount);
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-CH", { notation: n >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
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
    return `${formatMoney(v.askingPriceMin, v.currency)} – ${formatMoney(v.askingPriceMax, v.currency)}`;
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
