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
} as const
