export const generateId = (prefix: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
};

export const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Maps ambiguous characters to their unambiguous counterparts
// Generated codes never contain I, O, 1, 0 — this maps user typos
const CHAR_MAP: Record<string, string> = {
  'O': '0', 'o': '0',
  'I': '1', 'i': '1', 'l': '1',
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
