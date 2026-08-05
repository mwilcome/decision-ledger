/**
 * @packageDocumentation
 * Browser shell helpers: messaging and side panel behavior.
 */

export type {
  ContextGetMessage,
  ContextRefreshMessage,
  ContextUpdatedMessage,
  ExtensionMessage,
} from "./messaging.js";

export {
  isContextGetMessage,
  isContextRefreshMessage,
  isContextUpdatedMessage,
} from "./messaging.js";

export {
  enableSidePanelOnActionClick,
  hasSidePanelApi,
  sendMessage,
} from "./runtime.js";
