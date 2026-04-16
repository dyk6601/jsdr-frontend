import { useState } from 'react';
import type {
  AuthUser,
  UserProfile as UserProfileData,
  SavedComparison,
  FavoriteCity,
} from '../api';

interface City {
  name: string;
  state_code?: string;
  population?: number;
  lat?: number;
  lng?: number;
  average_salary?: number;
}

interface UserProfileProps {
  user: AuthUser | null;
  profile: UserProfileData | null;
  profileError: string | null;
  onRemoveFavorite: (name: string, stateCode: string) => Promise<void>;
  onDeleteComparison: (id: string) => Promise<void>;
  onLoadComparison: (cities: City[]) => void;
  allCities: City[];
}

const CATEGORIES = ['Housing', 'Food', 'Transportation', 'Healthcare', 'Entertainment'];

export default function UserProfile({
  user,
  profile,
  profileError,
  onRemoveFavorite,
  onDeleteComparison,
  onLoadComparison,
  allCities,
}: UserProfileProps) {
  const [busyKey, setBusyKey] = useState<string | null>(null);

  if (!user) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h2>My Profile</h2>
        <p>Sign in with Google to save favorite cities, comparisons, and spending preferences.</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div style={{ padding: '32px' }}>
        <h2>My Profile</h2>
        <p className="status-error">{profileError}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  const resolveCity = (name: string, stateCode: string): City => {
    const match = allCities.find(
      c => c.name === name && c.state_code === stateCode,
    );
    return match ?? { name, state_code: stateCode };
  };

  const handleRemoveFavorite = async (fav: FavoriteCity) => {
    const key = `fav:${fav.name}|${fav.state_code}`;
    setBusyKey(key);
    try {
      await onRemoveFavorite(fav.name, fav.state_code);
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeleteComparison = async (c: SavedComparison) => {
    const key = `cmp:${c.id}`;
    setBusyKey(key);
    try {
      await onDeleteComparison(c.id);
    } finally {
      setBusyKey(null);
    }
  };

  const handleLoadComparison = (c: SavedComparison) => {
    const cities = c.cities.map(({ name, state_code }) =>
      resolveCity(name, state_code),
    );
    onLoadComparison(cities);
  };

  return (
    <div className="profile-page">
      {/* Favorites */}
      <section className="profile-section">
        <h3 className="profile-section-title">Favorite Cities</h3>
        {profile.favorites.length === 0 ? (
          <p className="profile-empty">
            No favorites yet. Use the ★ button in the comparison view to save a city.
          </p>
        ) : (
          <div className="profile-chip-row">
            {profile.favorites.map(fav => {
              const key = `fav:${fav.name}|${fav.state_code}`;
              return (
                <button
                  key={key}
                  className="selected-city-chip"
                  disabled={busyKey === key}
                  onClick={() => void handleRemoveFavorite(fav)}
                  title={`Remove ${fav.name}, ${fav.state_code}`}
                >
                  ★ {fav.name}, {fav.state_code}
                  <span aria-hidden="true">×</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Saved comparisons */}
      <section className="profile-section">
        <h3 className="profile-section-title">Saved Comparisons</h3>
        {profile.saved_comparisons.length === 0 ? (
          <p className="profile-empty">
            No saved comparisons yet. Use "Save comparison" in the comparison view.
          </p>
        ) : (
          <ul className="saved-comparison-list">
            {profile.saved_comparisons.map(c => {
              const key = `cmp:${c.id}`;
              return (
                <li key={c.id} className="saved-comparison-item">
                  <div className="saved-comparison-info">
                    <div className="saved-comparison-name">{c.name}</div>
                    <div className="saved-comparison-cities">
                      {c.cities.map(x => `${x.name}, ${x.state_code}`).join(' · ')}
                    </div>
                  </div>
                  <div className="saved-comparison-actions">
                    <button
                      type="button"
                      onClick={() => handleLoadComparison(c)}
                      className="profile-action-button profile-action-primary"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      disabled={busyKey === key}
                      onClick={() => void handleDeleteComparison(c)}
                      className="profile-action-button profile-action-danger"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Weights */}
      <section className="profile-section">
        <h3 className="profile-section-title">Current Spending Weights</h3>
        <p className="profile-section-hint">
          Adjust these from the sliders in the comparison view — changes are saved automatically.
        </p>
        <div className="profile-weights-grid">
          {CATEGORIES.map(cat => (
            <div key={cat} className="profile-weight-row">
              <span className="profile-weight-label">{cat}</span>
              <span className="profile-weight-value">{profile.weights[cat] ?? 0}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
