import type { DecisionKind, DecisionStatus } from "@decision-ledger/core";
import {
  DECISION_KIND_OPTIONS,
  DECISION_STATUS_OPTIONS,
  DECISION_STATUS_OPTIONS_CREATE,
  getDecisionKindHint,
  getDefaultStatusForKind,
} from "@decision-ledger/core";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";

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
 * Compact form to create or edit a review note.
 *
 * @param props - Component props
 */
export function DecisionForm(props: DecisionFormProps): ReactElement {
  const { enabled, mode, initialValues, onSubmit, onCancel } = props;

  /** Root form element for scroll-into-view on edit. */
  const formRef = useRef<HTMLFormElement>(null);

  /** Textarea for focus when entering edit mode. */
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  /** Note type. */
  const [kind, setKind] = useState<DecisionKind>(initialValues?.kind ?? "note");

  /** Progress. */
  const [status, setStatus] = useState<DecisionStatus>(
    initialValues?.status ??
      getDefaultStatusForKind(initialValues?.kind ?? "note"),
  );

  /** Whether the user manually changed progress. */
  const [statusTouched, setStatusTouched] = useState(mode === "edit");

  /** Body text. */
  const [body, setBody] = useState(initialValues?.body ?? "");

  /** True when writing/editing so Save stays primary. */
  const [engaged, setEngaged] = useState(mode === "edit");

  useEffect(() => {
    const nextKind = initialValues?.kind ?? "note";
    setKind(nextKind);
    setStatus(initialValues?.status ?? getDefaultStatusForKind(nextKind));
    setBody(initialValues?.body ?? "");
    setStatusTouched(mode === "edit");
    setEngaged(mode === "edit" || Boolean(initialValues?.body));
  }, [mode, initialValues?.kind, initialValues?.status, initialValues?.body]);

  useEffect(() => {
    if (mode !== "edit") {
      return;
    }
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      bodyRef.current?.focus();
    }, 50);
  }, [mode, initialValues?.body]);

  /**
   * Updates note type and always applies that type's default progress.
   * Manual Progress changes still work afterward until Type is changed again.
   *
   * @param next - New kind
   */
  function handleKindChange(next: DecisionKind): void {
    setKind(next);
    setEngaged(true);
    setStatus(getDefaultStatusForKind(next));
    // Type drove Progress; allow a later Progress tweak without locking forever.
    setStatusTouched(false);
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
      setEngaged(false);
    }
  }

  const statusOptions =
    mode === "create" ? DECISION_STATUS_OPTIONS_CREATE : DECISION_STATUS_OPTIONS;

  const submitClass =
    mode === "edit" || engaged
      ? "dl-form__submit"
      : "dl-form__submit dl-form__submit--quiet";

  return (
    <form
      id="dl-note-form"
      ref={formRef}
      className="dl-form"
      onSubmit={handleSubmit}
      onFocusCapture={() => setEngaged(true)}
    >
      {mode === "edit" ? (
        <p className="dl-form__mode" aria-live="polite">
          Editing
        </p>
      ) : null}

      <div className="dl-form__row">
        <label className="dl-form__label dl-form__label--half">
          Type
          <select
            className="dl-form__select"
            value={kind}
            disabled={!enabled}
            title={getDecisionKindHint(kind)}
            onChange={(e) => handleKindChange(e.target.value as DecisionKind)}
          >
            {DECISION_KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="dl-form__label dl-form__label--half">
          Progress
          <select
            className="dl-form__select"
            value={status}
            disabled={!enabled}
            title="In progress, waiting for clarification, or settled"
            onChange={(e) => {
              setStatusTouched(true);
              setEngaged(true);
              setStatus(e.target.value as DecisionStatus);
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="dl-form__label">
        Note
        <textarea
          ref={bodyRef}
          className="dl-form__textarea"
          value={body}
          disabled={!enabled}
          rows={3}
          placeholder="Your note…"
          onChange={(e) => {
            setEngaged(true);
            setBody(e.target.value);
          }}
        />
      </label>

      <div className="dl-form__actions">
        <button className={submitClass} type="submit" disabled={!enabled}>
          {mode === "edit" ? "Update" : "Save"}
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
