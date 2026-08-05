import type {
  CaptureContext,
  ChangePresentation,
  ChangeRef,
} from "@decision-ledger/core";
import type { HostAdapter, HostCapabilities } from "@decision-ledger/host-api";
import { parseGitLabMergeRequestUrl } from "./parse.js";
import { readGitLabPresentation } from "./presentation.js";

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
   * Builds `https://gitlab.com/group/proj/-/merge_requests/N` (or self-hosted).
   *
   * @param change - Change identity
   */
  buildChangeUrl(change: ChangeRef): string {
    const origin =
      change.repo.instanceUrl?.replace(/\/$/, "") ?? "https://gitlab.com";
    const projectPath = `${change.repo.owner}/${change.repo.name}`;
    return `${origin}/${projectPath}/-/merge_requests/${change.number}`;
  }

  /**
   * Builds the project commit page on GitLab.
   *
   * @param change - Change that owns the project
   * @param headSha - Commit SHA
   */
  buildCommitUrl(change: ChangeRef, headSha: string): string {
    const origin =
      change.repo.instanceUrl?.replace(/\/$/, "") ?? "https://gitlab.com";
    const projectPath = `${change.repo.owner}/${change.repo.name}`;
    return `${origin}/${projectPath}/-/commit/${headSha.trim()}`;
  }

  /**
   * Reads MR title from the heading or tab title.
   *
   * @param _url - Current URL
   * @param doc - Page document
   */
  readPresentation(_url: URL, doc: Document): ChangePresentation | null {
    return readGitLabPresentation(doc);
  }

  /**
   * Observes URL and title changes for GitLab SPA navigations.
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

    /** Last emitted signature (href + title). */
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
 * Default singleton for gitlab.com with no extra self-hosted origins.
 */
export const gitlabAdapter: HostAdapter = new GitLabAdapter();
