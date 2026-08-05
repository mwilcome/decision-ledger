# Adapters

An **adapter** is the code for one Git site. It turns that site’s page URL (and optional HTML) into a `CaptureContext`. Shared logic in `packages/core` stays free of site names.

## Supported site shapes

| Site | Name of a change | Example URL path |
|------|------------------|------------------|
| GitHub | Pull request | `/{owner}/{repo}/pull/{n}` |
| GitLab | Merge request | `/{group}/{project}/-/merge_requests/{iid}` |
| Bitbucket | Pull request | `/{workspace}/{repo}/pull-requests/{id}` |
| Azure DevOps | Pull request | `/{org}/{project}/_git/{repo}/pullrequest/{id}` |
| Gitea / Forgejo | Pull request | Often like GitHub |

`ChangeRef.number` is the number shown in the URL and UI. On GitLab that is the **iid** (the per-project MR number).

## Interfaces

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

interface HostCapabilities {
  formalReviewStates: boolean;
  approvalRules: boolean;
  resolvableThreads: boolean;
  suggestedChanges: boolean;
  ciOnChangePage: boolean;
}
```

Adapters parse pages and watch for navigation. Saving decisions and changing decision status stay in core and storage.

## Context rules

- Build identity mainly from the URL. Use page HTML for extras (title, commit SHA, selected lines).
- `instanceUrl` is only the origin: scheme, host, and optional port.
- Page role is one of: `overview`, `changes`, `commits`, `checks`, `unknown`.
- If HTML or API data is missing, context from the URL alone is still valid.

## Package folders

```text
packages/adapters/host-api
packages/adapters/github
packages/adapters/gitlab
```

The content script picks an adapter with `matchesOrigin` and registers each adapter there.

## Adding a site

1. Implement `HostAdapter` in `packages/adapters/<host>/`.
2. Add sample URLs (and optional HTML) under `tools/fixtures/<host>/` for tests.
3. Register the adapter in the content script.
4. Document which origins it covers and which capability flags it sets.

Fixtures must not include secrets or private source code.

## Guidelines

- Keep site name checks out of `packages/core`
- Prefer structured URL parts over saving only the full `href`
- Request only the site origins you need
- Keep forge approval details out of `Decision.kind`; use capability flags or separate snapshot data
