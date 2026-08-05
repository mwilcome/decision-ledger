import type { CaptureContext, ChangeRef, Decision } from "./types.js";
import { buildChangeKey } from "./context-key.js";
import { normalizeShaForDisplay } from "./sha.js";

/**
 * Builds a short label for a pull request or merge request.
 * Example: `PR #1 · mwilcome/decision-ledger`
 *
 * @param change - Change identity
 */
export function formatChangeLabel(change: ChangeRef): string {
  const noun = changeNoun(change.repo.host);
  return `${noun} #${change.number} · ${change.repo.owner}/${change.repo.name}`;
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
    return "Whole pull request";
  }
  return `Commit ${normalizeShaForDisplay(headSha)}`;
}

/**
 * Describes where a new note will be saved, based on the open page.
 *
 * @param context - Current page context
 */
export function formatSaveTarget(context: CaptureContext): {
  /**
   * PR/MR line.
   */
  changeLine: string;
  /**
   * Whole PR vs specific commit.
   */
  scopeLine: string;
  /**
   * Host product name.
   */
  hostLine: string;
} {
  const sha = context.revision?.headSha;
  return {
    changeLine: formatChangeLabel(context.change),
    scopeLine: sha
      ? `This commit only (${normalizeShaForDisplay(sha)})`
      : "Whole pull request (no single commit selected)",
    hostLine: context.change.repo.host,
  };
}

/**
 * Counts useful for a summary chip row under a PR group.
 *
 * @param decisions - Decisions in the group
 */
export function countDecisionMarkers(decisions: readonly Decision[]): {
  /**
   * Notes that still need attention (open / in progress / needs changes).
   */
  needsAttention: number;
  /**
   * Notes with type "Needs changes".
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
