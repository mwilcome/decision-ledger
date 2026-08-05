# Architecture

## Overview

```text
┌─────────────────────────────────────────────────────────────┐
│  Host pages (GitHub, GitLab, …)                             │
│  content script: resolve adapter → observe → post context     │
└────────────────────────────┬────────────────────────────────┘
                             │ messages
┌────────────────────────────▼────────────────────────────────┐
│  Extension shell (MV3)                                      │
│  background service worker · commands · permissions          │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────┐
│  UI (side panel / popup)  │   │  Storage port               │
│  create · search · export │   │  IndexedDB · export files   │
└─────────────┬─────────────┘   └──────────────▲──────────────┘
              │                                │
              └────────────┬───────────────────┘
                           ▼
              ┌────────────────────────────┐
              │  packages/core (pure TS)   │
              │  Decision model · keys     │
              │  lifecycle · query/export  │
              └────────────────────────────┘
                           ▲
              ┌────────────┴───────────────┐
              │  packages/adapters/*       │
              │  HostAdapter implementations│
              └────────────────────────────┘
```

**Rule:** browser APIs and DOM live at the edges. **Core has no `chrome` / `browser` / `document` imports.**

## Planned monorepo packages

| Path | Responsibility |
|------|----------------|
| `apps/extension` | Manifest, background, content entry, side panel HTML entry |
| `packages/core` | Domain types, context keys, lifecycle, pure query/export |
| `packages/adapters/host-api` | `HostAdapter` interfaces and shared types |
| `packages/adapters/github` | GitHub.com (+ later GHE patterns) |
| `packages/adapters/gitlab` | GitLab.com (+ later self-hosted) |
| `packages/adapters/*` | Further forges |
| `packages/storage` | Persistence implementing core ports |
| `packages/ui` | Ledger UI components (framework chosen at scaffold) |
| `packages/shell` | Thin wrappers: side panel vs Firefox sidebar/popup |
| `tools/fixtures` | Saved URLs/HTML for adapter tests |

Exact tooling (pnpm/npm, WXT/Vite, UI framework) is fixed in scaffold + ADR if needed.

## Domain model

### Identity

| Concept | Meaning |
|---------|---------|
| `HostId` | Logical forge family (`github`, `gitlab`, …) |
| `RepoRef` | Host + optional `instanceUrl` + owner + name |
| `ChangeRef` | A PR/MR (or equivalent) on that repo |
| `RevisionRef` | Optional head/base SHAs for the change |
| `CaptureContext` | Everything known about “where the user was” when capturing |
| `Decision` | User-authored ledger entry bound to a context |

### Context key

Used to group and re-bind notes across SPA navigations:

```text
contextKey = host | instanceUrl | owner | name | number [| headSha]
```

- Same change, new `headSha` → **retain** decisions; surface “captured on older revision” when useful.
- Always include `instanceUrl` for self-hosted so `gitlab.com` never collides with `gitlab.company.com`.

### Decision lifecycle

```text
                ┌──────────────┐
                │    draft     │
                └──────┬───────┘
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   open_question    decided      (deleted*)
         │             │
         └──────┬──────┘
                ▼
           superseded ──► points at replacement Decision id

* soft-delete optional; prefer status transitions for auditability
```

### Forge review snapshot (optional enrichment)

Separate from `Decision`:

```text
ForgeReviewSnapshot = my formal state, approval summary, CI summary at a SHA
```

Adapters may provide this later via DOM or API. Core UI may *display* it; it is not the ledger.

## Host adapter boundary

```ts
interface HostAdapter {
  readonly id: HostId;
  readonly displayName: string;
  matchesOrigin(origin: string): boolean;
  parseLocation(url: URL, doc?: Document): CaptureContext | null;
  observe(doc: Document, onChange: (ctx: CaptureContext | null) => void): () => void;
  getSelectionContext?(doc: Document, ctx: CaptureContext): CaptureContext;
  fetchSnapshot?(ctx: CaptureContext, auth: unknown): Promise<ForgeReviewSnapshot>;
}
```

**Capability flags** (examples) drive UI, not host name checks in feature code:

- `formalReviewStates` — GitHub-style approve / changes requested  
- `approvalRules` — GitLab-style approval rules  
- `resolvableThreads`  
- `suggestedChanges`  
- `ciOnChangePage`  

See [ADAPTERS.md](ADAPTERS.md).

## Extension runtime

| Piece | Role |
|-------|------|
| Content script | Origin match → adapter → emit `CaptureContext` updates |
| Background (MV3 SW) | Message router, permission prompts, context cache |
| Side panel / shell UI | Primary ledger UX (stable vs in-page chrome) |
| Commands | e.g. “capture decision” with current context |

### Multi-browser

| Browser | Shell notes |
|---------|-------------|
| Chromium | `sidePanel` preferred |
| Firefox | Sidebar action or popup / tab page; same UI bundle |
| Safari | Later; packaging and distribution differ |

Use a polyfill or framework abstraction (`browser.*`) so feature code does not call `chrome.*` directly.

### Permissions strategy

- Prefer **optional host permissions** per origin / pattern.
- Do **not** require `*://*/*` at install.
- Tokens (if any) stored via extension storage; never logged or committed.

## Data flow (capture)

1. User opens a change page on a supported origin.  
2. Adapter `parseLocation` (+ `observe` on SPA nav) produces `CaptureContext`.  
3. UI shows host · repo · change number · short SHA.  
4. User writes a decision (kind, body, tags, status).  
5. Core validates → storage port persists.  
6. Export serializes decisions to Markdown/JSON on demand.

## Testing strategy (target)

| Layer | Approach |
|-------|----------|
| Core | Unit tests; no browser |
| Adapters | URL + HTML fixtures → expected `ChangeRef` / context |
| Extension smoke | Manual load unpacked + short checklist in DEVELOPMENT |
| E2E (later) | Playwright against fixtures or staging hosts |

## Security notes

- Treat decision bodies and excerpts as **sensitive**.
- Minimize content-script privilege; pass structured context inward, not raw page HTML to core.
- CSP and extension review constraints apply at packaging time.

## Related ADRs

- [0001-forge-agnostic-model.md](decisions/0001-forge-agnostic-model.md)
