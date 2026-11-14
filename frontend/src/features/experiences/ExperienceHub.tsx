import { ComponentType, lazy, Suspense, useEffect, useState } from "react";
import { api, ExperienceItem } from "../../lib/api";
import VideoModal from "../shared/VideoModal";
import SceneModal from "../shared/SceneModal";
import { FEATURES, Feature, SceneKey } from "./registry";

type SceneProps = { audioUrl: string | null };

const SCENES: Record<SceneKey, ComponentType<SceneProps>> = {
  colosseum: lazy(() => import("../scenes/ColosseumScene")),
  "arch-parade": lazy(() => import("../scenes/ArchParadeScene")),
  vittoriano: lazy(() => import("../scenes/VittorianoScene")),
  pantheon: lazy(() => import("../scenes/PantheonScene")),
};

export default function ExperienceHub({ slug }: { slug: string }) {
  const features = FEATURES[slug] ?? [];
  const [items, setItems] = useState<ExperienceItem[]>([]);
  const [open, setOpen] = useState<Feature | null>(null);

  useEffect(() => {
    setItems([]);
    setOpen(null);
    api
      .experiences(slug)
      .then(setItems)
      .catch(() => setItems([]));
  }, [slug]);

  const find = (key: string) => items.find((i) => i.featureKey === key);
  const Scene = open?.type === "scene" ? SCENES[open.scene] : null;

  if (!features.length) return null;

  return (
    <section className="experience-hub">
      <p className="eyebrow">Trải nghiệm</p>
      <div className="experience-grid">
        {features.map((f) => {
          const missing = f.type === "video" && !find(f.featureKey);
          return (
            <button
              key={f.id}
              type="button"
              disabled={missing}
              onClick={() => setOpen(f)}
              className="experience-card"
            >
              <strong>{f.label}</strong>
              <span>{missing ? "Chưa có tài nguyên" : f.hint}</span>
            </button>
          );
        })}
      </div>

      {open?.type === "video" && (
        <VideoModal
          title={open.label}
          src={find(open.featureKey)?.assetUrl ?? ""}
          credit={find(open.featureKey)?.credit ?? null}
          onClose={() => setOpen(null)}
        />
      )}

      {open?.type === "scene" && Scene && (
        <SceneModal
          title={open.label}
          subtitle="MÔ PHỎNG 3D"
          onClose={() => setOpen(null)}
        >
          <Suspense
            fallback={<p className="p-6 text-slate-500">Đang dựng cảnh 3D…</p>}
          >
            <Scene audioUrl={find("crowd_audio")?.assetUrl ?? null} />
          </Suspense>
        </SceneModal>
      )}
    </section>
  );
}
