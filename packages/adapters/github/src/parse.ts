import type { CaptureContext, PageRole } from "@decision-ledger/core";

/**
 * Path pattern for a GitHub pull request and optional tab segment.
 * Examples:
 * - `/owner/repo/pull/12`
 * - `/owner/repo/pull/12/files`
 */
const PR_PATH =
  /^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/(files|commits|checks|conversation))?\/?$/i;

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
  const tab = match[4];

  if (!owner || !name || !numberText) {
    return null;
  }

  const number = Number.parseInt(numberText, 10);
  if (Number.isNaN(number)) {
    return null;
  }

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
    page: mapTabToPageRole(tab),
    sourceUrl: url.toString(),
    capturedAt: new Date().toISOString(),
  };
}

/**
 * Maps a GitHub PR tab path segment to a shared page role.
 *
 * @param tab - Optional tab segment from the URL
 */
function mapTabToPageRole(tab: string | undefined): PageRole {
  switch (tab?.toLowerCase()) {
    case "files":
      return "changes";
    case "commits":
      return "commits";
    case "checks":
      return "checks";
    case "conversation":
    case undefined:
      return "overview";
    default:
      return "unknown";
  }
}

/**
 * Returns true when the URL is the public github.com host.
 *
 * @param url - Page URL
 */
function isPublicGitHub(url: URL): boolean {
  return url.hostname === "github.com" || url.hostname === "www.github.com";
}
