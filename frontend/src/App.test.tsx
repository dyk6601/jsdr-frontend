import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />);
    expect(
      screen.getByText(/LiveWhere — Cost of Living Comparison Tool/i)
    ).toBeInTheDocument();
  });

  it('renders the subtitle text', () => {
    render(<App />);
    expect(
      screen.getByText(/Compare cities, calculate salary adjustments/i)
    ).toBeInTheDocument();
  });
  it('renders the Interactive City Map section', () => {
    render(<App />);
    expect(screen.getByText(/Interactive City Map/i)).toBeInTheDocument();
  });

  it('renders the All Cities Data section', () => {
    render(<App />);
    expect(screen.getByText(/All Cities Data/i)).toBeInTheDocument();
  });

  it('renders map instructions for selecting cities', () => {
    render(<App />);
    expect(
      screen.getByText(/Click on markers to select cities for comparison \(max 4\)/i)
    ).toBeInTheDocument();
  });

  it('offers Google sign-in with auth URL', async () => {
    render(<App />);
    const link = await waitFor(() =>
      screen.getByRole('link', { name: /sign in with google/i })
    );
    expect(link).toHaveAttribute('href', expect.stringMatching(/\/auth\/google$/));
  });
});
