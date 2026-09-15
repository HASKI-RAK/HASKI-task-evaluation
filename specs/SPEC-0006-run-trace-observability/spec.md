---
id: SPEC-0006
type: feature
title: Run and trace observability
status: draft
parent: SPEC-0001
priority: P1
created: 2026-09-15
updated: 2026-09-15
depends_on:
  - SPEC-0004
related:
  - SPEC-0005
  - SPEC-0007
---

# Run and trace observability

## Intent

### Problem

Workflow execution currently signals progress mainly by coloring the executing node
green; users only see final OutputNode results. The tutorial explicitly promises
participants insight into intermediate outputs, workflow structure, and reliability —
which requires per-node execution visibility.

### Desired outcome

A run/trace view listing each executed node in order with status, timing, and
(intermediate) outputs. Clicking a trace step highlights the corresponding node on the
canvas.

## Scope

### In scope

- Richer node execution events carrying node identity, status, timing, and optionally
  inputs/outputs.
- A trace panel listing per-node execution steps for the current run.
- Trace-to-canvas highlighting.
- Redaction of sensitive content (prompts/model internals) where appropriate.

### Out of scope

- Persistent run history across sessions (only the current run's trace is required).
- Replay or step-debugging of execution.
- Performance profiling dashboards.

## Actors

- Participant (anonymous): inspects intermediate outputs to understand the workflow.
- Facilitator: demonstrates transparency of the assessment pipeline.
- Expert user: diagnoses workflow behavior and errors.

## User scenarios

### US-001 — See intermediate outputs

As a participant,
I want to see each node's output during a run,
so that I understand how my assessment strategy produces its result step by step.

Priority: P1

Independent value: delivers the "transparent assessment workflow" concept.

### US-002 — Locate a failing node

As an expert user,
I want the trace to show which node failed and why,
so that I can fix the workflow without guessing.

Priority: P2

Independent value: makes errors actionable.

### US-003 — Jump from trace to canvas

As a participant,
I want clicking a trace step to highlight the node on the canvas,
so that I can connect the trace to the workflow structure.

Priority: P2

Independent value: links observation with structure.

## Functional requirements

### FR-001 — Node execution events

WHEN a node starts executing,
the system SHALL emit an execution event identifying the node, its status, and its
start time.

### FR-002 — Node completion events

WHEN a node finishes executing,
the system SHALL emit a completion event identifying the node, its status (completed or
failed), its duration, and optionally its outputs.

### FR-003 — Trace view

WHEN a run is executed,
the system SHALL display a trace view listing each node execution in chronological
order with status and duration.

### FR-004 — Trace shows outputs

WHEN a node's completion event includes outputs,
the trace view SHALL display the node's output content for that step.

### FR-005 — Trace-to-canvas highlight

WHEN a user activates a step in the trace view,
the system SHALL highlight the corresponding node on the canvas.

### FR-006 — Error reporting in trace

IF a node fails during execution,
THEN the trace view SHALL mark the step as failed and display the error information.

### FR-008 — Fail-fast execution

IF a node fails during execution,
THEN the system SHALL stop the run and SHALL NOT execute nodes downstream of the
failed node.

### FR-007 — Output redaction

WHERE node outputs contain sensitive prompt or model configuration content,
the system SHALL redact that content in trace output before it reaches the client.

## Non-functional requirements

### NFR-001 — Trace event latency

Trace events for a node SHALL be visible in the client within 1 second of the event
being emitted by the server.

### NFR-002 — Redaction completeness

Trace output SHALL NOT contain API keys or model credentials under any circumstances.

## Acceptance criteria

### AC-001 — Trace lists all steps

Traces to: FR-003

```gherkin
Given a workflow with three connected nodes
When the user runs the workflow
Then the trace view lists all three node executions in order with status and duration
```

### AC-002 — Trace shows intermediate output

Traces to: FR-004

```gherkin
Given a node emits outputs on completion
When the run completes
Then the trace view shows that node's output content at its step
```

### AC-003 — Trace highlights node

Traces to: FR-005

```gherkin
Given a completed run with a trace
When the user activates a trace step
Then the corresponding node is highlighted on the canvas
```

### AC-004 — Failed node visible in trace

Traces to: FR-006

```gherkin
Given a node that fails during a run
When the run ends
Then the trace view marks that step as failed and shows error information
```

### AC-006 — Fail-fast stop

Traces to: FR-008

```gherkin
Given a workflow where node B depends on node A and node A fails
When the user runs the workflow
Then node B and all downstream nodes are not executed
And the trace view shows the run stopped at node A
```

### AC-005 — Credentials never in trace

Traces to: FR-007, NFR-002

```gherkin
Given a workflow containing nodes with model credentials
When a run completes
Then the trace output contains no API keys or model credentials
```

## Edge cases

- Concurrent runs of the same workflow → trace shows the most recent run; older runs
  are not interleaved.
- Very large node outputs → trace truncates with an expand action rather than breaking
  layout.
- Independent branches not downstream of the failed node → their execution is out of
  scope for fail-fast; only direct downstream nodes are guaranteed skipped.

## Business rules

- Trace data is per-run and ephemeral; it is not stored with the workflow.

## Constraints

- Events must be transport-compatible with the existing event delivery mechanism.

## Dependencies

- SPEC-0004 (events scoped to the acting workspace).

## Assumptions

- Existing `nodeExecuting` / `nodeExecuted` events can be extended without breaking
  the current editor behavior.

## Open questions

- None currently.

## Success criteria

- During the guided demo, participants can observe each step's intermediate output as
  the facilitator builds the workflow.

## Change history

| Date | Change |
|---|---|
| 2026-09-15 | Initial specification created |
