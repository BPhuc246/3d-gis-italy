import { useState } from 'react';
import type { EmbedKind, RegionDestination } from '../lib/api';
import Modal from './Modal';
import EmbedPlane from './EmbedPlane';
import { sketchfabAutoUrl } from '../lib/sketchfab';

export default function ModelViewer({ place, open = true, onClose }: { place: RegionDestination; open?: boolean; onClose: () => void }) {
  const [kind, setKind] = useState<EmbedKind>(place.embeds[0]?.kind ?? 'exterior');
  const current = place.embeds.find(e => e.kind === kind);
  return <Modal title={place.name} subtitle="KHÁM PHÁ MÔ HÌNH 3D" onClose={onClose} open={open} preload className="model-dialog">
    <div className="model-toolbar"><p>Kéo để xoay · Cuộn để thu phóng</p><div className="segmented">{place.embeds.map(e => <button key={e.kind} aria-pressed={kind === e.kind} onClick={() => setKind(e.kind)}>{e.kind === 'exterior' ? 'Bên ngoài' : 'Bên trong'}</button>)}</div></div>
    <EmbedPlane url={current?.embedUrl ?? null} active={open} title={`${place.name} · ${kind === 'interior' ? 'Bên trong' : 'Bên ngoài'}`} credit={current?.credit ?? null} />
    {current && <p className="embed-help">Nếu mô hình chưa hiển thị, <a href={sketchfabAutoUrl(current.embedUrl) ?? undefined} target="_blank" rel="noreferrer">mở trình xem tại nguồn ↗</a>.</p>}
  </Modal>;
}
