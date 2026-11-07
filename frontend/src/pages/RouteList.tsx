import { useEffect, useState } from 'react';
import { api, RouteSummary } from '../lib/api';

export default function RouteList() {
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listRoutes().then(setRoutes).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold text-slate-800">Tuyến tham quan</h1>
      <p className="mt-2 text-slate-500">Khám phá các cung đường di sản La Mã cổ đại kết nối các công trình tiêu biểu.</p>
      {error && <p className="mt-4 text-red-600">Lỗi: {error}</p>}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {routes.map((r) => (
          <div
            key={r.routeId}
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-800">{r.name}</h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{r.description}</p>
              <p className="mt-3 text-xs text-amber-800 font-medium bg-amber-50 rounded-lg p-2 inline-block">
                📍 {r.stopCount} điểm dừng · {r.estimatedDurationMinutes !== null ? `Khoảng ${r.estimatedDurationMinutes} phút` : ''} · Tuyến đi bộ kết nối 3D
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <a
                href={`#/routes/${r.routeId}`}
                className="text-sm font-semibold text-slate-700 hover:text-amber-700"
              >
                Chi tiết lịch trình →
              </a>
              <a
                href="#/map?route=true"
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition"
              >
                🗺️ Xem đường 3D
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
