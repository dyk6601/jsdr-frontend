import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface City {
  name: string;
  state_code?: string;
  population?: number;
}

interface CityComparisonProps {
  cities: City[];
}

// Side-by-side city comparison component
const CityComparison = ({ cities }: CityComparisonProps) => {
  // Show prompt if no cities selected
  if (cities.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Select cities from the map to compare</p>
      </div>
    );
  }

  // Prepare data for Recharts visualization
  const chartData = cities.map(city => ({
    name: city.name,
    population: city.population || 0,
  }));

  return (
    <div style={{ padding: '20px' }}>
      <h2>City Comparison</h2>
      <div style={{ marginBottom: '20px' }}>
        <h3>Selected Cities:</h3>
        {cities.map((city, idx) => (
          <div key={idx} style={{ marginBottom: '10px' }}>
            <strong>{city.name}</strong>
            {city.state_code && ` (${city.state_code})`}
            {city.population && (
              <div>Population: {city.population.toLocaleString()}</div>
            )}
          </div>
        ))}
      </div>

      {cities.length > 1 && (
        <div>
          <h3>Population Comparison</h3>
          <BarChart width={600} height={300} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="population" fill="#8884d8" />
          </BarChart>
        </div>
      )}
    </div>
  );
};

export default CityComparison;
