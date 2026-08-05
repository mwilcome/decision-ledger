import type { CaptureContext } from "@decision-ledger/core";
import type { HostAdapter, HostCapabilities } from "@decision-ledger/host-api";
import { parseGitHubPullRequestUrl } from "./parse.js";

/**
 * Capability flags for GitHub pull requests.
 */
const GITHUB_CAPABILITIES: HostCapabilities = {
  formalReviewStates: true,
  approvalRules: false,
  resolvableThreads: true,
  suggestedChanges: true,
  ciOnChangePage: true,
};

/**
 * Host adapter for GitHub.com and GitHub Enterprise-style origins.
 */
export class GitHubAdapter implements HostAdapter {
  /**
   * Adapter id used in context keys and settings.
   */
  readonly id = "github" as const;

  /**
   * Display name for the side panel.
   */
  readonly displayName = "GitHub";

  /**
   * Features this host can surface.
   */
  readonly capabilities = GITHUB_CAPABILITIES;

  /**
   * Extra origins the user has allowed (self-hosted Enterprise).
   */
  private readonly allowedOrigins: ReadonlySet<string>;

  /**
   * @param allowedOrigins - Optional list of extra origins (for example GHE)
   */
  constructor(allowedOrigins: readonly string[] = []) {
    this.allowedOrigins = new Set(allowedOrigins);
  }

  /**
   * Accepts github.com and any origin passed into the constructor.
   *
   * @param origin - Page origin
   */
  matchesOrigin(origin: string): boolean {
    if (origin === "https://github.com" || origin === "http://github.com") {
      return true;
    }
    return this.allowedOrigins.has(origin);
  }

  /**
   * Parses the location when it is a pull request page.
   *
   * @param url - Current URL
   * @param _doc - Reserved for future DOM enrichment
   */
  parseLocation(url: URL, _doc?: Document): CaptureContext | null {
    if (!this.matchesOrigin(url.origin)) {
      return null;
    }
    return parseGitHubPullRequestUrl(url);
  }

  /**
   * Observes URL changes via `popstate` and a lightweight interval for SPA navigations.
   * Calls `onChange` immediately with the current context, then on each change.
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
    // GitHub soft-navigates without always firing popstate; poll as a simple baseline.
    const timer = win.setInterval(emitIfChanged, 1000);

    return () => {
      win.removeEventListener("popstate", emitIfChanged);
      win.clearInterval(timer);
    };
  }
}

/**
 * Default singleton for github.com with no extra enterprise origins.
 */
export const githubAdapter: HostAdapter = new GitHubAdapter();
