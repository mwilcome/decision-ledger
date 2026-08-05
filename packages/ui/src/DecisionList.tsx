import type { Decision } from "@decision-ledger/core";
import {
  getDecisionKindLabel,
  getDecisionStatusLabel,
} from "@decision-ledger/core";
import type { ReactElement } from "react";

/**
 * Props for {@link DecisionList}.
 */
export interface DecisionListProps {
  /**
   * Decisions to render, newest or caller-sorted order.
   */
  decisions: readonly Decision[];

  /**
   * Id of the decision currently open in the edit form, if any.
   */
  editingId?: string | null;

  /**
   * Starts editing the given decision.
   *
   * @param decision - Decision to edit
   */
  onEdit: (decision: Decision) => void;

  /**
   * Requests deletion of the given decision (caller should confirm).
   *
   * @param decision - Decision to delete
   */
  onDelete: (decision: Decision) => void;
}

/**
 * Renders decision cards with edit and delete actions.
 *
 * @param props - Component props
 */
export function DecisionList(props: DecisionListProps): ReactElement {
  const { decisions, editingId, onEdit, onDelete } = props;

  if (decisions.length === 0) {
    return (
      <p className="dl-list-empty" aria-live="polite">
        No decisions in this view.
      </p>
    );
  }

  return (
    <ul className="dl-list">
      {decisions.map((decision) => {
        const shortSha = decision.context.revision?.headSha?.slice(0, 7);
        const isEditing = editingId === decision.id;

        return (
          <li
            key={decision.id}
            className={
              isEditing ? "dl-list__item dl-list__item--editing" : "dl-list__item"
            }
          >
            <header className="dl-list__header">
              <span className="dl-list__kind">
                {getDecisionKindLabel(decision.kind)}
              </span>
              <span className="dl-list__status">
                {getDecisionStatusLabel(decision.status)}
              </span>
            </header>
            <p className="dl-list__body">{decision.body}</p>
            <footer className="dl-list__footer">
              <span>
                {shortSha ? `commit ${shortSha} · ` : "whole change · "}
                {formatWhen(decision.updatedAt)}
              </span>
              <span className="dl-list__actions">
                <button
                  type="button"
                  className="dl-list__btn"
                  onClick={() => onEdit(decision)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="dl-list__btn dl-list__btn--danger"
                  onClick={() => onDelete(decision)}
                >
                  Delete
                </button>
              </span>
            </footer>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Formats an ISO timestamp for a short list footer.
 *
 * @param iso - ISO-8601 string
 */
function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
