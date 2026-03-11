import { useState } from 'react'
import { getCities, type City } from '../api'

export default function CityLookup() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<City[] | null>(null)

  const handleSearch = async () => {
    const trimmed = query.trim()
    if (!trimmed) return
    setResults(null)
    setError(null)
    setLoading(true)
    try {
      const all = await getCities()
      const matches = all.filter((c) =>
        c.name?.toLowerCase().includes(trimmed.toLowerCase())
      )
      setResults(matches)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>City Lookup</h2>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <input
          type="text"
          placeholder="Search by city name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #555' }}
        />
        <button onClick={handleSearch} disabled={loading || !query.trim()}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {results !== null && !loading && !error && (
        results.length === 0 ? (
          <p>No cities found matching "{query}"</p>
        ) : (
          <ul style={{ textAlign: 'left', display: 'inline-block' }}>
            {results.map((c) => (
              <li key={c.id ?? c.name}>
                <strong>{c.name}</strong>
                {c.state_code && ` (${c.state_code})`}
                {c.population !== undefined && ` — Pop: ${Number(c.population).toLocaleString()}`}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  )
}
