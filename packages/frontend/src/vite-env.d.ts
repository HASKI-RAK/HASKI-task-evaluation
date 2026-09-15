/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_DEBUG_BRIDGE?: string
  readonly VITE_ENABLE_SW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
