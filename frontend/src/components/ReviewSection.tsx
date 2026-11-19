import { FormEvent, useEffect, useState } from "react";
import { api, Review } from "../lib/api";
import { useAuth } from "../lib/auth";

const PAGE_SIZE = 10;
const MAX_COMMENT = 2000;

type Props = {
  slug: string;
  reviews: Review[];
  myReview: Review | null;
  avgRating: number | null;
  reviewCount: number;
  onChanged: () => void;
};

export default function ReviewSection({
  slug,
  reviews,
  myReview,
  avgRating,
  reviewCount,
  onChanged,
}: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<Review[]>(reviews);
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [comment, setComment] = useState(myReview?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(reviews);
  }, [reviews]);

  useEffect(() => {
    setRating(myReview?.rating ?? 0);
    setComment(myReview?.comment ?? "");
  }, [myReview?.reviewId, myReview?.updatedAt]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      window.location.hash = "#/auth";
      return;
    }
    if (rating < 1) {
      setError("Hãy chọn số sao.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.destinations.saveMyReview(slug, {
        rating,
        comment: comment.trim() || undefined,
      });
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      await api.destinations.deleteMyReview(slug);
      setRating(0);
      setComment("");
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function loadMore() {
    setBusy(true);
    setError("");
    try {
      const page = await api.destinations.reviews(slug, {
        limit: PAGE_SIZE,
        offset: items.length,
      });
      setItems((prev) => [...prev, ...page.items]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded-2xl bg-white p-6 shadow">
      <header className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-xl font-semibold text-slate-800">Đánh giá</h2>
        <p className="text-sm text-slate-500">
          {avgRating !== null
            ? `★ ${avgRating.toFixed(1)} · ${reviewCount} đánh giá`
            : "Chưa có đánh giá"}
        </p>
      </header>

      <form onSubmit={save} className="mt-6 space-y-3">
        {!user && (
          <p className="text-sm text-slate-500">
            Đăng nhập để viết đánh giá của bạn.
          </p>
        )}
        <div className="flex gap-1" role="radiogroup" aria-label="Số sao">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              onClick={() => setRating(n)}
              className={`text-2xl ${n <= rating ? "text-amber-500" : "text-slate-300"}`}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
          rows={3}
          placeholder="Chia sẻ cảm nhận của bạn…"
          className="w-full rounded-lg border border-slate-200 p-3 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {myReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}
          </button>
          {myReview && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="rounded-lg px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              Xóa đánh giá
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </form>

      <ul className="mt-8 divide-y divide-slate-100">
        {items.map((r) => (
          <li key={r.reviewId} className="py-4">
            <div className="flex items-baseline justify-between gap-3">
              <strong className="text-sm text-slate-800">{r.authorName}</strong>
              <span className="text-xs text-slate-400">
                {new Date(r.updatedAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <p className="mt-1 text-amber-500" aria-label={`${r.rating} sao`}>
              {"★".repeat(r.rating)}
              <span className="text-slate-300">{"★".repeat(5 - r.rating)}</span>
            </p>
            {r.comment && (
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {r.comment}
              </p>
            )}
          </li>
        ))}
      </ul>

      {items.length < reviewCount && (
        <button
          type="button"
          onClick={loadMore}
          disabled={busy}
          className="mt-4 text-sm text-amber-700 hover:underline disabled:opacity-50"
        >
          Xem thêm đánh giá
        </button>
      )}
    </section>
  );
}
