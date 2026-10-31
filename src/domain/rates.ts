import type { MonthKey, RateEntry } from './types';
import { compareMonths } from './dates';

/**
 * Returns the rate entry with the greatest effectiveFrom <= month.
 * If none (i.e. the queried month is earlier than the first effectiveFrom), returns the earliest entry.
 */
export function getRateForMonth(rates: RateEntry[], month: MonthKey): RateEntry {
  if (!rates || rates.length === 0) {
    return { effectiveFrom: month, full: 0, half: 0 };
  }

  // Ensure rates are sorted ascending by effectiveFrom
  const sorted = [...rates].sort((a, b) => compareMonths(a.effectiveFrom, b.effectiveFrom));

  let candidate: RateEntry = sorted[0];
  for (const entry of sorted) {
    if (compareMonths(entry.effectiveFrom, month) <= 0) {
      candidate = entry;
    } else {
      break;
    }
  }

  return candidate;
}

/**
 * Inserts or replaces a rate entry for the given effectiveFrom month, returning a newly sorted array.
 */
export function applyRateChange(rates: RateEntry[], newRate: RateEntry): RateEntry[] {
  const filtered = rates.filter((r) => r.effectiveFrom !== newRate.effectiveFrom);
  filtered.push(newRate);
  return filtered.sort((a, b) => compareMonths(a.effectiveFrom, b.effectiveFrom));
}
