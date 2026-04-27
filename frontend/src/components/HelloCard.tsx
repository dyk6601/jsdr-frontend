import { useEffect, useState } from 'react'
import { getHello } from '../api'

export default function HelloCard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    getHello()
      .then((msg) => {
        if (mounted) setMessage(msg)
      })
      .catch((err) => {
        if (mounted) setError(err?.message || String(err))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="card">
      <h2>Hello Endpoint</h2>
      {loading && <p role="status">Loading...</p>}
      {error && <p className="status-error" role="alert">Error: {error}</p>}
      {!loading && !error && <p role="status" aria-live="polite">{message}</p>}
    </div>
  )
}
