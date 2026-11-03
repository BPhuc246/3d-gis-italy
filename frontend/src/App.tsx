import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

type HealthResponse = {
  status: string;
  db: string;
};

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then((data: HealthResponse) => setHealth(data))
      .catch((err: Error) => setError(err.message));
  }, []);

  const isOk = health?.status === 'ok';

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-800">Fullstack App</h1>
        <p className="mt-1 text-sm text-slate-500">React + TypeScript + Tailwind</p>

        <div className="mt-6 space-y-3 text-sm">
          <Row label="Backend" value={API_URL} />
          <Row
            label="Trạng thái API"
            value={error ? `Lỗi: ${error}` : health ? health.status : 'Đang kiểm tra...'}
            tone={error ? 'error' : isOk ? 'ok' : 'neutral'}
          />
          <Row
            label="PostgreSQL"
            value={health ? health.db : '—'}
            tone={health?.db === 'connected' ? 'ok' : 'neutral'}
          />
        </div>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'ok' | 'error' | 'neutral';
}) {
  const color =
    tone === 'ok' ? 'text-emerald-600' : tone === 'error' ? 'text-red-600' : 'text-slate-700';

  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );
}
