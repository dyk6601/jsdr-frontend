import { useState, useEffect, useCallback } from 'react'
import './App.css'
import logo from '../assets/logo.png'
import CityMap from './components/CityMap'
import CityComparison from './components/CityComparison'
import SalaryCalculator from './components/SalaryCalculator'
import AuthBar from './components/AuthBar'
import SmartCityFinder from './components/SmartCityFinder'
import UserProfile from './components/UserProfile'
import {
  getCities,
  getCurrentUser,
  getUserProfile,
  addFavorite,
  removeFavorite,
  saveComparison,
  deleteComparison,
  updateWeights,
  type AuthUser,
  type UserProfile as UserProfileData,
} from './api'

interface City {
  name: string;
  state_code?: string;
  population?: number;
  lat?: number;
  lng?: number;
  /** Approx. median household income (USD); from API or local fallback for known metros */
  average_salary?: number;
}

// These two maps are intentionally keyed by `City|ST` to keep the UI resilient when
// backend payloads are incomplete (e.g., missing coords or salary for a city).
const CITY_COORDINATES: Record<string, [number, number]> = {
  'New York|NY': [40.7128, -74.006],
  'Los Angeles|CA': [34.0522, -118.2437],
  'Chicago|IL': [41.8781, -87.6298],
  'Houston|TX': [29.7604, -95.3698],
  'Phoenix|AZ': [33.4484, -112.074],
  'Philadelphia|PA': [39.9526, -75.1652],
  'San Antonio|TX': [29.4241, -98.4936],
  'San Diego|CA': [32.7157, -117.1611],
  'Dallas|TX': [32.7767, -96.797],
  'San Jose|CA': [37.3382, -121.8863],
  'Austin|TX': [30.2672, -97.7431],
  'Jacksonville|FL': [30.3322, -81.6557],
  'Fort Worth|TX': [32.7555, -97.3308],
  'Columbus|OH': [39.9612, -82.9988],
  'Charlotte|NC': [35.2271, -80.8431],
  'San Francisco|CA': [37.7749, -122.4194],
  'Indianapolis|IN': [39.7684, -86.1581],
  'Seattle|WA': [47.6062, -122.3321],
  'Denver|CO': [39.7392, -104.9903],
  'Boston|MA': [42.3601, -71.0589],
  'Nashville|TN': [36.1627, -86.7816],
  'Detroit|MI': [42.3314, -83.0458],
  'Portland|OR': [45.5152, -122.6784],
  'Las Vegas|NV': [36.1699, -115.1398],
  'Memphis|TN': [35.1495, -90.049],
  'Louisville|KY': [38.2527, -85.7585],
  'Baltimore|MD': [39.2904, -76.6122],
  'Milwaukee|WI': [43.0389, -87.9065],
  'Albuquerque|NM': [35.0844, -106.6504],
  'Tucson|AZ': [32.2226, -110.9747],
  'Fresno|CA': [36.7378, -119.7871],
  'Sacramento|CA': [38.5816, -121.4944],
  'Kansas City|MO': [39.0997, -94.5786],
  'Mesa|AZ': [33.4152, -111.8315],
  'Atlanta|GA': [33.749, -84.388],
  'Miami|FL': [25.7617, -80.1918],
  'Raleigh|NC': [35.7796, -78.6382],
  'Omaha|NE': [41.2565, -95.9345],
  'Minneapolis|MN': [44.9778, -93.265],
  'Cleveland|OH': [41.4993, -81.6944],
};

/** Approximate median household income (USD) when API does not provide salary — matches CITY_COORDINATES keys */
const FALLBACK_AVERAGE_SALARY: Record<string, number> = {
  'New York|NY': 75000,
  'Los Angeles|CA': 69000,
  'Chicago|IL': 62000,
  'Houston|TX': 56000,
  'Phoenix|AZ': 62000,
  'Philadelphia|PA': 52000,
  'San Antonio|TX': 55000,
  'San Diego|CA': 83000,
  'Dallas|TX': 58000,
  'San Jose|CA': 125000,
  'Austin|TX': 78000,
  'Jacksonville|FL': 55000,
  'Fort Worth|TX': 58000,
  'Columbus|OH': 58000,
  'Charlotte|NC': 62000,
  'San Francisco|CA': 126000,
  'Indianapolis|IN': 54000,
  'Seattle|WA': 93000,
  'Denver|CO': 78000,
  'Boston|MA': 81000,
  'Nashville|TN': 62000,
  'Detroit|MI': 32000,
  'Portland|OR': 72000,
  'Las Vegas|NV': 58000,
  'Memphis|TN': 45000,
  'Louisville|KY': 52000,
  'Baltimore|MD': 52000,
  'Milwaukee|WI': 45000,
  'Albuquerque|NM': 52000,
  'Tucson|AZ': 52000,
  'Fresno|CA': 48000,
  'Sacramento|CA': 62000,
  'Kansas City|MO': 58000,
  'Mesa|AZ': 58000,
  'Atlanta|GA': 62000,
  'Miami|FL': 47000,
  'Raleigh|NC': 78000,
  'Omaha|NE': 62000,
  'Minneapolis|MN': 72000,
  'Cleveland|OH': 32000,
};

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const getFallbackCoordinates = (name: string, stateCode?: string): [number, number] | undefined => {
  if (!stateCode) return undefined;
  return CITY_COORDINATES[`${name}|${stateCode}`];
};

