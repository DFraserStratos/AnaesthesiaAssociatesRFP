/**
 * After a sheet saves an event, bring its new row under the Procedure into
 * view (catch-up Phases 38b and 39): the additional invoice's
 * `procedure-event-row`, a credit's `procedure-credit-event`. The one helper
 * the Procedure's buttons share. PWA-safe.
 */
export function scrollToEventRow(eventId: string, shot: 'procedure-event-row' | 'procedure-credit-event'): void {
  requestAnimationFrame(() => document.querySelector(`[data-shot="${shot}"][data-event-id="${eventId}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
}
