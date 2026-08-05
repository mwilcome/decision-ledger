# Vision

## Problem

While reviewing a change, engineers make **decisions** that do not fit cleanly into forge primitives:

| Forge stores well | Often lost after the tab closes |
|-------------------|----------------------------------|
| Comments, threads | “We accept this risk because …” |
| Approve / request changes | “Open question for the author next sprint” |
| CI checks | “This supersedes what we decided on !88” |
| File diffs | Personal checklist of follow-ups across repos |

Tickets and ADRs help, but they are **out of band** and rarely linked to a specific revision, file, or review moment.

## Product statement

**Decision Ledger** is a browser extension that captures structured review decisions **in place** on supported Git forges, stores them **locally first**, and keeps them **portable across hosts** via a shared domain model—not a GitHub-only note pad.

## Who it is for

| Persona | Need |
|---------|------|
| Principal / staff engineers | Durable memory of risk calls and open questions across many repos |
| Tech leads | Lightweight personal or team ledger without standing up another SaaS |
| Reviewers on mixed stacks | Same workflow on GitHub *and* GitLab (and later other forges) |

## Principles

1. **Decisions ≠ forge review state** — Approvals and GitLab approval rules remain the forge’s job; we store *your* ledger.
2. **Adapters, not forks** — New git products plug in; core does not grow `if (gitlab)` trees.
3. **Degrade gracefully** — URL identity is enough to attach a note; DOM and APIs only enrich.
4. **Local-first, export-friendly** — Default is private storage; Markdown/JSON export early.
5. **Respect the host** — Prefer side panel / extension UI over heavy DOM injection that breaks on restyles.
6. **Optional trust surface** — Host permissions and tokens are opt-in per origin.

## In scope (v1 direction)

- WebExtension for **Chromium + Firefox**
- Host adapters starting with **GitHub.com** and **GitLab.com** (URL + minimal DOM)
- **Side panel** (or browser-equivalent shell) for create / search / edit decisions
- **Local persistence** (e.g. IndexedDB) and **Markdown export**
- **Decision lifecycle**: draft → decided | open_question → superseded
- Clear **extension points** for self-hosted instances and more forges

## Out of scope (v1)

| Non-goal | Why |
|----------|-----|
| Replacing forge review/approval systems | Wrong product; high liability |
| Cloud sync / multi-device accounts (required) | Can come later; privacy and scope |
| Full PR client (edit files, merge, CI re-run) | Scope explosion |
| Scraping private data for training / analytics | Explicit non-goal |
| Safari on day one | Packaging cost; second wave |
| Mobile browsers | Extension model differs |

## Success criteria (early)

- A reviewer can install a dev build, open a GitHub PR and a GitLab MR, and attach a decision that reappears after reload.
- A second forge can be added with a new adapter package + fixtures **without** changing core decision rules.
- Docs alone explain branching, standards, and architecture to a new contributor in one sitting.

## Related

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [decisions/0001-forge-agnostic-model.md](decisions/0001-forge-agnostic-model.md)
