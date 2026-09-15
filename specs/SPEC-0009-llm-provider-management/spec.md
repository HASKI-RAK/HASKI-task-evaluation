---
id: SPEC-0009
type: epic
title: LLM provider management and model governance
status: draft
parent: null
priority: unset
created: 2026-09-15
updated: 2026-09-15
depends_on:
  - SPEC-0003
related:
  - SPEC-0005
---

# LLM provider management and model governance

## Intent

### Problem

The LLM node currently hardcodes two execution paths: a local model worker and
OpenAI, with provider selection driven by server environment variables only. There is
no OpenRouter support, no way to change providers without redeploying, and no control
over which models end users may select. An operator cannot offer, for example,
OpenRouter with a shared key while restricting users to a curated subset of models.

### Desired outcome

Administrators configure LLM providers (including OpenRouter) and the set of models
users may use through an authenticated admin UI with server-side persistence. End
users see and execute only the allowed models; provider credentials never reach the
client.

## Scope

### In scope

- Multi-provider LLM execution in the LLM node, including OpenRouter (SPEC-0010).
- Facilitator-only admin UI for provider configuration with persisted storage
  (SPEC-0011).
- Admin-managed model allowlist enforced on model listing and execution (SPEC-0012).

### Out of scope

- Per-user or per-workspace model policies (deployment-global policy only).
- User account management beyond the existing env-credentialed facilitator role.
- Non-LLM node types (image, embedding, similarity nodes).
- Usage metering, quotas, or cost tracking.

## Actors

- Facilitator (admin): authenticated via env-configured admin credentials
  (SPEC-0003/FR-016); configures providers and the allowed model subset.
- End user (participant, instructor, expert user): selects and runs models in the LLM
  node; restricted to the allowed subset; never sees provider credentials.

## Child features

| ID | Feature | Status |
|---|---|---|
| SPEC-0010 | Multi-provider LLM execution | Draft |
| SPEC-0011 | Provider configuration admin UI | Draft |
| SPEC-0012 | Model allowlist governance | Draft |

## Cross-feature business rules

- Provider credentials SHALL exist only server-side; they SHALL NOT be included in
  serialized graphs, model lists sent to clients, or admin UI responses in
  readable form.
- Model policy SHALL be deployment-global: one provider configuration and one
  allowlist for the whole NodeGrade instance.
- WHEN no allowlist is configured for an enabled provider, all models offered by that
  provider SHALL be selectable by end users (default-allow; see SPEC-0012).

## Cross-feature constraints

- The facilitator role SHALL be the existing env-credentialed admin role defined in
  SPEC-0003 (FR-016); no new account system is introduced.
- OpenRouter SHALL be integrated through its OpenAI-compatible chat completions
  interface; no new execution protocol is introduced for it.

## Dependencies

- SPEC-0003 (facilitator authentication mechanism reused for admin UI access).

## Assumptions

- A single facilitator (or small trusted group sharing the admin credentials)
  manages the deployment; no concurrent-editing conflicts need resolving.
- The local model worker remains a provider alongside cloud providers.

## Open questions

- None currently.

## Epic success criteria

- An administrator can enable OpenRouter with a configured key and restrict users to
  a chosen subset of OpenRouter models entirely through the UI, without redeployment.
- An end user executing an LLM node can only select and run allowed models; attempts
  to use disallowed models fail with a clear error.
- Provider keys are never observable by end users.

## Change history

| Date | Change |
|---|---|
| 2026-09-15 | Initial specification created; classified as epic (provider execution, admin configuration UI, and allowlist governance are independently deliverable) |
