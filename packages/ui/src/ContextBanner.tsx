import type { CaptureContext } from "@decision-ledger/core";
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
 * Shows a short summary of the open pull request or merge request.
 *
 * @param props - Component props
 */
export function ContextBanner(props: ContextBannerProps): ReactElement {
  const { context } = props;

  if (!context) {
    return (
      <section className="dl-banner dl-banner--empty" aria-live="polite">
        <p>No supported change detected on this page.</p>
      </section>
    );
  }

  const { change, page } = context;
  const label = `${change.repo.owner}/${change.repo.name}#${change.number}`;

  return (
    <section className="dl-banner" aria-live="polite">
      <p className="dl-banner__title">{label}</p>
      <p className="dl-banner__meta">
        {change.repo.host} · {page}
      </p>
    </section>
  );
}
