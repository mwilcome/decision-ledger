import type { Decision } from "@decision-ledger/core";
import type { ReactElement } from "react";

/**
 * Props for {@link DecisionList}.
 */
export interface DecisionListProps {
  /**
   * Decisions to render, newest or caller-sorted order.
   */
  decisions: readonly Decision[];
}

/**
 * Renders a simple list of decision cards.
 *
 * @param props - Component props
 */
export function DecisionList(props: DecisionListProps): ReactElement {
  const { decisions } = props;

  if (decisions.length === 0) {
    return (
      <p className="dl-list-empty" aria-live="polite">
        No decisions saved yet.
      </p>
    );
  }

  return (
    <ul className="dl-list">
      {decisions.map((decision) => (
        <li key={decision.id} className="dl-list__item">
          <header className="dl-list__header">
            <span className="dl-list__kind">{decision.kind}</span>
            <span className="dl-list__status">{decision.status}</span>
          </header>
          <p className="dl-list__body">{decision.body}</p>
          <footer className="dl-list__footer">{decision.updatedAt}</footer>
        </li>
      ))}
    </ul>
  );
}
