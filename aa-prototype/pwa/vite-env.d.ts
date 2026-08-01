/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

/**
 * Ambient types for the PWA target. Both declarations here are PROGRAM-WIDE, not
 * scoped to this directory: `tsconfig.app.json` includes `src` and `pwa` in one
 * program, a `.d.ts` with no top-level import or export is a global script, and
 * a triple-slash reference has the same reach as a `types` entry. `src/pwa/`
 * depends on that — `UpdatePrompt` imports `virtual:pwa-register/react` and
 * `PwaDemoPanel` reads `__BUILD_ID__`, both from under `src/`.
 *
 * So nothing in the toolchain stops a prototype surface using either one. What
 * protects the prototype build is later and cruder: only `vite.pwa.config.ts`
 * registers the PWA plugin and `define`s `__BUILD_ID__`, so a prototype module
 * that imports the virtual module fails to resolve, and one that reads the build
 * id typechecks, builds green and throws `ReferenceError` at render time. Keep
 * both confined to `pwa/` and `src/pwa/` by hand.
 */

/**
 * The build id, injected by `define` in `vite.pwa.config.ts`: a short git sha, a
 * `<sha>-dirty-<stamp>`, an `AA_BUILD_ID` override, or `unknown`. Derived from
 * git rather than any one host's environment variable, so it stays honest
 * wherever this is served from. Typed as always present because inside the PWA
 * target it is; read it only from there.
 */
declare const __BUILD_ID__: string

/**
 * The build timestamp, injected by `define` in `vite.pwa.config.ts`: an ISO
 * 8601 string stamped when the bundle was built, for the More tab's "Deployed"
 * row. Same injection mechanism and same confinement rules as `__BUILD_ID__`.
 */
declare const __BUILD_DATE__: string
