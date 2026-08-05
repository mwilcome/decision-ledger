import type { DecisionKind, DecisionStatus } from "@decision-ledger/core";
import {
  DECISION_KIND_OPTIONS,
  DECISION_STATUS_OPTIONS,
} from "@decision-ledger/core";
import { useEffect, useState, type FormEvent, type ReactElement } from "react";

/**
 * Values submitted when the user creates or updates a decision.
 */
export interface DecisionFormValues {
  /**
   * Decision category chosen by the user.
   */
  kind: DecisionKind;

  /**
   * Lifecycle status chosen by the user.
   */
  status: DecisionStatus;

  /**
   * Free-text body of the decision.
   */
  body: string;
}

/**
 * Props for {@link DecisionForm}.
 */
export interface DecisionFormProps {
  /**
   * When false, the form is disabled (no active change context for create).
   */
  enabled: boolean;

  /**
   * `"create"` starts empty (with defaults). `"edit"` loads {@link initialValues}.
   */
  mode: "create" | "edit";

  /**
   * Starting field values when editing, or optional defaults when creating.
   */
  initialValues?: Partial<DecisionFormValues>;

  /**
   * Called with validated form values on submit.
   *
   * @param values - Kind, status, and body entered by the user
   */
  onSubmit: (values: DecisionFormValues) => void;

  /**
   * Called when the user cancels edit mode. Hidden in create mode when omitted.
   */
  onCancel?: () => void;
}

/**
 * Form to create a new decision or edit an existing one.
 *
 * @param props - Component props
 */
export function DecisionForm(props: DecisionFormProps): ReactElement {
  const { enabled, mode, initialValues, onSubmit, onCancel } = props;

  /** Selected decision kind. */
  const [kind, setKind] = useState<DecisionKind>(
    initialValues?.kind ?? "note",
  );

  /** Selected lifecycle status. */
  const [status, setStatus] = useState<DecisionStatus>(
    initialValues?.status ?? "draft",
  );

  /** Body text. */
  const [body, setBody] = useState(initialValues?.body ?? "");

  /**
   * Resets fields when switching into edit mode or when initial values change.
   */
  useEffect(() => {
    setKind(initialValues?.kind ?? "note");
    setStatus(initialValues?.status ?? "draft");
    setBody(initialValues?.body ?? "");
  }, [mode, initialValues?.kind, initialValues?.status, initialValues?.body]);

  /**
   * Validates and submits the form. Clears the body after a successful create.
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
      setStatus("draft");
    }
  }

  return (
    <form className="dl-form" onSubmit={handleSubmit}>
      {mode === "edit" ? (
        <p className="dl-form__mode" aria-live="polite">
          Editing decision
        </p>
      ) : null}
      <label className="dl-form__label">
        Kind
        <select
          className="dl-form__select"
          value={kind}
          disabled={!enabled}
          onChange={(e) => setKind(e.target.value as DecisionKind)}
        >
          {DECISION_KIND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="dl-form__label">
        Status
        <select
          className="dl-form__select"
          value={status}
          disabled={!enabled}
          onChange={(e) => setStatus(e.target.value as DecisionStatus)}
        >
          {DECISION_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="dl-form__label">
        Decision
        <textarea
          className="dl-form__textarea"
          value={body}
          disabled={!enabled}
          rows={4}
          placeholder="What did you decide, and why?"
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      <div className="dl-form__actions">
        <button className="dl-form__submit" type="submit" disabled={!enabled}>
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
