import { useEffect, useMemo, useState } from 'react';
import { api, RouteDetail as Detail } from '../lib/api';
import { loadLocalRoutes, localDemoAvailable } from '../lib/explore';
import { buildRouteGeometry, formatDistance } from '../lib/routeGeometry';

export default function RouteDetailPage({ id }: { id: string }) {
  const [route, setRoute] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    api
      .getRoute(id)
      .then((data) => {
        if (active) setRoute(data);
      })
      .catch(async (e: Error) => {
        if (localDemoAvailable) {
          try {
            const local = await loadLocalRoutes();
            const found = local.find((r) => r.routeId === id);
            if (found && active) {
              setRoute(found);
              return;
            }
          } catch {
            // Fall through to error
          }
        }
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const geometry = useMemo(() => (route ? buildRouteGeometry(route.stops) : null), [route]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <a href="#/routes" className="text-amber-700 hover:underline">
          ← Quay lại
        </a>
        <p className="mt-6 text-red-600">Lỗi: {error}</p>
      </div>
    );
  }
  if (!route || !geometry) return <p className="p-6 text-slate-500">Đang tải...</p>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <a href="#/routes" className="text-sm text-amber-700 hover:underline">
        ← Tất cả tuyến
      </a>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold text-slate-800">{route.name}</h1>
          <p className="mt-2 leading-relaxed text-slate-600">{route.description}</p>
        </div>
        <a
          href={`#/map?route=${route.routeId}`}
          className="rounded-xl bg-[#314e3e] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#203e2d] transition"
        >
          🗺️ Xem tuyến trên bản đồ 3D
        </a>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-sm">
        <div>
          <span className="block text-[11px] uppercase tracking-wider text-slate-400">Tổng quãng đường</span>
          <strong className="mt-1 block text-lg font-bold text-slate-800">
            {formatDistance(geometry.totalDistanceMeters)}
          </strong>
        </div>
        <div className="border-x border-slate-100">
          <span className="block text-[11px] uppercase tracking-wider text-slate-400">Thời gian đi bộ</span>
          <strong className="mt-1 block text-lg font-bold text-amber-700">
            ~{geometry.totalWalkingMinutes} phút
          </strong>
        </div>
        <div>
          <span className="block text-[11px] uppercase tracking-wider text-slate-400">Tổng tham quan</span>
          <strong className="mt-1 block text-lg font-bold text-emerald-800">
            ~{geometry.totalEstimatedMinutes} phút
          </strong>
        </div>
      </div>

      <h2 className="mt-8 text-xs font-bold uppercase tracking-wider text-slate-400">
        Lịch trình & chỉ dẫn đi bộ qua {route.stops.length} điểm dừng
      </h2>
      <ol className="mt-3 space-y-2">
        {route.stops.map((s, index) => {
          const nextLeg = geometry.legs[index];
          return (
            <li key={`${s.stopOrder}-${s.slug}`}>
              <a
                href={`#/map/${s.slug}?route=${route.routeId}`}
                className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm transition hover:border-amber-400 hover:shadow-md"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#314e3e] text-xs font-bold text-white">
                    {s.stopOrder}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800">{s.name}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{s.address}</span>
                  </div>
                </div>
                <div className="text-right">
                  {s.stayMinutes !== null && (
                    <span className="inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                      Tham quan ~{s.stayMinutes} phút
                    </span>
                  )}
                  <span className="mt-1 block text-xs text-slate-400">Bay đến trên bản đồ 3D →</span>
                </div>
              </a>

              {nextLeg && (
                <div className="ml-6 flex items-center gap-3 border-l-2 border-dashed border-amber-300 py-2.5 pl-5 text-xs text-slate-600">
                  <span className="rounded-md bg-amber-100/80 px-2 py-0.5 font-semibold text-amber-900">
                    🚶 {formatDistance(nextLeg.distanceMeters)} · ~{nextLeg.walkingMinutes} phút
                  </span>
                  <span className="text-slate-500">
                    {nextLeg.streetNames.join(' → ')}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
