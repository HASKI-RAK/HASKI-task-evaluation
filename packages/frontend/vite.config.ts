/* eslint-disable immutable/no-mutation */
import react from '@vitejs/plugin-react'
// load .env files
import { config } from 'dotenv'
import { defineConfig } from 'vite'
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

config()
const replaceOptions = { __DATE__: new Date().toISOString() }
// Env variables
const reload = process.env.RELOAD_SW === 'true'
const selfDestroying = process.env.SW_DESTROY === 'true'
if (reload) {
  // @ts-expect-error just ignore
  replaceOptions.__RELOAD_SW__ = 'true'
}

const manifestForPlugin: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',
  injectRegister: 'script',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
  manifest: {
    name: 'Task Editor',
    short_name: 'task-editor',
    description: 'Editor for automated task assessments',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    theme_color: '#000000',
    background_color: '#000000',
    display: 'standalone',
    scope: '/',
    start_url: '/',
    orientation: 'portrait'
  },
  devOptions: {
    enabled: true,
    /* other options */
    navigateFallback: '/index.html',
    type: 'module'
  },
  selfDestroying: selfDestroying
}
console.log('process.env.SOURCE_MAP', process.env.SOURCE_MAP)
// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  build: {
    sourcemap: process.env.SOURCE_MAP === 'true'
  },
  plugins: [tsconfigPaths(), react(), VitePWA(manifestForPlugin)]
})
