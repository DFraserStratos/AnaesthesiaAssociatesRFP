/**
 * One modal layer behind every overlay (UI unification U2, README U02).
 *
 * Every `Dialog`, `BottomSheet`, side panel and popover registers here while it
 * is open. One module-level stack, ordered by open time (a layer mounted in
 * the same commit as a layer inside it sits beneath it), and one `window`
 * keydown listener for the whole stack:
 *
 * - **Escape closes only the top layer**, through that layer's one `onClose`
 *   (so Phase 35 can refuse a close in one place). A child that stops the
 *   event's propagation keeps its own Escape (a search box with text clears
 *   first).
 * - **Tab and Shift+Tab wrap inside the top modal layer.**
 * - **Focus goes in** on open (the `initialFocusRef`, else a child that took
 *   focus with `autoFocus`, else the panel itself) and **comes back** to the
 *   control that opened the layer when it closes.
 * - **The background is inert, scoped.** From the top modal's root up to its
 *   scope (the closest `[data-aa-modal-scope]`: the app's `<main>` on the
 *   framed build and the mobile product root, so the harness bar and the
 *   PhoneFrame zoom toolbar are never touched), every sibling at every level
 *   is marked `inert`; an element already `inert` (SlideStack's parked
 *   layers) is left alone and keeps its own. Nothing is portalled.
 *
 * Popovers join the stack as `kind: 'popover'`: they take part in Escape's
 * order only (no focus move, trap or inert), so Escape closes an open popover
 * before the dialog under it, and a dialog's Escape never also closes a
 * harness menu below it.
 *
 * Imports nothing from an app folder, so it is safe in the PWA closure.
 */

import { useEffect, useRef, type RefObject } from 'react'

export type ModalLayerKind = 'modal' | 'popover'

export interface ModalLayerOptions {
  open: boolean
  /** The layer's one close. Escape (and every other close the caller wires) runs it. */
  onClose: () => void
  /** The layer's root: everything the layer draws (scrim included) sits inside it. */
  rootRef: RefObject<HTMLElement>
  /** What takes focus when nothing inside asks for it; the root when omitted. Give it `tabIndex={-1}`. */
  panelRef?: RefObject<HTMLElement>
  /** The control that takes focus on open. */
  initialFocusRef?: RefObject<HTMLElement>
  /** The element whose descendants go inert; the closest `[data-aa-modal-scope]` (else `body`) when omitted. */
  scopeRef?: RefObject<HTMLElement>
  /** `popover`: Escape order only. */
  kind?: ModalLayerKind
}

interface Layer {
  kind: ModalLayerKind
  root: HTMLElement
  panel: HTMLElement
  scope: HTMLElement | null
  close: () => void
  returnTo: HTMLElement | null
}

/** The scope attribute: put it on the element whose content a modal makes inert. */
export const MODAL_SCOPE_ATTR = 'data-aa-modal-scope'

const stack: Layer[] = []
/** The elements this module made inert, so a restore removes only its own. */
let inerted: HTMLElement[] = []
let listening = false

const TABBABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

function tabbables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter((el) => {
    if (el.closest('[inert], [hidden]') !== null) return false
    // `checkVisibility` is in every current browser; jsdom has none, and there
    // nothing is laid out, so everything counts as visible.
    const check = (el as HTMLElement & { checkVisibility?: () => boolean }).checkVisibility
    return typeof check === 'function' ? check.call(el) : true
  })
}

function focusQuietly(el: HTMLElement | null | undefined): void {
  // preventScroll: the phone frame is a scaled box; focusing must never scroll it.
  el?.focus({ preventScroll: true })
}

/** A control focus can go back to: still on the page, not the body, not behind a modal. */
function usable(el: HTMLElement | null | undefined, inside?: HTMLElement): el is HTMLElement {
  return el !== null && el !== undefined && el.isConnected && el !== document.body && el.closest('[inert]') === null && !(inside?.contains(el) ?? false)
}

function topModal(): Layer | undefined {
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const layer = stack[i]
    if (layer?.kind === 'modal') return layer
  }
  return undefined
}

function restoreInert(): void {
  for (const el of inerted) el.removeAttribute('inert')
  inerted = []
}

function scopeOf(layer: Layer): HTMLElement {
  return layer.scope ?? layer.root.parentElement?.closest<HTMLElement>(`[${MODAL_SCOPE_ATTR}]`) ?? document.body
}

