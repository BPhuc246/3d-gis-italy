import { useEffect, useMemo, useRef, useState } from 'react';
import WebScene from '@arcgis/core/WebScene.js';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js';
import SceneView from '@arcgis/core/views/SceneView.js';
import Graphic from '@arcgis/core/Graphic.js';
import Polygon from '@arcgis/core/geometry/Polygon.js';
import Point from '@arcgis/core/geometry/Point.js';
import Polyline from '@arcgis/core/geometry/Polyline.js';
import Mesh from '@arcgis/core/geometry/Mesh.js';
import MeshSymbol3D from '@arcgis/core/symbols/MeshSymbol3D.js';
import FillSymbol3DLayer from '@arcgis/core/symbols/FillSymbol3DLayer.js';
import LineSymbol3D from '@arcgis/core/symbols/LineSymbol3D.js';
import LineSymbol3DLayer from '@arcgis/core/symbols/LineSymbol3DLayer.js';
import SceneFilter from '@arcgis/core/layers/support/SceneFilter.js';
import SceneLayer from '@arcgis/core/layers/SceneLayer.js';
import GroupLayer from '@arcgis/core/layers/GroupLayer.js';
import PointSymbol3D from '@arcgis/core/symbols/PointSymbol3D.js';
import IconSymbol3DLayer from '@arcgis/core/symbols/IconSymbol3DLayer.js';
import TextSymbol3DLayer from '@arcgis/core/symbols/TextSymbol3DLayer.js';
import '@arcgis/core/assets/esri/themes/light/main.css';
import type { RegionDestination } from '../lib/api';
import { makeBuildingMesh, modelMask } from '../lib/buildingGeometry';
import { stories } from '../lib/explore';
import { alignLandmark } from '../lib/landmarkPlacement';
import { LANDMARK_ENTRANCES, type RouteLegGeometry } from '../lib/routeGeometry';

export type ActiveRouteView = {
  legs: RouteLegGeometry[];
  stops: { slug: string; stopOrder: number; name: string; longitude: number; latitude: number }[];
  activeLegIndex: number | null;
  activeStopIndex: number | null;
  fitTick: number;
};

type Props = {
  places: RegionDestination[];
  selected: string | null;
  focusTick: number;
  onSelect: (slug: string) => void;
  activeRoute?: ActiveRouteView | null;
};

