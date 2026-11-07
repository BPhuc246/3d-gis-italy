import { useEffect, useState } from 'react';
import { loadLocalTour, PHOTO_TOUR_SLUGS } from './explore';

export function usePhotoTourAvailable(slug: string | null | undefined) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let active = true;
    setAvailable(false);
    if (slug && (PHOTO_TOUR_SLUGS as readonly string[]).includes(slug)) loadLocalTour(slug).then(() => { if (active) setAvailable(true); }).catch(() => { /* No tour asset at this deployment. */ });
    return () => { active = false; };
  }, [slug]);
  return available;
}