function applyInert(): void {
  restoreInert()
  const top = topModal()
  if (top === undefined) return
  const scope = scopeOf(top)
  let el: HTMLElement = top.root
  while (el !== scope && el.parentElement !== null) {
    const parent: HTMLElement = el.parentElement
    for (const sibling of Array.from(parent.children)) {
      if (sibling === el || !(sibling instanceof HTMLElement)) continue
      if (sibling.hasAttribute('inert') || sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE') continue
      sibling.setAttribute('inert', '')
      inerted.push(sibling)
    }
    el = parent
  }
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.isComposing) return
  const top = stack[stack.length - 1]
  if (top === undefined) return
  if (e.key === 'Escape') {
    top.close()
    return
  }
  if (e.key !== 'Tab') return
  // The trap is the top modal's, even with a popover open inside it (the
  // Contract combo in the rail); a harness menu outside the modal keeps Tab.
  const modal = topModal()
  if (modal === undefined || (top.kind === 'popover' && !modal.root.contains(top.root))) return
  const items = tabbables(modal.root)
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
  if (items.length === 0) {
    e.preventDefault()
    focusQuietly(modal.panel)
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  const inside = active !== null && modal.root.contains(active)
  if (!inside) {
    e.preventDefault()
    focusQuietly(e.shiftKey ? last : first)
  } else if (e.shiftKey && (active === first || active === modal.panel)) {
    e.preventDefault()
    focusQuietly(last)
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    focusQuietly(first)
  }
}

function syncListener(): void {
  if (stack.length > 0 && !listening) {
    window.addEventListener('keydown', onKeyDown)
    listening = true
  } else if (stack.length === 0 && listening) {
    window.removeEventListener('keydown', onKeyDown)
    listening = false
  }
}

/**
 * The slot a layer left in the commit now running. A layer that unmounts and
 * a layer that mounts in the same commit are one layer re-rendered (the Admin
 * drawer swapping from its List body to its empty-session body under an open
 * status sheet): the new one takes the old one's place in the stack and its
 * opener, rather than jumping on top of the sheet. Cleared once the commit's
 * effects have run.
 */
let vacated: { at: number; returnTo: HTMLElement | null } | null = null

function push(layer: Layer, initialFocus: HTMLElement | null, opener: HTMLElement | null): void {
  // Open order, except that a layer mounted in the same commit as a layer
  // inside it (whose effect ran first) goes beneath that inner layer, and a
  // layer replacing one in the same commit takes its place.
  let at = stack.length
  let inherited: HTMLElement | null = null
  for (let i = 0; i < stack.length; i += 1) {
    const below = stack[i]
    if (below !== undefined && layer.root.contains(below.root)) {
      at = i
      break
    }
  }
  if (at === stack.length && vacated !== null && layer.kind === 'modal') {
    at = Math.min(vacated.at, stack.length)
    inherited = vacated.returnTo
    vacated = null
  }
  // A popover outside this modal's scope (a harness menu: it draws above the
  // app) stays above a modal that opens while it is up, say from a demo
  // action's Run: Escape closes the menu first, and focus stays in it.
  if (layer.kind === 'modal') {
    const scope = scopeOf(layer)
    while (at > 0) {
      const above = stack[at - 1]
      if (above === undefined || above.kind !== 'popover' || scope.contains(above.root)) break
      at -= 1
    }
  }
  stack.splice(at, 0, layer)
  syncListener()
  if (layer.kind !== 'modal') return
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const onTop = at === stack.length - 1
  // Where focus goes back on close, judged before this layer makes the page
  // inert: the inherited opener of a same-commit handoff, else the opener as it
  // stood before this layer rendered (an `autoFocus` child has already taken
  // focus by now), else what has focus; the first still on the page and live.
  layer.returnTo = (onTop ? [inherited, opener, active] : [inherited]).find((el) => usable(el, layer.root)) ?? null
  applyInert()
  if (!onTop) return
  if (initialFocus !== null) focusQuietly(initialFocus)
  else if (active === null || !layer.root.contains(active)) focusQuietly(layer.panel)
}

function pop(layer: Layer): void {
  const at = stack.indexOf(layer)
  if (at === -1) return
  stack.splice(at, 1)
  syncListener()
  if (layer.kind !== 'modal') return
  // Same-commit replacement (see `vacated`): effects of one commit run in one task.
  // The first layer to leave in a commit owns the slot (a sheet closing with
  // the drawer it sat over does not overwrite the drawer's opener).
  if (vacated === null) {
    vacated = { at, returnTo: layer.returnTo }
    queueMicrotask(() => {
      vacated = null
    })
  }
  applyInert()
  // Back to the opener, unless focus already went somewhere else on purpose;
  // an opener now behind another modal (inert) or gone falls back to that modal.
  const active = document.activeElement
  const lost = active === null || active === document.body || !active.isConnected || layer.root.contains(active)
  if (!lost) return
  if (usable(layer.returnTo)) focusQuietly(layer.returnTo)
  else focusQuietly(topModal()?.panel)
}

/** Register an open overlay on the one modal stack. See the module comment. */
export function useModalLayer({ open, onClose, rootRef, panelRef, initialFocusRef, scopeRef, kind = 'modal' }: ModalLayerOptions): void {
  // The latest onClose, so a re-render never re-runs the effect and moves the layer.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  // Who had focus when the layer was asked to open, read during the render
  // that opens it (before any `autoFocus` child moves focus in).
  const openerRef = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(false)
  if (open && !wasOpenRef.current && typeof document !== 'undefined') {
    const active = document.activeElement
    openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null
  }
  wasOpenRef.current = open
  useEffect(() => {
    const root = rootRef.current
    if (!open || root === null) return undefined
    const layer: Layer = {
      kind,
      root,
      panel: panelRef?.current ?? root,
      scope: scopeRef?.current ?? null,
      close: () => onCloseRef.current(),
      returnTo: null,
    }
    push(layer, initialFocusRef?.current ?? null, openerRef.current)
    return () => pop(layer)
    // Registered once per opening; the refs are read at open time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind])
}

/** True while `root` is the top layer of the stack (tests and popovers). */
export function isTopLayer(root: HTMLElement | null): boolean {
  return root !== null && stack[stack.length - 1]?.root === root
}

/** How many layers are open (tests). */
export function openLayerCount(): number {
  return stack.length
}
