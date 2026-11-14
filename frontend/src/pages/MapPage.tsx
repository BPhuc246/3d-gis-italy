import { lazy, Suspense, useEffect, useState } from "react";
import {
  api,
  RegionDetail,
  RegionDestination,
  DestinationDetail,
} from "../lib/api";
import {
  loadLocalRegion,
  localDemoAvailable,
  searchKey,
  stories,
} from "../lib/explore";
import { useAuth } from "../lib/auth";
import ModelViewer from "../components/ModelViewer";
import PhotoTour from "../components/PhotoTour";
import ReviewSection from "../components/ReviewSection";
import MapBoundary from "../components/MapBoundary";
import { usePhotoTourAvailable } from "../lib/usePhotoTour";
import ExperienceHub from "../features/experiences/ExperienceHub";

const MapScene = lazy(() => import("../components/MapScene"));

export default function MapPage({ slug }: { slug: string | null }) {
  const [region, setRegion] = useState<RegionDetail | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState(() => {
    try {
      return sessionStorage.getItem("roma-search") ?? "";
    } catch {
      return "";
    }
  });
  const [local, setLocal] = useState(() => {
    try {
      return (
        localDemoAvailable &&
        sessionStorage.getItem("roma-data-mode") !== "server"
      );
    } catch {
      return localDemoAvailable;
    }
  });
  const [attempt, setAttempt] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
  const [overlay, setOverlay] = useState<"model" | "tour" | null>(null);
  const [tab, setTab] = useState<"overview" | "reviews">("overview");

  useEffect(() => {
    let active = true;
    setError("");
    setRegion(null);
    (local ? loadLocalRegion() : api.getRegion("roma-trung-tam"))
      .then((data) => {
        if (active) setRegion(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [local, attempt]);

  useEffect(() => {
    setOverlay(null);
    setTab("overview");
  }, [slug]);
  useEffect(() => {
    try {
      sessionStorage.setItem("roma-search", query);
    } catch {
      /* Optional. */
    }
  }, [query]);
  useEffect(() => {
    try {
      sessionStorage.setItem("roma-data-mode", local ? "local" : "server");
    } catch {
      /* Optional. */
    }
  }, [local]);

  const selected = region?.destinations.find((p) => p.slug === slug) ?? null;
  const photoTourAvailable = usePhotoTourAvailable(selected?.slug);
  const places = region?.destinations ?? [];
  const results = places.filter((p) =>
    searchKey(
      `${p.name} ${p.slug} ${stories[p.slug]?.subtitle ?? ""}`,
    ).includes(searchKey(query.trim())),
  );

  function select(id: string) {
    setCollapsed(false);
    window.location.hash = `#/map/${id}`;
    setFocusTick((n) => n + 1);
  }

  return (
    <div className={`explore-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="explore-sidebar" aria-label="Khám phá địa điểm">
        <div className="sidebar-intro">
          <p className="eyebrow">MỘT THÀNH PHỐ, NGÀN CÂU CHUYỆN</p>
          <h1>
            Khám phá <em>Roma.</em>
          </h1>
          <p>Chạm vào di sản. Bước vào lịch sử.</p>
        </div>

        <form
          className="search-field"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (results[0]) select(results[0].slug);
          }}
        >
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Tìm địa điểm"
            placeholder="Tìm công trình, địa điểm…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" aria-label="Tìm kiếm">
            →
          </button>
        </form>

        {selected ? (
          <>
            <button
              className="back-link"
              onClick={() => {
                window.location.hash = "#/map";
              }}
            >
              ← Tất cả địa điểm
            </button>
            <PlaceHero key={selected.slug} place={selected} local={local} />
            <div className="detail-heading">
              <p className="eyebrow">
                {stories[selected.slug]?.eyebrow ?? selected.categoryLabel}
              </p>
              <h2>{selected.name}</h2>
              <p>{stories[selected.slug]?.subtitle}</p>
            </div>
            <div className="detail-actions">
              <button
                className="button primary"
                disabled={!selected.embeds.length}
                onClick={() => setOverlay("model")}
              >
                <span>◇</span> Xem chi tiết mô hình 3D <span>↗</span>
              </button>
              <button
                className="button secondary"
                disabled={!photoTourAvailable}
                onClick={() => setOverlay("tour")}
              >
                <span>◎</span>{" "}
                {photoTourAvailable
                  ? "Khám phá qua ảnh"
                  : "Tour ảnh đang được bổ sung"}{" "}
                <span>→</span>
              </button>
              <button
                className="text-action"
                onClick={() => setFocusTick((n) => n + 1)}
              >
                ⌖ Đến vị trí trên bản đồ
              </button>
            </div>
            <div className="detail-tabs" aria-label="Nội dung địa điểm">
              <button
                aria-pressed={tab === "overview"}
                onClick={() => setTab("overview")}
              >
                Tổng quan
              </button>
              <button
                aria-pressed={tab === "reviews"}
                onClick={() => setTab("reviews")}
              >
                Bình luận & đánh giá
              </button>
            </div>
            {tab === "overview" ? (
              <div className="place-overview">
                <p>
                  {stories[selected.slug]?.description ?? selected.description}
                </p>
                {local && selected.coverImageCredit && (
                  <p className="cover-attribution">
                    Ảnh: {selected.coverImageCredit} ·{" "}
                    <a
                      href={selected.coverImageSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Nguồn ảnh ↗
                    </a>{" "}
                    ·{" "}
                    <a
                      href={selected.coverImageLicenseUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Giấy phép
                    </a>
                  </p>
                )}
                <div className="facts-grid">
                  {stories[selected.slug]?.facts.map((f) => (
                    <div key={f.label}>
                      <span>{f.label}</span>
                      <strong>{f.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="visit-info">
                  <p>
                    <span>⌖ ĐỊA CHỈ</span>
                    {selected.address}
                  </p>
                  <p>
                    <span>◷ GIỜ THAM QUAN</span>
                    {selected.openingHours ??
                      "Xem thông tin tại nguồn chính thức."}
                  </p>
                  <p>
                    <span>VÉ THAM QUAN</span>
                    {selected.slug === "vittoriano"
                      ? "Ngoài trời: Miễn phí · Vé VIVE (bảo tàng & sân thượng): 18 EUR"
                      : selected.entryFee !== null
                        ? selected.entryFee === 0
                          ? "Miễn phí"
                          : `${selected.entryFee} ${selected.entryFeeCurrency}`
                        : "Xem loại vé và giá hiện hành tại nguồn chính thức."}
                  </p>
                </div>
                <ExperienceHub key={selected.slug} slug={selected.slug} />
                <FavoriteControl key={selected.slug} place={selected} />
                <a
                  className="source-link"
                  href={
                    stories[selected.slug]?.sourceUrl ??
                    "https://www.turismoroma.it/en"
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Thông tin từ nguồn chính thức ↗
                </a>
              </div>
            ) : (
              <ServerReviews key={selected.slug} slug={selected.slug} />
            )}
          </>
        ) : (
          <>
            <div className="list-heading">
              <h2>Di sản nổi bật</h2>
              <span>{results.length.toString().padStart(2, "0")} ĐỊA ĐIỂM</span>
            </div>
            {slug && region && (
              <p role="status" className="inline-notice">
                Địa điểm này chưa có trong bản đồ.
              </p>
            )}
            {error ? (
              <div className="empty-state" role="alert">
                <p>{error}</p>
                <button
                  className="button secondary"
                  onClick={() => setAttempt((n) => n + 1)}
                >
                  Thử lại
                </button>
                {localDemoAvailable && !local && (
                  <button
                    className="text-action"
                    onClick={() => setLocal(true)}
                  >
                    Dùng dữ liệu thử cục bộ
                  </button>
                )}
              </div>
            ) : !region ? (
              <p className="empty-state" role="status">
                Đang tải địa điểm…
              </p>
            ) : !results.length ? (
              <div className="empty-state">
                <p>
                  {places.length
                    ? "Không tìm thấy địa điểm phù hợp."
                    : "Khu vực chưa có địa điểm."}
                </p>
                <button className="text-action" onClick={() => setQuery("")}>
                  Xóa tìm kiếm
                </button>
              </div>
            ) : (
              <div className="place-list">
                {results.map((p, i) => (
                  <button
                    key={p.slug}
                    className="place-card"
                    onClick={() => select(p.slug)}
                  >
                    <div className="place-card-art">
                      <PlaceHero place={p} local={local} />
                      <span className="place-number">0{i + 1}</span>
                    </div>
                    <div className="place-card-copy">
                      <div>
                        <span className="eyebrow">
                          {stories[p.slug]?.era ?? p.categoryLabel}
                        </span>
                        <h3>{p.name}</h3>
                        <p>{stories[p.slug]?.subtitle}</p>
                      </div>
                      <span className="card-arrow">↗</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="explore-note">
              <span>◇</span>
              <div>
                <strong>Nhìn gần hơn. Hiểu sâu hơn.</strong>
                <p>
                  Chọn công trình để mở mô hình 3D hoặc khám phá những câu
                  chuyện qua ảnh.
                </p>
              </div>
            </div>
          </>
        )}
        {localDemoAvailable && (
          <div className="local-mode">
            <span>
              {local
                ? "● Dữ liệu tham quan ngoại tuyến"
                : "● Đang dùng dữ liệu máy chủ"}
            </span>
            <button
              onClick={() => {
                setLocal((v) => !v);
                setOverlay(null);
              }}
            >
              {local ? "Kết nối máy chủ" : "Dùng bản thử"}
            </button>
          </div>
        )}
      </aside>

      <section className="explore-map" aria-label="Không gian bản đồ">
        {region && places.length > 0 ? (
          <MapBoundary>
            <Suspense
              fallback={
                <div className="map-placeholder">Đang chuẩn bị bản đồ 3D…</div>
              }
            >
              <MapScene
                places={places}
                selected={selected?.slug ?? null}
                focusTick={focusTick}
                onSelect={select}
              />
            </Suspense>
          </MapBoundary>
        ) : (
          <div className="map-placeholder">
            <span className="eyebrow">ROMA · ITALIA</span>
            <h2>
              Những dấu tích
              <br />
              vượt thời gian.
            </h2>
            <p>
              {error
                ? "Chọn thử lại ở bảng bên để tải dữ liệu."
                : "Đang chuẩn bị hành trình khám phá…"}
            </p>
          </div>
        )}
        <div className="map-topbar">
          <button
            className="map-chip"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
            aria-label={
              collapsed ? "Mở bảng địa điểm" : "Thu gọn bảng địa điểm"
            }
          >
            {collapsed ? "☰ Địa điểm" : "‹ Thu gọn"}
          </button>
          <button
            className="map-chip"
            onClick={() => {
              window.location.hash = "#/map";
              setFocusTick((n) => n + 1);
            }}
          >
            ⌖ Toàn cảnh Roma
          </button>
        </div>
        {selected && (
          <div className="map-selected">
            <span className="live-dot" />
            <div>
              <span>ĐANG KHÁM PHÁ</span>
              <strong>{selected.name}</strong>
            </div>
            <button
              onClick={() => setOverlay("model")}
              disabled={!selected.embeds.length}
              aria-label="Mở mô hình 3D của địa điểm"
            >
              ◇ Xem 3D ↗
            </button>
          </div>
        )}
      </section>

      {selected && selected.embeds.length > 0 && (
        <ModelViewer
          key={selected.slug}
          place={selected}
          open={overlay === "model"}
          onClose={() => setOverlay(null)}
        />
      )}
      {selected && overlay === "tour" && (
        <PhotoTour
          destinationSlug={selected.slug}
          onClose={() => setOverlay(null)}
        />
      )}
    </div>
  );
}

function PlaceHero({
  place,
  local,
}: {
  place: RegionDestination;
  local: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const photo =
    place.coverImageUrl &&
    !place.coverImageUrl.includes("placehold.co") &&
    !broken;
  return (
    <div className={`place-hero art-${place.slug}`}>
      {photo ? (
        <img
          src={place.coverImageUrl}
          alt={place.name}
          loading="lazy"
          onError={() => setBroken(true)}
        />
      ) : (
        <>
          <svg viewBox="0 0 320 150" aria-hidden="true">
            {place.slug === "pantheon" ? (
              <g>
                <path d="M112 83a48 42 0 0 1 96 0" fill="#8c9e91" />
                <path d="M94 83h132v48H94z" fill="#d6d8c9" />
                <path d="m65 75 95-33 95 33z" fill="#657d70" />
                <path d="M74 76h172v9H74zM73 130h174v8H73z" fill="#8c9e91" />
                {[83, 110, 139, 169, 198, 227].map((x) => (
                  <path key={x} d={`M${x} 85h10v45h-10z`} fill="#b9c7b9" />
                ))}
              </g>
            ) : place.slug === "arch-of-constantine" ? (
              <g fill="#b6a779">
                <path d="M77 51h166v31H77zM72 45h176v8H72z" />
                <path d="M80 82h20v53H80zM121 82h21v53h-21zM178 82h21v53h-21zM220 82h20v53h-20z" />
                <path d="M100 96a11 11 0 0 1 21 0v-15h-21zM142 99a18 18 0 0 1 36 0V81h-36zM199 96a11 11 0 0 1 21 0V81h-21z" />
                <path d="M75 135h170v5H75z" />
              </g>
            ) : place.slug === "vittoriano" ? (
              <g fill="#4a5d6e">
                <path
                  d="M40 135h240v6H40zM55 125h210v10H55zM70 110h180v15H70z"
                  fill="#b0aba2"
                />
                <path d="M50 48h42v62H50zM228 48h42v62h-42z" fill="#cfcac0" />
                <path d="M56 36h30v12H56zM234 36h30v12h-30z" fill="#938e85" />
                <path d="M92 56h136v8H92z" fill="#beb9af" />
                {[102, 116, 130, 144, 158, 172, 186, 200, 214].map((x) => (
                  <path key={x} d={`M${x} 64h6v46h-6z`} fill="#e2ded5" />
                ))}
                <path d="M142 98h36v16h-36z" fill="#7a756d" />
              </g>
            ) : (
              <g fill="#c38e70">
                <ellipse cx="160" cy="93" rx="95" ry="40" />
                <path d="M65 65h190v30H65z" />
                <ellipse cx="160" cy="65" rx="95" ry="35" fill="#d9b496" />
                <ellipse cx="160" cy="65" rx="58" ry="19" fill="#a56e54" />
              </g>
            )}
          </svg>
          <span className="art-label">ILLUSTRAZIONE · ROMA</span>
        </>
      )}
    </div>
  );
}

function FavoriteControl({ place }: { place: RegionDestination }) {
  const { user } = useAuth();
  const [favorite, setFavorite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setFavorite(false);
    setLoaded(false);
    setMessage("");
    if (!user) return;
    let active = true;
    api
      .getDestination(place.slug)
      .then((d) => {
        if (active) {
          setFavorite(d.isFavorite);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) setMessage("Chưa tải được trạng thái yêu thích.");
      });
    return () => {
      active = false;
    };
  }, [place.slug, user]);
  async function toggle() {
    if (!user) {
      try {
        sessionStorage.setItem("roma-return", window.location.hash);
      } catch {
        /* Optional. */
      }
      window.location.hash = "#/auth";
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      if (favorite) await api.removeFavorite(place.slug);
      else await api.addFavorite(place.slug);
      setFavorite((v) => !v);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        className="button secondary favorite-button"
        disabled={busy || (!!user && !loaded)}
        onClick={toggle}
      >
        {favorite ? "♥ Đã lưu yêu thích" : "♡ Lưu địa điểm yêu thích"}
      </button>
      {message && (
        <p className="inline-notice" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

function ServerReviews({ slug }: { slug: string }) {
  const [detail, setDetail] = useState<DestinationDetail | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    api
      .getDestination(slug)
      .then((d) => {
        if (active) setDetail(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [slug, attempt]);
  if (error)
    return (
      <div className="empty-state">
        <p role="alert">{error}</p>
        <button
          className="text-action"
          onClick={() => setAttempt((n) => n + 1)}
        >
          Thử lại
        </button>
      </div>
    );
  if (!detail) return <p className="empty-state">Đang tải đánh giá…</p>;
  return (
    <ReviewSection
      key={`${slug}:${detail.reviews.map((r) => r.updatedAt).join(",")}`}
      slug={slug}
      reviews={detail.reviews}
      myReview={detail.myReview}
      avgRating={detail.avgRating}
      reviewCount={detail.reviewCount}
      onChanged={() => setAttempt((n) => n + 1)}
    />
  );
}
