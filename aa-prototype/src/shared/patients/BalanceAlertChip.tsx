/**
 * The anaesthetist's balance colour code (catch-up Phase 40; US-11.3.2,
 * US-15.0.6): on the Booking row of their List and in the Booking detail, on
 * mobile, web and the PWA. Built on `Pill`: mild is the warning tint (a colour
 * code), strong the error tint. It carries no amount, no patient name, no
 * Clear and no link to the patient record, and it follows the live strength
 * while ignoring the office's Clear: it stays until the balance is paid.
 * Renders nothing when there is no balance warning, or on another
 * anaesthetist's List.
 */

import { useMemo } from 'react'
import { useAppStore } from '../../store'
import { PATIENT_BALANCE_CREDIT_SHORT } from '../../domain/warnings'
import { Pill } from '../ui/Pill'
import { balanceAlertForBooking, type BalanceAlert } from './balanceAlert'

/** The live alert on one Booking for the anaesthetist viewing it. */
export function useBalanceAlert(bookingId: string, viewerAnaesthetistId: string | undefined): BalanceAlert {
  const schedule = useAppStore((s) => s.schedule)
  const billing = useAppStore((s) => s.billing)
  const appSettings = useAppStore((s) => s.appSettings)
  const clock = useAppStore((s) => s.clock)
  const masters = useAppStore((s) => s.masters)
  return useMemo(
    () => balanceAlertForBooking({ schedule, billing, appSettings, clock, masters }, bookingId, viewerAnaesthetistId),
    [schedule, billing, appSettings, clock, masters, bookingId, viewerAnaesthetistId],
  )
}

/** The short label a List row has room for; the full sentence rides in the title and the accessible name. */
export function balanceAlertRowLabel(text: string | undefined): string {
  return text === PATIENT_BALANCE_CREDIT_SHORT ? 'In credit with AA' : 'Owes AA'
}

export function BalanceAlertChip({
  bookingId,
  viewerAnaesthetistId,
  placement = 'row',
}: {
  bookingId: string
  /** The anaesthetist viewing (their own List only). */
  viewerAnaesthetistId: string | undefined
  /** `row`: the List row's short label; `detail`: the full sentence, wrapping, in the Booking detail. */
  placement?: 'row' | 'detail'
}) {
  return <BalanceAlertPill alert={useBalanceAlert(bookingId, viewerAnaesthetistId)} placement={placement} />
}

/** The chip over a plain `BalanceAlert` (the component catalogue); nothing when there is no alert. */
export function BalanceAlertPill({ alert, placement = 'row' }: { alert: BalanceAlert; placement?: 'row' | 'detail' }) {
  if (alert.strength === 'none' || alert.text === undefined) return null
  const tone = alert.strength === 'strong' ? 'error' : 'warning'
  if (placement === 'detail') {
    return (
      <Pill shot="balance-alert-chip" data-strength={alert.strength} tone={tone} size="lg" style={{ whiteSpace: 'normal', alignSelf: 'flex-start', lineHeight: '17px' }}>
        {alert.text}
      </Pill>
    )
  }
  return (
    <Pill shot="balance-alert-chip" data-strength={alert.strength} tone={tone} size="sm" title={alert.text} ariaLabel={alert.text} style={{ flex: 'none' }}>
      {balanceAlertRowLabel(alert.text)}
    </Pill>
  )
}
