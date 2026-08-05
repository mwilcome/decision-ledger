/**
 * Side panel application: shows page context, decision form, and local list.
 */

import type { CaptureContext, Decision } from "@decision-ledger/core";
import { createDecision } from "@decision-ledger/core";
import { sendMessage } from "@decision-ledger/shell";
import { MemoryDecisionStore } from "@decision-ledger/storage";
import {
  ContextBanner,
  DecisionForm,
  DecisionList,
  type DecisionFormValues,
} from "@decision-ledger/ui";
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";

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
   * In-memory store for this side panel session (scaffold; replace with IndexedDB later).
   */
  const store = useMemo(() => new MemoryDecisionStore(), []);

  /** Current page context from the background worker. */
  const [context, setContext] = useState<CaptureContext | null>(null);

  /** Decisions loaded from the store. */
  const [decisions, setDecisions] = useState<Decision[]>([]);

  /**
   * Reloads decisions from the store into component state.
   */
  const refreshDecisions = useCallback(async (): Promise<void> => {
    const all = await store.list();
    // Newest first for readability in the side panel.
    all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setDecisions(all);
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
   * Creates a draft decision for the current context and persists it.
   *
   * @param values - Form values from {@link DecisionForm}
   */
  async function handleSubmit(values: DecisionFormValues): Promise<void> {
    if (!context) {
      return;
    }
    const decision = createDecision({
      context,
      kind: values.kind,
      body: values.body,
      status: "draft",
    });
    await store.save(decision);
    await refreshDecisions();
  }

  return (
    <div className="dl-app">
      <header className="dl-app__header">
        <h1 className="dl-app__title">Decision Ledger</h1>
      </header>
      <ContextBanner context={context} />
      <DecisionForm enabled={context !== null} onSubmit={(v) => void handleSubmit(v)} />
      <section className="dl-app__list" aria-label="Saved decisions">
        <h2 className="dl-app__subtitle">Saved</h2>
        <DecisionList decisions={decisions} />
      </section>
    </div>
  );
}
