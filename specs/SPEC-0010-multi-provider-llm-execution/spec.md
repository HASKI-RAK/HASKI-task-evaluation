---
id: SPEC-0010
type: feature
title: Multi-provider LLM execution
status: draft
parent: SPEC-0009
priority: unset
created: 2026-09-15
updated: 2026-09-15
depends_on:
  - SPEC-0011
  - SPEC-0012
related: []
---

# Multi-provider LLM execution

## Intent

### Problem

The LLM node routes execution between a local model worker and OpenAI using
hardcoded endpoints and env-var-driven branching. Adding a provider (e.g. OpenRouter)
requires new node code paths, and provider selection is invisible to administrators.

### Desired outcome

The LLM node executes against any configured provider — local model worker, OpenAI,
OpenRouter — selected by model-to-provider mapping from persisted configuration.
Adding a further OpenAI-compatible provider requires configuration, not new node
logic.

## Scope

### In scope

- Provider abstraction for LLM execution covering the local model worker, OpenAI, and
  OpenRouter.
- Model listing aggregated from all enabled providers, each model tagged with its
  source provider.
- Execution routing: a selected model is executed against its provider.
- OpenRouter integration via its OpenAI-compatible chat completions interface.

### Out of scope

- Admin UI and persistence of provider configuration (SPEC-0011).
- Allowlist filtering of models (SPEC-0012).
- Streaming responses.
- Non-OpenAI-compatible provider protocols.

## Actors

- End user: selects a model in the LLM node and executes it.
- Facilitator (admin): indirectly, by configuring providers (SPEC-0011).

## User scenarios

### US-001 — Use an OpenRouter model

As an end user,
I want to select an OpenRouter-hosted model in the LLM node and run my workflow,
so that I can use the models my organization provides without needing my own API key.

Priority: P1

Independent value: unlocks a large model catalog for users without any per-user
credentials.

### US-002 — Mixed providers in one workflow

As an expert user,
I want model lists from the local worker and cloud providers merged in one model
selector,
so that I can pick the best model per node regardless of where it is hosted.

Priority: P2

Independent value: removes artificial separation between local and cloud models.

## Functional requirements

### FR-001 — Provider abstraction

The LLM node SHALL execute chat completions through a provider abstraction in which
each provider is identified by a provider id and supplies a model list and a
completion endpoint.

### FR-002 — OpenRouter provider

WHEN OpenRouter is configured and enabled,
the system SHALL list OpenRouter models and execute chat completions against the
OpenRouter API using the configured server-side key.

### FR-003 — Existing providers preserved

WHEN the local model worker or OpenAI is configured,
the system SHALL continue to list and execute their models with behavior equivalent
to the current implementation.

### FR-004 — Model-to-provider mapping

WHEN a user selects a model,
the system SHALL route execution to the provider that supplied that model id.

### FR-005 — Ambiguous model ids

IF the same model id is offered by more than one enabled provider,
THEN the system SHALL resolve the conflict deterministically by configured provider
priority and SHALL expose the resolved provider to the user in the model list.

### FR-006 — Model list aggregation

WHEN the LLM node initializes,
the system SHALL merge model lists from all enabled providers into one selectable
list, with each entry carrying its provider id.

### FR-007 — Provider failure isolation

IF one enabled provider fails to return its model list or to execute a completion,
THEN the system SHALL surface the failure for models of that provider only and SHALL
NOT prevent listing or execution of models from other providers.

### FR-008 — Credential isolation

The LLM node SHALL send provider credentials only in requests to the corresponding
provider and SHALL NOT expose them in serialized graph data, client-visible model
lists, or error messages.

## Non-functional requirements

### NFR-001 — Provider addition without node changes

Adding an additional OpenAI-compatible provider SHALL require only configuration
changes; no changes to LLM node execution logic.

## Acceptance criteria

### AC-001 — OpenRouter model executes

Traces to: FR-002, FR-004

```gherkin
Given OpenRouter is configured with a valid server-side key and enabled
When a user selects an OpenRouter model in the LLM node and executes the node
Then the completion is returned from OpenRouter using the configured key
And the key is not present in any client-visible data
```

### AC-002 — Merged model list

Traces to: FR-006

```gherkin
Given the local model worker and OpenRouter are both enabled
When the LLM node initializes
Then the model selector contains models from both providers
And each model entry is associated with its provider
```

### AC-003 — Routing follows provider

Traces to: FR-004

```gherkin
Given models from multiple providers are listed
When the user selects a model from provider A and executes the node
Then the completion request is sent only to provider A
```

### AC-004 — Duplicate model id resolved

Traces to: FR-005

```gherkin
Given two enabled providers both offer model id "m"
When the LLM node lists models
Then exactly one entry for "m" is shown, attributed to the higher-priority provider
```

### AC-005 — One provider down does not break others

Traces to: FR-007

```gherkin
Given the local worker and OpenRouter are enabled and OpenRouter is unreachable
When the LLM node initializes and the user executes a local-worker model
Then the local model executes successfully
And selecting an OpenRouter model reports a provider-specific failure
```

### AC-006 — Legacy behavior preserved

Traces to: FR-003

```gherkin
Given only the local model worker is configured (no cloud providers)
When a user selects a local model and executes the node
Then behavior matches the current local-worker execution path
```

## Edge cases

- Provider key invalid or expired → provider marked failed; its models hidden or
  flagged, other providers unaffected.
- Provider returns a model list in an unexpected format → provider contributes no
  models rather than breaking aggregation.
- Model selected earlier is removed from the provider catalog → node reports the
  model as unavailable on next execution instead of sending a doomed request.

## Business rules

- A model id SHALL map to exactly one provider at execution time.

## Constraints

- OpenRouter SHALL be accessed through its OpenAI-compatible chat completions
  interface.
- Provider credentials SHALL be supplied from server-side persisted configuration
  (SPEC-0011), replacing direct env-var reads in the LLM node.

## Dependencies

- SPEC-0011 (provider configuration source).
- SPEC-0012 (allowlist filtering applied to the aggregated list).

## Assumptions

- OpenRouter's model catalog is large; no pagination requirement beyond what the
  catalog API provides.

## Open questions

- Should provider priority be a global setting or per-provider ordering in the admin
  UI?

## Success criteria

- An OpenRouter model can be selected and executed in a workshop workflow without
  any per-user setup.
- Existing local-worker and OpenAI workflows continue to run unchanged.

## Change history

| Date | Change |
|---|---|
| 2026-09-15 | Initial specification created |
