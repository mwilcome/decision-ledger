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
  getDecisionKindHint,
  getDecisionKindLabel,
  getDecisionStatusLabel,
  getDefaultStatusForKind,
  isAttentionDecision,
  isSettledDecision,
} from "./labels.js";

export {
  changeGroupKey,
  changeNoun,
  countDecisionMarkers,
  formatChangeLabel,
  formatCommitScopeLabel,
  formatSaveTarget,
} from "./display.js";

export { normalizeShaForDisplay } from "./sha.js";

export { groupDecisionsByChange } from "./group.js";
export type { DecisionChangeGroup, DecisionSection } from "./group.js";
