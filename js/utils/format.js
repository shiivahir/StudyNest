/* Small pure helpers: input in, text out, no side effects (easy to test). */

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes;
  let i = -1;
  do { value /= 1024; i++; } while (value >= 1024 && i < units.length - 1);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
