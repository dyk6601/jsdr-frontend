import { useState } from 'react';
import { getSalaryAdjustment, type SalaryResult } from '../api';

// Approximate top marginal state income tax rates (2024)
const STATE_TAX: Record<string, number> = {
  AL: 0.050, AK: 0.000, AZ: 0.025, AR: 0.047, CA: 0.093,
  CO: 0.044, CT: 0.065, DE: 0.066, FL: 0.000, GA: 0.055,
  HI: 0.110, ID: 0.058, IL: 0.050, IN: 0.031, IA: 0.057,
  KS: 0.057, KY: 0.040, LA: 0.060, ME: 0.075, MD: 0.058,
  MA: 0.050, MI: 0.043, MN: 0.099, MS: 0.050, MO: 0.048,
  MT: 0.069, NE: 0.066, NV: 0.000, NH: 0.000, NJ: 0.108,
  NM: 0.059, NY: 0.109, NC: 0.050, ND: 0.025, OH: 0.040,
  OK: 0.048, OR: 0.099, PA: 0.031, RI: 0.060, SC: 0.070,
  SD: 0.000, TN: 0.000, TX: 0.000, UT: 0.049, VT: 0.088,
  VA: 0.058, WA: 0.000, WV: 0.065, WI: 0.077, WY: 0.000,
  DC: 0.108,
};

// Known city -> state code mapping for tax lookup
const CITY_STATE: Record<string, string> = {
  'New York': 'NY', 'Los Angeles': 'CA', 'Chicago': 'IL', 'Houston': 'TX',
  'Phoenix': 'AZ', 'Philadelphia': 'PA', 'San Antonio': 'TX', 'San Diego': 'CA',
  'Dallas': 'TX', 'San Jose': 'CA', 'Austin': 'TX', 'Jacksonville': 'FL',
  'Fort Worth': 'TX', 'Columbus': 'OH', 'Charlotte': 'NC', 'San Francisco': 'CA',
  'Indianapolis': 'IN', 'Seattle': 'WA', 'Denver': 'CO', 'Boston': 'MA',
  'Nashville': 'TN', 'Detroit': 'MI', 'Portland': 'OR', 'Las Vegas': 'NV',
  'Memphis': 'TN', 'Louisville': 'KY', 'Baltimore': 'MD', 'Milwaukee': 'WI',
  'Albuquerque': 'NM', 'Tucson': 'AZ', 'Fresno': 'CA', 'Sacramento': 'CA',
  'Kansas City': 'MO', 'Mesa': 'AZ', 'Atlanta': 'GA', 'Miami': 'FL',
  'Raleigh': 'NC', 'Omaha': 'NE', 'Minneapolis': 'MN', 'Cleveland': 'OH',
  'Washington DC': 'DC', 'Honolulu': 'HI', 'New Orleans': 'LA',
  'Tampa': 'FL', 'Pittsburgh': 'PA', 'Cincinnati': 'OH', 'Anaheim': 'CA',
  'Aurora': 'CO', 'Saint Louis': 'MO',
};

function getStateTaxRate(cityName: string): number | null {
  const state = CITY_STATE[cityName.trim()];
  if (!state) return null;
  return STATE_TAX[state] ?? null;
}

function estimateNetIncome(gross: number, stateTaxRate: number): number {
  // Simplified federal effective rate by bracket
  let fedRate: number;
  if (gross <= 44725) fedRate = 0.12;
  else if (gross <= 95375) fedRate = 0.22;
  else if (gross <= 182050) fedRate = 0.24;
  else if (gross <= 231250) fedRate = 0.32;
  else fedRate = 0.35;
  return Math.round(gross * (1 - fedRate - stateTaxRate));
}

