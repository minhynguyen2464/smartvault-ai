/**
 * Formats a raw number or string into a comma-separated money string.
 * Example: "1000000" -> "1,000,000"
 * Example: "1234.56" -> "1,234.56"
 * Handles live user typing cleanly without breaking decimal points.
 */
export function formatMoneyInput(value: string | number): string {
  if (value === '' || value === null || value === undefined) return '';
  const str = String(value);

  const isNegative = str.startsWith('-');
  const clean = str.replace(/[^0-9.]/g, '');
  
  if (!clean) return isNegative ? '-' : '';

  const parts = clean.split('.');
  const integerFormatted = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  let result = integerFormatted;
  if (parts.length > 1) {
    result += '.' + parts.slice(1).join('');
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Parses a comma-formatted money string back into a raw number.
 * Example: "1,234,567.89" -> 1234567.89
 */
export function parseMoneyInput(formatted: string | number): number {
  if (formatted === '' || formatted === null || formatted === undefined) return 0;
  const raw = String(formatted).replace(/,/g, '');
  const val = parseFloat(raw);
  return isNaN(val) ? 0 : val;
}
