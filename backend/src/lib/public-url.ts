const BASE = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export function publicUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  return `${BASE}${value.startsWith("/") ? "" : "/"}${value}`;
}