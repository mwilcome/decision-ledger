import type { CaptureContext } from "@decision-ledger/core";
import type { HostAdapter, HostCapabilities } from "@decision-ledger/host-api";
import { parseGitLabMergeRequestUrl } from "./parse.js";

/**
 * Capability flags for GitLab merge requests.
 */
const GITLAB_CAPABILITIES: HostCapabilities = {
  formalReviewStates: false,
  approvalRules: true,
  resolvableThreads: true,
  suggestedChanges: true,
  ciOnChangePage: true,
};

/**
 * Host adapter for GitLab.com and self-hosted GitLab origins.
 */
export class GitLabAdapter implements HostAdapter {
  /**
   * Adapter id used in context keys and settings.
   */
  readonly id = "gitlab" as const;

  /**
   * Display name for the side panel.
   */
  readonly displayName = "GitLab";

  /**
   * Features this host can surface.
   */
  readonly capabilities = GITLAB_CAPABILITIES;

  /**
   * Extra origins the user has allowed (self-hosted GitLab).
   */
  private readonly allowedOrigins: ReadonlySet<string>;

  /**
   * @param allowedOrigins - Optional self-hosted origins
   */
  constructor(allowedOrigins: readonly string[] = []) {
    this.allowedOrigins = new Set(allowedOrigins);
  }

  /**
   * Accepts gitlab.com and any origin passed into the constructor.
   *
   * @param origin - Page origin
   */
  matchesOrigin(origin: string): boolean {
    if (origin === "https://gitlab.com" || origin === "http://gitlab.com") {
      return true;
    }
    return this.allowedOrigins.has(origin);
  }

  /**
   * Parses the location when it is a merge request page.
   *
   * @param url - Current URL
   * @param _doc - Reserved for future DOM enrichment
   */
  parseLocation(url: URL, _doc?: Document): CaptureContext | null {
    if (!this.matchesOrigin(url.origin)) {
      return null;
    }
    return parseGitLabMergeRequestUrl(url);
  }

  /**
   * Observes URL changes for GitLab SPA navigations.
   *
   * @param doc - Document belonging to the page window
   * @param onChange - Receives the latest context or null
   * @returns Cleanup that removes listeners and clears the timer
   */
  observe(
    doc: Document,
    onChange: (ctx: CaptureContext | null) => void,
  ): () => void {
    const win = doc.defaultView;
    if (!win) {
      onChange(null);
      return () => undefined;
    }

    /** Last href we reported, used to avoid duplicate callbacks. */
    let lastHref = "";

    /**
     * Reads the current URL and notifies when it changed.
     */
    const emitIfChanged = (): void => {
      const href = win.location.href;
      if (href === lastHref) {
        return;
      }
      lastHref = href;
      onChange(this.parseLocation(new URL(href), doc));
    };

    emitIfChanged();
    win.addEventListener("popstate", emitIfChanged);
    const timer = win.setInterval(emitIfChanged, 1000);

    return () => {
      win.removeEventListener("popstate", emitIfChanged);
      win.clearInterval(timer);
    };
  }
}

/**
 * Default singleton for gitlab.com with no extra self-hosted origins.
 */
export const gitlabAdapter: HostAdapter = new GitLabAdapter();
