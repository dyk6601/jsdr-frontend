import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';

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
}

interface CityMapProps {
  cities: City[];
  onCitySelect?: (city: City) => void;
}

// Interactive map component for city visualization
const CityMap = ({ cities, onCitySelect }: CityMapProps) => {
  // Default center: USA (geographic center)
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  const defaultZoom = 4;

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
      >
        {/* OpenStreetMap tile layer for base map */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {cities.map((city, idx) => {
          // Use default coordinates if not provided
          const lat = city.lat || 0;
          const lng = city.lng || 0;
          
          // Skip cities without valid coordinates
          if (lat === 0 && lng === 0) return null;

          return (
            <Marker
              key={idx}
              position={[lat, lng]}
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
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default CityMap;
