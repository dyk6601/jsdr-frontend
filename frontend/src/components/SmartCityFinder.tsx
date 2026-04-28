import { useEffect, useState } from 'react';
import { getCostOfLiving, getRecommendations, type RecommendedCity } from '../api';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

function scoreColor(score: number): string {
  if (score >= 60) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 700,
      background: scoreColor(score),
      color: '#fff',
      marginLeft: '6px',
    }}>
      {label} {score}
    </span>
  );
}

export default function SmartCityFinder() {
  const [salary, setSalary] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [state, setState] = useState('');
  const [size, setSize] = useState<'any' | 'small' | 'medium' | 'large'>('any');
  const [results, setResults] = useState<RecommendedCity[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colMap, setColMap] = useState<Record<string, number> | null>(null);
  const [originCol, setOriginCol] = useState<number | null>(null);

  useEffect(() => {
    getCostOfLiving().then(setColMap).catch(() => setColMap({}));
  }, []);

  const lookupCol = (name: string): number | null => {
    if (!colMap) return null;
    const key = name.trim();
    if (!key) return null;
    if (colMap[key] != null) return colMap[key];
    const lower = key.toLowerCase();
    for (const [k, v] of Object.entries(colMap)) {
      if (k.toLowerCase() === lower) return v;
    }
    return null;
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    let resolvedOriginCol: number | null = null;
    if (salary && originCity.trim()) {
      resolvedOriginCol = lookupCol(originCity);
      if (resolvedOriginCol == null) {
        setError(`Could not find cost-of-living data for "${originCity}". Try a major city name (e.g. "New York").`);
        setLoading(false);
        return;
      }
    }
    setOriginCol(resolvedOriginCol);

    try {
      const data = await getRecommendations({
        salary: salary ? parseFloat(salary) : undefined,
        state: state || undefined,
        size,
        top_n: 10,
      });
      setResults(data.recommendations);
      setTotal(data.total);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSalary('');
    setOriginCity('');
    setState('');
    setSize('any');
    setResults(null);
    setTotal(0);
    setError(null);
    setOriginCol(null);
  };

  return (
    <div>
      <h2>Smart City Finder</h2>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 0 }}>
        Find the best cities based on your preferences, ranked by affordability.
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginBottom: '20px' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem' }}>
          Current salary (optional)
          <input
            type="number"
            value={salary}
            onChange={e => setSalary(e.target.value)}
            placeholder="e.g. 80000"
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface-muted)', color: 'inherit', width: '160px' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem' }}>
          Current city (optional)
          <input
            type="text"
            value={originCity}
            onChange={e => setOriginCity(e.target.value)}
            placeholder="e.g. New York"
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface-muted)', color: 'inherit', width: '160px' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem' }}>
          State (optional)
          <select
            value={state}
            onChange={e => setState(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface-muted)', color: 'inherit', width: '100px' }}
          >
            <option value="">Any</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem' }}>
          City size
          <select
            value={size}
            onChange={e => setSize(e.target.value as typeof size)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface-muted)', color: 'inherit', width: '130px' }}
          >
            <option value="any">Any</option>
            <option value="small">Small (&lt;100k)</option>
            <option value="medium">Medium (100k–500k)</option>
            <option value="large">Large (&gt;500k)</option>
          </select>
        </label>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={handleSearch} disabled={loading} style={{ padding: '7px 20px' }}>
            {loading ? 'Searching…' : 'Find Cities'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="button"
            onClick={handleResetFilters}
            disabled={loading}
            style={{ padding: '7px 20px', marginLeft: '4px' }}
          >
            Reset filters
          </button>
        </div>
      </div>

      {error && <p className="status-error">{error}</p>}

      {/* Results */}
      {results !== null && (
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            Showing top {results.length} of {total} matching cities, ranked by affordability
            {salary && (
              <> · Equiv. salary baseline: {originCol != null ? `${originCity.trim()} (COL ${originCol})` : 'U.S. average (COL 100)'}</>
            )}
          </p>
          {results.length === 0 ? (
            <p>No cities match your filters.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {results.map((city, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    padding: '12px 16px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    background: 'var(--color-surface)',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                      #{idx + 1} {city.name}{city.state_code ? `, ${city.state_code}` : ''}
                    </span>
                    <ScoreBadge label="Affordability" score={city.affordability_score} />
                    <ScoreBadge label="QOL" score={city.qol_score} />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span>COL index: {city.col_index}</span>
                    {city.population > 0 && (
                      <span>Pop: {city.population.toLocaleString()}</span>
                    )}
                    {city.adjusted_salary != null && (
                      <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                        Equiv. salary: ${(
                          originCol != null
                            ? city.adjusted_salary * (100 / originCol)
                            : city.adjusted_salary
                        ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
