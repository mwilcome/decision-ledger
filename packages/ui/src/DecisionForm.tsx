import type { DecisionKind } from "@decision-ledger/core";
import { useState, type FormEvent, type ReactElement } from "react";

/**
 * Values submitted when the user saves a new decision draft.
 */
export interface DecisionFormValues {
  /**
   * Decision category chosen by the user.
   */
  kind: DecisionKind;

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
   * When false, the form is disabled (no active change context).
   */
  enabled: boolean;

  /**
   * Called with validated form values on submit.
   *
   * @param values - Kind and body entered by the user
   */
  onSubmit: (values: DecisionFormValues) => void;
}

/**
 * Supported kind options shown in the form select.
 */
const KIND_OPTIONS: { value: DecisionKind; label: string }[] = [
  { value: "note", label: "Note" },
  { value: "risk", label: "Risk" },
  { value: "question", label: "Question" },
  { value: "follow_up", label: "Follow-up" },
  { value: "block", label: "Block" },
  { value: "approve_with_nits", label: "Approve with nits" },
];

/**
 * Simple form to capture a new decision draft.
 *
 * @param props - Component props
 */
export function DecisionForm(props: DecisionFormProps): ReactElement {
  const { enabled, onSubmit } = props;

  /** Selected decision kind. */
  const [kind, setKind] = useState<DecisionKind>("note");

  /** Body text. */
  const [body, setBody] = useState("");

  /**
   * Validates and submits the form, then clears the body.
   *
   * @param event - Form submit event
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = body.trim();
    if (!enabled || !trimmed) {
      return;
    }
    onSubmit({ kind, body: trimmed });
    setBody("");
  }

  return (
    <form className="dl-form" onSubmit={handleSubmit}>
      <label className="dl-form__label">
        Kind
        <select
          className="dl-form__select"
          value={kind}
          disabled={!enabled}
          onChange={(e) => setKind(e.target.value as DecisionKind)}
        >
          {KIND_OPTIONS.map((option) => (
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
      <button className="dl-form__submit" type="submit" disabled={!enabled}>
        Save draft
      </button>
    </form>
  );
}
