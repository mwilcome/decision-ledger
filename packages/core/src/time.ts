/**
 * Formats an ISO timestamp as a short relative phrase for list UIs.
 * Full absolute time stays available for tooltips via the original ISO string.
 *
 * @param iso - ISO-8601 timestamp
 * @param nowMs - Optional clock for tests (defaults to Date.now)
 */
export function formatRelativeTime(
  iso: string,
  nowMs: number = Date.now(),
): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) {
    return iso;
  }

  const deltaSec = Math.round((nowMs - then) / 1000);
  const abs = Math.abs(deltaSec);

  if (abs < 45) {
    return deltaSec >= 0 ? "just now" : "in a moment";
  }

  const minutes = Math.round(abs / 60);
  if (minutes < 60) {
    return deltaSec >= 0
      ? `${minutes} min ago`
      : `in ${minutes} min`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 48) {
    return deltaSec >= 0
      ? `${hours} hour${hours === 1 ? "" : "s"} ago`
      : `in ${hours} hour${hours === 1 ? "" : "s"}`;
  }

  const days = Math.round(hours / 24);
  if (days < 30) {
    return deltaSec >= 0
      ? `${days} day${days === 1 ? "" : "s"} ago`
      : `in ${days} day${days === 1 ? "" : "s"}`;
  }

  try {
    return new Date(then).toLocaleDateString();
  } catch {
    return iso;
  }
}

/**
 * Formats an ISO timestamp for a tooltip (locale date and time).
 *
 * @param iso - ISO-8601 timestamp
 */
export function formatAbsoluteTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
