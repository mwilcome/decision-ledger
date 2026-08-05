# Development

## Tools

| Item | Choice |
|------|--------|
| Package manager | npm |
| Bundler | Vite |
| UI library | React |
| Language | TypeScript with strict mode |
| Extension format | Manifest V3 |

Use a current Node.js LTS release. Use a Chrome-based browser and Firefox to load local extension builds.

## Branches

| Branch | Role |
|--------|------|
| `main` | Stable code |
| `dev/1.0.0` | Current work toward version 1.0.0 |
| `feature/<name>` | A feature branch started from `dev/1.0.0` |
| `fix/<name>` | A fix branch |

Git tags like `v1.0.0` mark published releases. Open pull requests against `dev/1.0.0`. Use `main` as the target when you merge a release.

## Commits

Start the subject with a verb. Conventional Commit prefixes are welcome:

```text
feat(adapters): parse GitLab MR URLs
fix(storage): load decisions after reload
docs: shorten architecture
```

Do not commit secrets or private customer data.

## Code rules

1. `packages/core` must not import `chrome`, `browser`, or `document`.
2. Site-specific code lives only under `packages/adapters/*`.
3. UI should read adapter capability flags instead of hard-coding host names.
4. If the page is unknown, return `null` for context. Do not throw from content scripts.
5. Check whether a browser API exists before using it. `packages/shell` can supply a fallback.

## Tests

| Area | Expectation |
|------|-------------|
| Core | Automated unit tests |
| Adapters | Tests that feed sample URLs or HTML and check the resulting context |
| UI / extension | Manual check in a Chrome-based browser; also Firefox when browser shell code changes |

Test HTML and fixtures must not include secrets or private source code.

## Pull requests

- Say what changed and why
- Add tests or fixtures when you change core or parsers
- Update docs when shared types or behavior change
- Prefer per-site permissions; mention any new permission in the PR

## Architecture decision records (ADRs)

An ADR is a short file that records a major technical choice. Add files under `docs/decisions/` named `NNNN-short-title.md`:

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context
## Decision
## Consequences
```
