import { useState } from 'react'
import { getCities, type City } from '../api'

export default function CitiesCard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** `null` until the user loads data at least once */
  const [cities, setCities] = useState<City[] | null>(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const data = await getCities()
      setCities(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>Cities</h2>
      <p className="cities-card-hint">Load the list from the API when you are ready.</p>

      {cities === null && !loading && !error && (
        <button type="button" onClick={load} className="cities-load-button">
          Load cities
        </button>
      )}

      {loading && <p className="cities-loading">Loading…</p>}

      {error && !loading && (
        <div className="cities-error-block">
          <p className="cities-error">Error: {error}</p>
          <button type="button" onClick={load} className="cities-load-button">
            Retry
          </button>
        </div>
      )}

      {cities !== null && !loading && !error && (
        <>
          {cities.length === 0 ? (
            <p>No cities found</p>
          ) : (
            <ul className="cities-list">
              {cities.map((c) => (
                <li key={c.id ?? c.name}>
                  {c.name} {c.state_code ? `(${c.state_code})` : ''}
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={load} className="cities-refresh-button">
            Refresh
          </button>
        </>
      )}
    </div>
  )
}
