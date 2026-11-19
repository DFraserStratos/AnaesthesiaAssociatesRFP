/**
 * The contact archive rule (Phase 10, lifted here in catch-up Phase 43 so the
 * full-scale generator and the nightly job share one rule): an individual
 * (patient or billable party) Xero contact may be archived once every ACCREC
 * billed to it is fully paid and its last activity (latest invoice raise or
 * payment) is at least `windowDays` before today. Organisation contacts never
 * archive.
 *
 * Linear: ACCRECs are grouped by contact and payments by ACCREC once, so the
 * rule holds at 28,000 contacts (the old loop re-filtered every ACCREC per
 * contact, which went quadratic).
 */

import { toCents } from './money'
import { epochDayOf } from '../dateDays'
import type { Invoice, PaymentIn, XeroAccRec, XeroContact } from '../types'

export interface ContactArchiveInput {
  contacts: Readonly<Record<string, XeroContact>>
  accRecs: Readonly<Record<string, XeroAccRec>>
  payments: Readonly<Record<string, PaymentIn>>
  invoices: Readonly<Record<string, Pick<Invoice, 'raisedAtISO'>>>
  todayISO: string
  windowDays: number
}

/** The contact ids eligible to archive now, sorted. */
export function eligibleArchiveContactIdsOf(input: ContactArchiveInput): string[] {
  const accRecsByContact = new Map<string, XeroAccRec[]>()
  for (const r of Object.values(input.accRecs)) {
    const bucket = accRecsByContact.get(r.contactId)
    if (bucket === undefined) accRecsByContact.set(r.contactId, [r])
    else bucket.push(r)
  }
  const lastPaymentDayByAccRec = new Map<string, number>()
  for (const p of Object.values(input.payments)) {
    const day = epochDayOf(p.atISO)
    const prev = lastPaymentDayByAccRec.get(p.accRecId)
    if (prev === undefined || day > prev) lastPaymentDayByAccRec.set(p.accRecId, day)
  }
  const todayDay = epochDayOf(input.todayISO)
  const eligible: string[] = []
  for (const contact of Object.values(input.contacts)) {
    if (contact.archived) continue
    if (contact.type === 'organisation') continue
    const accRecs = accRecsByContact.get(contact.contactId)
    if (accRecs === undefined || accRecs.length === 0) continue
    if (!accRecs.every((r) => toCents(r.amountReceived) >= toCents(r.amountDue))) continue
    let lastActivityDay = -Infinity
    for (const r of accRecs) {
      const raised = input.invoices[r.invoiceId]?.raisedAtISO
      if (raised !== undefined) lastActivityDay = Math.max(lastActivityDay, epochDayOf(raised))
      const paid = lastPaymentDayByAccRec.get(r.id)
      if (paid !== undefined) lastActivityDay = Math.max(lastActivityDay, paid)
    }
    if (lastActivityDay === -Infinity) continue
    if (todayDay - lastActivityDay >= input.windowDays) eligible.push(contact.contactId)
  }
  return eligible.sort((a, b) => a.localeCompare(b))
}
