import { useState, useEffect } from 'react'
import { getCurrentUser, signOut, type AuthUser} from '../api'
import { API_URLS } from '../config/api'

// --- Auth (Google OAuth `session` cookie) ---


  
export default function AuthBar() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Session: httponly cookie is set by GET /auth/google/callback; we only reflect state via /auth/me
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loginErr = params.get('login_error') ?? params.get('error');
    if (loginErr) {
      setAuthError(loginErr);
      params.delete('login_error');
      params.delete('error');
      const qs = params.toString();
      const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', next);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const u = await getCurrentUser();
        setUser(u['user']);
      } finally {
        setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignOut = async () => {
    setAuthError(null);
    try {
      await signOut();
      setUser(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sign out failed';
      setAuthError(msg);
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="auth-bar">
          {authLoading ? (
            <span className="auth-bar-placeholder" aria-hidden />
          ) : user ? (
            <>
              <span className="auth-bar-user" title={user.email}>
                {user.name ?? user.email}
              </span>
              <button
                type="button"
                className="clear-selection-button auth-bar-signout"
                style={{ marginTop: 0 }}
                onClick={() => void handleSignOut()}
              >
                Sign out
              </button>
            </>
          ) : (
            <a className="auth-bar-google" href={API_URLS.GOOGLE_AUTH}>
              Sign in with Google
            </a>
          )}
        </div>
      </header>

      {authError && (
        <p className="auth-error" role="alert">
          {authError}
        </p>
      )}
    </>
  );
}