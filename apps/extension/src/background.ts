/**
 * Extension service worker (Manifest V3).
 * Caches the latest capture context from content scripts and answers UI requests.
 */

import {
  enableSidePanelOnActionClick,
  isContextGetMessage,
  isContextUpdatedMessage,
} from "@decision-ledger/shell";

/**
 * Last context payload received from a content script (serialized JSON shape).
 */
let latestContext: unknown | null = null;

/**
 * Registers the action click to open the side panel when the API exists.
 */
async function initSidePanel(): Promise<void> {
  try {
    await enableSidePanelOnActionClick();
  } catch (error) {
    console.warn("Decision Ledger: side panel setup failed", error);
  }
}

/**
 * Handles runtime messages from content scripts and the side panel.
 *
 * @param message - Unknown message body
 * @param _sender - Message sender metadata (unused in scaffold)
 * @param sendResponse - Callback to return an async response
 * @returns true when the response will be sent asynchronously
 */
function onMessage(
  message: unknown,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  if (isContextUpdatedMessage(message)) {
    latestContext = message.context;
    sendResponse({ ok: true });
    return false;
  }

  if (isContextGetMessage(message)) {
    sendResponse({ context: latestContext });
    return false;
  }

  sendResponse({ ok: false, error: "unknown_message" });
  return false;
}

chrome.runtime.onMessage.addListener(onMessage);
void initSidePanel();
