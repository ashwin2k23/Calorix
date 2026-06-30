/**
 * Client-side sanitization utilities.
 * Strips HTML tags and trims input to prevent reflected XSS
 * when user-typed data is rendered in the DOM.
 */

/** Strip all HTML tags from a string */
export const stripHtml = (str) => {
  if (str == null) return '';
  return String(str).replace(/<[^>]*>/g, '').trim();
};

/** Sanitize a free-text string (food names, chat messages, etc.) */
export const sanitizeText = (str, maxLen = 500) => {
  return stripHtml(str).slice(0, maxLen);
};

/** Validate a positive number within a range */
export const validateNumber = (val, min, max) => {
  const n = parseFloat(val);
  if (!isFinite(n)) return false;
  return n >= min && n <= max;
};

/** Validate that a value is in an allowed set */
export const validateEnum = (val, allowed) => allowed.includes(val);

/** Mask an email address for display: j***@gmail.com */
export const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '***';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
};

/** Mask a name: show only first name, hide surname */
export const maskName = (name) => {
  if (!name || typeof name !== 'string') return 'User';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${'*'.repeat(parts[parts.length - 1].length)}`;
};
