import type { RegionDestination, RouteDetail } from '../lib/api';
import {
  formatDistance,
  optimizeStopOrder,
  type ComputedRouteGeometry,
  type RouteStopInput,
} from '../lib/routeGeometry';

type Props = {
  routes: RouteDetail[];
  places: RegionDestination[];
  routeBuilderMode: 'curated' | 'custom';
  selectedRouteId: string;
  customSlugs: string[];
  stops: (RouteStopInput & { stopOrder: number })[];
  geometry: ComputedRouteGeometry;
  activeStopIndex: number | null;
  activeLegIndex: number | null;
  loading: boolean;
  error: string;
  onChangeBuilderMode: (mode: 'curated' | 'custom') => void;
  onSelectRouteId: (id: string) => void;
  onUpdateCustomSlugs: (slugs: string[]) => void;
  onFocusStop: (index: number, slug: string) => void;
  onFocusLeg: (index: number) => void;
  onFitAll: () => void;
  onOpenPlaceDetail: (slug: string) => void;
};

export default function RoutePanel({
  routes,
  places,
  routeBuilderMode,
  selectedRouteId,
  customSlugs,
  stops,
  geometry,
  activeStopIndex,
  activeLegIndex,
  loading,
  error,
  onChangeBuilderMode,
  onSelectRouteId,
  onUpdateCustomSlugs,
  onFocusStop,
  onFocusLeg,
  onFitAll,
  onOpenPlaceDetail,
}: Props) {
  const currentRoute = routes.find((r) => r.routeId === selectedRouteId) ?? routes[0] ?? null;

  function toggleCustomSlug(slug: string) {
    if (customSlugs.includes(slug)) {
      onUpdateCustomSlugs(customSlugs.filter((s) => s !== slug));
    } else {
      onUpdateCustomSlugs([...customSlugs, slug]);
    }
  }

  function moveSlug(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= customSlugs.length) return;
    const next = customSlugs.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onUpdateCustomSlugs(next);
  }

  function handleOptimize() {
    if (stops.length < 3) return;
    const optimized = optimizeStopOrder(stops);
    onUpdateCustomSlugs(optimized.map((s) => s.slug));
    onFitAll();
  }

  function stepStop(delta: -1 | 1) {
    if (!stops.length) return;
    const nextIndex =
      activeStopIndex === null
        ? delta > 0
          ? 0
          : stops.length - 1
        : Math.max(0, Math.min(stops.length - 1, activeStopIndex + delta));
    onFocusStop(nextIndex, stops[nextIndex].slug);
  }

  return (
    <div className="route-panel">
      <div className="segmented route-mode-switch" role="tablist" aria-label="Chế độ tuyến tham quan">
        <button
          role="tab"
          aria-pressed={routeBuilderMode === 'curated'}
          onClick={() => onChangeBuilderMode('curated')}
        >
          Tuyến gợi ý
        </button>
        <button
          role="tab"
          aria-pressed={routeBuilderMode === 'custom'}
          onClick={() => onChangeBuilderMode('custom')}
        >
          Tự chọn tuyến ({customSlugs.length})
        </button>
      </div>

      {routeBuilderMode === 'curated' ? (
        <div className="route-selector">
          {loading ? (
            <p className="route-muted">Đang tải tuyến tham quan…</p>
          ) : error && !routes.length ? (
            <p className="inline-notice" role="alert">{error}</p>
          ) : (
            <>
              <div className="route-presets">
                {routes.map((r) => (
                  <button
                    key={r.routeId}
                    className={`route-preset-card ${r.routeId === currentRoute?.routeId ? 'active' : ''}`}
                    onClick={() => onSelectRouteId(r.routeId)}
                  >
                    <strong>{r.name}</strong>
                    <span>
                      {r.stops.length} điểm dừng · {r.totalDistanceKm ? `${r.totalDistanceKm} km` : 'Đi bộ'}
                    </span>
                  </button>
                ))}
              </div>
              {currentRoute && <p className="route-description">{currentRoute.description}</p>}
            </>
          )}
        </div>
      ) : (
        <div className="custom-route-builder">
          <div className="custom-builder-head">
            <span>Chọn ít nhất 2 công trình để vẽ tuyến 3D</span>
            <div className="custom-builder-actions">
              <button
                type="button"
                className="text-action"
                disabled={stops.length < 3}
                onClick={handleOptimize}
                title="Sắp xếp thứ tự đi bộ ngắn nhất từ điểm đầu"
              >
                ✦ Tối ưu đường
              </button>
              {customSlugs.length > 0 && (
                <button
                  type="button"
                  className="text-action"
                  onClick={() => onUpdateCustomSlugs([])}
                >
                  Xóa hết
                </button>
              )}
            </div>
          </div>

          <div className="custom-stop-picks">
            {places.map((p) => {
              const orderIndex = customSlugs.indexOf(p.slug);
              const picked = orderIndex !== -1;
              return (
                <div key={p.slug} className={`custom-pick-row ${picked ? 'picked' : ''}`}>
                  <button
                    type="button"
                    className="custom-pick-toggle"
                    onClick={() => toggleCustomSlug(p.slug)}
                  >
                    <span className="custom-pick-badge">{picked ? orderIndex + 1 : '+'}</span>
                    <span>{p.name}</span>
                  </button>
                  {picked && (
                    <div className="custom-pick-order">
                      <button
                        type="button"
                        aria-label={`Đưa ${p.name} lên trước`}
                        disabled={orderIndex === 0}
                        onClick={() => moveSlug(orderIndex, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Đưa ${p.name} xuống sau`}
                        disabled={orderIndex === customSlugs.length - 1}
                        onClick={() => moveSlug(orderIndex, 1)}
                      >
                        ↓
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stops.length >= 2 ? (
        <>
          <div className="route-metrics">
            <div>
              <span>QUÃNG ĐƯỜNG</span>
              <strong>{formatDistance(geometry.totalDistanceMeters)}</strong>
            </div>
            <div>
              <span>ĐI BỘ</span>
              <strong>~{geometry.totalWalkingMinutes} phút</strong>
            </div>
            <div>
              <span>THAM QUAN</span>
              <strong>~{geometry.totalEstimatedMinutes} phút</strong>
            </div>
          </div>

          <div className="route-walkthrough-bar">
            <button type="button" className="button secondary" onClick={() => stepStop(-1)}>
              ← Chặng trước
            </button>
            <button type="button" className="button secondary" onClick={onFitAll}>
              ⌖ Toàn tuyến
            </button>
            <button type="button" className="button primary" onClick={() => stepStop(1)}>
              Chặng tiếp →
            </button>
          </div>

          <ol className="route-timeline">
            {stops.map((stop, idx) => {
              const isActive = activeStopIndex === idx;
              const nextLeg = geometry.legs[idx];
              const isLegActive = activeLegIndex === idx;
              return (
                <li key={`${stop.stopOrder}-${stop.slug}`} className="route-timeline-item">
                  <div className={`route-stop-card ${isActive ? 'active' : ''}`}>
                    <button
                      type="button"
                      className="route-stop-main"
                      onClick={() => onFocusStop(idx, stop.slug)}
                    >
                      <span className="route-stop-num">{stop.stopOrder}</span>
                      <div>
                        <strong>{stop.name}</strong>
                        <small>
                          {stop.stayMinutes ? `Lưu lại ~${stop.stayMinutes} phút` : 'Điểm dừng di sản'}
                        </small>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="route-stop-detail"
                      onClick={() => onOpenPlaceDetail(stop.slug)}
                      title="Xem thông tin chi tiết & mô hình 3D"
                    >
                      3D ↗
                    </button>
                  </div>

                  {nextLeg && (
                    <button
                      type="button"
                      className={`route-leg-connector ${isLegActive ? 'active' : ''}`}
                      onClick={() => onFocusLeg(idx)}
                    >
                      <span>
                        🚶 {formatDistance(nextLeg.distanceMeters)} · ~{nextLeg.walkingMinutes} phút
                      </span>
                      <small>{nextLeg.streetNames.join(' → ')}</small>
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <div className="empty-state">
          <p>
            Hãy chọn ít nhất <strong>2 địa điểm</strong> ở trên để hệ thống tính toán lộ trình đi bộ 3D qua các tuyến phố di sản Roma.
          </p>
        </div>
      )}
    </div>
  );
}
