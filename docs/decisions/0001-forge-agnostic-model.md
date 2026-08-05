# 0001. Shared core model with host adapters

- **Status:** Accepted
- **Date:** 2026-08-05

## Context

Git hosts differ in URLs, review UX, and APIs. A GitHub-only model is costly to extend.

## Decision

1. Core types: `RepoRef`, `ChangeRef`, `CaptureContext`, `Decision`.
2. Host behavior behind `HostAdapter`.
3. Forge review/approval state is optional, not the ledger record.
4. Browser differences stay in the shell; core is pure TypeScript.
5. Optional host permissions; URL parse is the minimum capture path.

## Consequences

- New hosts are new adapter packages and fixtures.
- Storage keys use host, instance, repo, and change number.
- UI labels stay host-neutral where possible ("change", not only "PR").

## Alternatives rejected

| Option | Reason |
|--------|--------|
| GitHub only | Blocks multi-host goal |
| Single content script with host switches | Hard to test; leaks into core |
| Cloud ledger as source of truth | Out of scope for default product |
