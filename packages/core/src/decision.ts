import type { Decision, DecisionStatus, NewDecisionInput } from "./types.js";

/**
 * Creates a new {@link Decision} with generated id and timestamps.
 *
 * @param input - User-provided fields for the decision
 * @param now - Optional clock for tests; defaults to `Date.now`
 * @returns A complete decision record ready to store
 */
export function createDecision(
  input: NewDecisionInput,
  now: () => number = Date.now,
): Decision {
  const timestamp = toIso(now());
  return {
    id: createId(now),
    context: input.context,
    status: input.status ?? "draft",
    kind: input.kind,
    body: input.body,
    tags: input.tags ? [...input.tags] : [],
    supersedes: input.supersedes,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Returns a copy of the decision with updated fields and a new `updatedAt`.
 *
 * @param decision - Existing decision
 * @param patch - Fields to replace (cannot change `id` or `createdAt`)
 * @param now - Optional clock for tests
 */
export function updateDecision(
  decision: Decision,
  patch: Partial<
    Pick<Decision, "context" | "status" | "kind" | "body" | "tags" | "supersedes">
  >,
  now: () => number = Date.now,
): Decision {
  return {
    ...decision,
    ...patch,
    tags: patch.tags ? [...patch.tags] : decision.tags,
    updatedAt: toIso(now()),
  };
}

/**
 * Marks a decision as superseded and optionally records which decision replaces it.
 *
 * @param decision - Decision being replaced
 * @param replacementId - Id of the newer decision, stored on the replacement via `supersedes` by the caller
 * @param now - Optional clock for tests
 * @returns Updated decision with status `"superseded"`
 */
export function markSuperseded(
  decision: Decision,
  replacementId: string | undefined,
  now: () => number = Date.now,
): Decision {
  // Status moves to superseded; linkage from the new decision points back via `supersedes`.
  void replacementId;
  return updateDecision(decision, { status: "superseded" }, now);
}

/**
 * Returns true when the status is allowed for a decision record.
 *
 * @param status - Candidate status string
 */
export function isDecisionStatus(status: string): status is DecisionStatus {
  return (
    status === "draft" ||
    status === "decided" ||
    status === "open_question" ||
    status === "superseded"
  );
}

/**
 * Builds a time-based id suitable for local use.
 * Not a cryptographic UUID; fine for device-local ledger ids.
 *
 * @param now - Clock function returning milliseconds since epoch
 */
function createId(now: () => number): string {
  const timePart = now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `dec_${timePart}_${randomPart}`;
}

/**
 * Formats a millisecond timestamp as ISO-8601 UTC.
 *
 * @param ms - Milliseconds since epoch
 */
function toIso(ms: number): string {
  return new Date(ms).toISOString();
}
