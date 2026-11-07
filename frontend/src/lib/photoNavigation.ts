import type { Hotspot } from './explore';

// An actual return to the last photo takes precedence over the curated route.
export function navigationPresentation(hotspot: Hotspot, previous?: string, targetTitle?: string) {
  const returning = !!previous && hotspot.target === previous;
  return {
    direction: returning ? 'return' as const : hotspot.direction ?? 'view' as const,
    label: returning ? `Quay lại: ${targetTitle?.replace(/^\d+ · /, '') ?? hotspot.title}` : hotspot.title,
  };
}

// Keep the moving marker inside its stable hit region; it must never move the hit region itself.
export function pointerMarker(x: number, y: number, width: number, height: number) {
  return { x: Math.max(-width / 2, Math.min(width / 2, x - width / 2)), y: Math.max(-height / 2, Math.min(height / 2, y - height / 2)) };
}
