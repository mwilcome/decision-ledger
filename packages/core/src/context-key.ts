import type { CaptureContext, ChangeRef, Decision, RepoRef } from "./types.js";

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
 * Builds a key for one commit on a change (PR/MR + head SHA).
 *
 * @param change - Change identity
 * @param headSha - Commit SHA (any length GitHub may put in the URL)
 * @returns Pipe-delimited key
 */
export function buildCommitKey(change: ChangeRef, headSha: string): string {
  return `${buildChangeKey(change)}|${normalizeSha(headSha)}`;
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
    return buildCommitKey(context.change, context.revision.headSha);
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

/**
 * Returns true when the decision belongs to the given change (any commit on that PR/MR).
 *
 * @param decision - Stored decision
 * @param change - Change to match
 */
export function decisionMatchesChange(
  decision: Decision,
  change: ChangeRef,
): boolean {
  return isSameChange(decision.context.change, change);
}

/**
 * Returns true when the decision is for the same change and the same commit SHA.
 * Compares SHAs by shared prefix so short and full SHAs can match.
 *
 * @param decision - Stored decision
 * @param change - Change to match
 * @param headSha - Commit SHA from the current page
 */
export function decisionMatchesCommit(
  decision: Decision,
  change: ChangeRef,
  headSha: string,
): boolean {
  if (!decisionMatchesChange(decision, change)) {
    return false;
  }
  const stored = decision.context.revision?.headSha;
  if (!stored) {
    return false;
  }
  return shasMatch(stored, headSha);
}

/**
 * Normalizes a SHA for use in keys (lowercase trim).
 *
 * @param sha - Raw SHA from a URL or page
 */
function normalizeSha(sha: string): string {
  return sha.trim().toLowerCase();
}

/**
 * Returns true when two SHA strings refer to the same commit.
 * Uses prefix match when lengths differ (short vs full SHA).
 *
 * @param a - First SHA
 * @param b - Second SHA
 */
function shasMatch(a: string, b: string): boolean {
  const left = normalizeSha(a);
  const right = normalizeSha(b);
  if (left === right) {
    return true;
  }
  const shorter = left.length <= right.length ? left : right;
  const longer = left.length <= right.length ? right : left;
  return shorter.length >= 7 && longer.startsWith(shorter);
}
