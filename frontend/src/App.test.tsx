import { render, screen } from '@testing-library/react';
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

});
