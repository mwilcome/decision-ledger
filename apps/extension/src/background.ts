/**
 * Extension service worker (Manifest V3).
 * Caches capture context from the active tab and answers side panel requests.
 */

import {
  enableSidePanelOnActionClick,
  isContextGetMessage,
  isContextUpdatedMessage,
} from "@decision-ledger/shell";

/**
 * Last context payload received from a content script (serialized JSON shape).
 * Reflects the active supported tab when tab-switch refresh is working.
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
 * Asks the content script on a tab to re-publish its page context.
 * Clears cached context when that tab has no Decision Ledger content script
 * (for example a non-GitHub tab).
 *
 * @param tabId - Browser tab id
 */
function requestContextFromTab(tabId: number): void {
  chrome.tabs.sendMessage(
    tabId,
    { type: "context.refresh" },
    () => {
      const err = chrome.runtime.lastError;
      if (err) {
        // No content script on this tab (or tab gone) — panel should not show a stale PR.
        latestContext = null;
      }
    },
  );
}

/**
 * Refreshes context from the currently active tab in the focused window.
 */
function refreshActiveTabContext(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (tabId === undefined) {
      latestContext = null;
      return;
    }
    requestContextFromTab(tabId);
  });
}

/**
 * Handles runtime messages from content scripts and the side panel.
 *
 * @param message - Unknown message body
 * @param sender - Message sender metadata
 * @param sendResponse - Callback to return a response
 * @returns true when the response will be sent asynchronously
 */
function onMessage(
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  if (isContextUpdatedMessage(message)) {
    // Prefer updates from the active tab so a background tab cannot clobber focus.
    const fromTabId = sender.tab?.id;
    if (fromTabId !== undefined) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeId = tabs[0]?.id;
        if (activeId === undefined || activeId === fromTabId) {
          latestContext = message.context;
        }
        sendResponse({ ok: true });
      });
      return true;
    }
    latestContext = message.context;
    sendResponse({ ok: true });
    return false;
  }

  if (isContextGetMessage(message)) {
    // Nudge the active tab to publish before answering (helps after a tab switch).
    refreshActiveTabContext();
    sendResponse({ context: latestContext });
    return false;
  }

  sendResponse({ ok: false, error: "unknown_message" });
  return false;
}

chrome.runtime.onMessage.addListener(onMessage);

// When the user switches tabs, re-read the new active page.
chrome.tabs.onActivated.addListener((activeInfo) => {
  requestContextFromTab(activeInfo.tabId);
});

// When the active tab finishes loading or its URL changes, refresh context.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.active) {
    return;
  }
  if (changeInfo.status === "complete" || changeInfo.url) {
    requestContextFromTab(tabId);
  }
});

// When focus moves to another browser window, use that window's active tab.
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return;
  }
  refreshActiveTabContext();
});

void initSidePanel();
