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
  - SPEC-0014
---

# Workspace isolation and multi-user storage

## Intent

### Problem

Graphs are globally identified only by a unique `path`. The API returns every stored
graph, and saving upserts by that path. With 20–50 concurrent workshop participants
this causes collisions, cross-participant visibility, and impossible shared slugs (e.g.
everyone wanting `rubric-assessment`).

### Desired outcome

Every workflow belongs to exactly one workspace. Every workflow operation — load,
create, save, delete, duplicate, reset, execution — is scoped to the actor's
workspace, derived server-side from an opaque access token rather than a
caller-supplied workspace id. Anonymous users get an ephemeral workspace backed by a
high-entropy access token; LTI and personal usage map to their own workspace types.

## Scope

### In scope

- Workspace concept with type BROWSER | WORKSHOP | LTI | PERSONAL.
- Opaque high-entropy workspace access token issued by the backend; the backend
  derives the allowed workspace from the token and never trusts a caller-supplied
  workspace id alone.
- Workflow entity scoped to a workspace with slug uniqueness per workspace.
- Anonymous browser workspace identity persisted in browser storage together with its
  access token.
- Full workspace-scoped CRUD: list, load/read, create, save/update, delete,
  duplicate-from-template, reset, execution.
- Migration of existing path-identified graphs into a default workspace.
- Retention based on last activity (lastActiveAt), with defined update triggers.
- Precise LTI workspace mapping rule.

### Out of scope

- Authentication, login, and user account management (facilitator admin sessions are
  SPEC-0013).
- Real-time collaborative editing between multiple participants.
- Workspace sharing or permissions beyond "scoped to one workspace".

## Actors

- Participant (anonymous): owns one ephemeral browser workspace; when joining a
  workshop, additionally receives a workshop-associated workspace (SPEC-0014).
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

### FR-001 — Workspace scoping of all operations

WHEN any workflow operation is performed (list, load/read, create, save/update,
delete, duplicate-from-template, reset, execution),
the system SHALL scope the operation to exactly one workspace.

### FR-002 — Workflow identity

The system SHALL identify workflows by a workspace reference plus a slug, and SHALL
enforce slug uniqueness within a workspace.

### FR-003 — Anonymous workspace with access token

WHEN an anonymous user first uses NodeGrade in a browser session,
the system SHALL establish an ephemeral workspace and SHALL issue an opaque
high-entropy workspace access token, persisted in browser storage together with the
workspace reference.

### FR-004 — Server-side authorization from token

WHEN any workspace-scoped request is performed,
the system SHALL derive the allowed workspace from the presented access token and
SHALL NOT authorize a request based on a caller-supplied workspace id alone.

### FR-005 — Same slug across workspaces

WHEN two different workspaces each save a workflow with the same slug,
the system SHALL store them as distinct workflows.

### FR-006 — Save is scoped

WHEN a user saves a workflow,
the system SHALL update only the workflow matching the user's workspace and slug,
and SHALL never create or modify a workflow in another workspace.

### FR-007 — Migration of existing graphs

WHEN the system is migrated to workspace-scoped storage,
the system SHALL place all pre-existing path-identified graphs into a single default
workspace while preserving their content.

### FR-008 — LTI workspace mapping

WHEN a workflow is created via an LTI launch context,
the system SHALL associate it with a workspace of type LTI keyed by the stable
combination of the launch issuer and the launch context/resource identity, so that
the same launch context consistently maps to the same workspace.

### FR-009 — Retention based on last activity

WHEN a BROWSER-type workspace has had no activity for 60 days,
the system SHALL delete that workspace together with all workflows it contains.

### FR-010 — Activity tracking

WHEN a workspace is created or any authenticated workspace-scoped operation succeeds,
the system SHALL update the workspace's lastActiveAt timestamp.

### FR-011 — Workshop workspaces exempt from retention

WHILE a workspace is of type WORKSHOP, LTI, or PERSONAL,
the system SHALL NOT auto-delete it under the retention policy.

