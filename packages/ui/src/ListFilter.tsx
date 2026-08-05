import type { ReactElement } from "react";

/**
 * Which saved decisions the list should show.
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
   * When false, the "This commit" option is disabled (no SHA on the page).
   */
  commitAvailable: boolean;

  /**
   * When false, "This change" is disabled (no PR/MR context).
   */
  changeAvailable: boolean;
}

/**
 * Scope control for the saved decisions list.
 *
 * @param props - Component props
 */
export function ListFilter(props: ListFilterProps): ReactElement {
  const { scope, onChange, commitAvailable, changeAvailable } = props;

  return (
    <div className="dl-filter" role="group" aria-label="Saved list scope">
      <label className="dl-filter__option">
        <input
          type="radio"
          name="dl-scope"
          checked={scope === "change"}
          disabled={!changeAvailable}
          onChange={() => onChange("change")}
        />
        This change
      </label>
      <label className="dl-filter__option">
        <input
          type="radio"
          name="dl-scope"
          checked={scope === "commit"}
          disabled={!commitAvailable}
          onChange={() => onChange("commit")}
        />
        This commit
      </label>
      <label className="dl-filter__option">
        <input
          type="radio"
          name="dl-scope"
          checked={scope === "all"}
          onChange={() => onChange("all")}
        />
        All saved
      </label>
    </div>
  );
}
