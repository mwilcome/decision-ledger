/**
 * @packageDocumentation
 * Browser shell helpers: messaging and side panel behavior.
 */

export type {
  ContextGetMessage,
  ContextUpdatedMessage,
  ExtensionMessage,
} from "./messaging.js";

export {
  isContextGetMessage,
  isContextUpdatedMessage,
} from "./messaging.js";

export {
  enableSidePanelOnActionClick,
  hasSidePanelApi,
  sendMessage,
} from "./runtime.js";
