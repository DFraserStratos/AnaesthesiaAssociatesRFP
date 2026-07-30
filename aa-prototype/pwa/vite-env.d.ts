/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

/**
 * Ambient types for the PWA target. Deliberately scoped to this directory
 * rather than added to `tsconfig.app.json`'s `types` array: only this target
 * has a service worker, and the prototype build should not be able to import
 * `virtual:pwa-register/react` by accident.
 */

/** The deployed commit, injected by `define` in `vite.pwa.config.ts`. */
declare const __BUILD_ID__: string
