import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getCostOfLiving } from '../api';

interface City {
  name: string;
  state_code?: string;
  population?: number;
  average_salary?: number;
}

interface CityComparisonProps {
  cities: City[];
  onRemoveCity?: (city: City) => void;
}

const CITY_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

const CATEGORIES = [
  { key: 'Housing',        ratio: 1.40 },
  { key: 'Food',           ratio: 0.85 },
  { key: 'Transportation', ratio: 0.75 },
  { key: 'Healthcare',     ratio: 0.95 },
  { key: 'Entertainment',  ratio: 0.90 },
];

const DEFAULT_WEIGHTS: Record<string, number> = {
  Housing: 3,
  Food: 2,
  Transportation: 2,
  Healthcare: 2,
  Entertainment: 1,
};

// Baseline: ~$60k income at NYC-level COL (index 100) maps to a score of 50.
// Doubling purchasing power (same income at half COL, or double income at same COL) → 100.
const BASELINE_INCOME = 60000;
const BASELINE_COL = 100;

function personalColIndex(colIndex: number, weights: Record<string, number>): number {
  const totalWeight = CATEGORIES.reduce((s, c) => s + (weights[c.key] ?? 0), 0);
  if (totalWeight === 0) return colIndex;
  const weightedRatio = CATEGORIES.reduce(
    (s, c) => s + (weights[c.key] ?? 0) * c.ratio,
    0,
  ) / totalWeight;
  return colIndex * weightedRatio;
}

function weightedAffordability(
  colIndex: number,
  weights: Record<string, number>,
  income: number | null,
): number {
  const personalCol = personalColIndex(colIndex, weights);
  if (personalCol <= 0) return 0;
  // Fallback when income is unknown: score purely off cost (lower COL → higher score).
  if (income == null || income <= 0) {
    return Math.max(0, Math.min(100, Math.round((BASELINE_COL / personalCol) * 50)));
  }
  const purchasingPower = income / personalCol;
  const baselinePower = BASELINE_INCOME / BASELINE_COL;
  return Math.max(0, Math.min(100, Math.round((purchasingPower / baselinePower) * 50)));
}

function scoreColor(score: number): string {
  if (score >= 60) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

const CityComparison = ({ cities, onRemoveCity }: CityComparisonProps) => {
  const [colData, setColData] = useState<Record<string, number>>({});
  const [colError, setColError] = useState<string | null>(null);
  const [weights, setWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS);

  useEffect(() => {
    if (cities.length === 0) return;
    getCostOfLiving()
      .then(setColData)
      .catch((e: any) => setColError(e?.message || 'Failed to load cost-of-living data'));
  }, [cities.length]);

  if (cities.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Select cities from the map to compare</p>
      </div>
    );
  }

  const getColIndex = (cityName: string): number | null => {
    const lower = cityName.toLowerCase();
    for (const [key, val] of Object.entries(colData)) {
      if (key.toLowerCase() === lower) return val;
    }
    return null;
  };

  const categoryChartData = CATEGORIES.map(({ key, ratio }) => {
    const entry: Record<string, string | number> = { category: key };
    for (const city of cities) {
      const idx = getColIndex(city.name);
      if (idx !== null) {
        entry[city.name] = Math.round(idx * ratio * 10) / 10;
      }
    }
    return entry;
  });

  const populationChartData = cities.map(city => ({
    name: city.name,
    population: city.population ?? 0,
  }));

  const hasCategoryData = cities.some(c => getColIndex(c.name) !== null);

  return (
    <div style={{ padding: '20px' }}>
      <h2>City Comparison</h2>

      {/* City summary cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '28px', justifyContent: 'center' }}>
        {cities.map((city, idx) => {
          const colIdx = getColIndex(city.name);
          const score = colIdx !== null ? weightedAffordability(colIdx, weights, city.average_salary ?? null) : null;
          return (
            <div
              key={idx}
              style={{
                flex: '1 1 160px',
                maxWidth: '200px',
                border: `2px solid ${CITY_COLORS[idx]}`,
                borderRadius: '10px',
                padding: '14px',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {onRemoveCity && (
                <button
                  type="button"
                  onClick={() => onRemoveCity(city)}
                  className="remove-city-button"
                  aria-label={`Remove ${city.name}${city.state_code ? `, ${city.state_code}` : ''} from comparison`}
                  title="Remove city"
                >
                  ×
                </button>
              )}
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>
                {city.name}{city.state_code ? `, ${city.state_code}` : ''}
              </div>
              {city.population != null && (
                <div style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                  Pop: {city.population.toLocaleString()}
                </div>
              )}
              {city.average_salary != null && (
                <div style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                  Median income: ${city.average_salary.toLocaleString()}
                </div>
              )}
              {colIdx !== null && (
                <div style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                  COL index: {colIdx}
                </div>
              )}
              {score !== null && (
                <div style={{ marginTop: '8px', fontWeight: 700, fontSize: '1.1rem', color: scoreColor(score) }}>
                  Affordability: {score}/100
                </div>
              )}
            </div>
          );
        })}
      </div>

      {colError && <p className="status-error">{colError}</p>}

      {/* Spending weight sliders */}
      {hasCategoryData && (
        <div style={{ marginBottom: '28px', maxWidth: '480px', margin: '0 auto 28px' }}>
          <h3 style={{ marginBottom: '12px' }}>Spending Priorities</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 0 }}>
            Adjust how much each category matters to you — this updates the affordability score.
          </p>
          {CATEGORIES.map(({ key }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <span style={{ minWidth: '110px', textAlign: 'right', fontSize: '0.875rem' }}>{key}</span>
              <input
                type="range"
                min={0}
                max={5}
                step={1}
                value={weights[key] ?? 0}
                onChange={e => setWeights(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                style={{ flex: 1 }}
              />
              <span style={{ minWidth: '20px', fontSize: '0.875rem', textAlign: 'right' }}>
                {weights[key]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Category breakdown chart */}
      {hasCategoryData && (
        <div style={{ marginBottom: '36px' }}>
          <h3>Cost of Living by Category</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 0 }}>
            Estimated indices relative to NYC = 100 (Numbeo-based)
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={categoryChartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis domain={[0, 140]} />
              <Tooltip />
              <Legend />
              {cities.map((city, idx) => (
                <Bar key={city.name} dataKey={city.name} fill={CITY_COLORS[idx]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Population comparison chart */}
      {cities.length > 1 && (
        <div>
          <h3>Population Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={populationChartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={v => (typeof v === 'number' ? v.toLocaleString() : String(v ?? ''))} />
              <Bar dataKey="population" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CityComparison;
