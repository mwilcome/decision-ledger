import type { DecisionKind, DecisionStatus } from "./types.js";

/**
 * Plain-language label for a decision kind (shown in the UI).
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
 * All decision kinds with UI labels, in display order for dropdowns.
 */
export const DECISION_KIND_OPTIONS: readonly {
  /**
   * Stored kind value.
   */
  value: DecisionKind;
  /**
   * Label shown to the user.
   */
  label: string;
}[] = [
  { value: "note", label: getDecisionKindLabel("note") },
  { value: "risk", label: getDecisionKindLabel("risk") },
  { value: "question", label: getDecisionKindLabel("question") },
  { value: "follow_up", label: getDecisionKindLabel("follow_up") },
  { value: "block", label: getDecisionKindLabel("block") },
  {
    value: "approve_with_notes",
    label: getDecisionKindLabel("approve_with_notes"),
  },
] as const;

/**
 * Plain-language label for a decision status.
 *
 * @param status - Stored status id
 */
export function getDecisionStatusLabel(status: DecisionStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "decided":
      return "Decided";
    case "open_question":
      return "Open question";
    case "superseded":
      return "Superseded";
    default:
      return status;
  }
}

/**
 * Status options for create/edit forms.
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
