import type { Decision } from "@decision-ledger/core";
import {
  formatChangeLabel,
  formatCommitScopeLabel,
  getDecisionKindLabel,
  getDecisionStatusLabel,
  groupDecisionsByChange,
  isAttentionDecision,
  isSettledDecision,
  normalizeShaForDisplay,
} from "@decision-ledger/core";
import type { ReactElement } from "react";

/**
 * Props for {@link DecisionList}.
 */
export interface DecisionListProps {
  /**
   * Decisions to render (already filtered by the app).
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
 * Renders saved notes grouped by pull request, then whole PR vs commit.
 *
 * @param props - Component props
 */
export function DecisionList(props: DecisionListProps): ReactElement {
  const { decisions, editingId, onEdit, onDelete } = props;

  if (decisions.length === 0) {
    return (
      <p className="dl-list-empty" aria-live="polite">
        No notes in this view yet.
      </p>
    );
  }

  const groups = groupDecisionsByChange(decisions);

  return (
    <div className="dl-groups">
      {groups.map((group) => (
        <section key={group.key} className="dl-group">
          <header className="dl-group__header">
            <h3 className="dl-group__title">{group.title}</h3>
            <p className="dl-group__host">{group.host}</p>
            <p className="dl-group__chips" aria-label="Summary">
              <span className="dl-chip">{group.counts.total} total</span>
              {group.counts.needsAttention > 0 ? (
                <span className="dl-chip dl-chip--attention">
                  {group.counts.needsAttention} need attention
                </span>
              ) : null}
              {group.counts.needsChanges > 0 ? (
                <span className="dl-chip dl-chip--block">
                  {group.counts.needsChanges} needs changes
                </span>
              ) : null}
              {group.counts.settled > 0 ? (
                <span className="dl-chip dl-chip--settled">
                  {group.counts.settled} settled
                </span>
              ) : null}
            </p>
          </header>

          {group.sections.map((section) => (
            <div key={section.key} className="dl-section">
              <h4 className="dl-section__title">{section.title}</h4>
              <ul className="dl-list">
                {section.decisions.map((decision) => (
                  <DecisionCard
                    key={decision.id}
                    decision={decision}
                    isEditing={editingId === decision.id}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

/**
 * Props for a single note card.
 */
interface DecisionCardProps {
  /**
   * Decision to show.
   */
  decision: Decision;

  /**
   * Whether this card is the one being edited.
   */
  isEditing: boolean;

  /**
   * Edit handler.
   */
  onEdit: (decision: Decision) => void;

  /**
   * Delete handler.
   */
  onDelete: (decision: Decision) => void;
}

/**
 * One note card with breadcrumb, type, progress, and actions.
 *
 * @param props - Card props
 */
function DecisionCard(props: DecisionCardProps): ReactElement {
  const { decision, isEditing, onEdit, onDelete } = props;
  const attention = isAttentionDecision(decision.kind, decision.status);
  const settled = isSettledDecision(decision.status);
  const sha = decision.context.revision?.headSha;

  const classNames = [
    "dl-list__item",
    isEditing ? "dl-list__item--editing" : "",
    attention ? "dl-list__item--attention" : "",
    settled ? "dl-list__item--settled" : "",
    decision.kind === "block" ? "dl-list__item--block" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={classNames}>
      <p className="dl-list__crumb">
        {formatChangeLabel(decision.context.change)}
        <span className="dl-list__crumb-sep"> → </span>
        {formatCommitScopeLabel(
          sha ? normalizeShaForDisplay(sha) : undefined,
        )}
      </p>
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
        <span className="dl-list__when">{formatWhen(decision.updatedAt)}</span>
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
