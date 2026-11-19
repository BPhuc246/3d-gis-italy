export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const TOKEN_KEY = "token";
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type Page<T> = { items: T[]; total: number; limit: number; offset: number };

export type User = { userId: string; fullName: string; email: string; avatarUrl: string | null };
export type AuthResponse = { token: string; user: User };
export type GeoJsonGeometry = { type: string; coordinates: unknown };

export type Building = {
  shapeType: "circle" | "ellipse" | "rectangle";
  headingDeg: number | null;
  heightM: number;
  footprintLengthM: number;
  footprintWidthM: number;
};

export type Model3D = {
  modelId: string;
  kind: "exterior" | "interior";
  embedUrl: string;
  credit: string | null;
};

export type GalleryImage = { url: string; caption: string | null; isPrimary: boolean };

export type Review = {
  reviewId: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string | null;
  updatedAt: string;
};

export type DestinationSummary = {
  destinationId: string;
  slug: string;
  name: string;
  address: string;
  category: string;
  categoryLabel: string;
  coverUrl: string | null;
  latitude: number;
  longitude: number;
  avgRating: number | null;
  reviewCount: number;
};

export type DestinationDetail = {
  destinationId: string;
  slug: string;
  name: string;
  description: string;
  address: string;
  category: string;
  categoryLabel: string;
  openingHours: string | null;
  entryFee: number | null;
  entryFeeCurrency: string;
  coverUrl: string | null;
  latitude: number;
  longitude: number;
  displayColor: string | null;
  building: Building | null;
  models: Model3D[];
  images: GalleryImage[];
  avgRating: number | null;
  reviewCount: number;
  isFavorite: boolean;
  myReview: Review | null;
};

export type RegionDestination = Omit<DestinationDetail, "isFavorite" | "myReview">;

export type RegionDetail = {
  regionId: string;
  slug: string;
  name: string;
  description: string | null;
  boundary: GeoJsonGeometry | null;
  centerLatitude: number;
  centerLongitude: number;
  destinations: RegionDestination[];
};

export type RouteSummary = {
  routeId: string;
  name: string;
  description: string;
  totalDistanceKm: number | null;
  estimatedDurationMinutes: number | null;
  stopCount: number;
};

export type RouteStop = {
  stopOrder: number;
  stayMinutes: number | null;
  slug: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  coverUrl: string | null;
  categoryLabel: string;
};

export type RouteDetail = Omit<RouteSummary, "stopCount"> & {
  path: GeoJsonGeometry | null;
  stops: RouteStop[];
};

export type FavoriteItem = {
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  coverUrl: string | null;
  favoritedAt: string;
};

export type TourSummary = {
  id: string;
  title: string;
  slug: string;
  name: string;
  sceneCount: number;
  coverUrl: string | null;
};

export type HotspotDirection = "forward" | "return" | "view" | "left" | "right" | "up" | "down";

type HotspotBase = { id: string; title: string; x: number; y: number };
export type NavigateHotspot = HotspotBase & { target: string; direction: HotspotDirection; text: string };
export type InfoHotspot = HotspotBase & { text: string; sourceUrl: string | null };
export type TourHotspot = NavigateHotspot | InfoHotspot;

export type TourScene = {
  id: string;
  title: string;
  image: string | null;
  thumbnail: string | null;
  alt: string | null;
  description: string | null;
  author: string | null;
  sourceUrl: string | null;
  license: string;
  licenseUrl: string | null;
  width: number | null;
  height: number | null;
  captureDate: string | null;
  hotspots: TourHotspot[];
};

export type TourQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  answer: number | null;
  explanation: string | null;
  sceneId: string | null;
};

export type TourDetail = {
  id: string;
  version: number;
  destinationSlug: string;
  destinationName: string;
  title: string;
  startSceneId: string | null;
  routeNote: string | null;
  contentSources: { title: string; url: string }[];
  scenes: TourScene[];
  questions: TourQuestion[];
};

type QueryValue = string | number | undefined | null;

function toQuery(params: Record<string, QueryValue>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") qs.set(key, String(value));
  }
  const text = qs.toString();
  return text ? `?${text}` : "";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) tokenStore.clear();
    throw new ApiError((data as { message?: string }).message ?? `Lỗi ${res.status}`, res.status);
  }
  return data as T;
}

const json = (body: unknown) => JSON.stringify(body);
const enc = encodeURIComponent;

export const api = {
  health: () => request<{ status: string; db: string }>("/api/health"),

  auth: {
    register: (body: { fullName: string; email: string; password: string }) =>
      request<AuthResponse>("/api/auth/register", { method: "POST", body: json(body) }),
    login: (body: { email: string; password: string }) =>
      request<AuthResponse>("/api/auth/login", { method: "POST", body: json(body) }),
    me: () => request<User>("/api/auth/me"),
  },

  me: {
    favorites: () => request<FavoriteItem[]>("/api/me/favorites"),
  },

  destinations: {
    list: (params: { category?: string; q?: string; limit?: number; offset?: number } = {}) =>
      request<Page<DestinationSummary>>(`/api/destinations${toQuery(params)}`),

    get: (slug: string) => request<DestinationDetail>(`/api/destinations/${enc(slug)}`),

    reviews: (slug: string, params: { limit?: number; offset?: number } = {}) =>
      request<Page<Review>>(`/api/destinations/${enc(slug)}/reviews${toQuery(params)}`),

    saveMyReview: (slug: string, body: { rating: number; comment?: string }) =>
      request<Review>(`/api/destinations/${enc(slug)}/reviews/me`, { method: "PUT", body: json(body) }),

    deleteMyReview: (slug: string) =>
      request<void>(`/api/destinations/${enc(slug)}/reviews/me`, { method: "DELETE" }),

    addFavorite: (slug: string) =>
      request<void>(`/api/destinations/${enc(slug)}/favorite`, { method: "PUT" }),

    removeFavorite: (slug: string) =>
      request<void>(`/api/destinations/${enc(slug)}/favorite`, { method: "DELETE" }),
  },

  regions: {
    get: (slug: string) => request<RegionDetail>(`/api/regions/${enc(slug)}`),
  },

  routes: {
    list: () => request<RouteSummary[]>("/api/routes"),
    get: (id: string) => request<RouteDetail>(`/api/routes/${enc(id)}`),
  },

  tours: {
    list: () => request<TourSummary[]>("/api/tours"),
    forDestination: (slug: string) => request<TourDetail>(`/api/destinations/${enc(slug)}/tour`),
  },
};
