/**
 * The support panel's catalogue examples (catch-up Phase 43b): the panel body
 * inline, the desktop SidePanel host and the phone's BottomSheet host. Send
 * writes a real audited ticket to the demo store, like the app.
 */

import { useState } from 'react'
import { Button } from '../../../shared/ui'
import { ResponseTable, SupportHours, SupportPanel, SupportRequestForm, SupportSheet, SupportSidePanel, TicketList } from '../../../shared/support'
import { ticketsFor, useAppStore } from '../../../store'
import { OFFICE_ACTOR, SOUTER_ACTOR, type Actor } from '../../../store'

export function SupportPanelExample() {
  return (
    <div style={{ maxWidth: 552 }}>
      <SupportPanel channels={['helpLine', 'productSupport']} actor={OFFICE_ACTOR} app="admin" seesEveryRequest buttonSize="desktop" />
    </div>
  )
}

export function SupportSidePanelExample({ app }: { app: 'admin' | 'web' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Open Help</Button>
      <SupportSidePanel open={open} onClose={() => setOpen(false)} actor={app === 'admin' ? OFFICE_ACTOR : SOUTER_ACTOR} app={app} />
    </>
  )
}

export function SupportSheetExample({ actor }: { actor: Actor }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Get help</Button>
      <SupportSheet open={open} onClose={() => setOpen(false)} actor={actor} app="mobile" />
    </>
  )
}

/** The parts on their own, at the seeded clock (8:00am, so the line reads closed). */
export function SupportHoursExample() {
  const clock = useAppStore((s) => s.clock)
  const holidays = useAppStore((s) => s.masters.publicHolidays)
  return (
    <div style={{ maxWidth: 552 }}>
      <SupportHours channel="helpLine" dateISO={clock.todayISO} minutes={clock.minutesSinceMidnight} publicHolidays={Object.values(holidays)} />
    </div>
  )
}

export function ResponseTableExample() {
  return (
    <div style={{ maxWidth: 552 }}>
      <ResponseTable channel="productSupport" />
    </div>
  )
}

export function SupportRequestFormExample() {
  return (
    <div style={{ maxWidth: 552 }}>
      <SupportRequestForm channel="helpLine" outOfHours buttonSize="desktop" onSend={() => 'Not sent: a catalogue example.'} />
    </div>
  )
}

export function TicketListExample() {
  const support = useAppStore((s) => s.support)
  return (
    <div style={{ maxWidth: 552 }}>
      <TicketList tickets={ticketsFor({ support }, { channel: 'productSupport' })} clockISO="2026-11-24T08:00:00" showRequester title="Every request" />
    </div>
  )
}
