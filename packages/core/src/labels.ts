import type { DecisionKind, DecisionStatus } from "./types.js";

/**
 * Plain-language label for a note type (stored as `kind`).
 *
 * @param kind - Stored kind id
 */
export function getDecisionKindLabel(kind: DecisionKind): string {
  switch (kind) {
    case "note":
      return "Note";
    case "risk":
      return "Accepted risk";
    case "question":
      return "Open question";
    case "follow_up":
      return "Follow-up";
    case "block":
      return "Needs changes";
    case "approve_with_notes":
      return "OK, minor notes";
    default:
      return kind;
  }
}

/**
 * One-line meaning for a note type, shown in the form help text.
 *
 * @param kind - Stored kind id
 */
export function getDecisionKindHint(kind: DecisionKind): string {
  switch (kind) {
    case "note":
      return "General remark";
    case "risk":
      return "You are OK shipping with this tradeoff";
    case "question":
      return "Needs an answer";
    case "follow_up":
      return "Do this later";
    case "block":
      return "Blocking concern before merge";
    case "approve_with_notes":
      return "Fine to merge; small polish only";
    default:
      return "";
  }
}

/**
 * All note types with UI labels, in display order for dropdowns.
 */
export const DECISION_KIND_OPTIONS: readonly {
  /**
   * Stored kind value.
   */
  value: DecisionKind;
  /**
   * Short label shown in the dropdown.
   */
  label: string;
  /**
   * One-line meaning for help text.
   */
  hint: string;
}[] = [
  {
    value: "note",
    label: getDecisionKindLabel("note"),
    hint: getDecisionKindHint("note"),
  },
  {
    value: "risk",
    label: getDecisionKindLabel("risk"),
    hint: getDecisionKindHint("risk"),
  },
  {
    value: "question",
    label: getDecisionKindLabel("question"),
    hint: getDecisionKindHint("question"),
  },
  {
    value: "follow_up",
    label: getDecisionKindLabel("follow_up"),
    hint: getDecisionKindHint("follow_up"),
  },
  {
    value: "block",
    label: getDecisionKindLabel("block"),
    hint: getDecisionKindHint("block"),
  },
  {
    value: "approve_with_notes",
    label: getDecisionKindLabel("approve_with_notes"),
    hint: getDecisionKindHint("approve_with_notes"),
  },
] as const;

/**
 * Plain-language label for progress (stored as `status`).
 *
 * @param status - Stored status id
 */
export function getDecisionStatusLabel(status: DecisionStatus): string {
  switch (status) {
    case "draft":
      return "In progress";
    case "decided":
      return "Settled";
    case "open_question":
      return "Still open";
    case "superseded":
      return "Replaced";
    default:
      return status;
  }
}

/**
 * Progress options for create/edit forms (primary three + replaced for edits).
 */
export const DECISION_STATUS_OPTIONS: readonly {
  /**
   * Stored status value.
   */
  value: DecisionStatus;
  /**
   * Label shown to the user.
   */
  label: string;
}[] = [
  { value: "draft", label: getDecisionStatusLabel("draft") },
  { value: "decided", label: getDecisionStatusLabel("decided") },
  { value: "open_question", label: getDecisionStatusLabel("open_question") },
  { value: "superseded", label: getDecisionStatusLabel("superseded") },
] as const;

/**
 * Progress options when creating a new note (no "Replaced").
 */
export const DECISION_STATUS_OPTIONS_CREATE: readonly {
  /**
   * Stored status value.
   */
  value: DecisionStatus;
  /**
   * Label shown to the user.
   */
  label: string;
}[] = DECISION_STATUS_OPTIONS.filter((o) => o.value !== "superseded");

/**
 * Suggests a default progress when the user picks a note type.
 *
 * @param kind - Selected note type
 */
export function getDefaultStatusForKind(kind: DecisionKind): DecisionStatus {
  switch (kind) {
    case "question":
      return "open_question";
    case "note":
    case "approve_with_notes":
      return "decided";
    case "risk":
    case "follow_up":
    case "block":
    default:
      return "draft";
  }
}

/**
 * Returns true when the note should stand out while scanning a long list.
 *
 * @param kind - Note type
 * @param status - Progress
 */
export function isAttentionDecision(
  kind: DecisionKind,
  status: DecisionStatus,
): boolean {
  if (status === "superseded" || status === "decided") {
    return false;
  }
  return (
    kind === "block" ||
    kind === "question" ||
    status === "open_question" ||
    status === "draft"
  );
}

/**
 * Returns true when the note is settled and can be shown more quietly.
 *
 * @param status - Progress
 */
export function isSettledDecision(status: DecisionStatus): boolean {
  return status === "decided" || status === "superseded";
}
