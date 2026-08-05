# Vision

## Purpose

Forges store comments, approvals, and CI. They do not store the reviewer's own decisions (risk accepted, open question, follow-up, superseded call).

Decision Ledger records those decisions in context of a change (repo, number, optional file/lines and revision) on the hosts the user already uses.

## Scope

**In**

- WebExtension on Chromium and Firefox
- Shared domain model; host adapters (GitHub and GitLab first)
- Side panel UI for create, search, edit, export
- Local storage; Markdown/JSON export
- Decision statuses: `draft`, `decided`, `open_question`, `superseded`

**Out**

- Replacing forge approve/merge flows
- Required cloud account or sync
- Full PR client (edit, merge, re-run CI)
- Safari and mobile as initial targets

## Rules

1. User decisions are not the same as forge review state.
2. Host code lives in adapters only.
3. URL parse is enough to attach a decision; DOM and APIs only add detail.
4. Default storage is local.
5. Prefer extension UI over heavy page injection.
6. Host permissions are opt-in per origin.
