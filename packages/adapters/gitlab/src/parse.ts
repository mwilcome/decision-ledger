import type { CaptureContext, PageRole } from "@decision-ledger/core";

/**
 * Path pattern for a GitLab merge request.
 * Supports nested groups: `/group/sub/project/-/merge_requests/42`
 * Optional tab: `/diffs`, `/commits`, `/pipelines`
 */
const MR_PATH =
  /^\/(.+)\/-\/merge_requests\/(\d+)(?:\/(diffs|commits|pipelines|reports))?\/?$/i;

/**
 * Parses a GitLab merge request URL into a capture context.
 *
 * @param url - Page URL
 * @returns Context or null when the path is not a merge request
 */
export function parseGitLabMergeRequestUrl(url: URL): CaptureContext | null {
  const match = MR_PATH.exec(url.pathname);
  if (!match) {
    return null;
  }

  const projectPath = match[1];
  const iidText = match[2];
  const tab = match[3];

  if (!projectPath || !iidText) {
    return null;
  }

  const parts = projectPath.split("/").filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  const name = parts[parts.length - 1];
  const owner = parts.slice(0, -1).join("/");
  if (!name || !owner) {
    return null;
  }

  const number = Number.parseInt(iidText, 10);
  if (Number.isNaN(number)) {
    return null;
  }

  return {
    change: {
      repo: {
        host: "gitlab",
        instanceUrl: isPublicGitLab(url) ? undefined : url.origin,
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
 * Maps a GitLab MR tab segment to a shared page role.
 *
 * @param tab - Optional tab from the URL
 */
function mapTabToPageRole(tab: string | undefined): PageRole {
  switch (tab?.toLowerCase()) {
    case "diffs":
      return "changes";
    case "commits":
      return "commits";
    case "pipelines":
    case "reports":
      return "checks";
    case undefined:
      return "overview";
    default:
      return "unknown";
  }
}

/**
 * Returns true when the host is public gitlab.com.
 *
 * @param url - Page URL
 */
function isPublicGitLab(url: URL): boolean {
  return url.hostname === "gitlab.com" || url.hostname === "www.gitlab.com";
}
