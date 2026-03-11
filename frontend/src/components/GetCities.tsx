import { useState, useEffect } from 'react'
import { getCities, type City } from '../api'

export default function CitiesCard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cities, setCities] = useState<City[] | null>(null)

  const load = async () => {
    setCities(null)
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

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="card">
      <h2>Cities</h2>
      {cities === null && !loading && !error && (
        <button onClick={load}>Get Cities</button>
      )}
      {error && !loading && (
        <div>
          <button onClick={load}>Retry</button>
        </div>
      )}
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {cities !== null && !loading && !error && (
        cities.length === 0 ? (
          <p>No cities found</p>
        ) : (
          <ul>
            {cities.map((c) => (
              <li key={c.id ?? c.name}>
                {c.name} {c.state_code ? `(${c.state_code})` : ''}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  )
}