const normalizeCity = (raw: any): City | null => {
  // The cities endpoint has historically returned slightly different shapes, so we
  // normalize here to avoid leaking backend-specific quirks throughout the UI.
  const name = raw?.name ?? raw?.city;
  if (!name || typeof name !== 'string') return null;

  const stateCode = raw?.state_code ?? raw?.state;

  const fallback = getFallbackCoordinates(name, stateCode);
  const lat = toNumberOrUndefined(raw?.lat ?? raw?.latitude) ?? fallback?.[0];
  const lng = toNumberOrUndefined(raw?.lng ?? raw?.lon ?? raw?.long ?? raw?.longitude) ?? fallback?.[1];
  const population = toNumberOrUndefined(raw?.population);

  const avgFromApi = toNumberOrUndefined(
    raw?.average_salary ?? raw?.avg_salary ?? raw?.median_household_income ?? raw?.median_income,
  );
  const metroKey = stateCode ? `${name}|${stateCode}` : '';
  const average_salary = avgFromApi ?? (metroKey ? FALLBACK_AVERAGE_SALARY[metroKey] : undefined);

  return {
    name,
    state_code: stateCode,
    population,
    lat,
    lng,
    average_salary,
  };
};

type Page = 'home' | 'compare' | 'salary' | 'finder' | 'profile';
type Theme = 'light' | 'dark' | 'beige';

const THEME_CYCLE: Theme[] = ['light', 'dark', 'beige'];

const getNextTheme = (current: Theme): Theme => {
  const idx = THEME_CYCLE.indexOf(current);
  return THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
};

const getThemeToggleLabel = (theme: Theme): string => {
  switch (theme) {
    case 'light':
      return '🌙 Dark mode';
    case 'dark':
      return '🌾 Beige mode';
    default:
      return '☀️ Light mode';
  }
};

