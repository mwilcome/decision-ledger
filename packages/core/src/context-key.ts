import type { CaptureContext, ChangeRef, RepoRef } from "./types.js";

/**
 * Builds a stable string key that groups decisions for one repository.
 *
 * @param repo - Repository identity
 * @returns Pipe-delimited key including host and optional instance URL
 */
export function buildRepoKey(repo: RepoRef): string {
  const instance = repo.instanceUrl ?? "";
  return [repo.host, instance, repo.owner, repo.name].join("|");
}

/**
 * Builds a stable string key that groups decisions for one change (PR/MR).
 * Does not include commit SHA so notes stay attached when the branch moves.
 *
 * @param change - Change identity
 * @returns Pipe-delimited key for the change
 */
export function buildChangeKey(change: ChangeRef): string {
  return `${buildRepoKey(change.repo)}|${change.number}`;
}

/**
 * Builds a context key for grouping, optionally including head SHA for revision-aware views.
 *
 * @param context - Capture context
 * @param options - When `includeHeadSha` is true and a head SHA exists, it is appended
 * @returns Pipe-delimited key
 */
export function buildContextKey(
  context: CaptureContext,
  options: { includeHeadSha?: boolean } = {},
): string {
  const base = buildChangeKey(context.change);
  if (options.includeHeadSha && context.revision?.headSha) {
    return `${base}|${context.revision.headSha}`;
  }
  return base;
}

/**
 * Returns true when two change refs point at the same change on the same instance.
 *
 * @param a - First change
 * @param b - Second change
 */
export function isSameChange(a: ChangeRef, b: ChangeRef): boolean {
  return buildChangeKey(a) === buildChangeKey(b);
}
