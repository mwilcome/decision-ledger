/**
 * Content script injected on supported Git host pages.
 * Resolves a host adapter, observes navigation, and posts context to the background.
 */

import { githubAdapter } from "@decision-ledger/adapter-github";
import { gitlabAdapter } from "@decision-ledger/adapter-gitlab";
import type { CaptureContext } from "@decision-ledger/core";
import { createAdapterRegistry } from "@decision-ledger/host-api";
import type { ContextUpdatedMessage } from "@decision-ledger/shell";

/**
 * Registry of built-in host adapters for public GitHub and GitLab.
 */
const registry = createAdapterRegistry([githubAdapter, gitlabAdapter]);

/**
 * Cleanup for the active adapter observer, if any.
 */
let stopObserving: (() => void) | undefined;

/**
 * Posts the latest context to the background service worker.
 *
 * @param context - Capture context or null when the page is not a change page
 */
function publishContext(context: CaptureContext | null): void {
  const message: ContextUpdatedMessage = {
    type: "context.updated",
    context,
  };
  chrome.runtime.sendMessage(message, () => {
    // Ignore closed-port errors during navigation/reload.
    void chrome.runtime.lastError;
  });
}

/**
 * Starts adapter observation for the current page origin.
 */
function start(): void {
  stopObserving?.();
  stopObserving = undefined;

  const origin = window.location.origin;
  const adapter = registry.resolve(origin);
  if (!adapter) {
    publishContext(null);
    return;
  }

  stopObserving = adapter.observe(document, publishContext);
}

start();
