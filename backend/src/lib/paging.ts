export type Page = { limit: number; offset: number };

function readInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "string" || value.trim() === "") return fallback;
  const n = Number(value);
  if (!Number.isInteger(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

export function parsePage(
  query: Record<string, unknown>,
  defaultLimit = 20,
  maxLimit = 50,
): Page {
  return {
    limit: readInt(query.limit, 1, maxLimit, defaultLimit),
    offset: readInt(query.offset, 0, 100_000, 0),
  };
}

export function pageBody<T>(items: T[], total: number, page: Page) {
  return { items, total, limit: page.limit, offset: page.offset };
}

// Escape ký tự đặc biệt của LIKE/ILIKE để người dùng tìm đúng chuỗi họ nhập
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

// Chuỗi đã trim, rỗng hoặc không phải chuỗi thì trả về null
export function readString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}