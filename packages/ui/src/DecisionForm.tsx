import type { DecisionKind, DecisionStatus } from "@decision-ledger/core";
import {
  DECISION_KIND_OPTIONS,
  DECISION_STATUS_OPTIONS,
  DECISION_STATUS_OPTIONS_CREATE,
  getDecisionKindHint,
  getDefaultStatusForKind,
} from "@decision-ledger/core";
import { useEffect, useState, type FormEvent, type ReactElement } from "react";

/**
 * Values submitted when the user creates or updates a note.
 */
export interface DecisionFormValues {
  /**
   * Note type (stored as kind).
   */
  kind: DecisionKind;

  /**
   * Progress (stored as status).
   */
  status: DecisionStatus;

  /**
   * Free-text body.
   */
  body: string;
}

/**
 * Props for {@link DecisionForm}.
 */
export interface DecisionFormProps {
  /**
   * When false, the form is disabled.
   */
  enabled: boolean;

  /**
   * `"create"` or `"edit"`.
   */
  mode: "create" | "edit";

  /**
   * Starting field values when editing.
   */
  initialValues?: Partial<DecisionFormValues>;

  /**
   * Called with validated form values on submit.
   *
   * @param values - Type, progress, and body
   */
  onSubmit: (values: DecisionFormValues) => void;

  /**
   * Called when the user cancels edit mode.
   */
  onCancel?: () => void;
}

/**
 * Form to create or edit a review note with plain-language fields.
 *
 * @param props - Component props
 */
export function DecisionForm(props: DecisionFormProps): ReactElement {
  const { enabled, mode, initialValues, onSubmit, onCancel } = props;

  /** Note type. */
  const [kind, setKind] = useState<DecisionKind>(initialValues?.kind ?? "note");

  /** Progress. */
  const [status, setStatus] = useState<DecisionStatus>(
    initialValues?.status ?? getDefaultStatusForKind(initialValues?.kind ?? "note"),
  );

  /** Whether the user manually changed progress (stops auto-default from type). */
  const [statusTouched, setStatusTouched] = useState(mode === "edit");

  /** Body text. */
  const [body, setBody] = useState(initialValues?.body ?? "");

  /**
   * Resets fields when switching create/edit target.
   */
  useEffect(() => {
    const nextKind = initialValues?.kind ?? "note";
    setKind(nextKind);
    setStatus(
      initialValues?.status ?? getDefaultStatusForKind(nextKind),
    );
    setBody(initialValues?.body ?? "");
    setStatusTouched(mode === "edit");
  }, [mode, initialValues?.kind, initialValues?.status, initialValues?.body]);

  /**
   * Updates note type and optionally progress default in create mode.
   *
   * @param next - New kind
   */
  function handleKindChange(next: DecisionKind): void {
    setKind(next);
    if (!statusTouched && mode === "create") {
      setStatus(getDefaultStatusForKind(next));
    }
  }

  /**
   * Validates and submits the form.
   *
   * @param event - Form submit event
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = body.trim();
    if (!enabled || !trimmed) {
      return;
    }
    onSubmit({ kind, status, body: trimmed });
    if (mode === "create") {
      setBody("");
      setKind("note");
      setStatus(getDefaultStatusForKind("note"));
      setStatusTouched(false);
    }
  }

  const statusOptions =
    mode === "create" ? DECISION_STATUS_OPTIONS_CREATE : DECISION_STATUS_OPTIONS;

  return (
    <form className="dl-form" onSubmit={handleSubmit}>
      {mode === "edit" ? (
        <p className="dl-form__mode" aria-live="polite">
          Editing this note
        </p>
      ) : null}

      <p className="dl-form__pair-help">
        <strong>What is this?</strong> is the sort of note you are writing.{" "}
        <strong>Where is this?</strong> is whether you are still working on it,
        finished, or still waiting on an answer.
      </p>

      <label className="dl-form__label">
        What is this note?
        <select
          className="dl-form__select"
          value={kind}
          disabled={!enabled}
          onChange={(e) => handleKindChange(e.target.value as DecisionKind)}
        >
          {DECISION_KIND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="dl-form__hint">{getDecisionKindHint(kind)}</span>
      </label>

      <label className="dl-form__label">
        Where is this?
        <select
          className="dl-form__select"
          value={status}
          disabled={!enabled}
          onChange={(e) => {
            setStatusTouched(true);
            setStatus(e.target.value as DecisionStatus);
          }}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="dl-form__hint">
          In progress = still thinking. Settled = done. Still open = waiting on
          an answer.
        </span>
      </label>

      <label className="dl-form__label">
        Your note
        <textarea
          className="dl-form__textarea"
          value={body}
          disabled={!enabled}
          rows={4}
          placeholder="Write the decision or question in plain language."
          onChange={(e) => setBody(e.target.value)}
        />
      </label>

      <div className="dl-form__actions">
        <button className="dl-form__submit" type="submit" disabled={!enabled}>
          {mode === "edit" ? "Update note" : "Save note"}
        </button>
        {mode === "edit" && onCancel ? (
          <button
            className="dl-form__cancel"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
