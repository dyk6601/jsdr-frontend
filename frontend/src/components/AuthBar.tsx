import { useState, useEffect } from 'react'
import { getCurrentUser, signOut, type AuthUser} from '../api'
import { API_URLS } from '../config/api'

// --- Auth (Google OAuth `session` cookie) ---



export default function AuthBar() {
  // null = not signed in, AuthUser = signed in
  const [user, setUser] = useState<AuthUser | null>(null);
  // true while the initial /auth/me request is in flight
  const [authLoading, setAuthLoading] = useState(true);
  // surfaces OAuth redirect errors and sign-out failures
  const [authError, setAuthError] = useState<string | null>(null);

  // Session: httponly cookie is set by GET /auth/google/callback; we only reflect state via /auth/me
  // On mount, check for a login_error/error query param injected by the OAuth callback redirect.
  // Strip the param from the URL so a page refresh doesn't re-show a stale error.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loginErr = params.get('login_error') ?? params.get('error');
    if (loginErr) {
      setAuthError(loginErr);
      params.delete('login_error');
      params.delete('error');
      const qs = params.toString();
      const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
      // Replace history entry so the error param disappears without a navigation
      window.history.replaceState({}, '', next);
    }
  }, []);

  // getCurrentUser resolves after fetch; guard so we never setState after unmount (tests + fast navigations).
  useEffect(() => {
    // cancelled flag prevents setState on an unmounted component
    let cancelled = false;
    void (async () => {
      try {
        const u = await getCurrentUser();
        if (!cancelled) {
          setUser(u);
        }
      } finally {
        // Always clear the loading spinner, even if the fetch threw
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Calls the sign-out endpoint, then clears local user state.
  // Errors are surfaced in the UI rather than thrown.
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
          {/* Show a placeholder while the session check is pending to avoid layout shift */}
          {authLoading ? (
            <span className="auth-bar-placeholder" aria-hidden />
          ) : user ? (
            // Signed-in state: display name (fallback to email) + sign-out button
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
            // Signed-out state: link kicks off the Google OAuth flow
            <a className="auth-bar-google" href={API_URLS.GOOGLE_AUTH}>
              Sign in with Google
            </a>
          )}
        </div>
      </header>

      {/* auth-error is conditionally rendered below the header so it doesn't shift header layout */}
      {authError && (
        <p className="auth-error" role="alert">
          {authError}
        </p>
      )}
    </>
  );
}