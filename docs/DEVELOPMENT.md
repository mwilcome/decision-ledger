# Development

## Tooling

| Item | Choice |
|------|--------|
| Package manager | npm |
| Bundler | Vite |
| UI | React |
| Language | TypeScript strict |
| Extension | MV3 WebExtension |

Node LTS. Chromium and Firefox for loading unpacked builds.

## Branches

| Branch | Role |
|--------|------|
| `main` | Stable |
| `dev/1.0.0` | Active development for 1.0.0 |
| `feature/<name>` | Work branched from `dev/1.0.0` |
| `fix/<name>` | Fixes |

Tags (`v1.0.0`, …) mark releases. PRs target `dev/1.0.0` unless merging a release to `main`.

## Commits

Imperative subject. Conventional Commits preferred:

```text
feat(adapters): parse GitLab MR URLs
fix(storage): load decisions after reload
docs: shorten architecture
```

No secrets or customer data in commits.

## Code rules

1. `packages/core` has no `chrome`, `browser`, or `document` imports.
2. Host logic only in `packages/adapters/*`.
3. UI uses adapter capabilities, not `if (host === "gitlab")`.
4. Unknown pages return `null` context; do not throw out of content scripts.
5. Detect browser APIs; shell provides fallbacks.

## Tests

| Area | Expectation |
|------|-------------|
| Core | Unit tests |
| Adapters | URL/HTML fixtures → expected context |
| UI / extension | Manual smoke on Chromium; Firefox when shell changes |

Sanitize fixtures. No private source or tokens.

## PRs

- Describe what and why
- Include tests/fixtures for core or parser changes
- Update docs when contracts or behavior change
- Optional host permissions only; call out new permissions

## ADRs

`docs/decisions/NNNN-short-title.md`:

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context
## Decision
## Consequences
```
