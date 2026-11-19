import { useState } from "react";
import type { Model3D } from "../lib/api";
import Modal from "./Modal";

const KIND_LABEL: Record<Model3D["kind"], string> = {
  exterior: "Bên ngoài",
  interior: "Bên trong",
};

export default function ModelViewer({
  place,
  onClose,
}: {
  place: { name: string; models: Model3D[] };
  onClose: () => void;
}) {
  const [kind, setKind] = useState<Model3D["kind"]>(
    place.models[0]?.kind ?? "exterior",
  );
  const current = place.models.find((m) => m.kind === kind) ?? place.models[0];
  if (!current) return null;

  return (
    <Modal
      title={place.name}
      subtitle="KHÁM PHÁ MÔ HÌNH 3D"
      onClose={onClose}
      open
      preload
      className="model-dialog"
    >
      <div className="model-toolbar">
        <p>Kéo để xoay · Cuộn để thu phóng</p>
        {place.models.length > 1 && (
          <div className="segmented">
            {place.models.map((m) => (
              <button
                key={m.modelId}
                aria-pressed={current.modelId === m.modelId}
                onClick={() => setKind(m.kind)}
              >
                {KIND_LABEL[m.kind]}
              </button>
            ))}
          </div>
        )}
      </div>

      <iframe
        key={current.modelId}
        src={current.embedUrl}
        title={`${place.name} · ${KIND_LABEL[current.kind]}`}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        loading="lazy"
        style={{
          width: "100%",
          height: "min(70vh, 560px)",
          border: 0,
          borderRadius: 12,
        }}
      />

      {current.credit && (
        <p className="embed-help">Mô hình: {current.credit}</p>
      )}
    </Modal>
  );
}
