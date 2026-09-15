/**
 * Reserved provider keys. These are serialized into workflow content, so they must be
 * identical across every deployment or migrated workflows will not resolve.
 */
export const PROVIDER_KEY_LOCAL = 'local'
export const PROVIDER_KEY_OPENAI = 'openai'
export const PROVIDER_KEY_OPENROUTER = 'openrouter'

export const RESERVED_PROVIDER_KEYS = [
  PROVIDER_KEY_LOCAL,
  PROVIDER_KEY_OPENAI,
  PROVIDER_KEY_OPENROUTER
] as const

/**
 * A model selection, qualified by the provider it belongs to (SPEC-0010/FR-004).
 *
 * The bare `model` id it replaces was ambiguous as soon as two providers offered the
 * same id, and it gave execution no way to know where to route.
 */
export type ModelRef = {
  providerKey: string
  modelId: string
}

export const isModelRef = (value: unknown): value is ModelRef => {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.providerKey === 'string' &&
    candidate.providerKey.length > 0 &&
    typeof candidate.modelId === 'string' &&
    candidate.modelId.length > 0
  )
}
