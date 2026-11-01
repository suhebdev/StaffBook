/**
 * Formats an integer amount in Indian numbering format with rupee prefix.
 * e.g., 1234567 -> ₹12,34,567
 * 0 -> ₹0
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  const isNegative = amount < 0;
  const absInt = Math.round(Math.abs(amount));
  const s = absInt.toString();

  if (s.length <= 3) {
    return `${isNegative ? '-' : ''}₹${s}`;
  }

  const lastThree = s.substring(s.length - 3);
  const otherNumbers = s.substring(0, s.length - 3);
  const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

  return `${isNegative ? '-' : ''}₹${formattedOther},${lastThree}`;
}

/**
 * Strips non-digits from string, returns positive integer or null if empty/invalid.
 */
export function parseMoneyInput(str: string): number | null {
  if (!str) return null;
  const clean = str.replace(/[^\d]/g, '');
  if (!clean) return null;
  const num = parseInt(clean, 10);
  return isNaN(num) ? null : num;
}
