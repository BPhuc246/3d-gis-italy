import { FormEvent, useState } from 'react';
import { api, Review } from '../lib/api';
import { useAuth } from '../lib/auth';

type Props = {
  slug: string;
  reviews: Review[];
  avgRating: number | null;
  reviewCount: number;
  onChanged: () => void;
};

const INPUT =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none';

function stars(n: number) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

export default function ReviewSection({ slug, reviews, avgRating, reviewCount, onChanged }: Props) {
  const { user } = useAuth();
  const mine = reviews.find((r) => r.userId === user?.userId);

  const [rating, setRating] = useState(mine?.rating ?? 5);
  const [comment, setComment] = useState(mine?.comment ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.saveReview(slug, { rating, comment: comment.trim() || undefined });
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Xóa đánh giá của bạn?')) return;
    setBusy(true);
    try {
      await api.deleteReview(slug);
      setRating(5);
      setComment('');
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-slate-800">
        Đánh giá{' '}
        <span className="text-base font-normal text-slate-500">
          ★ {avgRating ?? '—'} · {reviewCount} đánh giá
        </span>
      </h2>

      {!user ? (
        <p className="mt-3 text-sm text-slate-600">
          <a href="#/auth" className="text-amber-700 hover:underline">Đăng nhập</a> để viết đánh giá.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl bg-white p-5 shadow">
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600" htmlFor="rating">Số sao</label>
            <select
              id="rating"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} sao</option>
              ))}
            </select>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Chia sẻ trải nghiệm của bạn (không bắt buộc)"
            className={INPUT}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {mine ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
            </button>
            {mine && (
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="text-sm text-red-600 hover:underline disabled:opacity-50"
              >
                Xóa đánh giá
              </button>
            )}
          </div>
        </form>
      )}

      <ul className="mt-6 space-y-4">
        {reviews.length === 0 && <li className="text-sm text-slate-400">Chưa có đánh giá nào.</li>}
        {reviews.map((r) => (
          <li key={r.reviewId} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-800">{r.authorName}</span>
              <span className="text-amber-600">{stars(r.rating)}</span>
            </div>
            {r.comment && <p className="mt-2 text-sm text-slate-600">{r.comment}</p>}
            <p className="mt-2 text-xs text-slate-400">
              {new Date(r.updatedAt).toLocaleDateString('vi-VN')}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
