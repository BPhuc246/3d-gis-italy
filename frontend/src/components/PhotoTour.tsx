import { PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { loadLocalTour, PhotoTour as TourData, Hotspot, NavigationDirection } from '../lib/explore';
import Modal from './Modal';
import { photoSize, limitPhotoPan, PhotoViewMode, INITIAL_PHOTO_ZOOM } from '../lib/photoViewport';
import { navigationPresentation, pointerMarker } from '../lib/photoNavigation';

export default function PhotoTour({ destinationSlug, onClose }: { destinationSlug: string; onClose: () => void }) {
  const [tour, setTour] = useState<TourData | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError(''); setTour(null);
    loadLocalTour(destinationSlug, attempt > 0).then(data => { if (active) setTour(data); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [attempt, destinationSlug]);
  return <Modal title={tour?.title ?? 'Khám phá qua ảnh'} subtitle={tour?.destinationName ?? 'DI SẢN ROMA'} onClose={onClose} hideHeader className="tour-dialog immersive-tour">
    <button className="tour-exit" onClick={onClose} aria-label="Thoát tour ảnh">✕</button>
    {error ? <div className="empty-state"><p role="alert">{error}</p><button className="button secondary" onClick={() => setAttempt(n => n + 1)}>Thử lại</button></div> : tour ? <TourContent key={`${tour.id}:${tour.version}`} tour={tour} /> : <p className="empty-state" role="status">Đang tải hành trình…</p>}
  </Modal>;
}

function TourContent({ tour }: { tour: TourData }) {
  const key = `roma-tour:${tour.id}:v${tour.version}`;
  const infoIds = tour.scenes.flatMap(s => s.hotspots.filter(h => !h.target).map(h => h.id));
  const questionIds = tour.questions.map(q => q.id);
  const sceneIds = tour.scenes.map(s => s.id);
  const [saved] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || '{}');
      const valid = (values: unknown, allowed: string[]) => Array.isArray(values) ? [...new Set<string>(values.filter((id: unknown) => typeof id === 'string' && allowed.includes(id)))] : [];
      return { seen: valid(raw.seen, infoIds), solved: valid(raw.solved, questionIds), visited: valid(raw.visited, sceneIds), current: sceneIds.includes(raw.current) ? raw.current as string : tour.startSceneId };
    } catch { return { seen: [] as string[], solved: [] as string[], visited: [] as string[], current: tour.startSceneId }; }
  });
  const initialScene = tour.scenes.find(s => s.id === saved.current)!;
  const [seen, setSeen] = useState<string[]>(saved.seen);
  const [solved, setSolved] = useState<string[]>(saved.solved);
  const [visited, setVisited] = useState<string[]>(() => [...new Set([...saved.visited, saved.current])]);
  const [sceneId, setSceneId] = useState(saved.current);
  const [history, setHistory] = useState<string[]>([]);
  const [active, setActive] = useState<Hotspot | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [zoom, setZoom] = useState(INITIAL_PHOTO_ZOOM);
  const [mode, setMode] = useState<PhotoViewMode>('cover');
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panelCollapsed, setPanelCollapsed] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const [panelTab, setPanelTab] = useState<'scenes' | 'info' | 'game'>('scenes');
  const [showHotspots, setShowHotspots] = useState(false);
  const [showSceneName, setShowSceneName] = useState(false);
  const drag = useRef<{ pointer: number; x: number; y: number; panX: number; panY: number } | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageAttempt, setImageAttempt] = useState(0);
  const [ratio, setRatio] = useState(initialScene.width && initialScene.height ? initialScene.width / initialScene.height : 1.7);
  const [size, setSize] = useState({ width: 600, height: 400 });
  const viewport = useRef<HTMLDivElement>(null);
  const scene = tour.scenes.find(s => s.id === sceneId) ?? tour.scenes[0];
  const image = photoSize(size.width, size.height, ratio, zoom, mode);
  const progress = Math.round((seen.length + solved.length + visited.length) / (infoIds.length + tour.questions.length + tour.scenes.length) * 100);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify({ seen, solved, visited, current: sceneId })); } catch { /* Optional storage. */ } }, [key, seen, solved, visited, sceneId]);
  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setPan(p => { const next = limitPhotoPan(p.x, p.y, image.width, image.height, size.width, size.height); return next.x === p.x && next.y === p.y ? p : next; });
  }, [image.width, image.height, size.width, size.height]);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => { event.preventDefault(); setZoom(z => Math.max(1, Math.min(3.5, z + (event.deltaY < 0 ? .15 : -.15)))); };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, []);
  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest('button, a') || event.button !== 0) return;
    drag.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    setPan(limitPhotoPan(current.panX + event.clientX - current.x, current.panY + event.clientY - current.y, image.width, image.height, size.width, size.height));
  }
  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  useEffect(() => {
    // Warm only neighboring full-size photos; the scene list uses small thumbnails.
    const neighbors = scene.hotspots.filter(h => h.target).slice(0, 2).map(h => tour.scenes.find(s => s.id === h.target)!);
    const images = neighbors.map(s => { const image = new Image(); image.decoding = 'async'; image.src = s.image; return image; });
    return () => { images.length = 0; };
  }, [sceneId, tour]);
  function navigate(id: string, backwards = false) {
    if (id === sceneId || !tour.scenes.some(s => s.id === id)) return;
    if (!backwards) setHistory(h => [...h, sceneId]);
    const next = tour.scenes.find(s => s.id === id)!;
    if (next.width && next.height) setRatio(next.width / next.height);
    setVisited(ids => ids.includes(id) ? ids : [...ids, id]);
    setSceneId(id); setActive(null); setZoom(INITIAL_PHOTO_ZOOM); setMode('cover'); setPan({ x: 0, y: 0 }); drag.current = null; setImageReady(false); setImageError(false);
    viewport.current?.scrollTo(0, 0);
  }
  function open(h: Hotspot) {
    if (h.target) { navigate(h.target); return; }
    if (active?.id === h.id && !panelCollapsed && panelTab === 'info') { setActive(null); setPanelCollapsed(true); return; }
    setActive(h); setPanelCollapsed(false); setPanelTab('info'); setSeen(ids => ids.includes(h.id) ? ids : [...ids, h.id]);
  }
  return <div className={`tour-layout ${panelCollapsed ? 'tour-panel-collapsed' : ''}`}>
    <section className="tour-visual" aria-label="Ảnh tham quan toàn cảnh">
      <div className={`photo-viewport ${showHotspots ? '' : 'hotspots-hidden'}`} ref={viewport}
        onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}
        onDoubleClick={e => { if (!(e.target as Element).closest('button')) { setMode('cover'); setZoom(INITIAL_PHOTO_ZOOM); setPan({ x: 0, y: 0 }); } }}>
        {imageError ? <div className="photo-error" role="alert">Không tải được ảnh.<button className="button secondary" onClick={() => { setImageError(false); setImageReady(false); setImageAttempt(n => n + 1); }}>Thử lại ảnh</button></div> : <div className="photo-sheet" style={{ width: image.width, transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px)` }}>
          <img key={`${scene.id}:${imageAttempt}`} src={scene.image} alt={scene.alt} draggable={false} onLoad={e => { setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight); setImageReady(true); }} onError={() => setImageError(true)} />
          {imageReady && scene.hotspots.map(h => <PhotoHotspot key={`${scene.id}:${h.id}`} hotspot={h} showLabels={showHotspots} previous={history[history.length - 1]} targetTitle={tour.scenes.find(s => s.id === h.target)?.title} visited={seen.includes(h.id)} expanded={active?.id === h.id && !panelCollapsed && panelTab === 'info'} onOpen={() => open(h)} />)}
        </div>}
        {!imageReady && !imageError && <span className="tour-image-loading" role="status">Đang tải ảnh…</span>}
      </div>
    </section>

    <aside id="tour-side-panel" className="tour-story" aria-label="Hành trình, thông tin và trò chơi" {...(panelCollapsed ? { inert: '' } : {})} aria-hidden={panelCollapsed}>
      <div className="tour-panel-intro"><p className="eyebrow">{tour.destinationName.toLocaleUpperCase('vi')} · ROMA</p><h3>{tour.title}</h3><p>Quan sát. Khám phá. Giải mã di sản.</p></div>
      <div className="tour-progress"><div><span>HÀNH TRÌNH CỦA BẠN</span><strong>{progress}%</strong></div><progress max="100" value={progress} aria-label="Tiến độ khám phá" /><p>{visited.length}/{tour.scenes.length} góc nhìn · {seen.length}/{infoIds.length} chi tiết · {solved.length}/{tour.questions.length} câu hỏi</p></div>
      <div className="tour-panel-tabs" aria-label="Nội dung bảng bên">{([['scenes', 'Hành trình'], ['info', 'Thông tin'], ['game', 'Trò chơi']] as const).map(([value, label]) => <button key={value} aria-pressed={panelTab === value} onClick={() => setPanelTab(value)}>{label}</button>)}</div>
      {panelTab === 'scenes' && <div className="tour-scene-list">{tour.scenes.map((s, index) => <button key={s.id} aria-pressed={scene.id === s.id} onClick={() => navigate(s.id)}><img src={s.thumbnail ?? s.image} alt="" loading="lazy" decoding="async" /><span><small>GÓC NHÌN 0{index + 1}</small><strong>{s.title.slice(5)}</strong><em>{scene.id === s.id ? 'Đang khám phá' : visited.includes(s.id) ? 'Đã xem · Xem lại →' : 'Chuyển đến cảnh này →'}</em></span></button>)}<div className="tour-connected-scenes"><h4>Liên kết từ cảnh này</h4>{scene.hotspots.filter(h => h.target).map(h => { const nav = navigationPresentation(h, history[history.length - 1], tour.scenes.find(s => s.id === h.target)?.title); return <button key={h.id} onClick={() => navigate(h.target!)}><NavigationIcon direction={nav.direction} />{nav.label}</button>; })}</div><p className="tour-hint">{tour.routeNote}</p></div>}
      {panelTab === 'info' && <>
        <p className="eyebrow">QUAN SÁT & KHÁM PHÁ</p><h3 className="tour-scene-heading">{scene.title.slice(5)}</h3><p>{scene.description}</p>
        <div aria-live="polite">{active ? <div className="hotspot-content"><span className="eyebrow">CHI TIẾT ĐÃ MỞ</span><h4>{active.title}</h4><p>{active.text}</p>{active.sourceUrl && <a className="hotspot-source" href={active.sourceUrl} target="_blank" rel="noreferrer">Nguồn nội dung ↗</a>}</div> : <p className="tour-hint">Rê chuột trên ảnh để tìm điểm khám phá. Bấm một điểm để mở thông tin, bấm lại để đóng.</p>}</div>
        <details className="accessible-hotspots"><summary>Các điểm khám phá trong cảnh</summary>{scene.hotspots.map(h => <button key={h.id} aria-expanded={h.target ? undefined : active?.id === h.id} onClick={() => open(h)}>{seen.includes(h.id) ? '✓ ' : '+ '}{h.title}</button>)}</details>
        <section className="tour-image-source" aria-label="Thông tin nguồn ảnh"><h4>Thông tin nguồn ảnh</h4><p>Ảnh: {scene.author}</p><p><a href={scene.licenseUrl} target="_blank" rel="noreferrer">{scene.license}</a> · <a href={scene.sourceUrl} target="_blank" rel="noreferrer">Xem ảnh tại nguồn ↗</a></p><p>Ảnh 2D · {scene.width ? `${scene.width}px` : 'Ảnh tư liệu'} · Nhiều thời điểm chụp</p></section><section className="tour-content-sources"><h4>Tìm hiểu về công trình</h4>{tour.contentSources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</section>
      </>}
      {panelTab === 'game' && <div className="tour-games">{tour.questions.map((q, qi) => <div key={q.id} className="tour-question">
        <span className="eyebrow">CÂU HỎI {qi + 1} / {tour.questions.length}</span><h4>{q.prompt}</h4><div>{q.choices.map((choice, index) => <button key={choice} aria-pressed={answers[q.id] === index || (solved.includes(q.id) && index === q.answer)} disabled={solved.includes(q.id)} onClick={() => { setAnswers(values => ({ ...values, [q.id]: index })); if (index === q.answer) setSolved(ids => ids.includes(q.id) ? ids : [...ids, q.id]); }}>{choice}{solved.includes(q.id) && index === q.answer ? ' ✓' : ''}</button>)}</div>
        <p aria-live="polite">{solved.includes(q.id) ? `Chính xác! ${q.explanation}` : answers[q.id] !== undefined ? 'Chưa đúng. Hãy xem lại góc nhìn gợi ý rồi thử lần nữa.' : 'Quan sát ảnh để tìm câu trả lời.'}</p>
        {!solved.includes(q.id) && q.sceneId && <button className="text-action" onClick={() => { navigate(q.sceneId!); setPanelTab('info'); }}>Xem góc nhìn gợi ý →</button>}
      </div>)}</div>}
      {progress === 100 && <p className="tour-complete" role="status">✓ Bạn đã khám phá trọn hành trình {tour.destinationName}!</p>}
    </aside>

    <button className="tour-panel-toggle" aria-controls="tour-side-panel" aria-expanded={!panelCollapsed} aria-label={panelCollapsed ? 'Mở bảng hành trình' : 'Thu gọn bảng hành trình'} onClick={() => setPanelCollapsed(value => !value)}>{panelCollapsed ? '›' : '‹'}</button>
    <div className="tour-tools" aria-label="Điều khiển ảnh">
      <button aria-label={showHotspots ? 'Ẩn icon tương tác' : 'Hiện icon tương tác'} aria-pressed={showHotspots} title={showHotspots ? 'Ẩn icon tương tác' : 'Hiện icon tương tác'} onClick={() => setShowHotspots(value => !value)}><EyeIcon hidden={!showHotspots} /></button>
      <button aria-label={showSceneName ? 'Ẩn tên khu vực hiện tại' : 'Hiện tên khu vực hiện tại'} aria-pressed={showSceneName} title={showSceneName ? 'Ẩn tên khu vực hiện tại' : 'Hiện tên khu vực hiện tại'} onClick={() => setShowSceneName(value => !value)}><SearchIcon /></button>
      <button aria-label="Cảnh trước" title="Cảnh trước" disabled={!history.length} onClick={() => { const previous = history[history.length - 1]; setHistory(h => h.slice(0, -1)); navigate(previous, true); }}>←</button>
      <button aria-label="Thu nhỏ ảnh" disabled={zoom <= 1} onClick={() => setZoom(z => Math.max(1, z - .25))}>−</button>
      <button aria-label="Phóng to ảnh" disabled={zoom >= 3.5} onClick={() => setZoom(z => Math.min(3.5, z + .25))}>+</button>
      <button aria-label={mode === 'cover' ? 'Xem toàn bộ ảnh' : 'Ảnh phủ toàn màn hình'} title={mode === 'cover' ? 'Xem toàn bộ ảnh' : 'Phủ toàn màn hình'} onClick={() => { setMode(mode === 'cover' ? 'contain' : 'cover'); setZoom(mode === 'cover' ? 1 : INITIAL_PHOTO_ZOOM); setPan({ x: 0, y: 0 }); }}>⤢</button>
    </div>
    <div className="tour-current-scene" hidden={!showSceneName}><span className="live-dot" />{scene.title}</div>
  </div>;
}

function PhotoHotspot({ hotspot: h, showLabels, previous, targetTitle, visited, expanded, onOpen }: { hotspot: Hotspot; showLabels: boolean; previous?: string; targetTitle?: string; visited: boolean; expanded: boolean; onOpen: () => void }) {
  const nav = navigationPresentation(h, previous, targetTitle);
  const label = h.target ? nav.label : expanded ? `Đóng thông tin: ${h.title}` : h.title;
  function track(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.pointerType === 'touch' || !h.target) return;
    const button = event.currentTarget;
    const bounds = button.getBoundingClientRect();
    const offset = pointerMarker(event.clientX - bounds.left, event.clientY - bounds.top, bounds.width, bounds.height);
    button.style.setProperty('--marker-x', `${offset.x}px`);
    button.style.setProperty('--marker-y', `${offset.y}px`);
    const viewport = button.closest('.photo-viewport')!.getBoundingClientRect();
    // Put the caption inward at the screen edges, including when the photo is panned.
    button.dataset.caption = event.clientX - viewport.left < 180 ? 'right' : viewport.right - event.clientX < 180 ? 'left' : event.clientY - viewport.top < 105 ? 'below' : 'above';
  }
  function reset(event: ReactPointerEvent<HTMLButtonElement>) {
    event.currentTarget.style.removeProperty('--marker-x');
    event.currentTarget.style.removeProperty('--marker-y');
  }
  return <button className={`photo-hotspot ${h.target ? 'navigation' : ''} ${visited ? 'visited' : ''}`} data-direction={h.target ? nav.direction : undefined} style={{ left: `${h.x}%`, top: `${h.y}%` }} aria-label={label} aria-expanded={h.target ? undefined : expanded} onPointerEnter={track} onPointerMove={track} onPointerLeave={reset} onClick={onOpen}>
    <span className="hotspot-marker"><span className="hotspot-disc">{h.target ? <NavigationIcon direction={nav.direction} /> : visited ? '✓' : '+'}</span><span className="hotspot-caption" hidden={!showLabels} aria-hidden="true">{h.target && <small>{nav.direction === 'return' ? 'QUAY LẠI' : nav.direction === 'view' ? 'ĐỔI GÓC NHÌN' : 'KHÁM PHÁ'}</small>}{label}</span></span>
  </button>;
}

function NavigationIcon({ direction }: { direction: NavigationDirection }) {
  if (direction === 'view') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
  if (direction === 'return') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 5 3 10l5 5M3 10h10a6 6 0 1 1 0 12" transform="translate(0 -2)" /></svg>;
  const angle = { left: -90, right: 90, up: 0, down: 180, forward: 0 }[direction];
  return <svg className={direction === 'forward' ? 'direction-forward' : ''} style={{ transform: `rotate(${angle}deg)` }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 7-7 7 7M12 5v15" /></svg>;
}

function SearchIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{hidden && <path d="m3 3 18 18" />}</svg>;
}
