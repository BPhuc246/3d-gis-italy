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
      {error && <p className="mt-4 text-red-600">Lỗi: {error}</p>}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {routes.map((r) => (
          <a
            key={r.routeId}
            href={`#/routes/${r.routeId}`}
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
          >
            <h2 className="text-xl font-semibold text-slate-800">{r.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{r.description}</p>
            <p className="mt-4 text-xs text-slate-400">
              {r.stopCount} điểm dừng
              {r.estimatedDurationMinutes !== null && ` · khoảng ${r.estimatedDurationMinutes} phút`}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
