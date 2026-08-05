/**
 * Message types passed between content script, background, and UI.
 */

/**
 * Context update published when the active tab's capture context changes.
 */
export interface ContextUpdatedMessage {
  /**
   * Discriminator for this message kind.
   */
  type: "context.updated";

  /**
   * Serialized capture context, or null when the page is not a supported change.
   */
  context: unknown | null;
}

/**
 * Request from the UI asking the background for the latest known context.
 */
export interface ContextGetMessage {
  /**
   * Discriminator for this message kind.
   */
  type: "context.get";
}

/**
 * Background asks the active tab's content script to re-publish page context.
 * Used when the user switches browser tabs.
 */
export interface ContextRefreshMessage {
  /**
   * Discriminator for this message kind.
   */
  type: "context.refresh";
}

/**
 * Union of extension runtime messages used in the scaffold.
 */
export type ExtensionMessage =
  | ContextUpdatedMessage
  | ContextGetMessage
  | ContextRefreshMessage;

/**
 * Type guard for {@link ContextUpdatedMessage}.
 *
 * @param value - Unknown message payload
 */
export function isContextUpdatedMessage(
  value: unknown,
): value is ContextUpdatedMessage {
  return isObject(value) && value["type"] === "context.updated";
}

/**
 * Type guard for {@link ContextGetMessage}.
 *
 * @param value - Unknown message payload
 */
export function isContextGetMessage(value: unknown): value is ContextGetMessage {
  return isObject(value) && value["type"] === "context.get";
}

/**
 * Type guard for {@link ContextRefreshMessage}.
 *
 * @param value - Unknown message payload
 */
export function isContextRefreshMessage(
  value: unknown,
): value is ContextRefreshMessage {
  return isObject(value) && value["type"] === "context.refresh";
}

/**
 * Returns true when the value is a non-null object.
 *
 * @param value - Value to test
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
