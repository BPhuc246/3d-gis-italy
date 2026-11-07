import { useEffect, useRef, useState } from 'react';
import { connectSketchfabViewer, sketchfabAutoUrl, sketchfabModelId, ViewerApi } from '../lib/sketchfab';

export default function EmbedPlane({ url, title, credit, active = true }: { url: string | null; title: string; credit: string | null; active?: boolean }) {
  const uid = sketchfabModelId(url);
  if (!uid) return <div className="empty-state">Công trình này chưa có mô hình nhúng hợp lệ.</div>;
  return <InteractiveViewer key={uid} uid={uid} url={url!} title={title} credit={credit} active={active} />;
}

function InteractiveViewer({ uid, url, title, credit, active }: { uid: string; url: string; title: string; credit: string | null; active: boolean }) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const apiRef = useRef<ViewerApi>();
  const [phase, setPhase] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [message, setMessage] = useState('Đang kết nối trình xem 3D…');
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const frame = iframe.current;
    if (!frame) return;
    let disposed = false, ready = false;
    setPhase('loading'); setSlow(false); setMessage('Đang kết nối trình xem 3D…');
    const timer = window.setTimeout(() => { if (!disposed && !ready) setSlow(true); }, 25000);
    function fallback() {
      if (disposed) return;
      clearTimeout(timer);
      setPhase('fallback');
      setMessage('Chưa kết nối được bộ điều khiển tự mở. Bạn có thể thử lại hoặc mở tại nguồn.');
      frame!.src = sketchfabAutoUrl(url)!;
    }
    const disconnect = connectSketchfabViewer({
      frame, uid,
      onInitialized(api) { apiRef.current = api; },
      onReady() {
        if (!disposed) {
          ready = true; clearTimeout(timer); setPhase('ready'); setSlow(false);
        }
      },
      onProgress(stage, value) {
        if (disposed || ready) return;
        const percent = typeof value === 'number' ? ` ${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` : '';
        setMessage(`${stage === 'model' ? 'Đang tải mô hình 3D…' : 'Đang tải hình ảnh bề mặt…'}${percent}`);
      },
      onError: fallback,
    });
    return () => {
      disposed = true; clearTimeout(timer);
      apiRef.current = undefined;
      disconnect();
    };
  }, [uid, url, attempt]);
  useEffect(() => {
    if (phase !== 'ready') return;
    try { if (active) apiRef.current?.start(); else apiRef.current?.stop(); } catch { /* Keep the cached frame if the provider is temporarily unavailable. */ }
  }, [active, phase]);

  return <figure className="embed-figure">
    <div className="relative aspect-video w-full bg-slate-900">
      <iframe ref={iframe} title={title} className="absolute inset-0 h-full w-full" allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen />
      {phase !== 'ready' && <div className="embed-loading" role="status"><span>{message}</span>{slow && <span style={{ display: 'block', marginTop: 6 }}>Mô hình đang tải lâu hơn dự kiến; tốc độ phụ thuộc nguồn Sketchfab và kết nối.</span>}{(slow || phase === 'fallback') && <button className="text-action" style={{ display: 'block', pointerEvents: 'auto' }} onClick={() => setAttempt(n => n + 1)}>Thử kết nối lại trình xem</button>}</div>}
    </div>
    {credit && <figcaption className="px-4 py-2 text-xs text-slate-500">{credit}</figcaption>}
  </figure>;
}
