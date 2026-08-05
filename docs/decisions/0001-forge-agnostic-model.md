# 0001. Forge-agnostic core model with host adapters

- **Status:** Accepted  
- **Date:** 2026-08-05  
- **Tags:** architecture, adapters, domain-model  

## Context

Decision Ledger must work across Git products (GitHub, GitLab, others). Those products differ in:

- Nouns (pull request vs merge request)
- URL layouts and self-hosted instances
- Review/approval UX and APIs
- DOM structure and SPA navigation

Building a GitHub-first app with later “ports” tends to bake GitHub assumptions into storage keys, UI, and tests—making multi-host support permanently expensive.

## Decision

1. Define a **forge-agnostic domain model** in core: `RepoRef`, `ChangeRef`, `CaptureContext`, `Decision`, and related value types.  
2. Isolate all host-specific behavior behind a **`HostAdapter`** interface (parse, observe, optional selection/API).  
3. Treat forge formal review/approval state as **optional snapshots**, not as the primary ledger record.  
4. Implement multi-browser packaging as a **shell** concern; core remains pure TypeScript.  
5. Prefer **optional host permissions** and a **degradation ladder** (URL → DOM → API).

## Consequences

### Positive

- New forges are additive packages + fixtures.  
- Storage and search stay stable when a host restyles its DOM.  
- Self-hosted instances can share adapters via `instanceUrl` + origin allowlists.  
- Testing can target pure parsers without loading a full browser.

### Negative / tradeoffs

- Slightly more upfront abstraction than a single-host MVP.  
- Adapters must be disciplined about mapping (e.g. GitLab **iid** vs global id).  
- UI must be written against capabilities and neutral labels (“change”, not only “PR”).

### Follow-ups

- Scaffold monorepo packages reflecting this split.  
- Land GitHub + GitLab adapters together early so the boundary stays honest.  
- Record tooling choices (extension framework, package manager) in later ADRs if non-obvious.

## Alternatives considered

| Alternative | Why not |
|-------------|---------|
| GitHub-only product | Conflicts with multi-forge goal; hard to retrofit |
| One mega content script with host `switch` | Becomes untestable and core-leaky |
| Remote SaaS ledger as source of truth | Privacy and scope; may revisit as optional sync |
