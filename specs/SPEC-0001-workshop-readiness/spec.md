---
id: SPEC-0001
type: epic
title: NodeGrade workshop readiness
status: draft
parent: null
priority: P1
created: 2026-09-15
updated: 2026-09-15
depends_on: []
related:
  - SPEC-0002
  - SPEC-0003
  - SPEC-0004
  - SPEC-0005
  - SPEC-0006
  - SPEC-0007
  - SPEC-0008
  - SPEC-0009
---

# NodeGrade workshop readiness

## Intent

### Problem

NodeGrade is being presented at a workshop (WAIE tutorial) where participants watch a
guided workflow being built, then spend ~35 minutes adapting a preconfigured assessment
workflow. The current product is developer-oriented: the landing page is a placeholder,
graphs have no ownership, there is no template concept, the editor exposes low-level
mechanics, and intermediate execution results are invisible. This makes the promised
demo → inspect → modify → discuss journey impractical for 20–50 concurrent participants.

### Desired outcome

Participants can enter the workshop through a dedicated entry point, duplicate a
canonical assessment template into their own isolated workspace, adapt it using
high-level editing affordances (palette, inspector, insertable blocks), observe
node-by-node execution with intermediate outputs, and recover from mistakes — without
the facilitator having to explain NodeGrade's internals.

## Scope

### In scope

- Landing page and workshop entry routing (SPEC-0002)
- Template subsystem: workflow templates, insertable block templates, duplicate/reset
  semantics (SPEC-0003)
- Workspace/session isolation and multi-user storage (SPEC-0004)
- Editor shell redesign: toolbar, component palette, inspector, simplified nodes,
  sizing fix (SPEC-0005)
- Run/trace observability (SPEC-0006)
- Canonical WAIE workshop template and Test/Trace preview experience (SPEC-0007)
- Reliability hardening: CI gate, smoke test, error states, documentation (SPEC-0008)

### Out of scope

- General rewrite of the editor canvas engine
- LTI platform integration changes beyond workspace typing
- User account management / authentication
- Performance optimization beyond workshop-scale usage
- LLM provider management and model governance (SPEC-0009, separate epic)

## Actors

- Workshop facilitator: presents the tutorial, prepares and demonstrates workflows.
- Participant (anonymous): attends the workshop, duplicates a template, adapts a
  workflow in an ephemeral workspace. Not authenticated.
- Instructor (LTI context): uses NodeGrade inside a course via LTI launch.
- Expert user: builds workflows from primitives outside a workshop context.

## Child features

| ID | Feature | Status |
|---|---|---|
| SPEC-0002 | Landing page and workshop entry | Draft |
| SPEC-0003 | Template subsystem | Draft |
| SPEC-0004 | Workspace isolation and multi-user storage | Draft |
| SPEC-0005 | Editor shell and node UX | Draft |
| SPEC-0006 | Run and trace observability | Draft |
| SPEC-0007 | WAIE workshop experience and preview | Draft |
| SPEC-0008 | Reliability, CI and documentation | Draft |

Note: SPEC-0009 (LLM provider management and model governance) is a separate epic,
not a child of this one.

## Cross-feature business rules

- A template SHALL never be edited in place; using a template always creates a
  user-owned copy (SPEC-0003).
- Every workflow SHALL belong to exactly one workspace; graph listing and saving SHALL
  be scoped to the actor's workspace (SPEC-0004).
- Workflow identity SHALL NOT depend on the URL path of the editor route.

## Cross-feature constraints

- Requirements must be deliverable before the conference workshop; items prioritized
  P0 (SPEC-0002, SPEC-0003, SPEC-0004, SPEC-0005) form the minimum viable workshop set.

## Dependencies

- None external.

## Assumptions

- The workshop scenario involves 20–50 concurrent anonymous participants.
- LTI-launched usage remains a supported workflow identity source during migration.
- Existing stored graphs can be migrated into a default/personal workspace.
- Anonymous (WORKSHOP-type) workspaces auto-delete 60 days after creation (decided in
  SPEC-0004/FR-008).
- Templates ship bundled with the product initially; a server-side template store is a
  later evolution (assumption in SPEC-0003).
- Facilitator role is established via env-configured admin username/password (docker
  compose supplyable), no account/registration system (decided in SPEC-0003).

## Open questions

- None currently.

## Epic success criteria

- A facilitator can run the full tutorial flow (open workshop page → duplicate WAIE
  template → participants edit independently → run → inspect trace) with 20–50
  concurrent participants without graph collisions or verbal setup instructions.
- The conference happy path is covered by an automated smoke test that gates PRs.

## Change history

| Date | Change |
|---|---|
| 2026-09-15 | Initial specification created from workshop-readiness analysis |
| 2026-09-15 | Noted SPEC-0009 (LLM provider management) as a separate epic outside this epic's scope |
