---
id: SPEC-0007
type: feature
title: WAIE workshop experience and preview
status: draft
parent: SPEC-0001
priority: P1
created: 2026-09-15
updated: 2026-09-15
depends_on:
  - SPEC-0003
  - SPEC-0004
  - SPEC-0006
related:
  - SPEC-0002
  - SPEC-0005
---

# WAIE workshop experience and preview

## Intent

### Problem

The tutorial promises participants a canonical free-text assessment workflow (WAIE)
they can adapt — changing rubrics, feedback strategies, or adding validation/review
steps. No such canonical template exists, and the current preview mixes German UI
labels with English warnings, imposes a hard-coded 10-character minimum answer length,
and fixes the preview drawer at a static width.

### Desired outcome

A canonical WAIE workshop template (Input → Assessment → Classification → Feedback) is
shipped with the product, and the editor's preview becomes a workshop-ready test/trace
experience with English UI and workflow-configurable answer constraints.

## Scope

### In scope

- Canonical WAIE free-text assessment template as the shipped workshop template.
- Preview experience restructured as a Test tab and a Trace tab.
- Test tab: question display, student answer input, run action, results display (score,
  classification, feedback).
- English UI for the participant-facing preview, with localization support.
- Answer length minimum configurable by the workflow, not fixed in the UI.

### Out of scope

- Multiple additional workshop templates (the gallery is generic, see SPEC-0003).
- Full internationalization framework beyond EN/DE for participant-facing strings.

## Actors

- Participant (anonymous): runs and adapts the WAIE workflow.
- Facilitator: demonstrates the WAIE workflow during the guided part.

## User scenarios

### US-001 — Adapt one part of the workflow

As a participant,
I want a canonical assessment workflow where I can modify the rubric, feedback
strategy, or add a validation block,
so that I can perform the workshop assignment directly.

Priority: P1

Independent value: this is the workshop's core exercise.

### US-002 — Test the assessment end to end

As a participant,
I want to enter a question and student answer, run the assessment, and see score,
classification, and feedback together,
so that I can evaluate the effect of my changes.

Priority: P1

Independent value: closes the edit → test loop.

### US-003 — Configure answer constraints

As a facilitator,
I want the minimum answer length to be part of the workflow,
so that short-answer grading scenarios are not blocked by a fixed UI rule.

Priority: P2

Independent value: makes the tool usable beyond long free-text answers.

## Functional requirements

### FR-001 — Canonical WAIE template

The system SHALL ship a canonical WAIE free-text assessment template structured as:
Input (question, student answer) → Assessment (rubric, rubric prompt, LLM, score) →
Classification → Feedback (feedback prompt, LLM, feedback output).

### FR-002 — Test tab

WHEN the user opens the preview's Test tab,
the system SHALL display the question, a student answer input, a run action, and a
results area.

### FR-003 — Results display

WHEN a test run completes,
the system SHALL display the resulting score, classification, and feedback in the
results area.

### FR-004 — Trace tab

WHEN the user opens the preview's Trace tab,
the system SHALL display the run trace as defined in SPEC-0006.

### FR-005 — English participant UI

The participant-facing preview interface SHALL be presented in English by default.

### FR-006 — Workflow-configurable minimum answer length

WHILE a workflow defines a minimum answer length,
the test tab SHALL enforce that value instead of any fixed UI-level minimum.

### FR-007 — No fixed answer-length policy

The preview SHALL NOT impose a fixed hard-coded minimum answer length.

## Non-functional requirements

### NFR-001 — Localization readiness

Participant-facing preview strings SHALL be extractable for localization (at minimum EN
and DE).

## Acceptance criteria

### AC-001 — WAIE template available

Traces to: FR-001

```gherkin
Given the template gallery
When the user browses workflow templates
Then the canonical WAIE free-text assessment template is available and matches the Input → Assessment → Classification → Feedback structure
```

### AC-002 — End-to-end test run

Traces to: FR-002, FR-003

```gherkin
Given the WAIE workflow is open in the editor
When the user enters a question and a student answer and runs the assessment
Then the results area shows a score, a classification, and feedback
```

### AC-003 — Trace tab available

Traces to: FR-004

```gherkin
Given a run has been executed
When the user opens the Trace tab
Then the run trace is displayed as defined in SPEC-0006
```

### AC-004 — English UI

Traces to: FR-005

```gherkin
Given the preview is open
When the user views the test tab
Then all participant-facing labels and messages are in English
```

### AC-005 — Configurable answer minimum

Traces to: FR-006, FR-007

```gherkin
Given a workflow whose minimum answer length is 0
When the user submits an empty answer attempt shorter than 10 characters
Then the run is permitted (no fixed 10-character block applies)
And when the workflow sets a minimum of 20 characters, a 15-character answer is rejected with the configured limit stated
```

## Edge cases

- Test run while another run is in flight → previous run's results are superseded
  clearly or the new run is rejected with feedback.
- WAIE template used outside a workshop → fully functional as a normal template.

## Business rules

- The WAIE template is the canonical workshop starting point; there SHALL be exactly
  one canonical WAIE template.

## Constraints

- None beyond existing template format (SPEC-0003).

## Dependencies

- SPEC-0003 (template mechanism), SPEC-0004 (workspace-owned copies), SPEC-0006
  (trace).

## Assumptions

- The existing TaskView result rendering (text outputs, scores, classifications) can
  be reused for the results area.

## Open questions

- Should the WAIE template's rubric be editable inline in the inspector only, or also
  shown in the Test tab?

## Success criteria

- A participant can complete the assignment (modify rubric / feedback / add
  validation) and verify the effect with a test run in under 10 minutes.

## Change history

| Date | Change |
|---|---|
| 2026-09-15 | Initial specification created |
