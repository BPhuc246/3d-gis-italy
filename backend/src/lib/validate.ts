export function isEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function isSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 120 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
}
