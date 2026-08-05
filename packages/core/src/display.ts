import type { ChangeRef, Decision } from "./types.js";
import { buildChangeKey } from "./context-key.js";
import { normalizeShaForDisplay } from "./sha.js";

/**
 * Builds a short identity label for a pull request or merge request.
 * Example: `#2 · mwilcome/decision-ledger`
 *
 * @param change - Change identity
 */
export function formatChangeLabel(change: ChangeRef): string {
  return `#${change.number} · ${change.repo.owner}/${change.repo.name}`;
}

/**
 * Short accessible description including host product (for title attributes).
 *
 * @param change - Change identity
 */
export function formatChangeLabelWithHost(change: ChangeRef): string {
  const noun = changeNoun(change.repo.host);
  return `${noun} #${change.number} · ${change.repo.owner}/${change.repo.name}`;
}

/**
 * Friendly list/banner label: nickname, then learned title, then identity fallback.
 *
 * @param change - Change identity
 * @param meta - Optional cached presentation (title / nickname)
 * @param maxTitleLen - Max characters of title to show after `#N · `
 */
export function formatChangeDisplayLabel(
  change: ChangeRef,
  meta?: { title?: string; nickname?: string } | null,
  maxTitleLen = 42,
): string {
  const idPrefix = `#${change.number}`;
  const friendly = meta?.nickname?.trim() || meta?.title?.trim();
  if (friendly) {
    return `${idPrefix} · ${truncateText(friendly, maxTitleLen)}`;
  }
  return formatChangeLabel(change);
}

/**
 * Truncates text with an ellipsis when longer than maxLen.
 *
 * @param text - Source text
 * @param maxLen - Maximum length including ellipsis
 */
function truncateText(text: string, maxLen: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) {
    return cleaned;
  }
  if (maxLen <= 1) {
    return "…";
  }
  return `${cleaned.slice(0, maxLen - 1).trimEnd()}…`;
}

/**
 * Returns "PR" or "MR" style noun for display (defaults to "Change").
 *
 * @param host - Host id
 */
export function changeNoun(host: string): string {
  switch (host) {
    case "gitlab":
      return "MR";
    case "github":
    case "gitea":
    case "bitbucket":
    case "azuredevops":
      return "PR";
    default:
      return "Change";
  }
}

/**
 * Human label for the commit scope of a decision or page.
 *
 * @param headSha - Commit SHA, or undefined for whole-change notes
 */
export function formatCommitScopeLabel(headSha: string | undefined): string {
  if (!headSha) {
    return "Whole change";
  }
  return `Commit ${normalizeShaForDisplay(headSha)}`;
}

/**
 * Counts useful for a summary chip row under a PR group.
 *
 * @param decisions - Decisions in the group
 */
export function countDecisionMarkers(decisions: readonly Decision[]): {
  /**
   * Notes that still need attention (open / in progress / blockers).
   */
  needsAttention: number;
  /**
   * Notes with type Blocker.
   */
  needsChanges: number;
  /**
   * Notes marked settled.
   */
  settled: number;
  /**
   * Total notes.
   */
  total: number;
} {
  let needsAttention = 0;
  let needsChanges = 0;
  let settled = 0;

  for (const d of decisions) {
    if (d.kind === "block") {
      needsChanges += 1;
    }
    if (d.status === "decided" || d.status === "superseded") {
      settled += 1;
    } else if (
      d.kind === "block" ||
      d.kind === "question" ||
      d.status === "open_question" ||
      d.status === "draft"
    ) {
      needsAttention += 1;
    }
  }

  return {
    needsAttention,
    needsChanges,
    settled,
    total: decisions.length,
  };
}

/**
 * Stable key for a change group.
 *
 * @param change - Change identity
 */
export function changeGroupKey(change: ChangeRef): string {
  return buildChangeKey(change);
}
