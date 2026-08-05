/**
 * Content script injected on supported Git host pages.
 * Resolves a host adapter, observes navigation, and posts context to the background.
 */

import { githubAdapter } from "@decision-ledger/adapter-github";
import { gitlabAdapter } from "@decision-ledger/adapter-gitlab";
import type { CaptureContext } from "@decision-ledger/core";
import { createAdapterRegistry } from "@decision-ledger/host-api";
import {
  isContextRefreshMessage,
  type ContextUpdatedMessage,
} from "@decision-ledger/shell";

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
 * Starts (or restarts) adapter observation for the current page origin.
 * Immediate emit covers tab-switch refresh requests.
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

/**
 * Handles messages from the background (for example after the user switches tabs).
 *
 * @param message - Runtime message
 * @param _sender - Sender metadata
 * @param sendResponse - Response callback
 * @returns false (response is synchronous)
 */
function onMessage(
  message: unknown,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  if (isContextRefreshMessage(message)) {
    start();
    sendResponse({ ok: true });
    return false;
  }
  return false;
}

chrome.runtime.onMessage.addListener(onMessage);
start();
