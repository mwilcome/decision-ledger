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
  getDecisionKindLabel,
  getDecisionStatusLabel,
} from "./labels.js";
