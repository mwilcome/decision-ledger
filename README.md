# Decision Ledger

**Cross-browser decision ledger for code reviews across Git forges.**

Capture durable review *decisions* while you work on pull requests and merge requests—on GitHub, GitLab, and other hosts—without rebuilding each forge’s review UI.

| | |
|---|---|
| **Status** | Early design / documentation (`dev/1.0.0`) |
| **Type** | Browser extension (WebExtensions) + shared TypeScript core |
| **License** | TBD (set before first public release tag) |

---

## Why this exists

Code forges store comments, approvals, and CI state. They rarely store the **personal and team decisions** you make while reviewing:

- What risk did you accept, and why?
- What question is still open?
- What superseded an earlier call on a related change?

Decision Ledger records those decisions **in context** (repo, change number, optional file/hunk, revision) and keeps them searchable later—locally first, forge-agnostic by design.

---

## Goals

1. **Multi-host** — GitHub, GitLab, and additional forges via adapters (not GitHub-only scraping).
2. **Multi-browser** — Chromium (Chrome, Edge, Brave, …) and Firefox first; Safari as a later packaging target.
3. **Forge-agnostic core** — One domain model (`ChangeRef`, `Decision`, …); host-specific code stays in adapters.
4. **Local-first** — Decisions live on your machine by default; sync/export are explicit features.
5. **Degrade gracefully** — URL-only capture still works when DOM layout changes; APIs enrich when available.

Non-goals for v1 are listed in [docs/VISION.md](docs/VISION.md).

---

## Repository layout

```text
decision-ledger/
├── README.md                 # You are here
├── docs/                     # Product & engineering documentation
│   ├── README.md             # Docs index
│   ├── VISION.md
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT.md
│   ├── ADAPTERS.md
│   └── decisions/            # Architecture Decision Records (ADRs)
├── apps/                     # (planned) extension shell & entrypoints
├── packages/                 # (planned) core, adapters, ui, storage, shell
└── tools/                    # (planned) fixtures, scripts
```

Application packages are **not scaffolded yet**. Step 3 of the initial plan adds the monorepo baseline. Until then, this repository is documentation-first.

---

## Documentation map

| Document | Purpose |
|----------|---------|
| [docs/VISION.md](docs/VISION.md) | Product intent, users, scope, non-goals |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, domain model, browser/extension design |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Setup, branches, standards, PR path, release habits |
| [docs/ADAPTERS.md](docs/ADAPTERS.md) | How forges plug in; adding a new host |
| [docs/decisions/](docs/decisions/) | ADRs — significant technical choices |

Start with **Vision → Architecture → Development** if you are new to the project.

---

## Conceptual API (core)

There is no published HTTP API in v1. The “API” of the product is the **core TypeScript surface** used by the extension UI and adapters.

### Context (what you are looking at)

```ts
// Illustrative — finalized in packages/core during scaffold

type HostId = "github" | "gitlab" | "bitbucket" | "azuredevops" | "gitea" | string;

interface RepoRef {
  host: HostId;
  instanceUrl?: string;  // self-hosted base, e.g. https://gitlab.example.com
  owner: string;         // owner, group, workspace, or org/project segment(s)
  name: string;
}

interface ChangeRef {
  repo: RepoRef;
  number: number;        // PR/MR number as shown in the UI (iid on GitLab)
}

interface CaptureContext {
  change: ChangeRef;
  revision?: { headSha: string; baseSha?: string };
  selection?: { path: string; startLine: number; endLine: number; side?: "left" | "right"; excerpt?: string };
  thread?: { threadId: string; filePath?: string };
  page: "overview" | "changes" | "commits" | "checks" | "unknown";
  sourceUrl: string;
  capturedAt: string;    // ISO-8601
}
```

### Decisions (what you record)

```ts
type DecisionStatus = "draft" | "decided" | "open_question" | "superseded";
type DecisionKind = "risk" | "approve_with_nits" | "block" | "question" | "note" | "follow_up";

interface Decision {
  id: string;
  context: CaptureContext;
  status: DecisionStatus;
  kind: DecisionKind;
  body: string;
  tags: string[];
  supersedes?: string;   // other Decision id
  createdAt: string;
  updatedAt: string;
}
```

### Host adapter (how a forge plugs in)

```ts
interface HostAdapter {
  readonly id: HostId;
  readonly displayName: string;
  matchesOrigin(origin: string): boolean;
  parseLocation(url: URL, doc?: Document): CaptureContext | null;
  observe(doc: Document, onChange: (ctx: CaptureContext | null) => void): () => void;
  getSelectionContext?(doc: Document, ctx: CaptureContext): CaptureContext;
}
```

Full contracts and capability flags: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/ADAPTERS.md](docs/ADAPTERS.md).

---

## Quick start (after scaffold)

> Scaffold is not in the tree yet. After step 3, this section will be the day-to-day path.

```powershell
# Clone
git clone https://github.com/mwilcome/decision-ledger.git
cd decision-ledger

# Use the active development line for 1.0 work
git checkout dev/1.0.0

# Install & develop (commands will match package manager chosen at scaffold)
# pnpm install
# pnpm dev
```

Load the unpacked extension in your browser per [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) once build output exists.

---

## Branching (current)

| Branch | Role |
|--------|------|
| `main` | Stable baseline; merge when a slice is ready |
| `dev/1.0.0` | Active development toward the first versioned release |

Release tags (e.g. `v1.0.0`) are created **when shipping**, not used as long-lived branches. Details: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

---

## Contributing

1. Read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for standards and PR expectations.
2. Prefer small PRs into `dev/1.0.0` (or the current `dev/*` line) unless the change is a release merge to `main`.
3. New forge support = new adapter package + fixtures; do not special-case hosts inside core.

---

## Security & privacy

- **Local-first:** decision text and optional diff excerpts stay on the device unless you export or enable sync.
- **Optional host permissions:** the extension should not demand every forge origin up front.
- **No secrets in git:** tokens and `.env` files are gitignored; never commit PATs.

Treat review notes as potentially sensitive (proprietary code, security findings).

---

## Roadmap (high level)

1. Documentation and standards (this milestone)
2. Monorepo scaffold (core, shell, first adapters)
3. GitHub + GitLab capture (URL + minimal DOM), side panel, local store, Markdown export
4. Self-hosted origins, additional forges, optional API enrichment
5. Firefox parity hardening; Safari packaging evaluation

---

## Maintainers

- [mwilcome](https://github.com/mwilcome)

Questions and proposals: GitHub Issues / Discussions on this repository.
