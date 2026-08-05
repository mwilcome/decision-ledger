import type { ChangePresentation } from "@decision-ledger/core";

/**
 * Reads PR title (and branches when present) from a GitHub pull request page.
 *
 * @param doc - Page document
 */
export function readGitHubPresentation(doc: Document): ChangePresentation | null {
  const title =
    readHeadingTitle(doc) ?? readTitleFromDocumentTitle(doc.title);
  if (!title) {
    return null;
  }

  const branches = readBranchPair(doc);
  return {
    title,
    sourceBranch: branches?.source,
    targetBranch: branches?.target,
  };
}

/**
 * Prefer the visible PR title heading when GitHub has painted it.
 *
 * @param doc - Page document
 */
function readHeadingTitle(doc: Document): string | undefined {
  const selectors = [
    "bdi.js-issue-title",
    ".js-issue-title",
    "h1.gh-header-title .js-issue-title",
    "h1.gh-header-title bdi",
    "h1[data-component='PH_Title'] span",
  ];
  for (const selector of selectors) {
    const el = doc.querySelector(selector);
    const text = el?.textContent?.replace(/\s+/g, " ").trim();
    if (text && text.length > 0 && text.length < 300) {
      return text;
    }
  }
  return undefined;
}

/**
 * Parses `Some title · Pull Request #2 · owner/repo` style tab titles.
 *
 * @param documentTitle - `document.title`
 */
function readTitleFromDocumentTitle(documentTitle: string): string | undefined {
  const trimmed = documentTitle.trim();
  if (!trimmed) {
    return undefined;
  }
  const pullMatch = trimmed.match(
    /^(.*?)\s*[·|]\s*Pull\s+Request\s*#?\d+/i,
  );
  if (pullMatch?.[1]) {
    const t = pullMatch[1].trim();
    if (t.length > 0 && t.length < 300) {
      return t;
    }
  }
  return undefined;
}

/**
 * Reads "from branch into branch" from the PR header when present.
 *
 * @param doc - Page document
 */
function readBranchPair(
  doc: Document,
): { source: string; target: string } | undefined {
  const head = doc.querySelector(".commit-ref.head-ref, .css-truncate.head-ref");
  const base = doc.querySelector(".commit-ref.base-ref, .css-truncate.base-ref");
  const source = head?.textContent?.replace(/\s+/g, " ").trim();
  const target = base?.textContent?.replace(/\s+/g, " ").trim();
  if (source && target) {
    return { source, target };
  }
  return undefined;
}
