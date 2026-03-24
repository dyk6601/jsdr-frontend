import { useState, useEffect } from 'react'
import './App.css'
import CityMap from './components/CityMap'
import CityComparison from './components/CityComparison'
import SalaryCalculator from './components/SalaryCalculator'
import CitiesCard from './components/GetCities'
import { getCities } from './api'

interface City {
  name: string;
  state_code?: string;
  population?: number;
  lat?: number;
  lng?: number;
}

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
  const name = raw?.name ?? raw?.city;
  if (!name || typeof name !== 'string') return null;

  const stateCode = raw?.state_code ?? raw?.state;

  const fallback = getFallbackCoordinates(name, stateCode);
  const lat = toNumberOrUndefined(raw?.lat ?? raw?.latitude) ?? fallback?.[0];
  const lng = toNumberOrUndefined(raw?.lng ?? raw?.lon ?? raw?.long ?? raw?.longitude) ?? fallback?.[1];
  const population = toNumberOrUndefined(raw?.population);

  return {
    name,
    state_code: stateCode,
    population,
    lat,
    lng,
  };
};

// Main application shell component
function App() {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCities, setSelectedCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(null);

  // Fetch cities from backend
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

  const handleCitySelect = (city: City) => {
    // Add city to comparison if not already selected (max 4 cities)
    if (selectedCities.length < 4 && !selectedCities.find(c => c.name === city.name)) {
      setSelectedCities([...selectedCities, city]);
    }
  };

  const clearSelection = () => {
    setSelectedCities([]);
  };

  return (
    <div className="app-shell">
      <h1>LiveWhere — Cost of Living Comparison Tool</h1>
      <p>Compare cities, calculate salary adjustments, and find your ideal location</p>

      <div className="app-section">
        <h2>Interactive City Map</h2>
        <p>Click on markers to select cities for comparison (max 4)</p>
        {loadingCities && <p>Loading cities...</p>}
        {citiesError && <p style={{ color: 'red' }}>Error loading cities: {citiesError}</p>}
        <CityMap cities={cities} onCitySelect={handleCitySelect} />
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
        <CityComparison cities={selectedCities} />
      </div>

      <div className="app-section">
        <SalaryCalculator />
      </div>

      <div className="app-section">
        <h2>All Cities Data</h2>
        <CitiesCard />
      </div>
    </div>
  )
}

export default App
