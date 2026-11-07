import { useEffect, useMemo, useRef, useState } from 'react';
import WebScene from '@arcgis/core/WebScene.js';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js';
import SceneView from '@arcgis/core/views/SceneView.js';
import Graphic from '@arcgis/core/Graphic.js';
import Polygon from '@arcgis/core/geometry/Polygon.js';
import Point from '@arcgis/core/geometry/Point.js';
import Mesh from '@arcgis/core/geometry/Mesh.js';
import MeshSymbol3D from '@arcgis/core/symbols/MeshSymbol3D.js';
import FillSymbol3DLayer from '@arcgis/core/symbols/FillSymbol3DLayer.js';
import SceneFilter from '@arcgis/core/layers/support/SceneFilter.js';
import SceneLayer from '@arcgis/core/layers/SceneLayer.js';
import GroupLayer from '@arcgis/core/layers/GroupLayer.js';
import PointSymbol3D from '@arcgis/core/symbols/PointSymbol3D.js';
import IconSymbol3DLayer from '@arcgis/core/symbols/IconSymbol3DLayer.js';
import '@arcgis/core/assets/esri/themes/light/main.css';
import type { RegionDestination } from '../lib/api';
import { makeBuildingMesh, modelMask } from '../lib/buildingGeometry';
import { stories } from '../lib/explore';
import { alignLandmark } from '../lib/landmarkPlacement';

type Props = {
  places: RegionDestination[];
  selected: string | null;
  focusTick: number;
  onSelect: (slug: string) => void;
};

