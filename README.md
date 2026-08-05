# Decision Ledger

A browser extension that saves your code-review decisions while you look at pull requests and merge requests on sites like GitHub and GitLab.

Notes are saved on your computer. Shared TypeScript types describe a change and a decision. Each Git site has a small adapter that reads that site’s URLs and pages.

| | |
|---|---|
| Tools | TypeScript, npm, Vite, React, browser extension (Manifest V3) |
| Branches | `main` for stable code; `dev/1.0.0` for current work |
| License | TBD |

## Docs in this repo

| File | What it covers |
|------|----------------|
| [docs/VISION.md](docs/VISION.md) | Why the project exists and what it covers |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the parts fit together and the main data types |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | How to work in this repository |
| [docs/ADAPTERS.md](docs/ADAPTERS.md) | How support for each Git site is added |
| [docs/decisions/](docs/decisions/) | Written records of major technical choices (ADRs) |

These files describe the product and how the code is organized. Notes for a specific release version will live in separate version docs when we publish releases.

## What the product should do

Works in Chrome-based browsers and Firefox. It should:

- See which pull request or merge request is open
- Let you create, edit, search, and export decisions linked to that change
- Put site-specific code in adapters only
- Still work using only the page URL if the page HTML is hard to read

## Main data types

The app does not expose a public web API. These types are the shared shapes used in code.

```ts
type HostId = "github" | "gitlab" | "bitbucket" | "azuredevops" | "gitea" | string;

interface RepoRef {
  host: HostId;
  instanceUrl?: string;
  owner: string;
  name: string;
}

interface ChangeRef {
  repo: RepoRef;
  number: number;
}

interface CaptureContext {
  change: ChangeRef;
  revision?: { headSha: string; baseSha?: string };
  selection?: {
    path: string;
    startLine: number;
    endLine: number;
    side?: "left" | "right";
    excerpt?: string;
  };
  thread?: { threadId: string; filePath?: string };
  page: "overview" | "changes" | "commits" | "checks" | "unknown";
  sourceUrl: string;
  capturedAt: string;
}

type DecisionStatus = "draft" | "decided" | "open_question" | "superseded";
type DecisionKind =
  | "risk"
  | "approve_with_nits"
  | "block"
  | "question"
  | "note"
  | "follow_up";

interface Decision {
  id: string;
  context: CaptureContext;
  status: DecisionStatus;
  kind: DecisionKind;
  body: string;
  tags: string[];
  supersedes?: string;
  createdAt: string;
  updatedAt: string;
}

interface HostAdapter {
  readonly id: HostId;
  readonly displayName: string;
  matchesOrigin(origin: string): boolean;
  parseLocation(url: URL, doc?: Document): CaptureContext | null;
  observe(doc: Document, onChange: (ctx: CaptureContext | null) => void): () => void;
  getSelectionContext?(doc: Document, ctx: CaptureContext): CaptureContext;
}
```

## Folder layout

```text
decision-ledger/
  README.md
  docs/                 documentation
  apps/extension        browser extension entry points
  packages/core         shared types and decision logic
  packages/adapters/    one folder per Git site
  packages/storage      saving and loading decisions
  packages/ui           React UI
  packages/shell        small helpers for different browsers
  tools/fixtures        sample URLs and HTML for tests
```

## Privacy

Decision text stays on the device unless you export it or turn on sync later. The extension asks for site access per site. Do not commit passwords, tokens, or secrets.

## Maintainers

- [mwilcome](https://github.com/mwilcome)
