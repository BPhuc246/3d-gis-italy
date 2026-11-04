import { useEffect, useState } from 'react';
import { api, RouteDetail as Detail } from '../lib/api';

export default function RouteDetailPage({ id }: { id: string }) {
  const [route, setRoute] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getRoute(id).then(setRoute).catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <a href="#/routes" className="text-amber-700 hover:underline">← Quay lại</a>
        <p className="mt-6 text-red-600">Lỗi: {error}</p>
      </div>
    );
  }
  if (!route) return <p className="p-6 text-slate-500">Đang tải...</p>;

  const first = route.stops[0];

  return (
    <div className="mx-auto max-w-3xl p-6">
      <a href="#/routes" className="text-sm text-amber-700 hover:underline">← Tất cả tuyến</a>
      <h1 className="mt-4 text-3xl font-bold text-slate-800">{route.name}</h1>
      <p className="mt-2 text-slate-600">{route.description}</p>

      {first && (
        <a
          href={`#/map/${first.slug}`}
          className="mt-5 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Xem tuyến trên bản đồ 3D
        </a>
      )}

      <ol className="mt-8 space-y-3">
        {route.stops.map((s) => (
          <li key={s.slug}>
            <a
              href={`#/map/${s.slug}`}
              className="block rounded-xl bg-white p-4 shadow transition hover:shadow-lg"
            >
              <span className="font-medium text-slate-800">
                {s.stopOrder}. {s.name}
              </span>
              <span className="mt-1 block text-xs text-slate-500">{s.address}</span>
              {s.stayMinutes !== null && (
                <span className="mt-1 block text-xs text-slate-400">Lưu lại khoảng {s.stayMinutes} phút</span>
              )}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
