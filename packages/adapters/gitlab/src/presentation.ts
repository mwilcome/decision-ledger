import type { ChangePresentation } from "@decision-ledger/core";

/**
 * Reads MR title from a GitLab merge request page.
 *
 * @param doc - Page document
 */
export function readGitLabPresentation(doc: Document): ChangePresentation | null {
  const title =
    readHeadingTitle(doc) ?? readTitleFromDocumentTitle(doc.title);
  if (!title) {
    return null;
  }
  return { title };
}

/**
 * Prefer the MR title heading when present.
 *
 * @param doc - Page document
 */
function readHeadingTitle(doc: Document): string | undefined {
  const selectors = [
    "h1.title",
    ".detail-page-header-title h1",
    "[data-testid='breadcrumb-current-link']",
    "h1[data-testid='title-content']",
  ];
  for (const selector of selectors) {
    const el = doc.querySelector(selector);
    const text = el?.textContent?.replace(/\s+/g, " ").trim();
    if (text && text.length > 0 && text.length < 300 && !/^!?\d+$/.test(text)) {
      return text;
    }
  }
  return undefined;
}

/**
 * Parses titles like `My change (!7) · group / project · GitLab`.
 *
 * @param documentTitle - `document.title`
 */
function readTitleFromDocumentTitle(documentTitle: string): string | undefined {
  const trimmed = documentTitle.trim();
  if (!trimmed) {
    return undefined;
  }
  const bang = trimmed.match(/^(.*?)\s*\(!?\d+\)/);
  if (bang?.[1]) {
    const t = bang[1].trim();
    if (t.length > 0 && t.length < 300) {
      return t;
    }
  }
  const pipe = trimmed.match(/^(.*?)\s*[·|]\s*/);
  if (pipe?.[1] && !/gitlab/i.test(pipe[1])) {
    const t = pipe[1].trim();
    if (t.length > 2 && t.length < 300) {
      return t;
    }
  }
  return undefined;
}