const SalaryCalculator = () => {
  const [originCity, setOriginCity] = useState('');
  const [targetCity, setTargetCity] = useState('');
  const [currentSalary, setCurrentSalary] = useState('');
  const [result, setResult] = useState<SalaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateAdjustedSalary = async () => {
    const salary = parseFloat(currentSalary);
    if (isNaN(salary) || !originCity.trim() || !targetCity.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getSalaryAdjustment(salary, originCity.trim(), targetCity.trim());
      setResult(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to calculate salary adjustment');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const originTax = result ? getStateTaxRate(result.from_city) : null;
  const targetTax = result ? getStateTaxRate(result.to_city) : null;
  const originNet = result && originTax !== null ? estimateNetIncome(result.original_salary, originTax) : null;
  const targetNet = result && targetTax !== null ? estimateNetIncome(result.adjusted_salary, targetTax) : null;

  return (
    <div className="card salary-calculator">
      <h2>Salary Adjustment Calculator</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>Compare purchasing power between cities</p>

      <div className="salary-form">
        <div className="salary-row">
          <label>Origin city</label>
          <input
            type="text"
            value={originCity}
            onChange={e => setOriginCity(e.target.value)}
            placeholder="e.g. New York"
          />
        </div>
        <div className="salary-row">
          <label>Current salary ($)</label>
          <input
            type="number"
            value={currentSalary}
            onChange={e => setCurrentSalary(e.target.value)}
            placeholder="e.g. 100000"
          />
        </div>
        <div className="salary-row">
          <label>Target city</label>
          <input
            type="text"
            value={targetCity}
            onChange={e => setTargetCity(e.target.value)}
            placeholder="e.g. Austin"
          />
        </div>

        <button onClick={calculateAdjustedSalary} disabled={loading}>
          {loading ? 'Calculating…' : 'Calculate'}
        </button>
      </div>

      {error && <p className="status-error" style={{ marginTop: '10px' }}>{error}</p>}

      {result !== null && (
        <div className="salary-result">
          <div className="salary-result-main">
            <span className="salary-label">
              Equivalent salary in <strong>{result.to_city}</strong>
            </span>
            <span className="salary-amount">
              ${result.adjusted_salary.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span style={{
              fontSize: 'var(--font-size-sm)',
              color: result.percentage_change >= 0 ? 'var(--color-danger)' : 'var(--color-success)',
            }}>
              {result.percentage_change >= 0 ? '+' : ''}{result.percentage_change.toFixed(1)}% cost of living
            </span>
          </div>

          <div className="salary-breakdown">
            <div className="salary-city-column">
              <h4>{result.from_city}</h4>
              <div className="salary-detail">
                <span>COL index</span>
                <strong>{result.col_from}</strong>
              </div>
              <div className="salary-detail">
                <span>State tax</span>
                <strong>{originTax !== null ? `${(originTax * 100).toFixed(1)}%` : 'N/A'}</strong>
              </div>
              <div className="salary-detail">
                <span>Est. take-home</span>
                <strong>{originNet !== null ? `$${originNet.toLocaleString()}` : 'N/A'}</strong>
              </div>
            </div>

            <div className="salary-city-column">
              <h4>{result.to_city}</h4>
              <div className="salary-detail">
                <span>COL index</span>
                <strong>{result.col_to}</strong>
              </div>
              <div className="salary-detail">
                <span>State tax</span>
                <strong>{targetTax !== null ? `${(targetTax * 100).toFixed(1)}%` : 'N/A'}</strong>
              </div>
              <div className="salary-detail">
                <span>Est. take-home</span>
                <strong>{targetNet !== null ? `$${targetNet.toLocaleString()}` : 'N/A'}</strong>
              </div>
            </div>
          </div>

          <div className="salary-difference-row">
            <span>Difference</span>
            <strong>
              {result.difference >= 0 ? '+' : ''}
              ${Math.abs(result.difference).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </strong>
          </div>

          {(originTax !== null || targetTax !== null) && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '12px' }}>
              * Tax estimates use approximate marginal state rates + simplified federal brackets. Consult a tax professional for accurate figures.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SalaryCalculator;
