/**
 * Rebook with another anaesthetist (catch-up Phase 41, work item 18; US-06.5.3):
 * the office's dialog on a truly cancelled Booking. The anaesthetist (roster
 * order, the original excluded), one of their ACTIVE Lists from today (date,
 * session, hospital, surgeon; the cancelled Booking's date first), the
 * not-preferred warning inline (never blocking, Phase 17; passed in by the
 * Admin screen, as the pairings are office-private), and the price the
 * new prepayment will be at, ex GST. The teal "Rebook" runs the store action;
 * a refusal shows in its own words. Mount it while open; it opens on mount.
 */

import { useMemo, useState } from 'react'
import { neutral } from '../../theme/tokens'
import { shortDay } from '../../domain/dateText'
import { rebookPriceFor, rebookTargetsFor, rebookWithAnotherAnaesthetist, useAppStore, type Actor, type RebookPrice } from '../../store'
import { Button } from '../ui/Button'
import { FormError, SelectField } from '../ui/Field'
import { Notice } from '../ui/Notice'
import { RadioCard } from '../ui/RadioCard'
import { useRovingRadio } from '../ui/useRovingRadio'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { drSurname, formatMoney } from '../format'
import { useCommandBlock } from './draft'

export interface RebookDialogProps {
  bookingId: string
  actor: Actor
  onClose: () => void
  /** After the rebook: the new Booking's id (the caller goes to it). */
  onRebooked: (newBookingId: string) => void
  /**
   * Phase 17's not-preferred warning for a pairing, or null. The pairings are
   * office-private, so the Admin screen passes it in (its `notPreferredWarning`
   * message); shared code never reads them.
   */
  notPreferredMessageFor?: (anaesthetistId: string, surgeonId: string) => string | null
}

/** The preview line; the amount in mono. */
function PriceLine({ price, name }: { price: RebookPrice; name: string }) {
  const who = drSurname(name)
  if (price.kind === 'prepaid') {
    return (
      <>
        New prepayment at {who}&apos;s own price: <span className="mono">{formatMoney(price.amount)}</span> ex GST
      </>
    )
  }
  if (price.kind === 'notPrepaid') return <>{who} does not take prepayment for this procedure.</>
  return <>{who} has no price for this procedure; the office adds it to their price list.</>
}

export function RebookDialog({ bookingId, actor, onClose, onRebooked, notPreferredMessageFor }: RebookDialogProps) {
  const { Overlay } = useSurface()
  const blocked = useCommandBlock()
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const clock = useAppStore((s) => s.clock)
  const targets = useMemo(() => rebookTargetsFor({ schedule, masters, clock }, bookingId), [schedule, masters, clock, bookingId])
  const booking = schedule.bookings[bookingId]
  const sourceDate = booking !== undefined ? schedule.lists[booking.listId]?.dateISO : undefined
  const patientName = booking !== undefined ? (masters.patients[booking.patientId]?.name ?? '') : ''

  // The default: the first colleague with a List on the cancelled Booking's date, else the first with any List.
  const initial = targets.find((t) => t.lists[0]?.dateISO === sourceDate) ?? targets.find((t) => t.lists.length > 0) ?? targets[0]
  const [anaesthetistId, setAnaesthetistId] = useState(initial?.anaesthetistId ?? '')
  const target = targets.find((t) => t.anaesthetistId === anaesthetistId)
  const lists = target?.lists ?? []
  const [listId, setListId] = useState(initial?.lists[0]?.listId ?? '')
  const chosen = lists.find((l) => l.listId === listId)
  const [error, setError] = useState<string | null>(null)

  const radio = useRovingRadio({ values: lists.map((l) => l.listId), value: chosen?.listId, onChange: setListId })
  const price = useMemo(
    () => (target !== undefined ? rebookPriceFor({ schedule, masters }, bookingId, target.anaesthetistId, chosen?.listId) : undefined),
    [schedule, masters, bookingId, target, chosen?.listId],
  )
  const warning = chosen !== undefined && target !== undefined ? (notPreferredMessageFor?.(target.anaesthetistId, chosen.surgeonId) ?? null) : null

  function pickAnaesthetist(id: string) {
    setAnaesthetistId(id)
    setListId(targets.find((t) => t.anaesthetistId === id)?.lists[0]?.listId ?? '')
    setError(null)
  }

  function rebook() {
    if (chosen === undefined) return
    setError(null)
    const outcome = rebookWithAnotherAnaesthetist(useAppStore, actor, bookingId, chosen.listId)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onRebooked(outcome.value.bookingId)
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="rebook-dialog" data-booking-id={bookingId} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Rebook with another anaesthetist" description={`A new booking for ${patientName}. The cancelled booking stays as it is.`} />
        <SelectField label="Anaesthetist" value={anaesthetistId} onChange={pickAnaesthetist} shot="rebook-anaesthetist">
          {targets.map((t) => (
            <option key={t.anaesthetistId} value={t.anaesthetistId}>
              {t.name}
            </option>
          ))}
        </SelectField>
        {lists.length === 0 ? (
          <Notice tone="neutral" shot="rebook-no-lists">
            {target !== undefined ? `${drSurname(target.name)} has no ACTIVE Lists from today.` : 'Choose an anaesthetist.'}
          </Notice>
        ) : (
          <div
            {...radio.groupProps}
            aria-label="List"
            data-shot="rebook-lists"
            style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', padding: 2 }}
          >
            {lists.map((l, i) => (
              <RadioCard
                key={l.listId}
                radio={radio.itemProps(i)}
                checked={l.listId === chosen?.listId}
                onSelect={() => setListId(l.listId)}
                shot="rebook-list"
                data-list-id={l.listId}
                title={
                  <>
                    <span className="mono">{shortDay(l.dateISO)}</span> · {l.session}
                  </>
                }
                description={
                  <span style={{ color: neutral.slate }}>
                    {l.hospitalName} · {l.surgeonName}
                  </span>
                }
              />
            ))}
          </div>
        )}
        {warning !== null && (
          <Notice tone="warning" live="status" shot="rebook-not-preferred">
            {warning}
          </Notice>
        )}
        {price !== undefined && target !== undefined && (
          <p data-shot="rebook-price" data-kind={price.kind} style={{ margin: 0, fontSize: 13.5, lineHeight: '19px', color: neutral.ink }}>
            <PriceLine price={price} name={target.name} />
          </p>
        )}
        <FormError message={error} shot="rebook-refusal" />
        <SheetActions
          primary={
            <Button
              variant="primary"
              block
              shot="rebook-submit"
              disabled={chosen === undefined || blocked !== null}
              {...(blocked !== null ? { disabledReason: blocked } : {})}
              onClick={rebook}
            >
              Rebook
            </Button>
          }
          secondary={
            <Button variant="secondary" block onClick={onClose}>
              Cancel
            </Button>
          }
        />
      </div>
    </Overlay>
  )
}
