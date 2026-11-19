import { useEffect, useState } from "react";
import { api } from "./api";

export function usePhotoTourAvailable(slug?: string | null): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    setAvailable(false);
    if (!slug) return;
    api.tours
      .list()
      .then((list) => {
        if (active) setAvailable(list.some((t) => t.slug === slug));
      })
      .catch(() => {
        if (active) setAvailable(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  return available;
}
