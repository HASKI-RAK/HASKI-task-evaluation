---
id: SPEC-0003
type: feature
title: Template subsystem
status: draft
parent: SPEC-0001
priority: P0
created: 2026-09-15
updated: 2026-09-15
depends_on:
  - SPEC-0004
related:
  - SPEC-0002
  - SPEC-0007
---

# Template subsystem

## Intent

### Problem

NodeGrade currently has one concept — a graph identified by a unique path holding a
serialized canvas blob. Importing a JSON file replaces the entire graph via
`configure()`. The workshop requires participants to adapt preconfigured workflows and
insert reusable assessment components (rubric scorer, feedback generator, validation)
without constructing them from low-level primitives.

### Desired outcome

Templates are a first-class domain concept with two kinds: complete workflow templates
(starting points) and insertable block templates (reusable subgraphs). Using a template
always creates a user-owned copy; inserting a block splices it into the current
workflow as one undoable operation.

## Scope

### In scope

- Template definition model: metadata (id, name, description, category, tags, type:
  workflow | block) plus graph content (nodes, links).
- Template gallery browsing with preview.
- "Use template" → duplicate into the user's workspace as a new editable workflow.
- "Reset to template" recovery action during a workshop.
- Block insertion into an existing workflow: new node IDs, remapped link IDs, position
  offset relative to the current viewport, selection of inserted nodes, single undoable
  operation.
- Insert palette with tabs: Nodes | Blocks | Templates.

### Out of scope

- Server-side template store and template versioning (assumption: templates ship
  bundled with the product for now).
- Editing templates in place.
- Template marketplace or sharing between users.

## Actors

- Facilitator (admin): authors, modifies, publishes, and unpublishes templates; the
  only role allowed to change template definitions.
- Participant (anonymous): duplicates the workshop template, inserts blocks; cannot
  modify template definitions.
- Expert user: browses templates and blocks for general use; cannot modify template
  definitions.

## User scenarios

### US-001 — Start from a complete template

As a participant,
I want to pick a complete assessment workflow template and get my own editable copy,
so that I can adapt an existing strategy instead of building from primitives.

Priority: P1

Independent value: any user can bootstrap a working assessment workflow in one action.

### US-002 — Insert a reusable block

As a participant,
I want to insert a block such as "Rubric scorer" into my current workflow,
so that I can add a validation or review step without wiring low-level nodes.

Priority: P1

Independent value: enables the core workshop activity — changing one part of the
workflow.

### US-003 — Recover from mistakes

As a participant,
I want to reset my workflow back to its template,
so that I can recover when my edits have broken the graph mid-exercise.

Priority: P1

Independent value: critical for live workshops; prevents dead ends.

## Functional requirements

### FR-001 — Template definition

The system SHALL support template definitions consisting of metadata (unique id, name,
description, category, tags, type: workflow or block) and graph content (nodes and
links).

### FR-002 — Template gallery

WHEN a user opens the template gallery,
the system SHALL list available templates with name, description, and category, and
SHALL allow filtering by type (workflow / block).

### FR-003 — Template preview

WHEN a user selects a template in the gallery,
the system SHALL show a preview of the template's structure before use.

### FR-004 — Use template creates a copy

WHEN a user activates "Use template" for a workflow template,
the system SHALL create a new workflow in the user's workspace containing a copy of the
template graph, and SHALL open it in the editor.

### FR-005 — Templates are immutable

IF a user attempts to edit a template directly,
THEN the system SHALL not modify the template definition; all edits apply to the
user-owned copy.

### FR-006 — Reset to template

WHEN a user activates "Reset to template" on a workflow that was created from a
template,
the system SHALL replace the workflow's graph with a fresh copy of the template graph
after user confirmation.

### FR-007 — Block insertion

WHEN a user activates "Insert block" for a block template,
the system SHALL add the block's nodes and links into the current workflow without
removing existing content.

### FR-008 — Block insertion identity remapping

WHEN a block is inserted,
the system SHALL assign new unique node identifiers and remap the block's internal link
identifiers so they do not collide with existing graph content.

### FR-009 — Block insertion placement

WHEN a block is inserted,
the system SHALL place the block's nodes relative to the current viewport/cursor
position.

### FR-010 — Block insertion is one undoable operation

WHEN a block is inserted,
the system SHALL record the insertion as a single undoable editor operation and select
the newly inserted nodes.

### FR-011 — Insert palette

WHEN a user opens the insert palette in the editor,
the system SHALL offer tabs for Nodes, Blocks, and Templates, and searchable entries
with workshop-friendly categories and descriptions.

### FR-012 — Template administration restricted to facilitator

WHEN a user who is not a facilitator attempts to create, modify, publish, or unpublish
a template definition,
THEN the system SHALL reject the action.

### FR-013 — Facilitator template management

WHEN a facilitator creates, modifies, publishes, or unpublishes a template definition,
the system SHALL apply the change to the canonical template set.

### FR-014 — Published templates visible to all

WHILE a template is published,
the system SHALL offer it in the template gallery to all users.

