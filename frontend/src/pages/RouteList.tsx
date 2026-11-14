import { useEffect, useState } from 'react';
import { api, RouteSummary } from '../lib/api';
import { loadLocalRoutes, localDemoAvailable } from '../lib/explore';

export default function RouteList() {
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .listRoutes()
      .then((data) => {
        if (active) setRoutes(data);
      })
      .catch(async (e: Error) => {
        if (localDemoAvailable) {
          try {
            const local = await loadLocalRoutes();
            if (active) {
              setRoutes(
                local.map((r) => ({
                  routeId: r.routeId,
                  name: r.name,
                  description: r.description,
                  totalDistanceKm: r.totalDistanceKm,
                  estimatedDurationMinutes: r.estimatedDurationMinutes,
                  stopCount: r.stops.length,
                }))
              );
              setOfflineMode(true);
              return;
            }
          } catch {
            // Fall back to showing original error below
          }
        }
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Tuyến tham quan 3D</h1>
          <p className="mt-2 text-slate-500">
            Khám phá các cung đường đi bộ di sản La Mã kết nối các công trình trên bản đồ 3D.
          </p>
        </div>
        <a
          href="#/map?route=custom"
          className="rounded-xl bg-[#314e3e] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#203e2d] transition"
        >
          ✦ Tự thiết kế tuyến đường 3D
        </a>
      </div>

      {offlineMode && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Đang hiển thị dữ liệu tuyến tham quan ngoại tuyến cục bộ.
        </p>
      )}
      {error && <p className="mt-4 text-red-600">Lỗi: {error}</p>}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {routes.map((r) => (
          <div
            key={r.routeId}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-800">{r.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-amber-900">
                <span className="rounded-lg bg-amber-50 px-2.5 py-1.5">
                  📍 {r.stopCount} điểm dừng
                </span>
                {r.totalDistanceKm !== null && (
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-800">
                    🚶 {r.totalDistanceKm.toFixed(2)} km đi bộ
                  </span>
                )}
                {r.estimatedDurationMinutes !== null && (
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700">
                    ◷ ~{r.estimatedDurationMinutes} phút
                  </span>
                )}
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <a
                href={`#/routes/${r.routeId}`}
                className="text-sm font-semibold text-slate-700 hover:text-amber-700"
              >
                Chi tiết lịch trình →
              </a>
              <a
                href={`#/map?route=${r.routeId}`}
                className="rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
              >
                🗺️ Xem tuyến 3D
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
