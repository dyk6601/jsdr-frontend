import { useState } from 'react';
import { getSalaryAdjustment, type SalaryResult } from '../api';

// Salary adjustment calculator component
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

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Salary Adjustment Calculator</h2>
      <p>Compare purchasing power between cities</p>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Origin City:
          <input
            type="text"
            value={originCity}
            onChange={(e) => setOriginCity(e.target.value)}
            placeholder="e.g., New York"
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Current Salary ($):
          <input
            type="number"
            value={currentSalary}
            onChange={(e) => setCurrentSalary(e.target.value)}
            placeholder="e.g., 100000"
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Target City:
          <input
            type="text"
            value={targetCity}
            onChange={(e) => setTargetCity(e.target.value)}
            placeholder="e.g., Austin"
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>

      <button
        onClick={calculateAdjustedSalary}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Calculating...' : 'Calculate'}
      </button>

      {error && (
        <p className="status-error" style={{ marginTop: '10px' }}>{error}</p>
      )}

      {result !== null && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <h3>Results:</h3>
          <p>
            To maintain the same lifestyle in <strong>{result.to_city}</strong>,
            you would need approximately:
          </p>
          <p style={{ fontSize: '24px', color: '#4CAF50', fontWeight: 'bold' }}>
            ${result.adjusted_salary.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            {result.percentage_change >= 0 ? '+' : ''}{result.percentage_change.toFixed(1)}% cost of living difference
          </p>
        </div>
      )}
    </div>
  );
};

export default SalaryCalculator;