export default function MapScene({ places, selected, focusTick, onSelect, activeRoute = null }: Props) {
  const modelPlaces = useMemo(() => places.map(alignLandmark), [places]);
  const container = useRef<HTMLDivElement>(null);
  const viewRef = useRef<SceneView | null>(null);
  const routeLayerRef = useRef<GraphicsLayer | null>(null);
  const routeStopsLayerRef = useRef<GraphicsLayer | null>(null);
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
    const routeLayer = new GraphicsLayer({ title: 'Tuyến đường tham quan 3D', elevationInfo: { mode: 'relative-to-ground', offset: 3.5 } });
    const routeStopsLayer = new GraphicsLayer({ title: 'Thứ tự điểm dừng', elevationInfo: { mode: 'relative-to-ground' } });
    routeLayerRef.current = routeLayer;
    routeStopsLayerRef.current = routeStopsLayer;

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
      map.addMany([shapes, pins, routeLayer, routeStopsLayer]);
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
        const hit = await view.hitTest(event, { include: [shapes, pins, routeStopsLayer] });
        const item = hit.results.find(r => r.type === 'graphic');
        if (!disposed && item?.type === 'graphic' && item.graphic.attributes?.slug) {
          selectRef.current(item.graphic.attributes.slug);
        }
      } catch { /* A view destroyed during hit testing has no result to apply. */ }
    });

    return () => {
      disposed = true;
      clearTimeout(timer);
      click.remove();
      routeLayerRef.current = null;
      routeStopsLayerRef.current = null;
      viewRef.current = null;
      view.destroy();
    };
  }, [modelPlaces, retry]);

  // Vẽ tuyến đường đi bộ 3D và nhãn thứ tự điểm dừng mỗi khi tuyến hoặc chặng thay đổi
  useEffect(() => {
    const routeLayer = routeLayerRef.current;
    const stopsLayer = routeStopsLayerRef.current;
    if (!routeLayer || !stopsLayer) return;

    routeLayer.removeAll();
    stopsLayer.removeAll();
    if (!activeRoute) return;

    const hasFocusedLeg = activeRoute.activeLegIndex !== null;

    activeRoute.legs.forEach((leg, index) => {
      if (leg.smoothPath.length < 2) return;
      const isActiveLeg = activeRoute.activeLegIndex === index;
      const lineGeometry = new Polyline({
        paths: [leg.smoothPath],
        spatialReference: { wkid: 4326 },
      });

      // Lớp 1: Hào quang phát sáng bên dưới giúp đường dẫn nổi bật trên nền phố 3D
      routeLayer.add(new Graphic({
        geometry: lineGeometry,
        symbol: new LineSymbol3D({
          symbolLayers: [
            new LineSymbol3DLayer({
              material: { color: isActiveLeg ? [234, 88, 12, 0.45] : hasFocusedLeg ? [180, 120, 60, 0.16] : [217, 119, 6, 0.36] },
              size: isActiveLeg ? 14 : 10,
              cap: 'round',
              join: 'round',
            }),
          ],
        }),
      }));

      // Lớp 2: Lõi đường dẫn rõ nét
      routeLayer.add(new Graphic({
        geometry: lineGeometry,
        symbol: new LineSymbol3D({
          symbolLayers: [
            new LineSymbol3DLayer({
              material: { color: isActiveLeg ? '#ea580c' : hasFocusedLeg ? '#cbb89d' : '#b45309' },
              size: isActiveLeg ? 5.5 : 4,
              cap: 'round',
              join: 'round',
            }),
            ...(isActiveLeg || !hasFocusedLeg ? [
              new LineSymbol3DLayer({
                material: { color: '#fef08a' },
                size: 1.8,
                cap: 'round',
                join: 'round',
              }),
            ] : []),
          ],
        }),
      }));
    });

    // Nhãn thứ tự điểm dừng (1, 2, 3...) nổi bật phía trên công trình
    activeRoute.stops.forEach((stop, index) => {
      const aligned = modelPlaces.find(p => p.slug === stop.slug);
      const lon = aligned?.longitude ?? stop.longitude;
      const lat = aligned?.latitude ?? stop.latitude;
      const z = (Number(aligned?.heightM) || 35) + 16;
      const isActiveStop = activeRoute.activeStopIndex === index;

      stopsLayer.add(new Graphic({
        geometry: new Point({ longitude: lon, latitude: lat, z }),
        symbol: new PointSymbol3D({
          symbolLayers: [
            new IconSymbol3DLayer({
              resource: { primitive: 'circle' },
              size: isActiveStop ? 26 : 22,
              material: { color: isActiveStop ? '#ea580c' : '#314e3e' },
              outline: { color: '#fffef8', size: 2.2 },
            }),
            new TextSymbol3DLayer({
              text: String(stop.stopOrder),
              material: { color: '#fffef8' },
              font: { size: isActiveStop ? 11 : 10, weight: 'bold', family: 'Segoe UI, Arial, sans-serif' },
              verticalAlignment: 'middle',
              horizontalAlignment: 'center',
            }),
          ],
        }),
        attributes: { slug: stop.slug },
      }));

      // Điểm neo đón khách dưới mặt đất ngay đầu/cuối dải đường bộ
      const entrance = LANDMARK_ENTRANCES[stop.slug];
      if (entrance) {
        stopsLayer.add(new Graphic({
          geometry: new Point({ longitude: entrance[0], latitude: entrance[1], z: 4.5 }),
          symbol: new PointSymbol3D({
            symbolLayers: [
              new IconSymbol3DLayer({
                resource: { primitive: 'circle' },
                size: isActiveStop ? 18 : 14,
                material: { color: isActiveStop ? '#ea580c' : '#b45309' },
                outline: { color: '#ffffff', size: 2 },
              }),
              new TextSymbol3DLayer({
                text: String(stop.stopOrder),
                material: { color: '#ffffff' },
                font: { size: isActiveStop ? 9.5 : 8, weight: 'bold' },
                verticalAlignment: 'middle',
                horizontalAlignment: 'center',
              }),
            ],
          }),
          attributes: { slug: stop.slug },
        }));
      }
    });
  }, [activeRoute, modelPlaces, ready]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !ready) return;

    const p = modelPlaces.find(place => place.slug === selected);
    const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (p) {
      view.goTo(
        { target: new Point({ longitude: p.longitude, latitude: p.latitude }), scale: p.slug === 'colosseum' ? 2100 : 1100, tilt: 58, heading: 15 },
        { duration: 850, animate }
      ).catch(error => {
        if (error.name !== 'AbortError') console.warn('Camera unavailable', error.name);
      });
      return;
    }

    if (activeRoute && activeRoute.stops.length >= 2) {
      const pathPoints = activeRoute.legs.flatMap(l => l.smoothPath);
      const fallbackPoints = activeRoute.stops.map(s => [s.longitude, s.latitude] as [number, number]);
      const pts = pathPoints.length >= 2 ? pathPoints : fallbackPoints;
      const lons = pts.map(pt => pt[0]);
      const lats = pts.map(pt => pt[1]);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const padLon = Math.max(0.0025, (maxLon - minLon) * 0.35);
      const padLat = Math.max(0.0025, (maxLat - minLat) * 0.35);
      view.goTo(
        {
          target: new Polyline({
            paths: [[[minLon - padLon, minLat - padLat], [maxLon + padLon, maxLat + padLat]]],
            spatialReference: { wkid: 4326 },
          }),
          tilt: 48,
          heading: 12,
        },
        { duration: 900, animate }
      ).catch(error => {
        if (error.name !== 'AbortError') console.warn('Camera unavailable', error.name);
      });
      return;
    }

    view.goTo(
      { target: new Point({ longitude: 12.485, latitude: 41.894 }), scale: 16000, tilt: 35, heading: 0 },
      { duration: 850, animate }
    ).catch(error => {
      if (error.name !== 'AbortError') console.warn('Camera unavailable', error.name);
    });
  }, [selected, ready, modelPlaces, focusTick, activeRoute?.fitTick]);

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
        <div><i style={{ background: '#bc704c' }} /> Mô hình khối minh họa</div>
        {activeRoute && <div><i style={{ background: '#d97706' }} /> Tuyến đi bộ tham quan 3D</div>}
      </div>
    </div>
  );
}
