import type { ChangeRef } from "@decision-ledger/core";
import {
  buildChangeUrlForHost,
  buildCommitUrlForHost,
} from "./forge-urls.js";
import type { AdapterRegistry, HostAdapter } from "./types.js";

/**
 * Finds the adapter that should build URLs for a stored change.
 *
 * @param registry - Registered host adapters
 * @param change - Change identity
 */
export function resolveAdapterForChange(
  registry: AdapterRegistry,
  change: ChangeRef,
): HostAdapter | null {
  if (change.repo.instanceUrl) {
    try {
      const origin = new URL(change.repo.instanceUrl).origin;
      const byOrigin = registry.resolve(origin);
      if (byOrigin) {
        return byOrigin;
      }
    } catch {
      // Fall through to host id match.
    }
  }
  return registry.adapters.find((a) => a.id === change.repo.host) ?? null;
}

/**
 * Builds a PR/MR URL using a registry adapter when present, else host defaults.
 *
 * @param registry - Optional registered adapters
 * @param change - Change identity
 */
export function resolveChangeUrl(
  registry: AdapterRegistry | null | undefined,
  change: ChangeRef,
): string | null {
  if (registry) {
    const adapter = resolveAdapterForChange(registry, change);
    if (adapter) {
      try {
        return adapter.buildChangeUrl(change);
      } catch {
        // Fall through to pure host builder.
      }
    }
  }
  return buildChangeUrlForHost(change);
}

/**
 * Builds a commit URL using a registry adapter when present, else host defaults.
 *
 * @param registry - Optional registered adapters
 * @param change - Change identity
 * @param headSha - Commit SHA
 */
export function resolveCommitUrl(
  registry: AdapterRegistry | null | undefined,
  change: ChangeRef,
  headSha: string,
): string | null {
  if (registry) {
    const adapter = resolveAdapterForChange(registry, change);
    if (adapter) {
      try {
        return adapter.buildCommitUrl(change, headSha);
      } catch {
        // Fall through.
      }
    }
  }
  return buildCommitUrlForHost(change, headSha);
}
