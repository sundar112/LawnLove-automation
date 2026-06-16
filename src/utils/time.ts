/**
 * Time helpers. NEVER call these from inside locator strings or assertion
 * expected-values — only for log lines, file naming, etc.
 */
export const isoNow = (): string => new Date().toISOString();

/**
 * Returns a YYYYMMDD-HHmmss timestamp suitable for filenames.
 */
export const timestampForFilename = (): string => {
  const d = new Date();
  const pad = (n: number, width = 2): string => n.toString().padStart(width, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
};

/**
 * Convert an ISO duration-ish number of ms into a human string ("3m 12s").
 */
export const humanDuration = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
};