const routeToPage = (hash: string): Page => {
  // Hash routing keeps navigation entirely client-side without requiring server
  // route configuration (handy for static hosting and simple dev setups).
  const route = hash.replace(/^#/, '').trim();
  switch (route) {
    case '/compare':
      return 'compare';
    case '/salary':
      return 'salary';
    case '/finder':
      return 'finder';
    case '/profile':
      return 'profile';
    default:
      return 'home';
  }
};

const pageToRoute = (page: Page): string => {
  switch (page) {
    case 'compare':
      return '#/compare';
    case 'salary':
      return '#/salary';
    case 'finder':
      return '#/finder';
    case 'profile':
      return '#/profile';
    default:
      return '#/';
  }
};

// Main application shell component
function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = window.localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark' || saved === 'beige') return saved;
    } catch {
      // Ignore storage errors and use system preference.
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCities, setSelectedCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [page, setPage] = useState<Page>(() => routeToPage(window.location.hash));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem('theme', theme);
    } catch {
      // Ignore storage errors.
    }
  }, [theme]);

  // Keep page state in sync with the URL hash so deep links (and refreshes) land
  // on the expected view.
  useEffect(() => {
    const syncRoute = () => {
      setPage(routeToPage(window.location.hash));
    };
    window.addEventListener('hashchange', syncRoute);
    syncRoute();
    return () => {
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  const navigateTo = useCallback((nextPage: Page) => {
    const nextHash = pageToRoute(nextPage);
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    } else {
      setPage(nextPage);
    }
  }, []);

  // Fetch cities once on mount. We keep results in memory so switching pages is instant.
  useEffect(() => {
    let cancelled = false;

    const loadCities = async () => {
      setLoadingCities(true);
      setCitiesError(null);

      try {
        const data = await getCities();
        if (cancelled) return;
        const normalized = (Array.isArray(data) ? data : [])
          .map(normalizeCity)
          .filter((city): city is City => city !== null);
        setCities(normalized);
      } catch (e: any) {
        if (cancelled) return;
        setCitiesError(e?.message || 'Failed to load cities');
        setCities([]);
      } finally {
        if (!cancelled) {
          setLoadingCities(false);
        }
      }
    };

    void loadCities();

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep auth + profile in sync.
  // We also resync on window focus so returning from an OAuth redirect updates the UI.
  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const u = await getCurrentUser();
      if (cancelled) return;
      setUser(u);

      if (!u) {
        setProfile(null);
        setProfileError(null);
        return;
      }

      try {
        const p = await getUserProfile();
        if (cancelled) return;
        setProfile(p);
        setProfileError(null);
      } catch (e: any) {
        if (cancelled) return;
        setProfile(null);
        setProfileError(e?.message || 'Failed to load profile');
      }
    };

    void sync();

    const onFocus = () => { void sync(); };
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleAddFavorite = useCallback(async (name: string, stateCode: string) => {
    const favorites = await addFavorite(name, stateCode);
    setProfile(prev => prev ? { ...prev, favorites } : prev);
  }, []);

  const handleRemoveFavorite = useCallback(async (name: string, stateCode: string) => {
    const favorites = await removeFavorite(name, stateCode);
    setProfile(prev => prev ? { ...prev, favorites } : prev);
  }, []);

  const handleSaveComparison = useCallback(
    async (name: string, cs: City[]) => {
      const payload = cs
        .filter(c => c.state_code)
        .map(c => ({ name: c.name, state_code: c.state_code as string }));
      if (payload.length === 0) return;
      const saved_comparisons = await saveComparison(name, payload);
      setProfile(prev => prev ? { ...prev, saved_comparisons } : prev);
    },
    [],
  );

  const handleDeleteComparison = useCallback(async (id: string) => {
    const saved_comparisons = await deleteComparison(id);
    setProfile(prev => prev ? { ...prev, saved_comparisons } : prev);
  }, []);

  const handleWeightsChange = useCallback(async (weights: Record<string, number>) => {
    const saved = await updateWeights(weights);
    setProfile(prev => prev ? { ...prev, weights: saved } : prev);
  }, []);

  const handleLoadComparison = useCallback((cs: City[]) => {
    setSelectedCities(cs.slice(0, 4));
    navigateTo('compare');
  }, [navigateTo]);

  const handleCitySelect = (city: City) => {
    // Add city to comparison if not already selected (max 4 cities)
    if (
      selectedCities.length < 4
      && !selectedCities.find(
        c => c.name === city.name && c.state_code === city.state_code,
      )
    ) {
      setSelectedCities([...selectedCities, city]);
    }
  };

  const removeSelectedCity = (cityToRemove: City) => {
    setSelectedCities(prev => prev.filter(
      city => !(city.name === cityToRemove.name && city.state_code === cityToRemove.state_code),
    ));
  };

  const clearSelection = () => {
    setSelectedCities([]);
  };

  const favoriteKeys = new Set(
    (profile?.favorites ?? []).map(f => `${f.name}|${f.state_code}`),
  );

  const pageTitle = (() => {
    switch (page) {
      case 'compare':
        return 'City Comparison';
      case 'salary':
        return 'Salary Calculator';
      case 'finder':
        return 'Smart City Finder';
      case 'profile':
        return 'My Profile';
      default:
        return 'Choose Your Planner';
    }
  })();

  return (
    <div className="app-shell">
      <div className="top-controls">
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme(prev => getNextTheme(prev))}
          aria-pressed={theme === 'dark'}
          aria-label={`Switch to ${getNextTheme(theme)} mode`}
        >
          {getThemeToggleLabel(theme)}
        </button>
      </div>

      <AuthBar />

      <header className="app-hero card">
        <div className="app-hero-copy">
          <p className="app-kicker">LiveWhere</p>
          <h1 className="hero-title">
            Plan where to live
            <span className="hero-accent">with confidence</span>
          </h1>
          <p className="app-subtitle">
            Explore city affordability, compare purchasing power, and save personalized insights.
          </p>
        </div>
        <img className="app-logo" src={logo} alt="LiveWhere logo" />
      </header>

      <nav className="app-nav" aria-label="Primary">
        <button type="button" className={page === 'home' ? 'app-nav-button active' : 'app-nav-button'} onClick={() => navigateTo('home')}>Home</button>
        <button type="button" className={page === 'compare' ? 'app-nav-button active' : 'app-nav-button'} onClick={() => navigateTo('compare')}>City Comparison</button>
        <button type="button" className={page === 'salary' ? 'app-nav-button active' : 'app-nav-button'} onClick={() => navigateTo('salary')}>Salary Calculator</button>
        <button type="button" className={page === 'finder' ? 'app-nav-button active' : 'app-nav-button'} onClick={() => navigateTo('finder')}>Smart City Finder</button>
        <button type="button" className={page === 'profile' ? 'app-nav-button active' : 'app-nav-button'} onClick={() => navigateTo('profile')}>My Profile</button>
      </nav>

      <section className="page-heading">
        <h2>{pageTitle}</h2>
      </section>

      {page === 'home' && (
        <div className="home-grid">
          <article className="card feature-card">
            <span className="feature-card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" role="presentation">
                <rect x="4" y="4" width="6" height="6" rx="1.5" fill="currentColor" />
                <rect x="14" y="4" width="6" height="6" rx="1.5" fill="currentColor" />
                <rect x="4" y="14" width="6" height="6" rx="1.5" fill="currentColor" />
                <rect x="14" y="14" width="6" height="6" rx="1.5" fill="currentColor" />
              </svg>
            </span>
            <h3>Interactive city comparison</h3>
            <p>Select up to 4 cities and compare cost-of-living signals side by side on a live map.</p>
            <button className="feature-card-link" type="button" onClick={() => navigateTo('compare')}>
              <span>Open comparison</span>
              <span className="feature-card-arrow" aria-hidden="true">→</span>
            </button>
          </article>
          <article className="card feature-card">
            <span className="feature-card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" role="presentation">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v4l2.6 2.6" />
              </svg>
            </span>
            <h3>Salary adjustment calculator</h3>
            <p>Estimate how much you need to earn to keep the same purchasing power after moving.</p>
            <button className="feature-card-link" type="button" onClick={() => navigateTo('salary')}>
              <span>Open calculator</span>
              <span className="feature-card-arrow" aria-hidden="true">→</span>
            </button>
          </article>
          <article className="card feature-card">
            <span className="feature-card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" role="presentation">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
            </span>
            <h3>Smart city finder</h3>
            <p>Filter cities by your preferences and discover top affordability matches quickly.</p>
            <button className="feature-card-link" type="button" onClick={() => navigateTo('finder')}>
              <span>Find cities</span>
              <span className="feature-card-arrow" aria-hidden="true">→</span>
            </button>
          </article>
          <article className="card feature-card">
            <span className="feature-card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" role="presentation">
                <circle cx="12" cy="8.5" r="3" />
                <path d="M6 19a6 6 0 0 1 12 0" />
              </svg>
            </span>
            <h3>Your saved profile</h3>
            <p>Sign in to keep favorites, saved comparisons, and weighting preferences.</p>
            <button className="feature-card-link" type="button" onClick={() => navigateTo('profile')}>
              <span>Open profile</span>
              <span className="feature-card-arrow" aria-hidden="true">→</span>
            </button>
          </article>
        </div>
      )}

      {page === 'compare' && (
        <>
          <div className="app-section">
            {loadingCities && <p>Loading cities...</p>}
            {citiesError && <p className="status-error">Error loading cities: {citiesError}</p>}
            <CityMap cities={cities} onCitySelect={handleCitySelect} />
            {selectedCities.length > 0 && (
              <div className="selected-city-list">
                {selectedCities.map(city => (
                  <button
                    key={`${city.name}-${city.state_code ?? ''}`}
                    className="selected-city-chip"
                    onClick={() => removeSelectedCity(city)}
                    title={`Remove ${city.name}${city.state_code ? `, ${city.state_code}` : ''}`}
                  >
                    {city.name}{city.state_code ? `, ${city.state_code}` : ''}
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
            )}
            {selectedCities.length > 0 && (
              <button
                onClick={clearSelection}
                className="clear-selection-button"
              >
                Clear Selection
              </button>
            )}
          </div>

          <div className="app-section">
            <CityComparison
              cities={selectedCities}
              onRemoveCity={removeSelectedCity}
              authed={Boolean(user)}
              weights={profile?.weights}
              onWeightsChange={user ? handleWeightsChange : undefined}
              favoriteKeys={favoriteKeys}
              onAddFavorite={user ? handleAddFavorite : undefined}
              onRemoveFavorite={user ? handleRemoveFavorite : undefined}
              onSaveComparison={user ? handleSaveComparison : undefined}
            />
          </div>
        </>
      )}

      {page === 'salary' && (
        <div className="app-section card feature-shell">
          <SalaryCalculator />
        </div>
      )}

      {page === 'finder' && (
        <div className="app-section card feature-shell">
          <SmartCityFinder />
        </div>
      )}

      {page === 'profile' && (
        <div className="app-section">
          <UserProfile
            user={user}
            profile={profile}
            profileError={profileError}
            onRemoveFavorite={handleRemoveFavorite}
            onDeleteComparison={handleDeleteComparison}
            onLoadComparison={handleLoadComparison}
            allCities={cities}
          />
        </div>
      )}
    </div>
  )
}

export default App
