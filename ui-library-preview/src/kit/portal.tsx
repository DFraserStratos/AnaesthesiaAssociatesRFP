import { createContext, useContext } from 'react'

/**
 * Where library overlays portal to (PLAN D6). Every `components/ui` Portal
 * passes `container={usePortalContainer()}`.
 *
 * - No provider: a single body-level `<div class="lib-scope">` root, so
 *   portalled popups pick up the shadcn variables and base rules, which apply
 *   only under `.lib-scope`.
 * - Mobile replacement stage: wraps its subtree in a provider whose value is
 *   its own (relatively positioned, `.lib-scope`) div, so drawers and popovers
 *   stay inside the phone-width box.
 */
export const PortalContainerContext = createContext<HTMLElement | null>(null)

let defaultRoot: HTMLElement | null = null

/** The shared body-level `.lib-scope` portal root, created on first use. */
export function getDefaultPortalRoot(): HTMLElement | undefined {
  if (typeof document === 'undefined') return undefined
  if (defaultRoot === null || !defaultRoot.isConnected) {
    defaultRoot = document.createElement('div')
    defaultRoot.className = 'lib-scope'
    defaultRoot.setAttribute('data-lib-portal-root', '')
    document.body.appendChild(defaultRoot)
  }
  return defaultRoot
}

/** The container for library portals: the nearest provider's element, else the body-level root. */
export function usePortalContainer(): HTMLElement | undefined {
  return useContext(PortalContainerContext) ?? getDefaultPortalRoot()
}
