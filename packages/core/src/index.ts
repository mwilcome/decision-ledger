/**
 * @packageDocumentation
 * Pure domain types and helpers for Decision Ledger.
 * This package must not import browser or DOM APIs.
 */

export type {
  CaptureContext,
  ChangeRef,
  Decision,
  DecisionKind,
  DecisionStatus,
  ForgeReviewSnapshot,
  HostId,
  NewDecisionInput,
  PageRole,
  RepoRef,
  RevisionRef,
  SelectionRef,
  ThreadRef,
} from "./types.js";

export {
  buildChangeKey,
  buildCommitKey,
  buildContextKey,
  buildRepoKey,
  decisionMatchesChange,
  decisionMatchesCommit,
  isCurrentChange,
  isCurrentCommit,
  isSameChange,
} from "./context-key.js";

export {
  createDecision,
  isDecisionStatus,
  markSuperseded,
  updateDecision,
} from "./decision.js";

export {
  DECISION_KIND_OPTIONS,
  DECISION_STATUS_OPTIONS,
  DECISION_STATUS_OPTIONS_CREATE,
  attentionSortRank,
  formatOpenWorkSummary,
  getDecisionKindHint,
  getDecisionKindLabel,
  getDecisionStatusLabel,
  getDefaultStatusForKind,
  isAttentionDecision,
  isSettledDecision,
  sortDecisionsAttentionFirst,
} from "./labels.js";

export {
  changeGroupKey,
  changeNoun,
  countDecisionMarkers,
  formatChangeLabel,
  formatCommitScopeLabel,
} from "./display.js";

export { normalizeShaForDisplay } from "./sha.js";

export { formatAbsoluteTime, formatRelativeTime } from "./time.js";

export {
  groupDecisionsByChange,
  sectionHasAttention,
  sortChangeGroupsCurrentFirst,
} from "./group.js";
export type { DecisionChangeGroup, DecisionSection } from "./group.js";
