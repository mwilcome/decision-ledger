import type { ReactElement } from "react";

/**
 * Which saved notes the list should show.
 */
export type DecisionListScope = "change" | "commit" | "all";

/**
 * Props for {@link ListFilter}.
 */
export interface ListFilterProps {
  /**
   * Current list scope.
   */
  scope: DecisionListScope;

  /**
   * Called when the user picks a different scope.
   *
   * @param scope - New scope
   */
  onChange: (scope: DecisionListScope) => void;

  /**
   * When false, "This commit" is disabled.
   */
  commitAvailable: boolean;

  /**
   * When false, "This PR" is disabled.
   */
  changeAvailable: boolean;
}

/**
 * Compact scope control for the saved notes list.
 *
 * @param props - Component props
 */
export function ListFilter(props: ListFilterProps): ReactElement {
  const { scope, onChange, commitAvailable, changeAvailable } = props;

  return (
    <div className="dl-filter" role="group" aria-label="Show notes for">
      <div className="dl-filter__row">
        <label className="dl-filter__option">
          <input
            type="radio"
            name="dl-scope"
            checked={scope === "change"}
            disabled={!changeAvailable}
            onChange={() => onChange("change")}
          />
          This PR
        </label>
        <label className="dl-filter__option">
          <input
            type="radio"
            name="dl-scope"
            checked={scope === "commit"}
            disabled={!commitAvailable}
            onChange={() => onChange("commit")}
          />
          Commit
        </label>
        <label className="dl-filter__option">
          <input
            type="radio"
            name="dl-scope"
            checked={scope === "all"}
            onChange={() => onChange("all")}
          />
          All
        </label>
      </div>
      {!commitAvailable ? (
        <p className="dl-filter__hint">Pick a commit to filter by commit.</p>
      ) : null}
      {scope === "all" && changeAvailable ? (
        <button
          type="button"
          className="dl-filter__link"
          onClick={() => onChange("change")}
        >
          This page only
        </button>
      ) : null}
    </div>
  );
}
