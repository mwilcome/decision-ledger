# Decision Ledger

Browser extension for recording review decisions on pull requests and merge requests across Git hosts (GitHub, GitLab, and others).

Decisions are stored on the device. The core model is shared; each host has an adapter.

| | |
|---|---|
| Stack | TypeScript, npm, Vite, React, WebExtension (MV3) |
| Branch | `main` stable; `dev/1.0.0` active development |
| License | TBD |

## Docs

| Doc | Content |
|-----|---------|
| [docs/VISION.md](docs/VISION.md) | Purpose and scope |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layout, models, runtime |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Branches, standards, tooling |
| [docs/ADAPTERS.md](docs/ADAPTERS.md) | Host adapter contract |
| [docs/decisions/](docs/decisions/) | ADRs |

Version-specific changes live in version docs when releases ship. This tree describes the product design, not a delivery checklist.

## Expected outcome

A Chromium and Firefox extension that:

- Detects the open change on a supported host
- Lets the user create, edit, search, and export decisions tied to that change
- Keeps host-specific logic in adapters
- Works from URL identity when the page DOM is incomplete

## Core model

No HTTP API. Types below are the application contract.

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

## Layout

```text
decision-ledger/
  README.md
  docs/
  apps/extension
  packages/core
  packages/adapters/
  packages/storage
  packages/ui
  packages/shell
  tools/fixtures
```

## Privacy

Decision text stays local unless the user exports or enables sync. Host permissions are optional per origin. Do not commit tokens or secrets.

## Maintainers

- [mwilcome](https://github.com/mwilcome)
