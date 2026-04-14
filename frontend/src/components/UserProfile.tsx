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
    <div style={{ padding: '20px', maxWidth: '760px', margin: '0 auto' }}>
      <h2>My Profile</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: 0 }}>
        Signed in as <strong>{user.name ?? user.email}</strong>
      </p>

      {/* Favorites */}
      <section style={{ marginTop: '28px' }}>
        <h3>Favorite Cities</h3>
        {profile.favorites.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>
            No favorites yet. Use the ★ button in the comparison view to save a city.
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
      <section style={{ marginTop: '32px' }}>
        <h3>Saved Comparisons</h3>
        {profile.saved_comparisons.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>
            No saved comparisons yet. Use "Save comparison" in the comparison view.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {profile.saved_comparisons.map(c => {
              const key = `cmp:${c.id}`;
              return (
                <li
                  key={c.id}
                  style={{
                    border: '1px solid var(--color-border, #ccc)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {c.cities.map(x => `${x.name}, ${x.state_code}`).join(' · ')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLoadComparison(c)}
                    className="selected-city-chip"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    disabled={busyKey === key}
                    onClick={() => void handleDeleteComparison(c)}
                    className="clear-selection-button"
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Weights */}
      <section style={{ marginTop: '32px' }}>
        <h3>Current Spending Weights</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 0 }}>
          Adjust these from the sliders in the comparison view — changes are saved automatically.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: '6px', columnGap: '16px', maxWidth: '320px' }}>
          {CATEGORIES.map(cat => (
            <div key={cat} style={{ display: 'contents' }}>
              <span>{cat}</span>
              <span style={{ fontWeight: 600 }}>{profile.weights[cat] ?? 0}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
