/**
 * Short form of a commit SHA for UI (first 7 chars).
 *
 * @param sha - Full or short SHA
 */
export function normalizeShaForDisplay(sha: string): string {
  const cleaned = sha.trim().toLowerCase();
  return cleaned.length > 7 ? cleaned.slice(0, 7) : cleaned;
}
