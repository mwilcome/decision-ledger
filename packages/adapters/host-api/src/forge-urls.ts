import type { ChangeRef } from "@decision-ledger/core";

/**
 * Resolves the web origin for a change (self-hosted instance or public default).
 *
 * @param change - Change identity
 * @param publicOrigin - Default public host for this forge
 */
function originFor(
  change: ChangeRef,
  publicOrigin: string,
): string {
  if (change.repo.instanceUrl) {
    return change.repo.instanceUrl.replace(/\/$/, "");
  }
  return publicOrigin;
}

/**
 * GitHub pull request conversation URL.
 *
 * @param change - Change identity
 */
export function githubChangeUrl(change: ChangeRef): string {
  const origin = originFor(change, "https://github.com");
  const { owner, name } = change.repo;
  return `${origin}/${owner}/${name}/pull/${change.number}`;
}

/**
 * GitHub repository commit URL (stable; works outside PR UI).
 *
 * @param change - Change identity
 * @param headSha - Commit SHA
 */
export function githubCommitUrl(change: ChangeRef, headSha: string): string {
  const origin = originFor(change, "https://github.com");
  const { owner, name } = change.repo;
  return `${origin}/${owner}/${name}/commit/${headSha.trim()}`;
}

/**
 * GitLab merge request URL.
 *
 * @param change - Change identity
 */
export function gitlabChangeUrl(change: ChangeRef): string {
  const origin = originFor(change, "https://gitlab.com");
  const projectPath = `${change.repo.owner}/${change.repo.name}`;
  return `${origin}/${projectPath}/-/merge_requests/${change.number}`;
}

/**
 * GitLab project commit URL.
 *
 * @param change - Change identity
 * @param headSha - Commit SHA
 */
export function gitlabCommitUrl(change: ChangeRef, headSha: string): string {
  const origin = originFor(change, "https://gitlab.com");
  const projectPath = `${change.repo.owner}/${change.repo.name}`;
  return `${origin}/${projectPath}/-/commit/${headSha.trim()}`;
}

/**
 * Builds a PR/MR URL from structured change identity (no forge API).
 *
 * @param change - Change identity
 */
export function buildChangeUrlForHost(change: ChangeRef): string | null {
  switch (change.repo.host) {
    case "github":
    case "gitea":
      return githubChangeUrl(change);
    case "gitlab":
      return gitlabChangeUrl(change);
    default:
      return null;
  }
}

/**
 * Builds a commit URL from structured identity (no forge API).
 *
 * @param change - Change identity
 * @param headSha - Commit SHA
 */
export function buildCommitUrlForHost(
  change: ChangeRef,
  headSha: string,
): string | null {
  if (!headSha.trim()) {
    return null;
  }
  switch (change.repo.host) {
    case "github":
    case "gitea":
      return githubCommitUrl(change, headSha);
    case "gitlab":
      return gitlabCommitUrl(change, headSha);
    default:
      return null;
  }
}
