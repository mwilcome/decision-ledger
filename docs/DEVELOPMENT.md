# Development

Standards and paths for working in **Decision Ledger**. Update this file when tooling or branch policy changes.

## Prerequisites (planned)

Exact versions will be pinned at monorepo scaffold. Expect roughly:

- **Git** 2.40+
- **Node.js** LTS (Active)
- **pnpm** or npm (chosen at scaffold and documented here)
- A Chromium browser and Firefox for extension loads
- Optional: [GitHub CLI](https://cli.github.com/) (`gh`) for PRs

## Clone & branch

```powershell
git clone https://github.com/mwilcome/decision-ledger.git
cd decision-ledger
git fetch origin
git checkout dev/1.0.0
git pull
```

### Branch model

| Branch | Purpose |
|--------|---------|
| `main` | Stable line; should remain releasable once we ship |
| `dev/1.0.0` | Integration branch for the 1.0.0 effort |
| `feature/<short-name>` | Short-lived work branched from `dev/1.0.0` |
| `fix/<short-name>` | Same, for fixes |
| `docs/<short-name>` | Docs-only when convenient |

**Tags:** `v1.0.0`, `v1.0.1`, … mark releases. Do not use version tags as long-lived branches.

```text
main ────────────────●────────────●────
                     ▲            ▲
dev/1.0.0 ────●──●──●────●──●────●────  (merge / PR when slice ready)
              └── feature/foo
```

### Naming

- Prefer lowercase, hyphens: `feature/gitlab-url-parser`
- No personal long-lived branches on `origin` without a clear owner and expiry

## Day-to-day workflow

1. Sync `dev/1.0.0`.
2. Create `feature/...` from it.
3. Implement + test + update docs if behavior or public contracts change.
4. Open a PR **into `dev/1.0.0`** (not directly into `main` unless releasing).
5. After review, merge (squash or merge commit — pick one style per ADR when tooling lands; until then prefer **squash** for features).
6. Periodically open a PR **`dev/1.0.0` → `main`** when a coherent slice is ready.

### Commit messages

Use clear, imperative subjects (Conventional Commits encouraged, not enforced yet):

```text
feat(adapters): parse GitLab MR URLs into ChangeRef
fix(storage): rehydrate decisions after extension reload
docs: add adapter fixture guidelines
chore: add root gitignore
```

- Subject ≤ ~72 characters when practical  
- Body explains *why* when the diff is non-obvious  
- No secrets, tokens, or real customer data in commits  

## Coding standards

### Language & style

| Area | Standard |
|------|----------|
| Language | TypeScript, `strict` once scaffold lands |
| Modules | ES modules; explicit exports from package entrypoints |
| Core purity | `packages/core` must not import browser or DOM APIs |
| Host logic | Only inside `packages/adapters/*` |
| Formatting | Prettier (or Biome) — single config at repo root after scaffold |
| Lint | ESLint (or Biome) — CI-enforced when CI exists |

### Design rules

1. **No host conditionals in core or UI feature flags by stringly host name** — use adapter capabilities.
2. **Prefer ports/interfaces** for storage and messaging so tests stay pure.
3. **Fail soft on pages we don’t understand** — return `null` context; do not throw across the content-script boundary.
4. **Feature-detect** browser APIs (`sidePanel`, etc.); provide shell fallbacks.

### Testing expectations

| Change type | Minimum bar |
|-------------|-------------|
| Core model / lifecycle | Unit tests |
| Adapter URL/DOM parse | Fixture tests (see ADAPTERS) |
| UI only | Manual checklist + screenshot if UX shifts |
| Permissions / messaging | Short manual smoke on Chromium + note Firefox if touched |

Do not commit real private repository HTML that contains secrets; sanitize fixtures.

## Documentation standards

- User-facing or contributor-facing behavior changes → update `docs/` or root `README.md` in the same PR.
- Significant design choices → new ADR under `docs/decisions/` (see template below).
- Keep README **short**; deep detail lives under `docs/`.

### ADR template

Create `docs/decisions/NNNN-short-title.md`:

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context
## Decision
## Consequences
```

## Pull requests

### Checklist

- [ ] Targets correct base branch (`dev/1.0.0` unless release)
- [ ] Description: *what* and *why*
- [ ] Tests or fixtures for parser/core changes
- [ ] Docs updated if needed
- [ ] No secrets; fixtures sanitized
- [ ] Small enough to review (split if not)

### Review bar

Reviewers look for: adapter leakage into core, broken context keys for self-hosted, permission creep, and missing degradation path when DOM is missing.

## Security practices

- Never commit `.env`, PATs, cookies, or session dumps.
- Optional host permissions only; document any new permission in the PR.
- Assume decision text may contain security findings—avoid logging bodies at info level.

## Release habits (when ready)

1. Ensure `dev/1.0.0` (or current dev line) is green and documented.  
2. PR into `main`.  
3. Tag `vX.Y.Z` on `main`.  
4. Attach extension build artifacts as release assets if distributing outside stores.  

## Current repo state

| Item | State |
|------|--------|
| Documentation | Active |
| Monorepo scaffold | Not yet (next milestone) |
| CI | Not yet |
| Package scripts | Not yet |

Until scaffold lands, “development” is primarily **docs, ADRs, and fixtures design**. Code standards above apply as packages appear.

## Getting help

- Open a GitHub Issue with context and host/browser if relevant.
- Propose architecture changes via ADR PR when possible.
