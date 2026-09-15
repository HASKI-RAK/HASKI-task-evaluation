---
id: SPEC-0011
type: feature
title: Provider configuration admin UI
status: draft
parent: SPEC-0009
priority: unset
created: 2026-09-15
updated: 2026-09-15
depends_on:
  - SPEC-0003
related:
  - SPEC-0010
  - SPEC-0012
---

# Provider configuration admin UI

## Intent

### Problem

LLM provider settings (model worker URL, OpenAI key) live only in server environment
variables. Changing providers or keys requires redeployment, and there is no way for
an administrator to see or manage provider state at runtime.

### Desired outcome

A facilitator-authenticated admin UI where providers can be enabled, disabled, and
configured (including API keys), with settings persisted server-side and taking
effect without redeployment.

## Scope

### In scope

- Admin UI section for LLM provider management, accessible only to facilitators.
- Provider entries with: enable/disable state, provider-specific settings (base URL,
  API key), and display name.
- Server-side persistence of provider configuration.
- Configuration changes taking effect for subsequent LLM node executions without
  redeployment.
- Support for the built-in providers: local model worker, OpenAI, OpenRouter.

### Out of scope

- Model allowlist editing (SPEC-0012).
- Per-user or per-workspace provider policies.
- Adding arbitrary new provider types at runtime (provider set is fixed to
  OpenAI-compatible providers known to the system).

## Actors

- Facilitator (admin): authenticated via env-configured admin credentials
  (SPEC-0003/FR-016); the only actor who may view or change provider configuration.
- End user: must never see provider configuration or credentials.

## User scenarios

### US-001 — Enable OpenRouter for the deployment

As a facilitator,
I want to enter my OpenRouter API key and enable OpenRouter in an admin UI,
so that all users can use OpenRouter models without redeploying NodeGrade.

Priority: P1

Independent value: provider changes become a runtime operation instead of a
deployment operation.

### US-002 — Rotate a compromised key

As a facilitator,
I want to replace a provider API key in the UI,
so that I can respond to key compromise immediately.

Priority: P2

Independent value: operational security without downtime.

## Functional requirements

### FR-001 — Admin-only access

WHEN a non-facilitator user attempts to view or modify provider configuration,
the system SHALL deny access.

### FR-002 — Provider list

WHEN a facilitator opens the provider configuration UI,
the system SHALL show all supported providers with their current enabled state and
configured settings.

### FR-003 — Edit provider settings

WHEN a facilitator edits a provider's settings (display name, base URL, API key,
enabled state) and saves,
the system SHALL persist the changes server-side.

### FR-004 — Key write-only display

WHEN a facilitator views a configured provider,
the system SHALL show that an API key is set but SHALL NOT display the key value.

### FR-005 — Configuration takes effect without redeployment

WHEN provider configuration is saved,
the system SHALL apply it to subsequent LLM node model listings and executions
without requiring a server restart or redeployment.

### FR-006 — Validation before save

IF a facilitator saves a provider configuration with missing required settings
(e.g. enabled without an API key where one is required),
THEN the system SHALL reject the save and report which setting is missing.

### FR-007 — Disable provider

WHEN a facilitator disables a provider and saves,
the system SHALL remove that provider's models from user-visible model lists and
SHALL reject executions targeting that provider.

### FR-008 — Configuration survives restart

WHEN the server restarts,
the system SHALL retain the persisted provider configuration.

### FR-009 — Initial state from environment

WHERE provider settings exist as environment variables at first startup and no
persisted configuration exists yet,
the system SHALL seed the persisted configuration from those environment variables.

## Non-functional requirements

### NFR-001 — Configuration latency

Saving provider configuration SHALL take effect for new executions within 5 seconds.

## Acceptance criteria

### AC-001 — Non-facilitator denied

Traces to: FR-001

```gherkin
Given a user without facilitator credentials
When the user attempts to open the provider configuration UI
Then access is denied
And no provider settings or credentials are returned
```

### AC-002 — Facilitator configures OpenRouter

Traces to: FR-002, FR-003, FR-005

```gherkin
Given a facilitator is authenticated
When the facilitator enters an OpenRouter API key, enables OpenRouter, and saves
Then the configuration is persisted
And OpenRouter models appear in user model lists without a server restart
```

### AC-003 — Key never displayed

Traces to: FR-004

```gherkin
Given a provider has an API key configured
When the facilitator views the provider settings
Then the UI indicates a key is set
And the key value is not displayed
```

### AC-004 — Invalid save rejected

Traces to: FR-006

```gherkin
Given the facilitator enables a provider that requires an API key
When the facilitator saves without entering a key
Then the save is rejected
And the UI reports the missing setting
```

### AC-005 — Disabled provider hidden and blocked

Traces to: FR-007

```gherkin
Given OpenRouter is enabled with models visible to users
When the facilitator disables OpenRouter and saves
Then OpenRouter models no longer appear in user model lists
And execution of a workflow node still referencing an OpenRouter model fails with a clear error
```

### AC-006 — Configuration persists across restart

Traces to: FR-008

```gherkin
Given provider configuration has been saved
When the server restarts
Then the saved provider configuration is still active
```

### AC-007 — Env seeding on first start

Traces to: FR-009

```gherkin
Given the server starts with provider environment variables set and no persisted configuration
When the facilitator opens the provider UI
Then the providers reflect the environment-derived settings
```

## Edge cases

- Two facilitators editing concurrently → last save wins; no partial merges.
- Provider base URL unreachable at save time → save allowed (configuration is
  declarative); provider failure surfaces per SPEC-0010/FR-007.
- Facilitator clears a key while provider enabled → treated as missing required
  setting (FR-006).

## Business rules

- Provider configuration SHALL be deployment-global (single configuration for the
  whole instance).
- Provider API keys SHALL be stored server-side only and SHALL NOT be returned in
  readable form by any API response.

## Constraints

- Access control reuses the facilitator role from SPEC-0003 (FR-016); no new
  account system.
- Persistence uses the backend's existing storage mechanism.

## Dependencies

- SPEC-0003 (facilitator authentication).
- SPEC-0010 (consumes the configuration for execution).

## Assumptions

- The set of supported providers is fixed at deploy time (local worker, OpenAI,
  OpenRouter); new provider types are a code change, not a UI action.

## Open questions

- Should the admin UI live inside the editor shell (e.g. toolbar overflow menu) or as
  a separate route?

## Success criteria

- A facilitator can enable OpenRouter with a key and have it usable by all users
  within seconds, without redeployment.
- No API response ever contains a provider key in readable form.

## Change history

| Date | Change |
|---|---|
| 2026-09-15 | Initial specification created |
