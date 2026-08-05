# Architecture

## Tools

npm, TypeScript (strict mode), Vite, React, browser extension using Manifest V3.

## Parts of the system

| Part | Job |
|------|-----|
| Content script | Code that runs on the Git site page. Picks the right adapter and sends page context. |
| Background script | Runs in the extension. Passes messages, handles permissions, remembers current context. |
| UI (React) | Side panel: create, read, update, delete decisions. |
| `packages/core` | Shared types and decision logic. Does not use browser APIs. |
| `packages/adapters/*` | One package per Git site: read URL and page, build context. |
| `packages/storage` | DecisionStore port; IndexedDB implementation for local persistence. |
| `packages/shell` | Small differences between browsers (side panel vs popup). |

## Packages (folders)

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

## Data types

The main types (`RepoRef`, `ChangeRef`, `CaptureContext`, `Decision`, `HostAdapter`) are listed in the root [README.md](../README.md).

**Change key** groups decisions for one PR/MR:

```text
host | instanceUrl | owner | name | number
```

**Commit key** adds the commit SHA when a decision is about one commit on that change:

```text
host | instanceUrl | owner | name | number | headSha
```

When `CaptureContext.revision.headSha` is set at save time, the decision is commit-scoped. The side panel can filter by whole change, current commit, or all saved items.

For a company-hosted GitLab or GitHub, always include `instanceUrl` so two servers with the same project path stay separate.

**Note type** (field `kind`): Note, Question, Risk, Blocker.  
Legacy kinds (`follow_up`, `approve_with_notes`) map to Note on load.

**Progress** (field `status`): In progress, Waiting for clarification, Settled, Replaced.  
Settled means you are done with that item (including a answered question).

The saved list groups notes by pull request, then by whole PR vs commit.

The site’s own approval or CI status can be shown if we load it. It is separate from a `Decision` record.

## Persistence

Decisions are stored in **IndexedDB** inside the extension (browser profile on this machine). The side panel uses `IndexedDbDecisionStore` through the `DecisionStore` interface. There is no remote server.

## What happens when you save a decision

1. You open a pull request or merge request page.
2. The adapter builds a `CaptureContext` from the URL (and from the page HTML if it can).
3. You create or update a decision in the side panel (kind, status, body).
4. Core builds or updates the `Decision` record.
5. IndexedDB saves it. Delete removes it after a confirm dialog.

## Permissions

The extension requests access to a site when you use that site. It does not ask for all websites at install. Any API tokens stay in extension storage.

## Related decision record

- [0001-forge-agnostic-model.md](decisions/0001-forge-agnostic-model.md)
