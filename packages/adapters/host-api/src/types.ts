import type {
  CaptureContext,
  ChangeRef,
  ForgeReviewSnapshot,
  HostId,
} from "@decision-ledger/core";

/**
 * Feature flags describing what a host adapter can surface in the UI.
 * UI code should read these flags rather than branching on host id strings.
 */
export interface HostCapabilities {
  /**
   * Host supports formal review outcomes (approve, request changes, comment).
   */
  formalReviewStates: boolean;

  /**
   * Host uses approval rules (common on GitLab).
   */
  approvalRules: boolean;

  /**
   * Host supports resolvable discussion threads.
   */
  resolvableThreads: boolean;

  /**
   * Host supports suggested code changes in review.
   */
  suggestedChanges: boolean;

  /**
   * Change page commonly shows CI or pipeline status.
   */
  ciOnChangePage: boolean;
}

/**
 * Optional auth handle passed into API-based enrichment (tokens, etc.).
 * Shape is intentionally loose until a concrete auth module exists.
 */
export type AuthHandle = unknown;

/**
 * Contract every Git host adapter must implement.
 */
export interface HostAdapter {
  /**
   * Stable id for this adapter (matches {@link HostId} values where possible).
   */
  readonly id: HostId;

  /**
   * Human-readable product name for UI (for example `"GitHub"`).
   */
  readonly displayName: string;

  /**
   * Capability flags for this host.
   */
  readonly capabilities: HostCapabilities;

  /**
   * Returns true when this adapter handles the given origin (scheme + host + port).
   *
   * @param origin - Page origin, for example `"https://github.com"`
   */
  matchesOrigin(origin: string): boolean;

  /**
   * Parses the current location into a capture context, or null if this is not a change page.
   *
   * @param url - Current page URL
   * @param doc - Optional document for light DOM reads
   */
  parseLocation(url: URL, doc?: Document): CaptureContext | null;

  /**
   * Builds the main pull request / merge request URL for a change.
   * Uses `instanceUrl` when set (self-hosted); otherwise the public host.
   *
   * @param change - Change identity
   */
  buildChangeUrl(change: ChangeRef): string;

  /**
   * Builds a URL that opens a specific commit (repo commit page preferred).
   *
   * @param change - Change that contains the commit
   * @param headSha - Commit SHA (short or full)
   */
  buildCommitUrl(change: ChangeRef, headSha: string): string;

  /**
   * Watches SPA navigation and DOM updates and reports context changes.
   * Returns a cleanup function that stops observing.
   *
   * @param doc - Document to observe
   * @param onChange - Callback with the latest context or null
   */
  observe(
    doc: Document,
    onChange: (ctx: CaptureContext | null) => void,
  ): () => void;

  /**
   * Merges the current text selection into the given context when on a diff view.
   *
   * @param doc - Document containing the selection
   * @param ctx - Base context for the open change
   */
  getSelectionContext?(doc: Document, ctx: CaptureContext): CaptureContext;

  /**
   * Optional host API enrichment for formal review or CI state.
   *
   * @param ctx - Current capture context
   * @param auth - Auth material for the host API
   */
  fetchSnapshot?(
    ctx: CaptureContext,
    auth: AuthHandle,
  ): Promise<ForgeReviewSnapshot>;
}

/**
 * Registry of adapters used by the content script to resolve a page origin.
 */
export interface AdapterRegistry {
  /**
   * All registered adapters in priority order.
   */
  readonly adapters: readonly HostAdapter[];

  /**
   * Finds the first adapter that matches the origin, or null.
   *
   * @param origin - Page origin
   */
  resolve(origin: string): HostAdapter | null;
}
