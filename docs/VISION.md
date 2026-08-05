# Vision

## Purpose

Git sites (GitHub, GitLab, and similar) keep comments, approvals, and CI results. Reviewers also make personal calls while reading a change: risk they accept, questions still open, follow-ups, or that an older call was replaced.

Decision Ledger saves those personal calls next to the change you are looking at (repo, number, and optional file, lines, and commit). It works on the Git sites you already use.

## Scope

**Included**

- Browser extension for Chrome-based browsers and Firefox
- Shared data types for all sites; one adapter per site (GitHub and GitLab first)
- Side panel for create, read, update, and delete
- Local IndexedDB storage on the device
- List filter: whole change, current commit, or all saved
- Decision statuses: `draft`, `decided`, `open_question`, `superseded`

**Not included**

- Doing the site’s own approve or merge actions
- A required cloud account
- A full PR tool (edit files, merge, re-run CI)
- Safari or mobile as first targets

## Rules

1. The app stores what the reviewer writes. Site approve/reject stays on the Git site.
2. Code that knows one site’s URLs or HTML lives only in that site’s adapter.
3. Reading the page URL is enough to attach a decision. Page HTML and APIs can add detail when available.
4. Storage defaults to the user’s device.
5. Prefer the extension’s own UI (side panel) over large changes to the Git site’s page.
6. Site access is requested per site when needed.
