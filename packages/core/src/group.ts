import type { CaptureContext, Decision } from "./types.js";
import { buildChangeKey } from "./context-key.js";
import {
  countDecisionMarkers,
  formatChangeLabel,
  formatCommitScopeLabel,
} from "./display.js";
import {
  isAttentionDecision,
  sortDecisionsAttentionFirst,
} from "./labels.js";
import { normalizeShaForDisplay } from "./sha.js";

/**
 * One commit (or whole-PR) bucket inside a change group.
 */
export interface DecisionSection {
  /**
   * Stable section key (`whole` or normalized SHA).
   */
  key: string;

  /**
   * Section title for the UI.
   */
  title: string;

  /**
   * Decisions in this section, newest first preferred by caller.
   */
  decisions: Decision[];
}

/**
 * One pull request / merge request group in the saved list.
 */
export interface DecisionChangeGroup {
  /**
   * Change key for React lists.
   */
  key: string;

  /**
   * Plain label such as `PR #1 · owner/repo`.
   */
  title: string;

  /**
   * Host id for a quiet subtitle.
   */
  host: string;

  /**
   * Summary counts for chips.
   */
  counts: ReturnType<typeof countDecisionMarkers>;

  /**
   * Whole-PR section first, then commits sorted by newest activity.
   */
  sections: DecisionSection[];
}

/**
 * Groups decisions into PR → whole PR / commit → notes hierarchy.
 *
 * @param decisions - Flat list to group
 */
export function groupDecisionsByChange(
  decisions: readonly Decision[],
): DecisionChangeGroup[] {
  const byChange = new Map<string, Decision[]>();

  for (const decision of decisions) {
    const key = buildChangeKey(decision.context.change);
    const list = byChange.get(key) ?? [];
    list.push(decision);
    byChange.set(key, list);
  }

  const groups: DecisionChangeGroup[] = [];

  for (const [key, changeDecisions] of byChange) {
    const sample = changeDecisions[0];
    if (!sample) {
      continue;
    }

    const sections = buildSections(changeDecisions);
    groups.push({
      key,
      title: formatChangeLabel(sample.context.change),
      host: sample.context.change.repo.host,
      counts: countDecisionMarkers(changeDecisions),
      sections,
    });
  }

  // Groups with more recent activity first.
  groups.sort((a, b) => {
    const aTime = latestUpdated(a);
    const bTime = latestUpdated(b);
    return bTime.localeCompare(aTime);
  });

  return groups;
}

/**
 * Puts the group that matches the open page first; keeps relative order otherwise.
 *
 * @param groups - Grouped decisions (e.g. from {@link groupDecisionsByChange})
 * @param context - Current page context, or null
 * @returns New array sorted with the current PR/MR first when known
 */
export function sortChangeGroupsCurrentFirst(
  groups: readonly DecisionChangeGroup[],
  context: CaptureContext | null | undefined,
): DecisionChangeGroup[] {
  if (!context || groups.length < 2) {
    return [...groups];
  }

  const currentKey = buildChangeKey(context.change);
  const copy = [...groups];
  copy.sort((a, b) => {
    const aCurrent = a.key === currentKey ? 0 : 1;
    const bCurrent = b.key === currentKey ? 0 : 1;
    if (aCurrent !== bCurrent) {
      return aCurrent - bCurrent;
    }
    return 0;
  });
  return copy;
}

/**
 * Builds whole-PR + per-commit sections for one change's decisions.
 *
 * @param decisions - All decisions for one change
 */
function buildSections(decisions: readonly Decision[]): DecisionSection[] {
  const whole: Decision[] = [];
  const bySha = new Map<string, Decision[]>();

  for (const decision of decisions) {
    const sha = decision.context.revision?.headSha;
    if (!sha) {
      whole.push(decision);
      continue;
    }
    const norm = normalizeShaForDisplay(sha);
    const list = bySha.get(norm) ?? [];
    list.push(decision);
    bySha.set(norm, list);
  }

  const sections: DecisionSection[] = [];

  if (whole.length > 0) {
    sections.push({
      key: "whole",
      title: formatCommitScopeLabel(undefined),
      decisions: sortDecisionsAttentionFirst(whole),
    });
  }

  const commitSections = [...bySha.entries()]
    .map(([sha, list]) => ({
      key: sha,
      title: formatCommitScopeLabel(sha),
      decisions: sortDecisionsAttentionFirst(list),
      newest: list.reduce(
        (max, d) => (d.updatedAt > max ? d.updatedAt : max),
        list[0]?.updatedAt ?? "",
      ),
    }))
    .sort((a, b) => b.newest.localeCompare(a.newest));

  for (const section of commitSections) {
    // Skip empty commit buckets (defensive; map entries always have items).
    if (section.decisions.length === 0) {
      continue;
    }
    sections.push({
      key: section.key,
      title: section.title,
      decisions: section.decisions,
    });
  }

  return sections;
}

/**
 * Returns true when any note in the list still needs attention.
 *
 * @param decisions - Notes in a section
 */
export function sectionHasAttention(decisions: readonly Decision[]): boolean {
  return decisions.some((d) => isAttentionDecision(d.kind, d.status));
}

/**
 * Latest updatedAt string inside a group.
 *
 * @param group - Change group
 */
function latestUpdated(group: DecisionChangeGroup): string {
  let latest = "";
  for (const section of group.sections) {
    for (const d of section.decisions) {
      if (d.updatedAt > latest) {
        latest = d.updatedAt;
      }
    }
  }
  return latest;
}
