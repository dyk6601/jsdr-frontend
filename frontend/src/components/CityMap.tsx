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
delete (Icon.Default.prototype as any)._getIconUrl;
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

const MAX_COL = 105;
const MIN_COL = 35;

function affordabilityScore(colIndex: number): number {
  return Math.round(Math.max(0, Math.min(100, ((MAX_COL - colIndex) / (MAX_COL - MIN_COL)) * 100)));
}

function markerColor(score: number): string {
  if (score >= 60) return '#10b981'; // green — affordable
  if (score >= 40) return '#f59e0b'; // yellow — moderate
  return '#ef4444';                  // red — expensive
}

function coloredIcon(color: string): DivIcon {
  return new DivIcon({
    html: `<div style="
      width: 14px;
      height: 14px;
      background: ${color};
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

// Interactive map component for city visualization
const CityMap = ({ cities, onCitySelect }: CityMapProps) => {
  const [colData, setColData] = useState<Record<string, number>>({});

  useEffect(() => {
    getCostOfLiving().then(setColData).catch(() => {});
  }, []);

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

      {/* Legend */}
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

            if (lat === 0 && lng === 0) return null;

            const colIdx = getColIndex(city.name);
            const score = colIdx !== null ? affordabilityScore(colIdx) : null;
            const icon = score !== null
              ? coloredIcon(markerColor(score))
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
