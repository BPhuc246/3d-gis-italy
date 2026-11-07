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

  return (
    <div className="mx-auto max-w-3xl p-6">
      <a href="#/routes" className="text-sm text-amber-700 hover:underline">← Tất cả tuyến</a>
      <h1 className="mt-4 text-3xl font-bold text-slate-800">{route.name}</h1>
      <p className="mt-2 text-slate-600 leading-relaxed">{route.description}</p>

      <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
        <span>📍 Tuyến tham quan gồm {route.stops.length} di sản cổ đại tại trung tâm Roma</span>
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wider text-slate-400">Lịch trình các điểm dừng</h2>
      <ol className="mt-3 space-y-3">
        {route.stops.map((s) => (
          <li key={s.slug}>
            <a
              href={`#/map/${s.slug}`}
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow transition hover:shadow-lg hover:border-amber-400 border border-transparent"
            >
              <div>
                <span className="font-semibold text-slate-800">
                  {s.stopOrder}. {s.name}
                </span>
                <span className="mt-1 block text-xs text-slate-500">{s.address}</span>
              </div>
              <div className="text-right">
                {s.stayMinutes !== null && (
                  <span className="inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    Lưu lại ~{s.stayMinutes} phút
                  </span>
                )}
                <span className="block mt-1 text-xs text-slate-400">Xem điểm 3D →</span>
              </div>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
