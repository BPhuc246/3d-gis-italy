export type ViewerApi = {
  load?: (callback?: () => void) => void;
  start: (callback?: () => void) => void;
  stop: (callback?: () => void) => void;
  addEventListener: (event: string, callback: (value?: number) => void) => void;
};
export type ViewerOptions = {
  autostart: number; preload: number; camera: number;
  success: (api: ViewerApi) => void; error: () => void;
};
type ViewerConstructor = new (iframe: HTMLIFrameElement) => { init: (uid: string, options: ViewerOptions) => void };
declare global { interface Window { Sketchfab?: ViewerConstructor } }

let loading: Promise<ViewerConstructor> | undefined;
export function loadSketchfab(): Promise<ViewerConstructor> {
  if (window.Sketchfab) return Promise.resolve(window.Sketchfab);
  if (loading) return loading;
  loading = new Promise<ViewerConstructor>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
    script.async = true;
    const timer = window.setTimeout(() => fail(), 15000);
    function fail() { clearTimeout(timer); script.remove(); reject(new Error('Không kết nối được trình điều khiển Sketchfab.')); }
    script.onload = () => { clearTimeout(timer); if (window.Sketchfab) resolve(window.Sketchfab); else fail(); };
    script.onerror = fail;
    document.head.appendChild(script);
  }).catch(error => { loading = undefined; throw error; });
  return loading;
}

export function sketchfabModelId(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'sketchfab.com' || parsed.port || parsed.username || parsed.password) return null;
    return parsed.pathname.match(/^\/models\/([a-f0-9]{32})\/embed$/)?.[1] ?? null;
  } catch { return null; }
}

export function sketchfabAutoUrl(url: string | null): string | null {
  const uid = sketchfabModelId(url);
  if (!uid) return null;
  return `https://sketchfab.com/models/${uid}/embed?autostart=1&preload=1&camera=0`;
}

export function connectSketchfabViewer(options: {
  frame: HTMLIFrameElement; uid: string;
  onReady: () => void; onProgress: (stage: 'model' | 'texture', value?: number) => void;
  onError: () => void; load?: () => Promise<ViewerConstructor>;
  onInitialized?: (api: ViewerApi) => void;
}) {
  let active = true, ready = false;
  let api: ViewerApi | undefined;
  const fail = () => { if (active) { active = false; options.onError(); } };
  (options.load ?? loadSketchfab)().then(Sketchfab => {
    if (!active) return;
    new Sketchfab(options.frame).init(options.uid, {
      autostart: 1, preload: 1, camera: 0,
      success(viewer) {
        if (!active) return;
        api = viewer;
        options.onInitialized?.(viewer);
        viewer.addEventListener('viewerready', () => {
          if (active) { ready = true; options.onReady(); }
        });
        for (const stage of ['model', 'texture'] as const) viewer.addEventListener(`${stage}LoadProgress`, value => {
          if (active && !ready) options.onProgress(stage, value);
        });
        try { viewer.load?.(); viewer.start(); } catch { fail(); }
      },
      error: fail,
    });
  }).catch(fail);
  return () => {
    active = false;
    try { api?.stop(); } catch { /* The iframe may already have unloaded. */ }
    options.frame.src = 'about:blank';
  };
}
