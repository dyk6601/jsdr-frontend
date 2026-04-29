import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SmartCityFinder from './SmartCityFinder';
import * as api from '../api';

describe('SmartCityFinder', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('resets all filters and clears rendered results', async () => {
    vi.spyOn(api, 'getCostOfLiving').mockResolvedValue({
      'New York': 185,
      Austin: 105,
    });
    vi.spyOn(api, 'getRecommendations').mockResolvedValue({
      recommendations: [
        {
          name: 'Austin',
          state_code: 'TX',
          population: 980000,
          col_index: 105,
          affordability_score: 62,
          qol_score: 71,
        },
      ],
      total: 1,
    });

    render(<SmartCityFinder />);
    const user = userEvent.setup();

    const salaryInput = screen.getByPlaceholderText(/e.g. 80000/i);
    const cityInput = screen.getByPlaceholderText(/e.g. New York/i);
    const stateSelect = screen.getByLabelText(/state \(optional\)/i);
    const sizeSelect = screen.getByLabelText(/city size/i);

    await user.type(salaryInput, '90000');
    await user.type(cityInput, 'New York');
    await user.selectOptions(stateSelect, 'TX');
    await user.selectOptions(sizeSelect, 'large');
    await user.click(screen.getByRole('button', { name: /find cities/i }));

    await waitFor(() => {
      expect(screen.getByText(/showing top 1 of 1 matching cities/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /reset filters/i }));

    expect(salaryInput).toHaveValue(null);
    expect(cityInput).toHaveValue('');
    expect(stateSelect).toHaveValue('');
    expect(sizeSelect).toHaveValue('any');
    expect(screen.queryByText(/showing top 1 of 1 matching cities/i)).not.toBeInTheDocument();
  });

  it('reorders results when sort dropdown changes', async () => {
    vi.spyOn(api, 'getCostOfLiving').mockResolvedValue({});
    vi.spyOn(api, 'getRecommendations').mockResolvedValue({
      recommendations: [
        {
          name: 'Austin',
          state_code: 'TX',
          population: 980000,
          col_index: 105,
          affordability_score: 62,
          qol_score: 71,
        },
        {
          name: 'Boston',
          state_code: 'MA',
          population: 650000,
          col_index: 112,
          affordability_score: 55,
          qol_score: 83,
        },
      ],
      total: 2,
    });

    render(<SmartCityFinder />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /find cities/i }));

    await waitFor(() => {
      expect(screen.getByText(/#1 Austin, TX/i)).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/sort by/i), 'qol');
    expect(screen.getByText(/#1 Boston, MA/i)).toBeInTheDocument();
  });
});
