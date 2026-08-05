/**
 * Side panel: page context, form, grouped notes with review-friendly polish.
 */

import type { CaptureContext, Decision } from "@decision-ledger/core";
import {
  buildChangeKey,
  createDecision,
  decisionMatchesChange,
  decisionMatchesCommit,
  isSettledDecision,
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

/** Settled notes older than this are eligible for bulk delete. */
const SETTLED_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Root React component for the extension side panel.
 */
export function App(): ReactElement {
  /**
   * Persistent store for this side panel document.
   */
  const store = useMemo(() => new IndexedDbDecisionStore(), []);

  /** Current page context from the background worker. */
  const [context, setContext] = useState<CaptureContext | null>(null);

  /** All notes loaded from IndexedDB. */
  const [decisions, setDecisions] = useState<Decision[]>([]);

  /** List filter scope. */
  const [scope, setScope] = useState<DecisionListScope>("change");

  /** Note currently being edited, or null when creating. */
  const [editing, setEditing] = useState<Decision | null>(null);

  /** Error message from storage operations, if any. */
  const [error, setError] = useState<string | null>(null);

  /**
   * Fingerprint of the open page (PR + optional commit).
   */
  const pageFingerprint = useMemo(() => {
    if (!context) {
      return "";
    }
    const changePart = buildChangeKey(context.change);
    const shaPart = context.revision?.headSha?.toLowerCase() ?? "";
    return `${changePart}|${shaPart}`;
  }, [context]);

  /**
   * Reloads notes from IndexedDB.
   */
  const refreshDecisions = useCallback(async (): Promise<void> => {
    try {
      const all = await store.list();
      all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setDecisions(all);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    }
  }, [store]);

  /**
   * Asks the background script for the latest page context.
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
   * Auto-selects filter: commit page → this commit; PR page → this PR; else all.
   */
  useEffect(() => {
    if (!pageFingerprint || !context) {
      setScope("all");
      return;
    }
    if (context.revision?.headSha) {
      setScope("commit");
      return;
    }
    setScope("change");
  }, [pageFingerprint, context]);

  /**
   * Notes visible under the current filter.
   */
  const visibleDecisions = useMemo(() => {
    if (scope === "all" || !context) {
      return decisions;
    }
    if (scope === "commit" && context.revision?.headSha) {
      return decisions.filter((d) =>
        decisionMatchesCommit(d, context.change, context.revision!.headSha),
      );
    }
    return decisions.filter((d) => decisionMatchesChange(d, context.change));
  }, [context, decisions, scope]);

  /**
   * Creates a new note or updates the one being edited.
   *
   * @param values - Form values
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
      setError(err instanceof Error ? err.message : "Failed to save note");
    }
  }

  /**
   * Opens a note in the edit form (form scrolls into view via DecisionForm).
   *
   * @param decision - Note to edit
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
   * Confirms and deletes a note from IndexedDB.
   *
   * @param decision - Note to remove
   */
  async function handleDelete(decision: Decision): Promise<void> {
    const preview =
      decision.body.length > 80
        ? `${decision.body.slice(0, 80)}…`
        : decision.body;
    const ok = window.confirm(
      `Delete this note?\n\n${preview}\n\nThis cannot be undone.`,
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
      setError(err instanceof Error ? err.message : "Failed to delete note");
    }
  }

  /**
   * Marks unfinished notes in a PR group as settled.
   *
   * @param unfinished - Notes that are not settled yet
   */
  async function handleSettleAllInGroup(
    unfinished: readonly Decision[],
  ): Promise<void> {
    if (unfinished.length === 0) {
      return;
    }
    const ok = window.confirm(
      `Mark ${unfinished.length} open note(s) as settled?`,
    );
    if (!ok) {
      return;
    }
    try {
      for (const decision of unfinished) {
        const updated = updateDecision(decision, { status: "decided" });
        await store.save(updated);
      }
      if (editing && unfinished.some((d) => d.id === editing.id)) {
        setEditing(null);
      }
      await refreshDecisions();
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to settle notes",
      );
    }
  }

  /**
   * Deletes settled notes older than 30 days from the full store.
   */
  async function handleDeleteOldSettled(): Promise<void> {
    const cutoff = Date.now() - SETTLED_MAX_AGE_MS;
    const oldSettled = decisions.filter((d) => {
      if (!isSettledDecision(d.status)) {
        return false;
      }
      const t = Date.parse(d.updatedAt);
      return !Number.isNaN(t) && t < cutoff;
    });
    if (oldSettled.length === 0) {
      window.alert("No settled notes older than 30 days.");
      return;
    }
    const ok = window.confirm(
      `Delete ${oldSettled.length} settled note(s) older than 30 days? This cannot be undone.`,
    );
    if (!ok) {
      return;
    }
    try {
      for (const decision of oldSettled) {
        await store.remove(decision.id);
      }
      if (editing && oldSettled.some((d) => d.id === editing.id)) {
        setEditing(null);
      }
      await refreshDecisions();
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete old notes",
      );
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

      <section className="dl-app__list" aria-label="Saved notes">
        <ListFilter
          scope={scope}
          onChange={setScope}
          changeAvailable={context !== null}
          commitAvailable={Boolean(context?.revision?.headSha)}
        />
        <DecisionList
          decisions={visibleDecisions}
          currentContext={context}
          listScope={scope}
          editingId={editing?.id}
          onEdit={handleEdit}
          onDelete={(d) => void handleDelete(d)}
          onSettleAllInGroup={(list) => void handleSettleAllInGroup(list)}
          onDeleteOldSettled={() => void handleDeleteOldSettled()}
        />
      </section>
    </div>
  );
}
