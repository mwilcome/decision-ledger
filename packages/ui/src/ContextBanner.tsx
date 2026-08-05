import type { CaptureContext, ChangeRef } from "@decision-ledger/core";
import {
  formatChangeDisplayLabel,
  formatChangeLabelWithHost,
  formatCommitScopeLabel,
  normalizeShaForDisplay,
} from "@decision-ledger/core";
import type { ReactElement } from "react";
import { ExternalLink } from "./ExternalLink.js";

/**
 * Props for {@link ContextBanner}.
 */
export interface ContextBannerProps {
  /**
   * Current page context, or null when the active tab is not a supported change.
   */
  context: CaptureContext | null;

  /**
   * Optional cached title/nickname for the open change.
   */
  changeTitle?: string | null;

  /**
   * Builds a PR/MR URL for the change, or null when unknown.
   *
   * @param change - Change identity
   */
  getChangeUrl?: (change: ChangeRef) => string | null;

  /**
   * Builds a commit URL, or null when unknown.
   *
   * @param change - Change identity
   * @param headSha - Commit SHA
   */
  getCommitUrl?: (change: ChangeRef, headSha: string) => string | null;
}

/**
 * Compact banner for the open pull request / merge request.
 *
 * @param props - Component props
 */
export function ContextBanner(props: ContextBannerProps): ReactElement {
  const { context, changeTitle, getChangeUrl, getCommitUrl } = props;

  if (!context) {
    return (
      <section className="dl-banner dl-banner--empty" aria-live="polite">
        <p className="dl-banner__title">No change page</p>
        <p className="dl-banner__meta">Open a PR or MR to attach notes.</p>
      </section>
    );
  }

  const pageHint = pageRoleHint(context.page);
  const sha = context.revision?.headSha;
  const changeHref = getChangeUrl?.(context.change) ?? null;
  const commitHref =
    sha && getCommitUrl ? getCommitUrl(context.change, sha) : null;
  const scopeLabel = formatCommitScopeLabel(sha);
  const liveTitle =
    context.presentation?.title?.trim() || changeTitle?.trim() || undefined;
  const label = formatChangeDisplayLabel(context.change, {
    title: liveTitle,
  });
  const fullTitle =
    liveTitle || formatChangeLabelWithHost(context.change);

  return (
    <section className="dl-banner" aria-live="polite">
      <p className="dl-banner__title">
        <ExternalLink href={changeHref} title={fullTitle}>
          {label}
        </ExternalLink>
      </p>
      <p className="dl-banner__meta">
        {sha ? (
          <ExternalLink href={commitHref} title={sha}>
            {scopeLabel}
          </ExternalLink>
        ) : (
          scopeLabel
        )}
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