### FR-015 — Unpublished templates hidden

WHILE a template is not published,
the system SHALL NOT offer it in the template gallery to non-facilitator users.

### FR-016 — Facilitator authentication

WHEN a user presents the admin credentials configured on the server,
the system SHALL treat that user as a facilitator.

### FR-017 — Invalid credentials rejected

IF template administration is attempted without valid facilitator credentials,
THEN the system SHALL reject the action without granting facilitator privileges.

## Non-functional requirements

### NFR-001 — Insert latency

Block insertion SHALL complete within 500 ms for blocks of up to 20 nodes.

## Acceptance criteria

### AC-001 — Use template duplicates

Traces to: FR-004, FR-005

```gherkin
Given a published workflow template
When the user activates "Use template"
Then a new workflow owned by the user's workspace is created from the template and opened in the editor
And the template definition itself is unchanged
```

### AC-002 — Reset restores template graph

Traces to: FR-006

```gherkin
Given a workflow created from a template with modified content
When the user activates "Reset to template" and confirms
Then the workflow graph matches a fresh copy of the template graph
```

### AC-003 — Reset requires confirmation

Traces to: FR-006

```gherkin
Given a workflow created from a template
When the user activates "Reset to template"
Then a confirmation is required before the graph is replaced
```

### AC-004 — Insert block preserves existing graph

Traces to: FR-007, FR-008

```gherkin
Given a workflow with existing nodes
When the user inserts a block template
Then the existing nodes and links remain intact
And the block's nodes have identifiers that do not collide with existing ones
```

### AC-005 — Insert block is undoable

Traces to: FR-010

```gherkin
Given a block was just inserted
When the user performs undo
Then the inserted nodes and links are removed and the graph returns to its prior state
```

### AC-006 — Inserted block is placed near viewport

Traces to: FR-009

```gherkin
Given the user has panned the canvas away from the origin
When the user inserts a block
Then the block's nodes appear within the visible viewport area
```

### AC-007 — Gallery shows metadata

Traces to: FR-002, FR-003

```gherkin
Given multiple templates of both types exist
When the user opens the template gallery
Then each template shows name, description, and category, and can be filtered by type
And selecting a template shows a structural preview
```

### AC-008 — Non-facilitator cannot modify templates

Traces to: FR-005, FR-012

```gherkin
Given a user who is not a facilitator
When the user attempts to modify or delete a template definition
Then the action is rejected
And the template definition is unchanged
```

### AC-009 — Facilitator publishes a template

Traces to: FR-013, FR-014

```gherkin
Given a facilitator has created a template in unpublished state
When the facilitator publishes the template
Then the template appears in the gallery for all users
```

### AC-010 — Unpublished template hidden from participants

Traces to: FR-015

```gherkin
Given a template is unpublished
When a non-facilitator user opens the template gallery
Then the template is not listed
And when the facilitator opens the gallery, the template is listed with its unpublished state
```

### AC-011 — Facilitator authenticates with env-configured credentials

Traces to: FR-016

```gherkin
Given the server has admin credentials configured via environment variables
When a user authenticates with those credentials
Then the user acts as facilitator and can manage template definitions
```

### AC-012 — Wrong credentials rejected

Traces to: FR-017

```gherkin
Given the server has admin credentials configured
When a user authenticates with incorrect credentials
Then no facilitator privileges are granted
And template administration actions are rejected
```

## Edge cases

- Inserting a block into an empty workflow → allowed; behaves like a partial start.
- Template graph references node types not registered in the current build → template
  is flagged unavailable rather than partially imported.
- Duplicate "Use template" clicks → each click creates a distinct workflow copy, no
  silent overwrite.

## Business rules

- A template SHALL never be edited in place; user actions always operate on
  workspace-owned copies.
- A workflow created from a template SHALL retain a reference to its source template id
  (required for reset).
- Template authoring, modification, and publication SHALL be restricted to the
  facilitator (admin) role.

## Constraints

- Template graph content uses the same node/link model as stored workflows.
- The facilitator role SHALL be established through an admin username and password
  configured as server environment variables (supplyable via docker compose); no
  additional user-account or registration system is introduced for the facilitator
  role.

## Dependencies

- SPEC-0004 (workflows must be workspace-owned for copies and reset).

## Assumptions

- Templates are bundled with the product initially; a server-side template store is a
  later evolution.

## Open questions

- Should block templates support declared external input/output ports so insertion can
  auto-suggest connections to existing nodes?

## Success criteria

- A participant can go from gallery → own editable WAIE workflow in under 30 seconds.
- A broken participant graph can be restored to template state in one action.

## Change history

| Date | Change |
|---|---|
| 2026-09-15 | Initial specification created |
| 2026-09-15 | Added facilitator (admin) role: template authoring/publication restricted to facilitator (FR-012..FR-015, AC-008..AC-010) |
| 2026-09-15 | Facilitator authentication decided: env-based admin username/password, supplyable via docker compose (FR-016..FR-017, AC-011..AC-012, constraint added) |
