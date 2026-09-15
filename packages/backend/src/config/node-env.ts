import { configuration } from './configuration.js';

export type NodeExecutionEnv = {
  MODEL_WORKER_URL: string;
  SIMILARITY_WORKER_URL: string;
  OPENAI_API_KEY: string | undefined;
  BEARER_TOKEN: string | undefined;
};

/**
 * The environment injected onto every node before execution.
 *
 * Previously assembled inline in two places, each with its own copy of the model worker
 * fallback. SIMILARITY_WORKER_URL was never injected at all, so SentenceTransformer and
 * KeywordCheckNode always fell through to their own hardcoded address.
 */
export function buildNodeExecutionEnv(): NodeExecutionEnv {
  const { workers } = configuration();
  return {
    MODEL_WORKER_URL: workers.modelWorkerUrl,
    SIMILARITY_WORKER_URL: workers.similarityWorkerUrl,
    OPENAI_API_KEY: workers.openAiApiKey,
    BEARER_TOKEN: workers.bearerToken,
  };
}