## Non-functional requirements

### NFR-001 — Ephemeral persistence

An anonymous workspace identity SHALL survive page reloads within the same browser
profile for the duration of the workshop.

## Acceptance criteria

### AC-001 — Two participants, same slug

Traces to: FR-002, FR-005

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

Traces to: FR-006

```gherkin
Given a workflow exists in workspace B
When a user in workspace A saves their own workflow
Then the workspace B workflow is unchanged
```

### AC-005 — Existing graphs preserved on migration

Traces to: FR-007

```gherkin
Given the system contains pre-migration graphs
When the migration to workspace storage completes
Then every pre-existing graph is accessible in the default workspace with unchanged content
```

### AC-006 — Idle workspaces expire after 60 days

Traces to: FR-009, FR-010

```gherkin
Given a BROWSER-type workspace with no activity for more than 60 days
When the retention cleanup runs
Then the workspace and all of its workflows are deleted
And a BROWSER-type workspace with activity within 60 days is not deleted
And WORKSHOP, LTI, and PERSONAL workspaces are never auto-deleted
```

### AC-007 — Workspace id alone does not authorize

Traces to: FR-004

```gherkin
Given a request presenting workspace B's id but workspace A's access token
When the request targets workspace B's workflows
Then the request is rejected or resolved against workspace A only
And workspace B's content is not returned
```

### AC-008 — Load and delete are scoped

Traces to: FR-001

```gherkin
Given a workflow exists in workspace B
When a user in workspace A attempts to load or delete that workflow by id
Then the operation is rejected
```

### AC-009 — LTI launch maps to stable workspace

Traces to: FR-008

```gherkin
Given an LTI launch from the same issuer and context twice
When workflows are created in both launches
Then both workflows belong to the same LTI workspace
And a launch from a different context maps to a different workspace
```

## Edge cases

- Browser storage cleared mid-workshop → a new ephemeral workspace is created;
  previous workflows are unreachable (accepted trade-off, documented).
- Two tabs in the same browser → they share the same ephemeral workspace and token.
- A participant returns after 60+ days of inactivity → their workflows are gone; this
  is the documented cost of the retention policy and may only surprise outside the
  workshop window, where no work is expected to be preserved.
- A stolen workspace id without the access token → grants nothing; all requests are
  authorized from the token.

## Business rules

- Every workflow SHALL belong to exactly one workspace at all times.
- Retention deletion SHALL apply only to BROWSER-type workspaces; WORKSHOP, LTI, and
  PERSONAL workspaces are never auto-deleted.
- A workspace id SHALL NOT itself be an authorization credential; authorization SHALL
  derive from the workspace access token.

## Constraints

- Existing stored graph content format must remain readable during migration.
- The workspace access token SHALL be opaque and high-entropy; it SHALL NOT be
  derivable from the workspace id.

## Dependencies

- None (this is a prerequisite for SPEC-0002, SPEC-0003, and SPEC-0014).

## Assumptions

- No authentication is required for anonymous users; the workspace access token alone
  provides adequate isolation for the conference scenario.

## Open questions

- None currently.

## Success criteria

- 20–50 concurrent participants can each save a workflow with the same slug without
  collisions, cross-visibility, or IDOR-style access to other participants' graphs.

## Change history

| Date | Change |
|---|---|
| 2026-09-15 | Initial specification created |
| 2026-09-15 | Retention decision: anonymous workspaces auto-delete after 60 days (FR-008, AC-006); open question resolved |
| 2026-09-15 | Hardened isolation: opaque workspace access tokens as authorization (FR-003/004, AC-007), full CRUD scoping (FR-001, AC-008), retention re-anchored to lastActiveAt with defined update triggers (FR-009/010, AC-006), workspace types BROWSER|WORKSHOP|LTI|PERSONAL, precise LTI mapping rule (FR-008, AC-009), workshop workspaces exempt from retention (FR-011) |