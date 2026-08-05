# Architecture

## Tools

npm, TypeScript (strict mode), Vite, React, browser extension using Manifest V3.

## Parts of the system

| Part | Job |
|------|-----|
| Content script | Code that runs on the Git site page. Picks the right adapter and sends page context. |
| Background script | Runs in the extension. Passes messages, handles permissions, remembers current context. |
| UI (React) | Side panel: create, edit, search, and export decisions. |
| `packages/core` | Shared types and decision logic. Does not use browser APIs. |
| `packages/adapters/*` | One package per Git site: read URL and page, build context. |
| `packages/storage` | Save and load decisions (for example IndexedDB in the browser). |
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

**Context key** is a string that groups decisions for one change:

```text
host | instanceUrl | owner | name | number [| headSha]
```

For a company-hosted GitLab or GitHub, always include `instanceUrl` so two servers with the same project path stay separate.

**Decision statuses:** start as `draft`, then `decided` or `open_question`. Later a decision can become `superseded` and point at a newer decision id.

The site’s own approval or CI status can be shown if we load it. It is separate from a `Decision` record.

## What happens when you save a decision

1. You open a pull request or merge request page.
2. The adapter builds a `CaptureContext` from the URL (and from the page HTML if it can).
3. You write a decision in the side panel.
4. Core checks the data; storage saves it.
5. Export can write Markdown or JSON when you ask.

## Permissions

The extension requests access to a site when you use that site. It does not ask for all websites at install. Any API tokens stay in extension storage.

## Related decision record

- [0001-forge-agnostic-model.md](decisions/0001-forge-agnostic-model.md)
