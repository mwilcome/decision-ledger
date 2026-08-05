import type { CaptureContext, Decision } from "@decision-ledger/core";
import {
  buildChangeKey,
  formatAbsoluteTime,
  formatChangeLabel,
  formatCommitScopeLabel,
  formatOpenWorkSummary,
  formatRelativeTime,
  getDecisionKindLabel,
  getDecisionStatusLabel,
  groupDecisionsByChange,
  isAttentionDecision,
  isSettledDecision,
  normalizeShaForDisplay,
  sectionHasAttention,
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

  /**
   * Marks all unfinished notes in a PR group as settled.
   *
   * @param decisionsInGroup - Notes belonging to that PR
   */
  onSettleAllInGroup?: (decisionsInGroup: readonly Decision[]) => void;

  /**
   * Deletes settled notes older than 30 days (across the visible list).
   */
  onDeleteOldSettled?: () => void;
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
    onSettleAllInGroup,
    onDeleteOldSettled,
  } = props;

  /**
   * Which PR groups are expanded.
   */
  const [expandedByKey, setExpandedByKey] = useState<Record<string, boolean>>(
    {},
  );

  /**
   * Which sections (whole / commit) are expanded within groups.
   */
  const [sectionExpanded, setSectionExpanded] = useState<
    Record<string, boolean>
  >({});

  const groups = sortChangeGroupsCurrentFirst(
    groupDecisionsByChange(decisions),
    currentContext,
  );

  const currentKey = currentContext
    ? buildChangeKey(currentContext.change)
    : null;

  const showCardCrumb = listScope === "all";

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
   * Whether a PR group is expanded.
   *
   * @param groupKey - Group key
   * @param isCurrent - Open page match
   */
  function isGroupExpanded(groupKey: string, isCurrent: boolean): boolean {
    const stored = expandedByKey[groupKey];
    if (stored !== undefined) {
      return stored;
    }
    if (groups.length <= 1) {
      return true;
    }
    return isCurrent;
  }

  /**
   * Whether a section inside a group is expanded.
   * Defaults: expand if it has attention items; otherwise expand if only one section.
   *
   * @param sectionKey - Full key groupKey::sectionKey
   * @param decisionsInSection - Notes in the section
   * @param sectionCount - Number of sections in the parent group
   */
  function isSectionOpen(
    sectionKey: string,
    decisionsInSection: readonly Decision[],
    sectionCount: number,
  ): boolean {
    const stored = sectionExpanded[sectionKey];
    if (stored !== undefined) {
      return stored;
    }
    if (sectionCount <= 1) {
      return true;
    }
    return sectionHasAttention(decisionsInSection);
  }

  return (
    <div className="dl-groups">
      {groups.map((group) => {
        const isCurrent = currentKey !== null && group.key === currentKey;
        const expanded = isGroupExpanded(group.key, isCurrent);
        const allInGroup = group.sections.flatMap((s) => s.decisions);
        const openSummary = formatOpenWorkSummary(allInGroup);
        const unfinished = allInGroup.filter(
          (d) => !isSettledDecision(d.status),
        );
        const total = allInGroup.length;

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
                onClick={() =>
                  setExpandedByKey((prev) => ({
                    ...prev,
                    [group.key]: !isGroupExpanded(group.key, isCurrent),
                  }))
                }
              >
                <span className="dl-group__chevron" aria-hidden="true">
                  {expanded ? "▼" : "▶"}
                </span>
                <span className="dl-group__title-row">
                  <span className="dl-group__title">{group.title}</span>
                  {isCurrent ? (
                    <span className="dl-chip dl-chip--current">Here</span>
                  ) : null}
                  <span className="dl-group__total">{total}</span>
                </span>
              </button>
              <p
                className={
                  openSummary
                    ? "dl-group__summary"
                    : "dl-group__summary dl-group__summary--quiet"
                }
              >
                {openSummary ?? "No open work"}
              </p>
              {expanded &&
              onSettleAllInGroup &&
              unfinished.length > 0 &&
              isCurrent ? (
                <div className="dl-group__actions">
                  <button
                    type="button"
                    className="dl-list__btn"
                    onClick={() => onSettleAllInGroup(unfinished)}
                  >
                    Settle all open
                  </button>
                </div>
              ) : null}
            </header>

            {expanded
              ? group.sections
                  .filter((section) => section.decisions.length > 0)
                  .map((section) => {
                    const fullSectionKey = `${group.key}::${section.key}`;
                    const sectionOpen = isSectionOpen(
                      fullSectionKey,
                      section.decisions,
                      group.sections.length,
                    );

                    return (
                      <div key={section.key} className="dl-section">
                        <button
                          type="button"
                          className="dl-section__toggle"
                          aria-expanded={sectionOpen}
                          onClick={() =>
                            setSectionExpanded((prev) => ({
                              ...prev,
                              [fullSectionKey]: !sectionOpen,
                            }))
                          }
                        >
                          <span className="dl-group__chevron" aria-hidden="true">
                            {sectionOpen ? "▼" : "▶"}
                          </span>
                          <span className="dl-section__title">
                            {section.title}
                            <span className="dl-section__count">
                              {" "}
                              ({section.decisions.length})
                            </span>
                          </span>
                        </button>
                        {sectionOpen ? (
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
                        ) : null}
                      </div>
                    );
                  })
              : null}
          </section>
        );
      })}

      {onDeleteOldSettled ? (
        <details className="dl-more">
          <summary>More</summary>
          <button
            type="button"
            className="dl-list__btn"
            onClick={onDeleteOldSettled}
          >
            Delete settled notes older than 30 days
          </button>
        </details>
      ) : null}
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
   * When true, show PR → scope crumb.
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
 * One note card: body first, type as caption, progress via bar + quiet label.
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
      <p className="dl-list__body">{decision.body}</p>
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
            Del
          </button>
        </span>
      </footer>
    </li>
  );
}
