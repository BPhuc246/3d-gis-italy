export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const TOKEN_KEY = 'token';
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export type User = { userId: string; fullName: string; email: string; avatarUrl: string | null };

export type DestinationSummary = {
  destinationId: string;
  slug: string;
  name: string;
  address: string;
  category: string;
  coverImageUrl: string;
  latitude: number;
  longitude: number;
  avgRating: number | null;
  reviewCount: number;
};

export type Review = {
  reviewId: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string | null;
  updatedAt: string;
};

export type DestinationDetail = {
  destinationId: string;
  slug: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  categoryLabel: string;
  openingHours: string | null;
  entryFee: number | null;
  entryFeeCurrency: string;
  coverImageUrl: string;
  images: { imageUrl: string; imageType: string; caption: string | null; isPrimary: boolean }[];
  reviews: Review[];
  myReview: Review | null;
  reviewCount: number;
  avgRating: number | null;
  isFavorite: boolean;
};

export type EmbedKind = 'exterior' | 'interior';

export type EmbedItem = {
  kind: EmbedKind;
  embedUrl: string;
  credit: string | null;
};

export type BuildingShape = 'circle' | 'ellipse' | 'rectangle';

export type RegionDestination = {
  coverImageCredit?: string;
  coverImageSourceUrl?: string;
  coverImageLicenseUrl?: string;
  slug: string;
  name: string;
  description: string;
  address: string;
  category: string;
  categoryLabel: string;
  latitude: number;
  longitude: number;
  coverImageUrl: string;
  openingHours: string | null;
  entryFee: number | null;
  entryFeeCurrency: string;
  buildingShape: BuildingShape;
  footprintLengthM: number;
  footprintWidthM: number;
  heightM: number;
  headingDeg: number;
  interiorHeightM: number | null;
  displayColor: string;
  embeds: EmbedItem[];
  avgRating: number | null;
  reviewCount: number;
};

export type RegionDetail = {
  regionId: string;
  slug: string;
  name: string;
  description: string | null;
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
};

export type RouteDetail = Omit<RouteSummary, 'stopCount'> & { stops: RouteStop[] };

export type FavoriteItem = {
  slug: string;
  name: string;
  category: string;
  coverImageUrl: string;
  favoritedAt: string;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? `Lỗi ${res.status}`);
  }
  return data as T;
}

export const api = {
  register: (body: { fullName: string; email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () => request<User>('/api/auth/me'),

  listDestinations: (params: { category?: string; q?: string }) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set('category', params.category);
    if (params.q) qs.set('q', params.q);
    return request<DestinationSummary[]>(`/api/destinations?${qs.toString()}`);
  },

  getDestination: (slug: string) => request<DestinationDetail>(`/api/destinations/${slug}`),

  saveReview: (slug: string, body: { rating: number; comment?: string }) =>
    request<Review>(`/api/destinations/${slug}/review`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteReview: (slug: string) =>
    request<{ ok: boolean }>(`/api/destinations/${slug}/review`, { method: 'DELETE' }),

  addFavorite: (slug: string) =>
    request<{ ok: boolean }>(`/api/destinations/${slug}/favorite`, { method: 'POST' }),

  removeFavorite: (slug: string) =>
    request<{ ok: boolean }>(`/api/destinations/${slug}/favorite`, { method: 'DELETE' }),

  myFavorites: () => request<FavoriteItem[]>('/api/me/favorites'),

  listRoutes: () => request<RouteSummary[]>('/api/routes'),

  getRoute: (id: string) => request<RouteDetail>(`/api/routes/${id}`),

  getRegion: (slug: string) => request<RegionDetail>(`/api/regions/${slug}`),
};
