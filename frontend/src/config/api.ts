/**
 * API configuration – base URL and endpoint paths for the server.
 * Use VITE_API_BASE_URL in .env / .env.local to override (e.g. /api for dev proxy).
 */

const raw = import.meta.env.VITE_API_BASE_URL as string | undefined

/** Base URL for API requests. Default: /api in dev (Vite proxy), else must set VITE_API_BASE_URL in production. */
export const API_BASE_URL =
  raw !== undefined && raw !== ""
    ? raw.replace(/\/$/, "")
    : import.meta.env.DEV
      ? "/api"
      : ""

/** Endpoint paths (no base). */
export const API_ENDPOINTS = {
  CITIES: "/cities",
  CITY_BY_ID: (id: string) => `/cities/${id}`,
  CITY_EXISTS: (id: string) => `/cities/${id}/exists`,
  HELLO: "/hello",
  ENDPOINTS: "/endpoints",
  COST_OF_LIVING: "/cost-of-living",
  SALARY_ADJUSTMENT: "/cost-of-living/salary-adjustment",
  /** GET — start Google OAuth (browser redirect). */
  GOOGLE_AUTH: "/auth/google",
  /** GET — optional: current user when session cookie is set (implement on backend). */
  AUTH_ME: "/auth/me",
  /** POST — optional: clear session cookie (implement on backend). */
  AUTH_LOGOUT: "/auth/logout",
  /** GET — ranked city recommendations with optional filters. */
  RECOMMENDATIONS: "/recommendations",
  /** GET — user profile (favorites, saved comparisons, weights). */
  PROFILE: "/auth/me/profile",
  /** POST — add a favorite city. */
  FAVORITES: "/auth/me/favorites",
  /** DELETE — remove favorite by "Name|ST" key. */
  FAVORITE_ITEM: (key: string) => `/auth/me/favorites/${encodeURIComponent(key)}`,
  /** POST — save a comparison. */
  COMPARISONS: "/auth/me/comparisons",
  /** DELETE — remove saved comparison by id. */
  COMPARISON_ITEM: (id: string) => `/auth/me/comparisons/${encodeURIComponent(id)}`,
  /** PUT — persist category weights. */
  WEIGHTS: "/auth/me/weights",
} as const

/** Full URLs: API_BASE_URL + path. */
export const API_URLS = {
  CITIES: `${API_BASE_URL}${API_ENDPOINTS.CITIES}`,
  HELLO: `${API_BASE_URL}${API_ENDPOINTS.HELLO}`,
  ENDPOINTS: `${API_BASE_URL}${API_ENDPOINTS.ENDPOINTS}`,
  CITY_BY_ID: (id: string) =>
    `${API_BASE_URL}${API_ENDPOINTS.CITY_BY_ID(id)}`,
  CITY_EXISTS: (id: string) =>
    `${API_BASE_URL}${API_ENDPOINTS.CITY_EXISTS(id)}`,
  COST_OF_LIVING: `${API_BASE_URL}${API_ENDPOINTS.COST_OF_LIVING}`,
  SALARY_ADJUSTMENT: `${API_BASE_URL}${API_ENDPOINTS.SALARY_ADJUSTMENT}`,
  GOOGLE_AUTH: `${API_BASE_URL}${API_ENDPOINTS.GOOGLE_AUTH}`,
  AUTH_ME: `${API_BASE_URL}${API_ENDPOINTS.AUTH_ME}`,
  AUTH_LOGOUT: `${API_BASE_URL}${API_ENDPOINTS.AUTH_LOGOUT}`,
  RECOMMENDATIONS: `${API_BASE_URL}${API_ENDPOINTS.RECOMMENDATIONS}`,
  PROFILE: `${API_BASE_URL}${API_ENDPOINTS.PROFILE}`,
  FAVORITES: `${API_BASE_URL}${API_ENDPOINTS.FAVORITES}`,
  FAVORITE_ITEM: (key: string) =>
    `${API_BASE_URL}${API_ENDPOINTS.FAVORITE_ITEM(key)}`,
  COMPARISONS: `${API_BASE_URL}${API_ENDPOINTS.COMPARISONS}`,
  COMPARISON_ITEM: (id: string) =>
    `${API_BASE_URL}${API_ENDPOINTS.COMPARISON_ITEM(id)}`,
  WEIGHTS: `${API_BASE_URL}${API_ENDPOINTS.WEIGHTS}`,
} as const
