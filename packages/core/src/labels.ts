import type { Decision, DecisionKind, DecisionStatus } from "./types.js";

/**
 * Plain-language label for a note type (stored as `kind`).
 *
 * @param kind - Stored kind id
 */
export function getDecisionKindLabel(kind: DecisionKind): string {
  switch (kind) {
    case "note":
      return "Note";
    case "question":
      return "Question";
    case "risk":
      return "Risk";
    case "block":
      return "Blocker";
    default:
      return kind;
  }
}

/**
 * One-line meaning for a note type (tooltips).
 *
 * @param kind - Stored kind id
 */
export function getDecisionKindHint(kind: DecisionKind): string {
  switch (kind) {
    case "note":
      return "General remark or decision";
    case "question":
      return "Needs an answer";
    case "risk":
      return "Accepted tradeoff";
    case "block":
      return "Must fix before merge";
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
   * One-line meaning for tooltips.
   */
  hint: string;
}[] = [
  {
    value: "note",
    label: getDecisionKindLabel("note"),
    hint: getDecisionKindHint("note"),
  },
  {
    value: "question",
    label: getDecisionKindLabel("question"),
    hint: getDecisionKindHint("question"),
  },
  {
    value: "risk",
    label: getDecisionKindLabel("risk"),
    hint: getDecisionKindHint("risk"),
  },
  {
    value: "block",
    label: getDecisionKindLabel("block"),
    hint: getDecisionKindHint("block"),
  },
] as const;

/**
 * Maps any stored or legacy kind string to the current four types.
 *
 * @param raw - Value from storage or form
 */
export function normalizeDecisionKind(raw: unknown): DecisionKind {
  if (raw === "question") {
    return "question";
  }
  if (raw === "risk") {
    return "risk";
  }
  if (raw === "block") {
    return "block";
  }
  // note, follow_up, approve_with_notes, and anything unknown → note
  return "note";
}

/**
 * Returns a decision with a normalized kind (for load/migrate paths).
 *
 * @param decision - Decision as read from storage
 */
export function normalizeDecision(decision: Decision): Decision {
  const kind = normalizeDecisionKind(decision.kind);
  if (kind === decision.kind) {
    return decision;
  }
  return { ...decision, kind };
}

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
      return "Waiting for clarification";
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
  {
    value: "open_question",
    label: getDecisionStatusLabel("open_question"),
  },
  { value: "decided", label: getDecisionStatusLabel("decided") },
  { value: "superseded", label: getDecisionStatusLabel("superseded") },
] as const;

/**
 * Progress options when creating a new note (no "Replaced").
 * Order: In progress, Waiting for clarification, Settled.
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
    case "block":
      return "draft";
    case "note":
    case "risk":
    default:
      return "decided";
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

/**
 * Sort weight for "needs eyes first" lists (lower sorts earlier).
 *
 * @param kind - Note type
 * @param status - Progress
 */
export function attentionSortRank(
  kind: DecisionKind,
  status: DecisionStatus,
): number {
  if (status === "superseded") {
    return 50;
  }
  if (kind === "block") {
    return 0;
  }
  if (status === "open_question" || kind === "question") {
    return 1;
  }
  if (status === "draft") {
    return 2;
  }
  if (status === "decided") {
    return 40;
  }
  return 30;
}

/**
 * Sorts notes so unfinished / blocking items appear before settled ones.
 * Within the same rank, newest `updatedAt` first.
 *
 * @param decisions - Notes to sort
 */
export function sortDecisionsAttentionFirst(
  decisions: readonly Decision[],
): Decision[] {
  return [...decisions].sort((a, b) => {
    const rank =
      attentionSortRank(a.kind, a.status) -
      attentionSortRank(b.kind, b.status);
    if (rank !== 0) {
      return rank;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

/**
 * One-line summary of open work for a set of notes.
 *
 * @param decisions - Notes in a PR group
 */
export function formatOpenWorkSummary(
  decisions: readonly Decision[],
): string | null {
  let open = 0;
  let waiting = 0;
  let blocking = 0;

  for (const d of decisions) {
    if (d.kind === "block" && d.status !== "decided" && d.status !== "superseded") {
      blocking += 1;
    }
    if (
      (d.status === "open_question" || d.kind === "question") &&
      d.status !== "decided" &&
      d.status !== "superseded"
    ) {
      waiting += 1;
    }
    if (
      d.status === "draft" ||
      d.status === "open_question" ||
      (d.kind === "block" && d.status !== "decided" && d.status !== "superseded")
    ) {
      open += 1;
    }
  }

  if (open === 0 && waiting === 0 && blocking === 0) {
    return null;
  }

  const parts: string[] = [];
  if (open > 0) {
    parts.push(`${open} open`);
  }
  if (waiting > 0) {
    parts.push(`${waiting} waiting for clarification`);
  }
  if (blocking > 0) {
    parts.push(`${blocking} blocker${blocking === 1 ? "" : "s"}`);
  }
  return parts.join(" · ");
}
