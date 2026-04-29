import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon, DivIcon } from 'leaflet';
import { getCostOfLiving } from '../api';

// Fix for default marker icons in React Leaflet
// Leaflet expects icon images in specific paths that don't work with Vite bundling
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Override default icon paths to use imported assets
delete (Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface City {
  name: string;
  state_code?: string;
  population?: number;
  lat?: number;
  lng?: number;
  average_salary?: number;
}

interface CityMapProps {
  cities: City[];
  onCitySelect?: (city: City) => void;
}

// Cost-of-living index range used for normalization; sourced from the dataset's observed bounds
const MAX_COL = 105;
const MIN_COL = 35;

// Maps a raw COL index onto a 0–100 affordability score (higher = more affordable)
function affordabilityScore(colIndex: number): number {
  return Math.round(Math.max(0, Math.min(100, ((MAX_COL - colIndex) / (MAX_COL - MIN_COL)) * 100)));
}

function markerColor(score: number): string {
  if (score >= 60) return '#10b981'; // green — affordable
  if (score >= 40) return '#f59e0b'; // yellow — moderate
  return '#ef4444';                  // red — expensive
}

// Builds a circular DivIcon that displays the affordability score inline.
// Markers without a score (COL data missing) fall back to a small unlabeled dot.
function coloredIcon(color: string, label?: string): DivIcon {
  const size = label !== undefined ? 28 : 14;
  return new DivIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      color: white;
      font: 600 11px/1 system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      text-shadow: 0 1px 1px rgba(0,0,0,0.4);
    ">${label ?? ''}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 3)],
  });
}

// Interactive map component for city visualization
const CityMap = ({ cities, onCitySelect }: CityMapProps) => {
  // keyed by city name (lowercased at lookup time); populated once on mount
  const [colData, setColData] = useState<Record<string, number>>({});

  useEffect(() => {
    // Silently ignore fetch errors — markers fall back to indigo when COL data is unavailable
    getCostOfLiving().then(setColData).catch(() => {});
  }, []);

  // Case-insensitive lookup so "New York" matches "new york" in the dataset
  const getColIndex = (cityName: string): number | null => {
    const lower = cityName.toLowerCase();
    for (const [key, val] of Object.entries(colData)) {
      if (key.toLowerCase() === lower) return val;
    }
    return null;
  };

  // Default center: USA (geographic center)
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  const defaultZoom = 4;

  return (
    <div className="city-map-card card">
      <div className="city-map-card-header">
        <h2>Interactive City Map</h2>
        <p>Click on markers to select cities for comparison (max 4)</p>
      </div>

      {/* Color legend explaining the affordability score thresholds */}
      <div className="city-map-legend">
        <span>
          <span className="city-map-legend-dot city-map-legend-dot--affordable" />
          Affordable (60+)
        </span>
        <span>
          <span className="city-map-legend-dot city-map-legend-dot--moderate" />
          Moderate (40–59)
        </span>
        <span>
          <span className="city-map-legend-dot city-map-legend-dot--expensive" />
          Expensive (&lt;40)
        </span>
      </div>

      <div className="city-map-frame">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          className="city-map-container"
        >
          {/* OpenStreetMap tile layer for base map */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {cities.map((city, idx) => {
            const lat = city.lat || 0;
            const lng = city.lng || 0;

            // Skip cities with no coordinates rather than dropping them at [0, 0] (Gulf of Guinea)
            if (lat === 0 && lng === 0) return null;

            const colIdx = getColIndex(city.name);
            const score = colIdx !== null ? affordabilityScore(colIdx) : null;
            // Fall back to indigo when COL data hasn't loaded or the city isn't in the dataset
            const icon = score !== null
              ? coloredIcon(markerColor(score), String(score))
              : coloredIcon('#6366f1');

            return (
              <Marker
                key={idx}
                position={[lat, lng]}
                icon={icon}
                eventHandlers={{
                  click: () => onCitySelect?.(city),
                }}
              >
                <Popup>
                  <strong>{city.name}</strong>
                  {city.state_code && <div>{city.state_code}</div>}
                  {city.population && (
                    <div>Population: {city.population.toLocaleString()}</div>
                  )}
                  {city.average_salary != null && (
                    <div>Avg salary: ${city.average_salary.toLocaleString()}</div>
                  )}
                  {score !== null && (
                    <div style={{ marginTop: 4, fontWeight: 600, color: markerColor(score) }}>
                      Affordability: {score}/100
                    </div>
                  )}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default CityMap;

export default CityMap;
