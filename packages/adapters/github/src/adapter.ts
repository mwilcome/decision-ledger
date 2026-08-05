import type {
  CaptureContext,
  ChangePresentation,
  ChangeRef,
} from "@decision-ledger/core";
import type { HostAdapter, HostCapabilities } from "@decision-ledger/host-api";
import { parseGitHubPullRequestUrl } from "./parse.js";
import { readGitHubPresentation } from "./presentation.js";

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
   * Builds `https://github.com/owner/repo/pull/N` (or enterprise origin).
   *
   * @param change - Change identity
   */
  buildChangeUrl(change: ChangeRef): string {
    const origin =
      change.repo.instanceUrl?.replace(/\/$/, "") ?? "https://github.com";
    return `${origin}/${change.repo.owner}/${change.repo.name}/pull/${change.number}`;
  }

  /**
   * Builds the repo commit page (stable across GitHub UI variants).
   *
   * @param change - Change that owns the repo
   * @param headSha - Commit SHA
   */
  buildCommitUrl(change: ChangeRef, headSha: string): string {
    const origin =
      change.repo.instanceUrl?.replace(/\/$/, "") ?? "https://github.com";
    return `${origin}/${change.repo.owner}/${change.repo.name}/commit/${headSha.trim()}`;
  }

  /**
   * Reads PR title from the heading or tab title.
   *
   * @param _url - Current URL (unused; presentation is document-based)
   * @param doc - Page document
   */
  readPresentation(_url: URL, doc: Document): ChangePresentation | null {
    return readGitHubPresentation(doc);
  }

  /**
   * Observes URL and title changes (SPA may paint the title after navigation).
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

    /** Last emitted signature (href + title) to avoid duplicate callbacks. */
    let lastSig = "";

    /**
     * Parses location, attaches presentation, and notifies on real changes.
     */
    const emitIfChanged = (): void => {
      const href = win.location.href;
      const base = this.parseLocation(new URL(href), doc);
      if (!base) {
        const sig = `${href}|`;
        if (sig !== lastSig) {
          lastSig = sig;
          onChange(null);
        }
        return;
      }
      const presentation = this.readPresentation(new URL(href), doc) ?? undefined;
      const next: CaptureContext = presentation
        ? { ...base, presentation }
        : base;
      const sig = `${href}|${presentation?.title ?? ""}`;
      if (sig === lastSig) {
        return;
      }
      lastSig = sig;
      onChange(next);
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
 * Default singleton for github.com with no extra enterprise origins.
 */
export const githubAdapter: HostAdapter = new GitHubAdapter();
