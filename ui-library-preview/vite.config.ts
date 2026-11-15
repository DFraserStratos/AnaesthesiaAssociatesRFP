import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/*
 * ui-library-preview (see PLAN.md D1 to D9). aa-prototype is READ-ONLY: its source is imported
 * through the `@proto` alias and compiled by this Vite, never edited, never type-checked here.
 */

const here = import.meta.dirname
const repoRoot = path.resolve(here, '..')
const protoRoot = path.resolve(repoRoot, 'aa-prototype')
const protoSrc = path.join(protoRoot, 'src')
const previewSrc = path.join(here, 'src')

/** Bare packages the prototype imports that must come from THIS workspace (one React 19). */
const FORCED = ['react', 'react-dom', 'react-router-dom', 'zustand', 'lucide-react', 'date-fns']
const FORCED_RE = new RegExp(`^(${FORCED.map((p) => p.replace('/', '\\/')).join('|')})(\\/.*)?$`)

const isInsideProto = (file: string | undefined) => file !== undefined && path.resolve(file.split('?')[0]!).startsWith(protoRoot + path.sep)

/**
 * D2: an import of a forced package made from inside aa-prototype is re-resolved as if it came
 * from the preview, so aa-prototype/node_modules (React 18) is never used. Respects package
 * `exports` (react/jsx-runtime, react-dom/client, zustand/middleware, ...), unlike a path alias.
 */
function forcePreviewDeps(): Plugin {
  const anchor = path.join(previewSrc, 'main.tsx')
  return {
    name: 'uilp:force-preview-deps',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!FORCED_RE.test(source) || !isInsideProto(importer)) return null
      return this.resolve(source, anchor, { skipSelf: true })
    },
  }
}

/**
 * D3: imports of the prototype's CatalogueKit made FROM INSIDE aa-prototype are redirected to the
 * preview's kit. The preview's own import of the original kit (from src/kit) is left alone.
 */
function kitSwap(): Plugin {
  const original = path.join(protoSrc, 'apps', 'demo', 'catalogue', 'CatalogueKit')
  const shim = path.join(previewSrc, 'kit', 'ProtoKitShim.tsx')
  return {
    name: 'uilp:kit-swap',
    enforce: 'pre',
    resolveId(source, importer) {
      if (importer === undefined || !isInsideProto(importer) || !/CatalogueKit(\.tsx)?$/.test(source)) return null
      const target = path.resolve(path.dirname(importer.split('?')[0]!), source).replace(/\.tsx$/, '')
      return target === original ? shim : null
    },
  }
}

/** Stubs for `virtual:` modules only the prototype's PWA build provides. */
function virtualStubs(): Plugin {
  const STUBS: Record<string, string> = {
    'virtual:pwa-register/react': `
      export function useRegisterSW() {
        const noop = () => {}
        return { needRefresh: [false, noop], offlineReady: [false, noop], updateServiceWorker: async () => {} }
      }`,
    'virtual:pwa-register': `export function registerSW() { return async () => {} }`,
  }
  return {
    name: 'uilp:virtual-stubs',
    enforce: 'pre',
    resolveId(source) {
      return source in STUBS ? `\0uilp-stub:${source}` : null
    },
    load(id) {
      return id.startsWith('\0uilp-stub:') ? STUBS[id.slice('\0uilp-stub:'.length)] : null
    },
  }
}

export default defineConfig({
  plugins: [virtualStubs(), kitSwap(), forcePreviewDeps(), react(), tailwindcss()],
  // D7: the prototype's public/ (self-hosted fonts at /fonts/..., favicon) served as-is.
  publicDir: path.join(protoRoot, 'public'),
  resolve: {
    alias: [
      { find: /^@proto\//, replacement: protoSrc + '/' },
      { find: /^@\//, replacement: previewSrc + '/' },
    ],
    dedupe: [...FORCED, 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  server: {
    port: 5182,
    strictPort: true,
    fs: { allow: [repoRoot] },
  },
  preview: { port: 5182, strictPort: true },
})