export default function MapScene({ places, selected, focusTick, onSelect }: Props) {
  const modelPlaces = useMemo(() => places.map(alignLandmark), [places]);
  const container = useRef<HTMLDivElement>(null);
  const viewRef = useRef<SceneView | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!container.current) return;
    let disposed = false;
    setReady(false); setError(''); setSlow(false);

    const shapes = new GraphicsLayer({ title: 'Mô hình minh họa', elevationInfo: { mode: 'relative-to-ground' } });
    const pins = new GraphicsLayer({ title: 'Địa điểm', elevationInfo: { mode: 'relative-to-ground' } });

    // Build building shapes and pins
    for (const p of modelPlaces) {
      const color = stories[p.slug]?.color ?? '#bc704c';
      const mesh = makeBuildingMesh(p);
      shapes.add(new Graphic({
        geometry: new Mesh({
          spatialReference: { wkid: 4326 },
          vertexSpace: { type: 'local', origin: [p.longitude, p.latitude, 0] },
          vertexAttributes: { position: new Float64Array(mesh.position), normal: new Float32Array(mesh.normal) },
          components: mesh.components.filter(c => c.faces.length).map(c => ({
            faces: new Uint32Array(c.faces),
            shading: 'source',
            material: { color: c.color, doubleSided: true }
          })),
        }),
        symbol: new MeshSymbol3D({ symbolLayers: [new FillSymbol3DLayer()] }),
        attributes: { slug: p.slug },
      }));

      pins.add(new Graphic({
        geometry: new Point({ longitude: p.longitude, latitude: p.latitude, z: Number(p.heightM) + 6 }),
        symbol: new PointSymbol3D({
          symbolLayers: [
            new IconSymbol3DLayer({
              resource: { primitive: 'circle' },
              size: 11,
              material: { color },
              outline: { color: '#fff', size: 2 }
            })
          ]
        }),
        attributes: { slug: p.slug },
      }));
    }

    // Same public WebScene used by GIS_LEARNING's <arcgis-scene item-id="…">.
    const map = new WebScene({ portalItem: { id: 'c7400d08c9d546808961e3f01e201857' } });
    map.load().then(() => {
      if (disposed) return;
      const masks = modelPlaces.map(p => new Polygon({ rings: [modelMask(p)], spatialReference: { wkid: 4326 } }));
      const layers = [...(map.basemap?.baseLayers.toArray() ?? []), ...(map.basemap?.referenceLayers.toArray() ?? []), ...map.allLayers.toArray()];
      const collected = new Set(layers);
      for (const layer of collected) {
        if (layer instanceof GroupLayer) layer.layers.forEach(child => collected.add(child));
        if (layer instanceof SceneLayer && /\/Open3D_(Buildings|Trees)[^/]*\/SceneServer(?:\/|$)/i.test(layer.url ?? '')) {
          layer.filter = new SceneFilter({ spatialRelationship: 'disjoint', geometries: [...(layer.filter?.geometries.toArray() ?? []), ...masks] });
        }
      }
      map.addMany([shapes, pins]);
    }).catch(() => { if (!disposed) setError('Chưa tải được cảnh bản đồ. Kiểm tra kết nối rồi thử lại.'); });

    const view = new SceneView({
      container: container.current, map, qualityProfile: 'high', viewingMode: 'global',
      center: [12.485, 41.894], scale: 16000,
      environment: { atmosphereEnabled: false, starsEnabled: false, background: { type: 'color', color: '#e9ede7' }, lighting: { directShadowsEnabled: false, date: new Date('2026-06-21T11:00:00Z') } },
      ui: { components: ['zoom', 'compass', 'navigation-toggle'] },
      attributionVisible: true,
      constraints: { altitude: { min: 90, max: 200000 } },
    });
    viewRef.current = view;
    view.ui.move('zoom', 'bottom-right');
    view.ui.move('compass', 'bottom-right');
    view.ui.move('navigation-toggle', 'bottom-right');

    const timer = window.setTimeout(() => { if (!disposed) setSlow(true); }, 15000);
    view.when().then(() => { if (!disposed) { setReady(true); clearTimeout(timer); } }).catch(() => { if (!disposed) setError('Không khởi tạo được bản đồ 3D. Bạn vẫn có thể khám phá từ danh sách.'); });

    const click = view.on('click', async event => {
      try {
        const hit = await view.hitTest(event, { include: [shapes, pins] });
        const item = hit.results.find(r => r.type === 'graphic');
        if (!disposed && item?.type === 'graphic' && item.graphic.attributes?.slug) {
          selectRef.current(item.graphic.attributes.slug);
        }
      } catch { /* A view destroyed during hit testing has no result to apply. */ }
    });

    return () => { disposed = true; clearTimeout(timer); click.remove(); viewRef.current = null; view.destroy(); };
  }, [modelPlaces, retry]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !ready) return;

    const p = modelPlaces.find(place => place.slug === selected);
    const target = p
      ? { target: new Point({ longitude: p.longitude, latitude: p.latitude }), scale: p.slug === 'colosseum' ? 2100 : 1100, tilt: 58, heading: 15 }
      : { target: new Point({ longitude: 12.485, latitude: 41.894 }), scale: 16000, tilt: 35, heading: 0 };
    view.goTo(target, { duration: 850, animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches }).catch(error => {
      if (error.name !== 'AbortError') console.warn('Camera unavailable', error.name);
    });
  }, [selected, ready, modelPlaces, focusTick]);

  return (
    <div className="map-surface">
      <div ref={container} className="map-canvas" aria-label="Bản đồ 3D các di sản Roma" />
      {(!ready || error) && (
        <div className="map-message" role="status">
          <span className="map-loader" />
          <strong>{error || (slow ? 'Bản đồ đang tải lâu hơn dự kiến' : 'Đang mở bản đồ Roma…')}</strong>
          <p>{error ? 'Kiểm tra kết nối và khả năng WebGL của trình duyệt.' : 'Bạn có thể chọn địa điểm và xem ảnh trong lúc chờ.'}</p>
          {(error || slow) && <button className="button secondary" onClick={() => setRetry(v => v + 1)}>Tải lại bản đồ</button>}
        </div>
      )}
      <div className="map-caption">
        <span className="live-dot" /> ROMA, ITALIA <span>41.89° N · 12.49° E</span>
      </div>
      <div className="map-legend">
        <i style={{ background: '#bc704c' }} /> Mô hình khối minh họa
      </div>
    </div>
  );
}
