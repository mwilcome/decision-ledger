import type { AdapterRegistry, HostAdapter } from "./types.js";

/**
 * Creates a simple adapter registry that resolves by `matchesOrigin`.
 *
 * @param adapters - Adapters in the order they should be tried
 */
export function createAdapterRegistry(
  adapters: readonly HostAdapter[],
): AdapterRegistry {
  return {
    adapters,
    resolve(origin: string): HostAdapter | null {
      for (const adapter of adapters) {
        if (adapter.matchesOrigin(origin)) {
          return adapter;
        }
      }
      return null;
    },
  };
}
