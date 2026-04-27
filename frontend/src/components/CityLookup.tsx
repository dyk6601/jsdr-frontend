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
      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
        <label htmlFor="city-search" className="sr-only">Search cities</label>
        <input
          id="city-search"
          type="search"
          placeholder="Search by city name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-surface-muted)', color: 'var(--color-text)' }}
          aria-label="Search cities"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          aria-label="Search cities"
          aria-disabled={loading || !query.trim()}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
      {error && (
        <p className="status-error" role="alert">Error: {error}</p>
      )}

      <div aria-live="polite" aria-atomic="true">
        {results !== null && !loading && !error && (
          results.length === 0 ? (
            <p>No cities found matching "{query}"</p>
          ) : (
            <ul aria-label="Search results" style={{ textAlign: 'left', display: 'inline-block' }}>
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
    </div>
  )
}
