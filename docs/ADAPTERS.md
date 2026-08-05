# Adapters

Each Git host is an adapter that maps pages into `CaptureContext`. Core never branches on host name.

## Hosts

| Host | Change | URL pattern (typical) |
|------|--------|------------------------|
| GitHub | Pull request | `/{owner}/{repo}/pull/{n}` |
| GitLab | Merge request | `/{group}/{project}/-/merge_requests/{iid}` |
| Bitbucket | Pull request | `/{workspace}/{repo}/pull-requests/{id}` |
| Azure DevOps | Pull request | `/{org}/{project}/_git/{repo}/pullrequest/{id}` |
| Gitea / Forgejo | Pull request | Often GitHub-like |

`ChangeRef.number` is the number in the UI/URL (GitLab **iid**).

## Contract

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

Adapters own parse/observe. They do not own storage or decision lifecycle.

## Context rules

- Prefer URL fields for identity; use DOM only for extras (title, SHA, selection).
- `instanceUrl` is origin only (scheme, host, port).
- Page role: `overview` | `changes` | `commits` | `checks` | `unknown`.
- If DOM/API fail, URL-only context must still work.

## Packages

```text
packages/adapters/host-api
packages/adapters/github
packages/adapters/gitlab
```

Register adapters in the content script. Resolve by `matchesOrigin`.

## New host

1. Implement `HostAdapter` under `packages/adapters/<host>/`.
2. Add fixtures under `tools/fixtures/<host>/`.
3. Register the adapter.
4. Document origins and capabilities.

Fixtures must not include secrets or private source.

## Avoid

- Host checks inside `packages/core`
- Identity based only on full `href` strings
- Broad host permissions for one new origin
- Putting forge approval JSON into `Decision.kind`
