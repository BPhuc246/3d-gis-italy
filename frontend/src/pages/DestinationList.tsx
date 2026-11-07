import { FormEvent, useEffect, useState } from 'react';
import { api, DestinationSummary } from '../lib/api';

// Mã phải khớp với bảng destination_category trong database
const CATEGORIES = [
  { code: '', label: 'Tất cả' },
  { code: 'landmark', label: 'Di tích' },
  { code: 'museum', label: 'Bảo tàng' },
  { code: 'religious', label: 'Tôn giáo' },
];

const COVER_FALLBACK: Record<string, string> = {
  colosseum: '/_local/images/colosseum-exterior.jpg',
  'arch-of-constantine': '/_local/images/constantine-wide.jpg',
  pantheon: '/_local/images/pantheon-exterior.jpg',
};

export default function DestinationList() {
  const [items, setItems] = useState<DestinationSummary[]>([]);
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .listDestinations({ category, q: keyword })
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [category, keyword]);

  const search = (e: FormEvent) => {
    e.preventDefault();
    setKeyword(query.trim());
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Địa điểm tại Roma</h1>
        <p className="mt-2 text-slate-500">Khám phá công trình cổ đại trong không gian 3D.</p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <form onSubmit={search} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên..."
            className="w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700">
            Tìm
          </button>
        </form>
        <div className="flex gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setCategory(c.code)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                category === c.code ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-slate-500">Đang tải...</p>}
      {error && <p className="text-red-600">Lỗi: {error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-slate-500">Không tìm thấy địa điểm phù hợp.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((d) => {
          const cover = (!d.coverImageUrl || d.coverImageUrl.includes('placehold.co'))
            ? (COVER_FALLBACK[d.slug] ?? '/_local/images/colosseum-exterior.jpg')
            : d.coverImageUrl;
          return (
            <a
              key={d.destinationId}
              href={`#/d/${d.slug}`}
              className="group overflow-hidden rounded-2xl bg-white shadow transition hover:-translate-y-1 hover:shadow-lg"
            >
              <img src={cover} alt={d.name} className="h-48 w-full object-cover" loading="lazy" />
              <div className="p-5">
                <h2 className="text-lg font-semibold text-slate-800 group-hover:text-amber-700">{d.name}</h2>
                <p className="mt-1 text-xs text-slate-500">{d.address}</p>
                <p className="mt-3 text-xs text-slate-400">
                  {d.avgRating !== null ? `★ ${d.avgRating} · ${d.reviewCount} đánh giá` : 'Chưa có đánh giá'}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
