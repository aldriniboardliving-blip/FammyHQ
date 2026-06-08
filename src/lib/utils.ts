export const generateId = (prefix: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
};

export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Maps ambiguous user-typed characters to their unambiguous code counterparts.
// Generated codes use only: ABCDEFGHJKMNPQRSTUVWXYZ23456789
// (excludes I, O, L, 0, 1 to avoid visual ambiguity)
const CHAR_MAP: Record<string, string> = {
  '0': 'Q',   // digit 0 → letter Q
  'O': 'Q', 'o': 'Q',  // letter O → Q
  'l': '1',   // lowercase L → digit 1 (both excluded, mapped for consistency)
  '1': 'I',   // digit 1 → letter I (both excluded, mapped for consistency)
};

export const normalizeInviteCode = (raw: string): string => {
  let result = '';
  for (const ch of raw) {
    const upper = ch.toUpperCase();
    const mapped = CHAR_MAP[upper] || CHAR_MAP[ch] || upper;
    if (/^[A-Z0-9]$/.test(mapped)) {
      result += mapped;
    }
  }
  return result;
};

export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const parseDate = (dateString: string): Date => {
  return new Date(dateString);
};
