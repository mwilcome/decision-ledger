import type { CaptureContext, Decision } from "@decision-ledger/core";
import {
  buildChangeKey,
  formatAbsoluteTime,
  formatChangeLabel,
  formatCommitScopeLabel,
  formatRelativeTime,
  getDecisionKindLabel,
  getDecisionStatusLabel,
  groupDecisionsByChange,
  isAttentionDecision,
  isSettledDecision,
  normalizeShaForDisplay,
  sortChangeGroupsCurrentFirst,
} from "@decision-ledger/core";
import { useEffect, useState, type ReactElement } from "react";
import type { DecisionListScope } from "./ListFilter.js";

/**
 * Props for {@link DecisionList}.
 */
export interface DecisionListProps {
  /**
   * Decisions to render (already filtered by the app).
   */
  decisions: readonly Decision[];

  /**
   * Open page context, used to highlight and sort the current PR group.
   */
  currentContext?: CaptureContext | null;

  /**
   * Active list filter. When `"all"`, cards may show a short location crumb.
   */
  listScope?: DecisionListScope;

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
  const {
    decisions,
    currentContext,
    listScope = "change",
    editingId,
    onEdit,
    onDelete,
  } = props;

  /**
   * Which PR groups are expanded. Missing keys use the default (current open, others closed when multi).
   */
  const [expandedByKey, setExpandedByKey] = useState<Record<string, boolean>>(
    {},
  );

  const groups = sortChangeGroupsCurrentFirst(
    groupDecisionsByChange(decisions),
    currentContext,
  );

  const currentKey = currentContext
    ? buildChangeKey(currentContext.change)
    : null;

  /** Crumbs only when browsing every PR at once. */
  const showCardCrumb = listScope === "all";

  /**
   * When the open PR changes, expand that group so it is visible under Everything saved.
   */
  useEffect(() => {
    if (!currentKey) {
      return;
    }
    setExpandedByKey((prev) => {
      if (prev[currentKey] === true) {
        return prev;
      }
      return { ...prev, [currentKey]: true };
    });
  }, [currentKey]);

  if (decisions.length === 0) {
    return (
      <p className="dl-list-empty" aria-live="polite">
        No notes in this view yet.
      </p>
    );
  }

  /**
   * Resolves whether a group body is shown.
   *
   * @param groupKey - Change group key
   * @param isCurrent - Whether this group is the open page
   */
  function isExpanded(groupKey: string, isCurrent: boolean): boolean {
    const stored = expandedByKey[groupKey];
    if (stored !== undefined) {
      return stored;
    }
    // Single group: always open. Multiple: current open, others collapsed.
    if (groups.length <= 1) {
      return true;
    }
    return isCurrent;
  }

  /**
   * Toggles a group's expanded state.
   *
   * @param groupKey - Change group key
   * @param isCurrent - Whether this group is the open page
   */
  function toggleGroup(groupKey: string, isCurrent: boolean): void {
    setExpandedByKey((prev) => ({
      ...prev,
      [groupKey]: !isExpanded(groupKey, isCurrent),
    }));
  }

  return (
    <div className="dl-groups">
      {groups.map((group) => {
        const isCurrent = currentKey !== null && group.key === currentKey;
        const expanded = isExpanded(group.key, isCurrent);
        const groupClass = [
          "dl-group",
          isCurrent ? "dl-group--current" : "",
          expanded ? "" : "dl-group--collapsed",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <section
            key={group.key}
            className={groupClass}
            aria-current={isCurrent ? "true" : undefined}
          >
            <header className="dl-group__header">
              <button
                type="button"
                className="dl-group__toggle"
                aria-expanded={expanded}
                onClick={() => toggleGroup(group.key, isCurrent)}
              >
                <span className="dl-group__chevron" aria-hidden="true">
                  {expanded ? "▼" : "▶"}
                </span>
                <span className="dl-group__title-row">
                  <span className="dl-group__title">{group.title}</span>
                  {isCurrent ? (
                    <span className="dl-chip dl-chip--current">This page</span>
                  ) : null}
                </span>
              </button>
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

            {expanded
              ? group.sections.map((section) => (
                  <div key={section.key} className="dl-section">
                    <h4 className="dl-section__title">{section.title}</h4>
                    <ul className="dl-list">
                      {section.decisions.map((decision) => (
                        <DecisionCard
                          key={decision.id}
                          decision={decision}
                          showCrumb={showCardCrumb}
                          isEditing={editingId === decision.id}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      ))}
                    </ul>
                  </div>
                ))
              : null}
          </section>
        );
      })}
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
   * When true, show PR → scope crumb (used for Everything saved).
   */
  showCrumb: boolean;

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
 * One note card with type, progress, body, and actions.
 *
 * @param props - Card props
 */
function DecisionCard(props: DecisionCardProps): ReactElement {
  const { decision, showCrumb, isEditing, onEdit, onDelete } = props;
  const attention = isAttentionDecision(decision.kind, decision.status);
  const settled = isSettledDecision(decision.status);
  const sha = decision.context.revision?.headSha;
  const absolute = formatAbsoluteTime(decision.updatedAt);
  const relative = formatRelativeTime(decision.updatedAt);

  const classNames = [
    "dl-list__item",
    isEditing ? "dl-list__item--editing" : "",
    attention ? "dl-list__item--attention" : "",
    settled ? "dl-list__item--settled" : "",
    decision.kind === "block" ? "dl-list__item--block" : "",
    decision.status === "open_question" ? "dl-list__item--waiting" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={classNames}>
      {showCrumb ? (
        <p className="dl-list__crumb">
          {formatChangeLabel(decision.context.change)}
          <span className="dl-list__crumb-sep"> → </span>
          {formatCommitScopeLabel(
            sha ? normalizeShaForDisplay(sha) : undefined,
          )}
        </p>
      ) : null}
      <header className="dl-list__header">
        <span className="dl-list__kind">
          {getDecisionKindLabel(decision.kind)}
        </span>
        <span
          className={
            settled
              ? "dl-list__status dl-list__status--settled"
              : "dl-list__status dl-list__status--active"
          }
        >
          {getDecisionStatusLabel(decision.status)}
        </span>
      </header>
      <p className="dl-list__body">{decision.body}</p>
      <footer className="dl-list__footer">
        <span className="dl-list__when" title={absolute}>
          {relative}
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
}
