---
id: SPEC-0004
type: feature
title: Workspace isolation and multi-user storage
status: draft
parent: SPEC-0001
priority: P0
created: 2026-09-15
updated: 2026-09-15
depends_on: []
related:
  - SPEC-0002
  - SPEC-0003
---

# Workspace isolation and multi-user storage

## Intent

### Problem

Graphs are globally identified only by a unique `path`. The API returns every stored
graph, and saving upserts by that path. With 20–50 concurrent workshop participants
this causes collisions, cross-participant visibility, and impossible shared slugs (e.g.
everyone wanting `rubric-assessment`).

### Desired outcome

Every workflow belongs to exactly one workspace. Workflow listing, saving, and
collaboration are scoped to the actor's workspace. Anonymous participants get an
ephemeral browser-generated workspace identity; LTI and personal usage map to their own
workspace types.

## Scope

### In scope

- Workspace concept with type WORKSHOP | LTI | PERSONAL and an owner/session identifier.
- Workflow entity scoped to a workspace with slug uniqueness per workspace.
- Anonymous browser-generated ephemeral workspace identity.
- Migration of existing path-identified graphs into a default workspace.
- Workspace-scoped graph listing and saving.

### Out of scope

- Authentication, login, and user account management.
- Real-time collaborative editing between multiple participants.
- Workspace sharing or permissions beyond "scoped to one workspace".

## Actors

- Participant (anonymous): owns one ephemeral workspace per browser session.
- Instructor (LTI context): workspace tied to the LTI launch context.
- Expert user: personal workspace.
- Facilitator: may hold the workshop workspace containing prepared workflows.

## User scenarios

### US-001 — Participants never collide

As a participant,
I want my workflows stored in my own workspace,
so that my edits and saves cannot affect or be affected by other participants.

Priority: P1

Independent value: makes multi-user operation safe without accounts.

### US-002 — Same slug in every workspace

As a participant,
I want to name my workflow `rubric-assessment` even when others use the same name,
so that naming is natural and collisions do not block saving.

Priority: P1

Independent value: removes a class of confusing save failures.

### US-003 — Scoped workflow list

As a participant,
I want the workflow dropdown to show only my own workflows,
so that I do not see or accidentally edit other participants' work.

Priority: P1

Independent value: privacy and reduced cognitive load.

## Functional requirements

### FR-001 — Workspace scoping of graphs

WHEN any graph listing or graph save operation is performed,
the system SHALL scope the operation to exactly one workspace.

### FR-002 — Workflow identity

The system SHALL identify workflows by a workspace reference plus a slug, and SHALL
enforce slug uniqueness within a workspace.

### FR-003 — Anonymous workspace

WHEN an anonymous user first uses NodeGrade in a browser session,
the system SHALL establish an ephemeral workspace identified by a browser-generated
unique identifier, persisted in browser storage.

### FR-004 — Same slug across workspaces

WHEN two different workspaces each save a workflow with the same slug,
the system SHALL store them as distinct workflows.

### FR-005 — Save is scoped

WHEN a user saves a workflow,
the system SHALL update only the workflow matching the user's workspace and slug,
and SHALL never create or modify a workflow in another workspace.

### FR-006 — Migration of existing graphs

WHEN the system is migrated to workspace-scoped storage,
the system SHALL place all pre-existing path-identified graphs into a single default
workspace while preserving their content.

### FR-007 — LTI workspace mapping

WHEN a workflow is created via an LTI launch context,
the system SHALL associate it with a workspace of type LTI derived from the launch
context.

### FR-008 — Ephemeral workspace retention

WHEN an anonymous (WORKSHOP-type) workspace is older than 60 days,
the system SHALL delete that workspace together with all workflows it contains.

## Non-functional requirements

### NFR-001 — Ephemeral persistence

An anonymous workspace identity SHALL survive page reloads within the same browser
profile for the duration of the workshop.

## Acceptance criteria

### AC-001 — Two participants, same slug

Traces to: FR-002, FR-004

```gherkin
Given two different anonymous workspaces
When each workspace saves a workflow with slug "rubric-assessment"
Then two distinct workflows exist, one per workspace
```

### AC-002 — Listing is scoped

Traces to: FR-001

```gherkin
Given workflows exist in workspace A and workspace B
When a user in workspace A lists workflows
Then only workspace A workflows are returned
```

### AC-003 — Anonymous identity persists across reload

Traces to: FR-003, NFR-001

```gherkin
Given an anonymous user has an established workspace
When the user reloads the page
Then the same workspace is used and their workflows are visible
```

### AC-004 — Save cannot cross workspaces

Traces to: FR-005

```gherkin
Given a workflow exists in workspace B
When a user in workspace A saves their own workflow
Then the workspace B workflow is unchanged
```

### AC-005 — Existing graphs preserved on migration

Traces to: FR-006

```gherkin
Given the system contains pre-migration graphs
When the migration to workspace storage completes
Then every pre-existing graph is accessible in the default workspace with unchanged content
```

### AC-006 — Ephemeral workspaces expire after 60 days

Traces to: FR-008

```gherkin
Given an anonymous workspace last used more than 60 days ago
When the retention cleanup runs
Then the workspace and all of its workflows are deleted
And owned workspaces (LTI, PERSONAL) are unaffected
```

## Edge cases

- Browser storage cleared mid-workshop → a new ephemeral workspace is created;
  previous workflows are unreachable (accepted trade-off, documented).
- Two tabs in the same browser → they share the same ephemeral workspace.
- A participant returns after 60+ days → their workflows are gone; this is the
  documented cost of the retention policy and may only surprise outside the workshop
  window, where no work is expected to be preserved.

## Business rules

- Every workflow SHALL belong to exactly one workspace at all times.
- Retention deletion SHALL apply only to anonymous (WORKSHOP-type) workspaces; LTI and
  PERSONAL workspaces are never auto-deleted.

## Constraints

- Existing stored graph content format must remain readable during migration.

## Dependencies

- None (this is a prerequisite for SPEC-0002 and SPEC-0003).

## Assumptions

- No authentication is required for the conference; workspace identity alone provides
  adequate isolation.

## Open questions

- None currently.

## Success criteria

- 20–50 concurrent participants can each save a workflow with the same slug without
  collisions or cross-visibility.

## Change history

| Date | Change |
|---|---|
| 2026-09-15 | Initial specification created |

| 2026-09-15 | Retention decision: anonymous workspaces auto-delete after 60 days (FR-008, AC-006); open question resolved |