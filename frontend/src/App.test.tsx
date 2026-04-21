import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the new hero heading', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1, name: /Plan where to live/i });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/with confidence/i);
  });

  it('renders the new hero subtitle text', () => {
    render(<App />);
    expect(
      screen.getByText(/Explore city affordability, compare purchasing power, and save personalized insights./i)
    ).toBeInTheDocument();
  });

  it('shows the primary navigation options', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /City Comparison/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salary Calculator/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Smart City Finder/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /My Profile/i })).toBeInTheDocument();
  });

  it('renders the home planner cards', () => {
    render(<App />);
    expect(screen.getByText(/Interactive City Comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/Salary Adjustment Calculator/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Saved Profile/i)).toBeInTheDocument();
  });

  it('offers action buttons to open each planner page', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /Open Comparison/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Calculator/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Find Cities/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Profile/i })).toBeInTheDocument();
  });

  it('offers Google sign-in with auth URL', async () => {
    render(<App />);
    const link = await waitFor(() =>
      screen.getByRole('link', { name: /sign in with google/i })
    );
    expect(link).toHaveAttribute('href', expect.stringMatching(/\/auth\/google$/));
  });
});
