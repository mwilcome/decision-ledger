import type { CaptureContext } from "@decision-ledger/core";
import {
  formatChangeLabel,
  formatCommitScopeLabel,
} from "@decision-ledger/core";
import type { ReactElement } from "react";

/**
 * Props for {@link ContextBanner}.
 */
export interface ContextBannerProps {
  /**
   * Current page context, or null when the active tab is not a supported change.
   */
  context: CaptureContext | null;
}

/**
 * Shows which pull request (and optional commit) the open page is about.
 *
 * @param props - Component props
 */
export function ContextBanner(props: ContextBannerProps): ReactElement {
  const { context } = props;

  if (!context) {
    return (
      <section className="dl-banner dl-banner--empty" aria-live="polite">
        <p className="dl-banner__title">No pull request detected</p>
        <p className="dl-banner__meta">
          Open a GitHub or GitLab pull/merge request to link notes to it.
        </p>
      </section>
    );
  }

  const pageHint = pageRoleHint(context.page);

  return (
    <section className="dl-banner" aria-live="polite">
      <p className="dl-banner__kicker">On this page</p>
      <p className="dl-banner__title">
        {formatChangeLabel(context.change)}
      </p>
      <p className="dl-banner__meta">
        {formatCommitScopeLabel(context.revision?.headSha)}
        {pageHint ? ` · ${pageHint}` : ""}
      </p>
    </section>
  );
}

/**
 * Plain label for which tab of the PR the user is on.
 *
 * @param page - Normalized page role
 */
function pageRoleHint(page: CaptureContext["page"]): string {
  switch (page) {
    case "overview":
      return "Conversation";
    case "changes":
      return "Files / diff";
    case "commits":
      return "Commits list";
    case "checks":
      return "Checks";
    default:
      return "";
  }
}
