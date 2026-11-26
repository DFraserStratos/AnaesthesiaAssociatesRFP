/**
 * The opened arrival's keys (27 Nov 2026 rebuild; O1): J opens the next arrival in the inbox's order and K the one
 * before; Escape goes back to the inbox. Never while the office types (focus in an input, textarea, select or editable
 * text), with a modifier held, or while a sheet, dialog or menu is open (`[aria-modal="true"]`, `[role="dialog"]`,
 * `[role="menu"]`, `[role="listbox"]`): the modal layer's own Escape closes that first (`shared/surface/useModalLayer.ts`).
 */

import { useEffect, useRef } from 'react'

/** The element is somewhere the keys are words, not moves. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]') !== null
}

/** A sheet, dialog or menu is open on the page. */
export function overlayOpen(): boolean {
  return document.querySelector('[aria-modal="true"], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]') !== null
}

/** A half-written reason (a reject or dismiss form's text) is on the page: leaving would throw it away. */
export function draftOpen(): boolean {
  return Array.from(document.querySelectorAll<HTMLTextAreaElement | HTMLInputElement>('textarea, input[type="text"], input:not([type])')).some((el) => el.value.trim() !== '')
}

/** What a key press does: `next`, `previous`, `back`, or nothing. */
export function arrivalKeyAction(event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'target' | 'defaultPrevented'>): 'next' | 'previous' | 'back' | undefined {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return undefined
  const key = event.key.toLowerCase()
  if (key !== 'j' && key !== 'k' && key !== 'escape') return undefined
  if (isTypingTarget(event.target) || overlayOpen()) return undefined
  // J, K and Escape all leave this arrival; never while a reason is half written.
  if (draftOpen()) return undefined
  return key === 'j' ? 'next' : key === 'k' ? 'previous' : 'back'
}

export function useArrivalKeys(handlers: { onNext?: () => void; onPrevious?: () => void; onBack: () => void }): void {
  const latest = useRef(handlers)
  latest.current = handlers
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const action = arrivalKeyAction(event)
      if (action === undefined) return
      const { onNext, onPrevious, onBack } = latest.current
      const run = action === 'next' ? onNext : action === 'previous' ? onPrevious : onBack
      if (run === undefined) return
      event.preventDefault()
      run()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
