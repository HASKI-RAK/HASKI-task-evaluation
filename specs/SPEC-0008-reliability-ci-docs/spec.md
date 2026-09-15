---
id: SPEC-0008
type: feature
title: Reliability, CI and documentation
status: draft
parent: SPEC-0001
priority: P1
created: 2026-09-15
updated: 2026-09-15
depends_on:
  - SPEC-0002
  - SPEC-0003
  - SPEC-0004
  - SPEC-0007
related: []
---

# Reliability, CI and documentation

## Intent

### Problem

The root test pipeline only runs backend tests (frontend tests are excluded), the only
CI workflow runs a report on pushes to `main` without gating pull requests, and the
README has incomplete sections (Example Usage: TODO, Docker: TODO). Conference
readiness requires the exact demo flow to be protected by automation and documented.

### Desired outcome

A PR-gating CI pipeline covering both packages plus build, typecheck, lint, and a
browser smoke test of the conference happy path, and documentation enabling setup,
template authoring, and participant onboarding.

## Scope

### In scope

- PR CI pipeline: install, typecheck, lint, backend unit tests, frontend unit tests,
  build, browser smoke test.
- Browser smoke test covering the conference happy path.
- README completion: usage, deployment, workshop setup, template authoring,
  participant instructions.
- Root test script alignment so frontend tests are part of the default test run.

### Out of scope

- Load/performance testing infrastructure.
- Visual regression testing.
- Release/deployment automation beyond the documented checklist.

## Actors

- Contributor: needs PR feedback on all packages.
- Facilitator: needs setup and workshop documentation.
- Participant: needs concise instructions.

## User scenarios

### US-001 — Conference flow protected by CI

As a maintainer,
I want a smoke test that walks the conference happy path on every PR,
so that regressions in the demo flow cannot be merged unnoticed.

Priority: P1

Independent value: protects the single most valuable demonstration.

### US-002 — One command tests everything

As a contributor,
I want the root test command to include frontend and backend tests,
so that I cannot accidentally skip half the test suite.

Priority: P2

Independent value: removes a silent coverage gap.

## Functional requirements

### FR-001 — PR gating pipeline

WHEN a pull request is opened or updated,
CI SHALL run install, typecheck, lint, backend unit tests, frontend unit tests, build,
and the browser smoke test, and SHALL fail the check if any step fails.

### FR-002 — Conference happy path smoke test

The smoke test SHALL cover: opening the application root, choosing the WAIE workshop
entry, duplicating the template, loading the editor, modifying the rubric, running an
example, observing a result, reloading, and finding the workflow still present.

### FR-003 — Root test script coverage

The root test command SHALL execute both backend and frontend unit tests.

### FR-005 — Browser coverage

The browser smoke test SHALL run in both Chrome and Firefox.

### FR-004 — Documentation completeness

The README SHALL document: application usage, deployment, workshop setup, template
authoring, and participant instructions, replacing the current TODO sections.

## Non-functional requirements

### NFR-001 — CI duration

The full PR pipeline SHALL complete within 15 minutes.

## Acceptance criteria

### AC-001 — PR checks run

Traces to: FR-001

```gherkin
Given a pull request is opened
When CI completes
Then all steps (install, typecheck, lint, backend tests, frontend tests, build, smoke test) have run
And a failing step fails the overall check
```

### AC-002 — Smoke test covers happy path

Traces to: FR-002

```gherkin
Given the application is running
When the smoke test executes
Then it performs the full conference flow from landing page through template duplication, rubric edit, run, result, reload persistence
```

### AC-003 — Root test runs both packages

Traces to: FR-003

```gherkin
Given the repository is checked out
When the root test command runs
Then backend and frontend unit tests both execute
```

### AC-004 — README has no TODO sections

Traces to: FR-004

```gherkin
Given the README
When a reader looks for usage, deployment, workshop setup, template authoring, or participant instructions
Then each section contains complete guidance and no TODO placeholders remain
```

### AC-005 — Smoke test runs in both browsers

Traces to: FR-005

```gherkin
Given CI is running the PR pipeline
When the browser smoke test executes
Then it passes in Chrome and in Firefox
```

## Edge cases

- Smoke test flakiness → retry policy defined in CI configuration, failures block
  merge regardless.

## Business rules

- PRs SHALL NOT merge while the CI check fails.

## Constraints

- None.

## Dependencies

- SPEC-0002, SPEC-0003, SPEC-0004, SPEC-0007 (the smoke test walks flows those
  features define).

## Assumptions

- A headless browser environment is available in CI.

## Open questions

- None currently.

## Success criteria

- The conference happy path is exercised automatically on every PR and the README
  enables a newcomer to set up and run a workshop without oral handover.

## Change history

| Date | Change |
|---|---|
| 2026-09-15 | Initial specification created |
