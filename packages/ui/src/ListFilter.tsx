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
   * When false, "This commit only" is disabled.
   */
  commitAvailable: boolean;

  /**
   * When false, "This pull request" is disabled.
   */
  changeAvailable: boolean;
}

/**
 * Scope control for the saved notes list, in plain language.
 *
 * @param props - Component props
 */
export function ListFilter(props: ListFilterProps): ReactElement {
  const { scope, onChange, commitAvailable, changeAvailable } = props;

  return (
    <div className="dl-filter" role="group" aria-label="Which notes to show">
      <p className="dl-filter__heading">Show notes for</p>
      <label className="dl-filter__option">
        <input
          type="radio"
          name="dl-scope"
          checked={scope === "change"}
          disabled={!changeAvailable}
          onChange={() => onChange("change")}
        />
        This pull request
      </label>
      <label className="dl-filter__option">
        <input
          type="radio"
          name="dl-scope"
          checked={scope === "commit"}
          disabled={!commitAvailable}
          onChange={() => onChange("commit")}
        />
        This commit only
      </label>
      <label className="dl-filter__option">
        <input
          type="radio"
          name="dl-scope"
          checked={scope === "all"}
          onChange={() => onChange("all")}
        />
        Everything saved
      </label>
      {!commitAvailable ? (
        <p className="dl-filter__hint">
          Pick a commit in the PR to use this.
        </p>
      ) : null}
      {scope === "all" && changeAvailable ? (
        <button
          type="button"
          className="dl-filter__link"
          onClick={() => onChange("change")}
        >
          Show only this page
        </button>
      ) : null}
    </div>
  );
}
