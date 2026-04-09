import { useState } from 'react'
import { setPopulation as setCityPopulation } from '../api'

export default function SetPopulation() {
  const [cityName, setCityName] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [population, setPopulation] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSetPopulation = async () => {
    if (!cityName || !stateCode || population === '') {
      setError('City name, state, and population are required.')
      setSuccess(null)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await setCityPopulation(cityName, stateCode, Number(population))
      setSuccess('Population updated successfully.')
    } catch (e: any) {
      setError(e?.message || 'Failed to update population.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>Set Population</h2>

      <div style={{ marginBottom: '0.5rem' }}>
        <label>
          City name:{' '}
          <input
            type="text"
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
          />
        </label>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <label>
          State code:{' '}
          <input
            type="text"
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
          />
        </label>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <label>
          Population:{' '}
          <input
            type="number"
            value={population}
            onChange={(e) =>
              setPopulation(
                e.target.value === '' ? '' : Number(e.target.value),
              )
            }
          />
        </label>
      </div>

      <button onClick={() => void handleSetPopulation()} disabled={loading}>
        {loading ? 'Setting...' : 'Set Population'}
      </button>

      {error && <p className="status-error">Error: {error}</p>}
      {success && <p className="status-success">{success}</p>}
    </div>
  )
}