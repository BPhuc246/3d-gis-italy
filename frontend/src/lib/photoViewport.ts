export type PhotoViewMode = 'cover' | 'contain';
export const INITIAL_PHOTO_ZOOM = 1.25;
export function photoSize(width: number, height: number, ratio: number, zoom: number, mode: PhotoViewMode = 'cover') {
  const fit = mode === 'cover' ? Math.max(width, height * ratio) : Math.min(width, height * ratio);
  const imageWidth = Math.max(1, fit) * zoom;
  return { width: imageWidth, height: imageWidth / ratio };
}
export function limitPhotoPan(x: number, y: number, imageWidth: number, imageHeight: number, width: number, height: number) {
  const maxX = Math.max(0, (imageWidth - width) / 2);
  const maxY = Math.max(0, (imageHeight - height) / 2);
  return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
}
