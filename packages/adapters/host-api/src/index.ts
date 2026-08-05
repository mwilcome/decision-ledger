/**
 * @packageDocumentation
 * Shared adapter interfaces and registry helpers.
 */

export type {
  AdapterRegistry,
  AuthHandle,
  HostAdapter,
  HostCapabilities,
} from "./types.js";

export { createAdapterRegistry } from "./registry.js";

export {
  resolveAdapterForChange,
  resolveChangeUrl,
  resolveCommitUrl,
} from "./links.js";

export {
  buildChangeUrlForHost,
  buildCommitUrlForHost,
  githubChangeUrl,
  githubCommitUrl,
  gitlabChangeUrl,
  gitlabCommitUrl,
} from "./forge-urls.js";
