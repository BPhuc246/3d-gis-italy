import { useEffect, useState } from 'react';
import { api, FavoriteItem } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function Favorites() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api.myFavorites().then(setItems).catch((e: Error) => setError(e.message));
  }, [user]);

  if (loading) return <p className="p-6 text-slate-500">Đang tải...</p>;
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-slate-600">
          <a href="#/auth" className="text-amber-700 hover:underline">Đăng nhập</a> để xem danh sách yêu thích.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold text-slate-800">Yêu thích</h1>
      {error && <p className="mt-4 text-red-600">Lỗi: {error}</p>}
      {items.length === 0 && !error && <p className="mt-4 text-slate-500">Bạn chưa có địa điểm yêu thích nào.</p>}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f) => (
          <a key={f.slug} href={`#/d/${f.slug}`} className="overflow-hidden rounded-2xl bg-white shadow hover:shadow-lg">
            <img src={f.coverImageUrl} alt={f.name} className="h-40 w-full object-cover" loading="lazy" />
            <div className="p-4 font-medium text-slate-800">{f.name}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
