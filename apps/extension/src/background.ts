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
 * Returns true when the URL is a supported forge origin we inject into.
 *
 * @param url - Tab URL, if known
 */
function isSupportedForgeUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "github.com" || host === "gitlab.com";
  } catch {
    return false;
  }
}

/**
 * Asks the content script on a tab to re-publish its page context.
 * Clears cache only when the active tab is clearly not a supported forge page.
 *
 * @param tabId - Browser tab id
 */
function requestContextFromTab(tabId: number): void {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) {
      return;
    }

    if (!isSupportedForgeUrl(tab.url)) {
      latestContext = null;
      return;
    }

    chrome.tabs.sendMessage(
      tabId,
      { type: "context.refresh" },
      () => {
        // Content may still be injecting; do not clear on transient send failures.
        void chrome.runtime.lastError;
      },
    );
  });
}

/**
 * Refreshes context from the currently active tab in the focused window.
 */
function refreshActiveTabContext(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (tabId === undefined) {
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
    // Refresh active tab, then reply with best-known context (refresh is async).
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      const tabId = tab?.id;
      if (tabId === undefined) {
        sendResponse({ context: latestContext });
        return;
      }

      if (!isSupportedForgeUrl(tab?.url)) {
        latestContext = null;
        sendResponse({ context: null });
        return;
      }

      chrome.tabs.sendMessage(
        tabId,
        { type: "context.refresh" },
        () => {
          void chrome.runtime.lastError;
          // Content publishes context.updated shortly after; return current cache.
          sendResponse({ context: latestContext });
        },
      );
    });
    return true;
  }

  sendResponse({ ok: false, error: "unknown_message" });
  return false;
}

chrome.runtime.onMessage.addListener(onMessage);

chrome.tabs.onActivated.addListener((activeInfo) => {
  requestContextFromTab(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.active) {
    return;
  }
  if (changeInfo.status === "complete" || changeInfo.url) {
    requestContextFromTab(tabId);
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return;
  }
  refreshActiveTabContext();
});

void initSidePanel();
