# 0001. Shared core model with host adapters

- **Status:** Accepted
- **Date:** 2026-08-05

## Context

Git sites differ in URLs, review screens, and APIs. Building only for GitHub first would lock site assumptions into storage and UI.

## Decision

1. Shared types in core: `RepoRef`, `ChangeRef`, `CaptureContext`, `Decision`.
2. Each site implements `HostAdapter` for parse and observe.
3. Site approval and CI data are optional extras. A `Decision` is only what the user writes.
4. Browser-specific UI wiring lives in the shell package. Core is plain TypeScript.
5. Site permissions are requested per site. Parsing the URL is the minimum way to attach a decision.

## Consequences

- A new site means a new adapter package and test fixtures.
- Storage keys include host, instance URL, repo, and change number.
- UI can say “change” so the same words work for pull requests and merge requests.

## Other options considered

| Option | Why we did not pick it |
|--------|------------------------|
| GitHub only | We need more than one Git site |
| One big content script with many `if (host)` branches | Harder to test; site details leak into shared code |
| Cloud service as the main store | Default product keeps data on the device |
