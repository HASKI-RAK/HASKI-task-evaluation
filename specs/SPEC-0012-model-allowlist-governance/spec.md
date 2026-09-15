---
id: SPEC-0012
type: feature
title: Model allowlist governance
status: draft
parent: SPEC-0009
priority: unset
created: 2026-09-15
updated: 2026-09-15
depends_on:
  - SPEC-0011
related:
  - SPEC-0010
---

# Model allowlist governance

## Intent

### Problem

Every model offered by an enabled provider is selectable by end users. When an
administrator configures OpenRouter with a shared key, users could pick any of
hundreds of models — including expensive or inappropriate ones — with no way to
restrict the choice.

### Desired outcome

The administrator defines, per provider, the subset of models users may select. The
LLM node offers only allowed models, and execution of disallowed models is rejected
server-side regardless of what the client requests.

## Scope

### In scope

- Per-provider model allowlist edited by the facilitator in the admin UI.
- Allowlist selection from the provider's live model catalog.
- Enforcement on model listing (users see only allowed models).
- Enforcement on execution (disallowed models rejected server-side).
- Default-allow behavior when no allowlist is configured for a provider.

### Out of scope

- Per-user, per-workspace, or per-template model policies.
- Rate limiting, quotas, or cost budgets.
- Provider enable/disable and key management (SPEC-0011).

## Actors

- Facilitator (admin): defines the allowed model subset per provider.
- End user: sees and runs only allowed models.

## User scenarios

### US-001 — Restrict users to a curated model set

As a facilitator,
I want to pick a subset of OpenRouter models that users may use,
so that a shared key cannot be spent on unapproved or expensive models.

Priority: P1

Independent value: makes shared provider keys safe to expose to a large user group.

### US-002 — Allow everything by default

As a facilitator,
I want providers without an explicit allowlist to offer all their models,
so that I am not forced to curate a catalog I do not care about.

Priority: P2

Independent value: keeps configuration effort proportional to governance needs.

## Functional requirements

### FR-001 — Allowlist editing

WHEN a facilitator edits a provider's model policy,
the system SHALL allow selecting allowed models from that provider's live model
catalog and SHALL persist the selection.

### FR-002 — Catalog browsing

WHEN a facilitator opens the model policy editor for an enabled provider,
the system SHALL show the provider's current model catalog with the allowed subset
marked.

### FR-003 — Listing enforcement

WHILE a provider has an allowlist configured,
the system SHALL include only allowlisted models of that provider in user-visible
model lists.

### FR-004 — Execution enforcement

IF an LLM node execution requests a model that is not allowlisted for its provider,
THEN the system SHALL reject the execution with an error identifying the model as
unavailable.

### FR-005 — Default allow

WHILE a provider has no allowlist configured,
the system SHALL offer all models of that provider to users.

### FR-006 — Allowlist survives catalog changes

IF a provider's catalog changes such that an allowlisted model id no longer exists,
THEN the system SHALL omit that model from user lists and SHALL keep the remaining
allowlist intact.

### FR-007 — Policy applies without redeployment

WHEN the facilitator saves a model policy,
the system SHALL apply it to subsequent model listings and executions without server
restart.

## Non-functional requirements

### NFR-001 — Enforcement completeness

Model policy SHALL be enforced server-side; client-side filtering alone SHALL NOT be
relied upon for any enforcement requirement in this specification.

## Acceptance criteria

### AC-001 — Users see only allowed models

Traces to: FR-003

```gherkin
Given OpenRouter is enabled with an allowlist of 5 models out of 200+
When a user opens the model selector in the LLM node
Then only those 5 OpenRouter models are offered
And models from other providers are unaffected
```

### AC-002 — Disallowed model rejected at execution

Traces to: FR-004

```gherkin
Given an allowlist excludes model "x"
When a workflow execution requests model "x" (e.g. from a crafted or stale client)
Then the execution is rejected with an error stating the model is unavailable
And no request is sent to the provider
```

### AC-003 — No allowlist means all models

Traces to: FR-005

```gherkin
Given OpenRouter is enabled with no allowlist configured
When a user opens the model selector
Then all OpenRouter catalog models are offered
```

### AC-004 — Facilitator picks from live catalog

Traces to: FR-001, FR-002

```gherkin
Given the facilitator opens the model policy editor for OpenRouter
When the facilitator views the catalog and selects a subset and saves
Then the selection is persisted and immediately reflected in user model lists
```

### AC-005 — Vanished catalog entry handled

Traces to: FR-006

```gherkin
Given model "x" is allowlisted and later removed from the provider catalog
When the LLM node lists models
Then "x" is not offered
And the rest of the allowlist remains in effect
```

### AC-006 — Policy change is immediate

Traces to: FR-007

```gherkin
Given users have model lists open
When the facilitator adds a model to the allowlist and saves
Then the model becomes selectable for subsequent listings without server restart
```

## Edge cases

- Allowlist saved while provider catalog is temporarily unreachable → save allowed;
  catalog browsing shows cached or empty list with a notice; enforcement uses the
  persisted selection.
- Allowlist contains model ids from a different provider → those entries are ignored
  for this provider (allowlists are per provider).
- All allowlisted models of a provider vanish from the catalog → provider contributes
  no user-visible models; provider stays enabled.

## Business rules

- Model policy SHALL be deployment-global per provider (one allowlist per provider
  for the whole instance).
- An allowlist SHALL apply only to the provider it is defined for.

## Constraints

- Policy editing is restricted to the facilitator role (SPEC-0003/FR-016) and lives
  in the provider configuration UI (SPEC-0011).

## Dependencies

- SPEC-0011 (admin UI, persistence, facilitator access).
- SPEC-0010 (provider model catalogs and execution routing).

## Assumptions

- Provider catalogs are fetchable at policy-editing time; offline curation (typing
  model ids manually) is not required.

## Open questions

- Should the facilitator also be able to set a friendly display name per allowed
  model (e.g. "Fast draft" for a long OpenRouter id)?

## Success criteria

- With OpenRouter configured under a shared key, users can only select and run the
  administrator-approved subset of models, enforced server-side.

## Change history

| Date | Change |
|---|---|
| 2026-09-15 | Initial specification created |
