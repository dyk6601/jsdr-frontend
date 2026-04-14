import { API_URLS } from './config/api'

export type City = { id: string; name: string; [key: string]: any }

/** Sends the `session` cookie set by Google OAuth callback (same-site or configured CORS). */
export function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetch(input, {
    ...init,
    credentials: 'include',
  })
}

async function parseResponse(res: Response) {
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return await res.json()
  return await res.text()
}

export async function getHello(): Promise<string> {
  const res = await apiFetch(API_URLS.HELLO)
  if (!res.ok) throw new Error(`getHello failed: ${res.status}`)
  const body = await parseResponse(res)
  if (typeof body === 'string') return body
  if (body && typeof body === 'object') {
    if ('message' in body) return String((body as any).message)
    return JSON.stringify(body)
  }
  return String(body)
}

export async function getEndpoints(): Promise<string[]> {
  const res = await apiFetch(API_URLS.ENDPOINTS)
  if (!res.ok) throw new Error(`getEndpoints failed: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function getCities(): Promise<City[]> {
  const res = await apiFetch(API_URLS.CITIES)
  if (!res.ok) throw new Error(`getCities failed: ${res.status}`)
  const body = await res.json()

  if (Array.isArray(body)) return body

  if (body && typeof body === 'object') {
    const citiesField = (body as any).Cities
    if (Array.isArray(citiesField)) return citiesField
    if (citiesField && typeof citiesField === 'object') {
      return Object.entries(citiesField).map(([id, v]) => ({ id, ...(v as any) })) as City[]
    }
  }

  return []
}

export async function getCityExists(cityId: string): Promise<boolean> {
  const res = await apiFetch(API_URLS.CITY_EXISTS(cityId))
  if (!res.ok) throw new Error(`getCityExists failed: ${res.status}`)
  const body = await parseResponse(res)
  if (body && typeof body === 'object' && typeof (body as any).exists === 'boolean') {
    return (body as any).exists
  }
  return false
}

export async function getCity(cityId: string): Promise<City> {
  const res = await apiFetch(API_URLS.CITY_BY_ID(cityId))
  if (!res.ok) {
    if (res.status === 404) throw new Error('City not found')
    throw new Error(`getCity failed: ${res.status}`)
  }
  const body = await res.json()
  const cityData = body?.Cities ?? body
  return { id: cityId, ...cityData } as City
}

// --- Cost of Living & Salary Adjustment ---

export type SalaryResult = {
  from_city: string
  to_city: string
  original_salary: number
  adjusted_salary: number
  col_from: number
  col_to: number
  difference: number
  percentage_change: number
}

export async function getCostOfLiving(): Promise<Record<string, number>> {
  const res = await apiFetch(API_URLS.COST_OF_LIVING)
  if (!res.ok) throw new Error(`getCostOfLiving failed: ${res.status}`)
  const body = await res.json()
  return body.cost_of_living ?? body
}

export async function getSalaryAdjustment(
  salary: number,
  fromCity: string,
  toCity: string,
): Promise<SalaryResult> {
  const params = new URLSearchParams({
    salary: String(salary),
    from_city: fromCity,
    to_city: toCity,
  })
  const res = await apiFetch(`${API_URLS.SALARY_ADJUSTMENT}?${params}`)
  if (!res.ok) {
    const body = await parseResponse(res)
    const msg = (body as any)?.Error ?? `getSalaryAdjustment failed: ${res.status}`
    throw new Error(msg)
  }
  return await res.json()
}

export async function setPopulation(cityName: string, state: string, population: number): Promise<void> {
  const res = await apiFetch(API_URLS.CITIES, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city: cityName, state: state, population: population }),
  })
  if (!res.ok) throw new Error(`setPopulation failed: ${res.status}`)
  return await res.json()
}

// --- Auth (Google OAuth `session` cookie) ---

export type AuthUser = {
  email: string
  name?: string
  avatar_url?: string
}

/**
 * Returns the signed-in user when GET /auth/me succeeds.
 * Add this route on the backend to show name/email in the UI after login.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await apiFetch(API_URLS.AUTH_ME, { method: 'GET' })
    if (res.status === 401 || res.status === 403) return null
    if (res.status === 404) return null
    if (!res.ok) return null
    const body = await res.json()
    const user = (body && typeof body === 'object' && 'user' in body)
      ? (body as { user?: AuthUser }).user
      : (body as AuthUser)
    if (user && typeof user.email === 'string') {
      return user
    }
    return null
  } catch {
    return null
  }
}

/**
 * Clears the session cookie. Add POST /auth/logout on the backend that deletes the cookie.
 */
export async function signOut(): Promise<void> {
  const res = await apiFetch(API_URLS.AUTH_LOGOUT, { method: 'POST' })
  if (res.status === 404) return
  if (!res.ok) throw new Error(`signOut failed: ${res.status}`)
}

// --- Recommendations types ---

export type RecommendedCity = {
  name: string
  state_code: string
  population: number
  lat?: number
  lng?: number
  col_index: number
  affordability_score: number
  qol_score: number
  adjusted_salary?: number
}

export type RecommendationsResult = {
  recommendations: RecommendedCity[]
  total: number
}

// --- User profile (favorites, saved comparisons, weights) ---

export type FavoriteCity = {
  name: string
  state_code: string
  added_at?: string
}

export type SavedComparisonCity = {
  name: string
  state_code: string
}

export type SavedComparison = {
  id: string
  name: string
  cities: SavedComparisonCity[]
  created_at?: string
}

export type UserProfile = {
  user_id: string
  favorites: FavoriteCity[]
  saved_comparisons: SavedComparison[]
  weights: Record<string, number>
  updated_at?: string
}

function cityKey(name: string, stateCode: string): string {
  return `${name}|${stateCode}`
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const res = await apiFetch(API_URLS.PROFILE)
  if (res.status === 401) return null
  if (!res.ok) throw new Error(`getUserProfile failed: ${res.status}`)
  return await res.json()
}

export async function addFavorite(
  name: string,
  stateCode: string,
): Promise<FavoriteCity[]> {
  const res = await apiFetch(API_URLS.FAVORITES, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, state_code: stateCode }),
  })
  if (!res.ok) throw new Error(`addFavorite failed: ${res.status}`)
  const body = await res.json()
  return body.favorites ?? []
}

export async function removeFavorite(
  name: string,
  stateCode: string,
): Promise<FavoriteCity[]> {
  const res = await apiFetch(API_URLS.FAVORITE_ITEM(cityKey(name, stateCode)), {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`removeFavorite failed: ${res.status}`)
  const body = await res.json()
  return body.favorites ?? []
}

export async function saveComparison(
  name: string,
  cities: SavedComparisonCity[],
): Promise<SavedComparison[]> {
  const res = await apiFetch(API_URLS.COMPARISONS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, cities }),
  })
  if (!res.ok) throw new Error(`saveComparison failed: ${res.status}`)
  const body = await res.json()
  return body.saved_comparisons ?? []
}

export async function deleteComparison(
  id: string,
): Promise<SavedComparison[]> {
  const res = await apiFetch(API_URLS.COMPARISON_ITEM(id), {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`deleteComparison failed: ${res.status}`)
  const body = await res.json()
  return body.saved_comparisons ?? []
}

export async function updateWeights(
  weights: Record<string, number>,
): Promise<Record<string, number>> {
  const res = await apiFetch(API_URLS.WEIGHTS, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weights }),
  })
  if (!res.ok) throw new Error(`updateWeights failed: ${res.status}`)
  const body = await res.json()
  return body.weights ?? {}
}

// --- Recommendations ---

export async function getRecommendations(params: {
  salary?: number
  state?: string
  size?: 'small' | 'medium' | 'large' | 'any'
  top_n?: number
}): Promise<RecommendationsResult> {
  const query = new URLSearchParams()
  if (params.salary != null) query.set('salary', String(params.salary))
  if (params.state) query.set('state', params.state)
  if (params.size && params.size !== 'any') query.set('size', params.size)
  if (params.top_n) query.set('top_n', String(params.top_n))

  const url = query.toString()
    ? `${API_URLS.RECOMMENDATIONS}?${query}`
    : API_URLS.RECOMMENDATIONS

  const res = await apiFetch(url)
  if (!res.ok) throw new Error(`getRecommendations failed: ${res.status}`)
  return await res.json()
}
