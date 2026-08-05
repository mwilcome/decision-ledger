import type { CaptureContext, PageRole } from "@decision-ledger/core";

/**
 * Path pattern for a GitHub pull request plus any trailing segments.
 * Examples:
 * - `/owner/repo/pull/12`
 * - `/owner/repo/pull/12/files`
 * - `/owner/repo/pull/12/commits`
 * - `/owner/repo/pull/12/changes/<sha>` (single commit in the PR files view)
 */
const PR_PATH = /^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/(.*))?$/i;

/**
 * Matches a short or full git commit SHA used in GitHub PR URLs.
 */
const COMMIT_SHA = /^[0-9a-f]{7,40}$/i;

/**
 * Parses a github.com (or compatible) pull request URL into a capture context.
 *
 * @param url - Page URL
 * @returns Context or null when the path is not a pull request
 */
export function parseGitHubPullRequestUrl(url: URL): CaptureContext | null {
  const match = PR_PATH.exec(url.pathname);
  if (!match) {
    return null;
  }

  const owner = match[1];
  const name = match[2];
  const numberText = match[3];
  const rest = match[4] ?? "";

  if (!owner || !name || !numberText) {
    return null;
  }

  const number = Number.parseInt(numberText, 10);
  if (Number.isNaN(number)) {
    return null;
  }

  const segments = rest.split("/").filter(Boolean);
  const view = segments[0];
  const maybeSha = findCommitSha(segments);

  return {
    change: {
      repo: {
        host: "github",
        instanceUrl: isPublicGitHub(url) ? undefined : url.origin,
        owner,
        name,
      },
      number,
    },
    page: mapViewToPageRole(view),
    revision: maybeSha ? { headSha: maybeSha } : undefined,
    sourceUrl: url.toString(),
    capturedAt: new Date().toISOString(),
  };
}

/**
 * Maps the first path segment after `/pull/{n}` to a shared page role.
 * GitHub uses both classic tabs (`files`, `commits`) and newer `changes` URLs.
 *
 * @param view - First path segment after the PR number, if any
 */
function mapViewToPageRole(view: string | undefined): PageRole {
  switch (view?.toLowerCase()) {
    case "files":
    case "changes":
      return "changes";
    case "commits":
      return "commits";
    case "checks":
      return "checks";
    case "conversation":
    case undefined:
      return "overview";
    default:
      // Unknown first segment still keeps the PR identity (page role is secondary).
      return "unknown";
  }
}

/**
 * Finds a commit SHA in the path segments after `/pull/{n}`.
 * Used for URLs like `/pull/1/changes/<sha>` or `/pull/1/commits/<sha>`.
 *
 * @param segments - Path parts after the PR number
 * @returns SHA string when one segment looks like a commit id
 */
function findCommitSha(segments: readonly string[]): string | undefined {
  for (const segment of segments) {
    if (COMMIT_SHA.test(segment)) {
      return segment.toLowerCase();
    }
  }
  return undefined;
}

/**
 * Returns true when the URL is the public github.com host.
 *
 * @param url - Page URL
 */
function isPublicGitHub(url: URL): boolean {
  return url.hostname === "github.com" || url.hostname === "www.github.com";
}
