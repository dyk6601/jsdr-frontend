import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Frontend entrypoint (Vite + React).
// We mount a single React root and keep it stable for the lifetime of the page.
createRoot(document.getElementById('root')!).render(
  // StrictMode intentionally double-invokes certain lifecycles in development
  // to surface side effects. This does not affect production builds.
  <StrictMode>
    <App />
  </StrictMode>,
)
