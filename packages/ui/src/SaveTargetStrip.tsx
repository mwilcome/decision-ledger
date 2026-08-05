import type { CaptureContext } from "@decision-ledger/core";
import { formatSaveTarget } from "@decision-ledger/core";
import type { ReactElement } from "react";

/**
 * Props for {@link SaveTargetStrip}.
 */
export interface SaveTargetStripProps {
  /**
   * Current page context, or null when not on a supported change.
   */
  context: CaptureContext | null;

  /**
   * When true, the form is editing an existing note (save target is that note's context).
   */
  editing: boolean;
}

/**
 * Shows where the next Save will attach the note (PR and whole vs commit).
 *
 * @param props - Component props
 */
export function SaveTargetStrip(props: SaveTargetStripProps): ReactElement {
  const { context, editing } = props;

  if (editing) {
    return (
      <section className="dl-save-target" aria-live="polite">
        <p className="dl-save-target__label">Editing</p>
        <p className="dl-save-target__main">
          Changes apply to this existing note (same pull request link as when it
          was saved).
        </p>
      </section>
    );
  }

  if (!context) {
    return (
      <section className="dl-save-target dl-save-target--empty" aria-live="polite">
        <p className="dl-save-target__label">Saving on</p>
        <p className="dl-save-target__main">
          Open a pull request or merge request page to attach a new note.
        </p>
      </section>
    );
  }

  const target = formatSaveTarget(context);

  return (
    <section className="dl-save-target" aria-live="polite">
      <p className="dl-save-target__label">Saving on</p>
      <p className="dl-save-target__main">{target.changeLine}</p>
      <p className="dl-save-target__scope">{target.scopeLine}</p>
      <p className="dl-save-target__host">{target.hostLine}</p>
    </section>
  );
}
