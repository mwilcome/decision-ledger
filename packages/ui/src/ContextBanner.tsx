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
 * Compact banner for the open pull request / merge request.
 *
 * @param props - Component props
 */
export function ContextBanner(props: ContextBannerProps): ReactElement {
  const { context } = props;

  if (!context) {
    return (
      <section className="dl-banner dl-banner--empty" aria-live="polite">
        <p className="dl-banner__title">No change page</p>
        <p className="dl-banner__meta">Open a PR or MR to attach notes.</p>
      </section>
    );
  }

  const pageHint = pageRoleHint(context.page);
  const scope = formatCommitScopeLabel(context.revision?.headSha);

  return (
    <section className="dl-banner" aria-live="polite">
      <p className="dl-banner__title">{formatChangeLabel(context.change)}</p>
      <p className="dl-banner__meta">
        {scope}
        {pageHint ? ` · ${pageHint}` : ""}
      </p>
    </section>
  );
}

/**
 * Short label for which PR tab is open.
 *
 * @param page - Normalized page role
 */
function pageRoleHint(page: CaptureContext["page"]): string {
  switch (page) {
    case "overview":
      return "Conversation";
    case "changes":
      return "Files";
    case "commits":
      return "Commits";
    case "checks":
      return "Checks";
    default:
      return "";
  }
}
