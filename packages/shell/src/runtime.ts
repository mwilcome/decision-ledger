/**
 * Thin helpers around the extension runtime.
 * Feature code should call these instead of raw `chrome.*` where practical.
 */

/**
 * Sends a message to the extension runtime and resolves with the response.
 *
 * @param message - Payload to send
 * @returns Promise of the response body
 */
export function sendMessage<TResponse = unknown>(
  message: unknown,
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
      reject(new Error("chrome.runtime.sendMessage is not available"));
      return;
    }
    chrome.runtime.sendMessage(message, (response: TResponse) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      resolve(response);
    });
  });
}

/**
 * Returns true when the Chromium side panel API is present.
 */
export function hasSidePanelApi(): boolean {
  return (
    typeof chrome !== "undefined" &&
    typeof chrome.sidePanel !== "undefined" &&
    typeof chrome.sidePanel.setPanelBehavior === "function"
  );
}

/**
 * Opens the side panel when the user clicks the action icon (Chromium).
 * No-op when the API is missing (for example some Firefox builds).
 */
export async function enableSidePanelOnActionClick(): Promise<void> {
  if (!hasSidePanelApi()) {
    return;
  }
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}
