import { useCallback, useEffect, useState } from "react";
import { api, DestinationDetail as Detail, Review } from "../lib/api";
import { useAuth } from "../lib/auth";
import ReviewSection from "../components/ReviewSection";
import ModelViewer from "../components/ModelViewer";
import ExperienceHub from "../features/experiences/ExperienceHub";

const REVIEW_PAGE_SIZE = 10;

export default function DestinationDetailPage({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<Detail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showModel, setShowModel] = useState(false);
  // const [showTour, setShowTour] = useState(false);
  // const hasTour = usePhotoTourAvailable(slug);

  const load = useCallback(async () => {
    try {
      const [detail, page] = await Promise.all([
        api.destinations.get(slug),
        api.destinations.reviews(slug, { limit: REVIEW_PAGE_SIZE }),
      ]);
      setData(detail);
      setReviews(page.items);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [slug]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <a href="#/list" className="text-amber-700 hover:underline">
          ← Quay lại
        </a>
        <p className="mt-6 text-red-600">Lỗi: {error}</p>
      </div>
    );
  }
  if (!data) return <p className="p-6 text-slate-500">Đang tải...</p>;

  const photos = data.images;

  const toggleFavorite = async () => {
    if (!user) {
      window.location.hash = "#/auth";
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      if (data.isFavorite) {
        await api.destinations.removeFavorite(slug);
      } else {
        await api.destinations.addFavorite(slug);
      }
      await load();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <a href="#/list" className="text-sm text-amber-700 hover:underline">
        ← Danh sách địa điểm
      </a>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            {data.categoryLabel}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-800">
            {data.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{data.address}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* {hasTour && (
            <button className="button secondary" onClick={() => setShowTour(true)}>
              Khám phá qua ảnh
            </button>
          )} */}
          {data.models.length > 0 && (
            <button
              onClick={() => setShowModel(true)}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow hover:bg-slate-50"
            >
              Xem mô hình 3D
            </button>
          )}
          <a
            href={`#/map/${slug}`}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Xem trên bản đồ
          </a>
          <button
            onClick={toggleFavorite}
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
              data.isFavorite
                ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                : "bg-white text-slate-700 shadow hover:bg-slate-50"
            }`}
          >
            {data.isFavorite ? "♥ Đã yêu thích" : "♡ Yêu thích"}
          </button>
        </div>
      </header>

      {actionError && (
        <p className="mt-4 text-sm text-red-600">Lỗi: {actionError}</p>
      )}

      <div className="mt-6 grid gap-4 rounded-2xl bg-white p-6 shadow sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Giờ mở cửa
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {data.openingHours ?? "Chưa cập nhật"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Giá vé
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {slug === "vittoriano"
              ? "Ngoài trời: Miễn phí · Vé VIVE (bảo tàng & sân thượng): 18 EUR"
              : data.entryFee !== null
                ? data.entryFee === 0
                  ? "Miễn phí"
                  : `${data.entryFee.toFixed(2)} ${data.entryFeeCurrency}`
                : "Chưa cập nhật"}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Giới thiệu
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            {data.description}
          </p>
        </div>
      </div>

      {photos.length > 0 && (
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {photos.map((img) => (
            <figure
              key={img.url}
              className="overflow-hidden rounded-xl bg-white shadow"
            >
              <img
                src={img.url}
                alt={img.caption ?? data.name}
                className="h-40 w-full object-cover"
                loading="lazy"
              />
              {img.caption && (
                <figcaption className="p-2 text-xs text-slate-500">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </section>
      )}

      <ExperienceHub slug={slug} />

      <ReviewSection
        slug={slug}
        reviews={reviews}
        myReview={data.myReview}
        avgRating={data.avgRating}
        reviewCount={data.reviewCount}
        onChanged={load}
      />

      {showModel && (
        <ModelViewer place={data} onClose={() => setShowModel(false)} />
      )}
      {/* {showTour && (
        <PhotoTour destinationSlug={slug} onClose={() => setShowTour(false)} />
      )} */}
    </div>
  );
}
