# Host adapters

How Decision Ledger supports **multiple Git products** without forking the core.

## Why adapters

| Forge | Change noun | URL shape (typical) | Review shape |
|-------|-------------|---------------------|--------------|
| GitHub | Pull request | `/{owner}/{repo}/pull/{n}` | Approve / comment / request changes |
| GitLab | Merge request | `/{group}/{project}/-/merge_requests/{iid}` | Discussions + approval rules |
| Bitbucket | Pull request | `/{workspace}/{repo}/pull-requests/{id}` | Participate / approve |
| Azure DevOps | Pull request | `/{org}/{project}/_git/{repo}/pullrequest/{id}` | Votes + policies |
| Gitea / Forgejo | Pull request | Often GitHub-like | Varies by version |

Core speaks **`ChangeRef` + `CaptureContext`**. Adapters translate forge dialects into that model.

## Adapter responsibilities

| Must | Must not |
|------|----------|
| `matchesOrigin` for its hosts / instances | Own decision lifecycle or storage |
| `parseLocation` → `CaptureContext \| null` | Leak forge field names into core types |
| `observe` SPA navigations and emit updates | Require API tokens for basic capture (v1) |
| Prefer stable URL identity over brittle DOM | Throw uncaught across content-script boundary |
| Document capabilities | Scrape unrelated page data “just in case” |

Optional later:

- `getSelectionContext` — diff selection → path/lines/excerpt  
- `fetchSnapshot` — formal review / CI enrichment via API  

## Capability flags

UI and features query **capabilities**, not `if (host === "gitlab")`:

```ts
interface HostCapabilities {
  formalReviewStates: boolean;
  approvalRules: boolean;
  resolvableThreads: boolean;
  suggestedChanges: boolean;
  ciOnChangePage: boolean;
}
```

Add flags sparingly; prefer generic behavior when possible.

## Context mapping guidelines

### Numbers and IDs

- Store the **number users see in the URL/UI** as `ChangeRef.number` (GitLab **iid**, not global id).
- If an API later needs a global id, keep it in adapter-private metadata—not in core identity.

### Self-hosted

- `RepoRef.instanceUrl` is the origin (scheme + host [+ port]), no trailing path.
- Users add instance bases in settings; `matchesOrigin` consults built-ins **and** the allowlist.
- Permission prompts follow the user-enabled origin list.

### Page roles

Map product tabs to:

```text
"overview" | "changes" | "commits" | "checks" | "unknown"
```

Selection capture is only expected on `"changes"` (when implemented).

### Degradation ladder

1. **URL only** — host, repo, number (always try)  
2. **Light DOM** — title, head SHA if exposed  
3. **Selection / thread DOM** — flaky; isolate and test with fixtures  
4. **API** — optional enrichment with explicit auth  

If (2)–(4) fail, capture must still work at (1).

## Package layout (planned)

```text
packages/adapters/
  host-api/          # interfaces + shared types
  github/
  gitlab/
  bitbucket/         # later
  azuredevops/       # later
  gitea/             # later
```

Registry (conceptual):

```ts
const adapters: HostAdapter[] = [github, gitlab /* … */];

export function resolveAdapter(url: URL): HostAdapter | null {
  return adapters.find((a) => a.matchesOrigin(url.origin)) ?? null;
}
```

## Adding a new host

1. **Read** [ARCHITECTURE.md](ARCHITECTURE.md) and ADR 0001.  
2. **Create** `packages/adapters/<host>/` with `HostAdapter` implementation.  
3. **Add fixtures** under `tools/fixtures/<host>/`:
   - `urls.json` — input URL → expected `ChangeRef` / page role  
   - optional sanitized HTML snapshots for DOM parsers  
4. **Register** the adapter in the extension content entry.  
5. **Document** origins, capabilities, and known limits in this file’s table (or host README).  
6. **PR** with tests + a short manual smoke note (browser + sample URL patterns).  

### Fixture rules

- No private source code, tokens, or customer names.  
- Prefer synthetic HTML that only contains structure needed for selectors.  
- One fixture per interesting URL shape (nested GitLab groups, GHE host, etc.).

## Host notes (initial targets)

### GitHub

- Origins: `https://github.com` (GHE via instance allowlist later).  
- Paths: `/pull/{n}`, files, commits, checks.  
- Capabilities: formal review states, suggested changes, resolvable threads (typical).

### GitLab

- Origins: `https://gitlab.com` (+ self-hosted allowlist).  
- Paths: `/-/merge_requests/{iid}`, diffs, commits, pipelines.  
- Use **iid** in `ChangeRef.number`.  
- Capabilities: approval rules, resolvable discussions; formal “review submit” differs from GitHub.

### Others

Bitbucket, Azure DevOps, Gitea/Forgejo follow the same process; order is roadmap-driven, not architecture-blocked.

## Anti-patterns

- Copy-pasting GitHub parsers into GitLab with renamed variables inside `core`  
- Storing only `window.location.href` as identity (brittle query strings, lost structure)  
- Requiring broad `<all_urls>` for a single new host  
- Encoding GitLab approval rule JSON into `Decision.kind`  

## Related

- [ARCHITECTURE.md](ARCHITECTURE.md)  
- [decisions/0001-forge-agnostic-model.md](decisions/0001-forge-agnostic-model.md)  
