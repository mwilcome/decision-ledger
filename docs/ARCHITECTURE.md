# Architecture

## Stack

npm, TypeScript (strict), Vite, React, WebExtension MV3.

## Layers

| Layer | Role |
|-------|------|
| Content script | Resolve host adapter, emit `CaptureContext` |
| Background | Messaging, permissions, context cache |
| UI (React) | Side panel / shell: decisions CRUD, search, export |
| `packages/core` | Types, keys, lifecycle, query/export (no browser APIs) |
| `packages/adapters/*` | Per-host parse and observe |
| `packages/storage` | Persistence (e.g. IndexedDB) |
| `packages/shell` | Browser differences (side panel vs popup/sidebar) |

## Packages

```text
apps/extension
packages/core
packages/adapters/host-api
packages/adapters/github
packages/adapters/gitlab
packages/storage
packages/ui
packages/shell
tools/fixtures
```

## Models

See root [README.md](../README.md) for `RepoRef`, `ChangeRef`, `CaptureContext`, `Decision`, `HostAdapter`.

**Context key** (group decisions for a change):

```text
host | instanceUrl | owner | name | number [| headSha]
```

Include `instanceUrl` for self-hosted hosts so instances do not collide.

**Statuses:** `draft` → `decided` | `open_question` → `superseded` (optional link to replacement id).

Forge approval/CI state is optional display data, not a `Decision`.

## Runtime

1. User opens a change page.
2. Adapter builds `CaptureContext` from URL (and DOM if available).
3. User writes a decision in the side panel.
4. Core validates; storage persists.
5. Export writes Markdown or JSON on demand.

## Permissions

Optional host permissions per origin. No `*://*/*` at install. Tokens stay in extension storage.

## ADR

- [0001-forge-agnostic-model.md](decisions/0001-forge-agnostic-model.md)
