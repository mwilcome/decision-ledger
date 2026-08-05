/**
 * Side panel application: context banner, full CRUD form, filtered list.
 */

import type { CaptureContext, Decision } from "@decision-ledger/core";
import {
  createDecision,
  decisionMatchesChange,
  decisionMatchesCommit,
  updateDecision,
} from "@decision-ledger/core";
import { sendMessage } from "@decision-ledger/shell";
import { IndexedDbDecisionStore } from "@decision-ledger/storage";
import {
  ContextBanner,
  DecisionForm,
  DecisionList,
  ListFilter,
  type DecisionFormValues,
  type DecisionListScope,
} from "@decision-ledger/ui";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";

/**
 * Response shape for the `context.get` background message.
 */
interface ContextGetResponse {
  /**
   * Latest known capture context from the content script, if any.
   */
  context?: CaptureContext | null;
}

/**
 * Root React component for the extension side panel.
 */
export function App(): ReactElement {
  /**
   * Persistent store shared for the lifetime of this side panel document.
   */
  const store = useMemo(() => new IndexedDbDecisionStore(), []);

  /** Current page context from the background worker. */
  const [context, setContext] = useState<CaptureContext | null>(null);

  /** All decisions loaded from IndexedDB. */
  const [decisions, setDecisions] = useState<Decision[]>([]);

  /** List filter: this change, this commit, or everything. */
  const [scope, setScope] = useState<DecisionListScope>("change");

  /** Decision currently being edited, or null when creating. */
  const [editing, setEditing] = useState<Decision | null>(null);

  /** Error message from storage operations, if any. */
  const [error, setError] = useState<string | null>(null);

  /**
   * Reloads decisions from IndexedDB into component state.
   */
  const refreshDecisions = useCallback(async (): Promise<void> => {
    try {
      const all = await store.list();
      all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setDecisions(all);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load decisions");
    }
  }, [store]);

  /**
   * Asks the background script for the latest capture context.
   */
  const refreshContext = useCallback(async (): Promise<void> => {
    try {
      const response = await sendMessage<ContextGetResponse>({
        type: "context.get",
      });
      setContext(response.context ?? null);
    } catch {
      setContext(null);
    }
  }, []);

  useEffect(() => {
    void refreshDecisions();
    void refreshContext();
    const timer = window.setInterval(() => {
      void refreshContext();
    }, 1500);
    return () => window.clearInterval(timer);
  }, [refreshContext, refreshDecisions]);

  /**
   * Keeps the list scope valid when page context changes (for example commit SHA appears).
   */
  useEffect(() => {
    if (!context && scope !== "all") {
      setScope("all");
      return;
    }
    if (scope === "commit" && !context?.revision?.headSha) {
      setScope("change");
    }
  }, [context, scope]);

  /**
   * Decisions visible under the current filter.
   */
  const visibleDecisions = useMemo(() => {
    if (scope === "all" || !context) {
      return decisions;
    }
    if (scope === "commit" && context.revision?.headSha) {
      return decisions.filter((d) =>
        decisionMatchesCommit(
          d,
          context.change,
          context.revision!.headSha,
        ),
      );
    }
    return decisions.filter((d) =>
      decisionMatchesChange(d, context.change),
    );
  }, [context, decisions, scope]);

  /**
   * Creates a new decision or updates the one being edited.
   *
   * @param values - Form values from {@link DecisionForm}
   */
  async function handleSubmit(values: DecisionFormValues): Promise<void> {
    try {
      if (editing) {
        const updated = updateDecision(editing, {
          kind: values.kind,
          status: values.status,
          body: values.body,
        });
        await store.save(updated);
        setEditing(null);
      } else {
        if (!context) {
          return;
        }
        const created = createDecision({
          context,
          kind: values.kind,
          body: values.body,
          status: values.status,
        });
        await store.save(created);
      }
      await refreshDecisions();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save decision");
    }
  }

  /**
   * Opens a decision in the edit form.
   *
   * @param decision - Decision to edit
   */
  function handleEdit(decision: Decision): void {
    setEditing(decision);
  }

  /**
   * Leaves edit mode without saving.
   */
  function handleCancelEdit(): void {
    setEditing(null);
  }

  /**
   * Confirms and deletes a decision from IndexedDB.
   *
   * @param decision - Decision to remove
   */
  async function handleDelete(decision: Decision): Promise<void> {
    const preview =
      decision.body.length > 80
        ? `${decision.body.slice(0, 80)}…`
        : decision.body;
    const ok = window.confirm(
      `Delete this decision?\n\n${preview}\n\nThis cannot be undone.`,
    );
    if (!ok) {
      return;
    }
    try {
      await store.remove(decision.id);
      if (editing?.id === decision.id) {
        setEditing(null);
      }
      await refreshDecisions();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete decision");
    }
  }

  const formEnabled = editing !== null || context !== null;

  return (
    <div className="dl-app">
      <header className="dl-app__header">
        <h1 className="dl-app__title">Decision Ledger</h1>
      </header>
      <ContextBanner context={context} />
      {error ? (
        <p className="dl-app__error" role="alert">
          {error}
        </p>
      ) : null}
      <DecisionForm
        key={editing?.id ?? "create"}
        mode={editing ? "edit" : "create"}
        enabled={formEnabled}
        initialValues={
          editing
            ? {
                kind: editing.kind,
                status: editing.status,
                body: editing.body,
              }
            : undefined
        }
        onSubmit={(v) => void handleSubmit(v)}
        onCancel={editing ? handleCancelEdit : undefined}
      />
      <section className="dl-app__list" aria-label="Saved decisions">
        <h2 className="dl-app__subtitle">Saved</h2>
        <ListFilter
          scope={scope}
          onChange={setScope}
          changeAvailable={context !== null}
          commitAvailable={Boolean(context?.revision?.headSha)}
        />
        <DecisionList
          decisions={visibleDecisions}
          editingId={editing?.id}
          onEdit={handleEdit}
          onDelete={(d) => void handleDelete(d)}
        />
      </section>
    </div>
  );
}
