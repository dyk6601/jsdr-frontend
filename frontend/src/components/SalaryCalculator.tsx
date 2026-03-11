import { useState } from 'react';

// Salary adjustment calculator component
const SalaryCalculator = () => {
  const [originCity, setOriginCity] = useState('');
  const [targetCity, setTargetCity] = useState('');
  const [currentSalary, setCurrentSalary] = useState('');
  const [adjustedSalary, setAdjustedSalary] = useState<number | null>(null);

  const calculateAdjustedSalary = () => {
    // Parse salary input
    const salary = parseFloat(currentSalary);
    if (isNaN(salary)) return;

    // TODO: Replace with actual API call to get cost of living data
    // Placeholder calculation - simple multiplier
    const costOfLivingMultiplier = 1.2;
    const adjusted = salary * costOfLivingMultiplier;
    setAdjustedSalary(adjusted);
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
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Calculate
      </button>

      {adjustedSalary !== null && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <h3>Results:</h3>
          <p>
            To maintain the same lifestyle in <strong>{targetCity}</strong>,
            you would need approximately:
          </p>
          <p style={{ fontSize: '24px', color: '#4CAF50', fontWeight: 'bold' }}>
            ${adjustedSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            (Based on cost of living differences)
          </p>
        </div>
      )}
    </div>
  );
};

export default SalaryCalculator;
