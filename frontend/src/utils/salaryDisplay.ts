/**
 * Display helpers for salary calculator UI.
 * Centralize formatting so you can reuse the same strings in tooltips, exports, or comparisons later.
 */

/**
 * Formats a signed dollar amount from an API `difference` field (positive = need more in target city).
 * Example: -1234.5 → "-$1,235", 5000 → "+$5,000"
 */
export function formatSignedCurrencyFromDifference(difference: number): string {
  const sign = difference >= 0 ? '+' : '-';
  const abs = Math.abs(difference).toLocaleString(undefined, { maximumFractionDigits: 0 });
  return `${sign}$${abs}`;
}
