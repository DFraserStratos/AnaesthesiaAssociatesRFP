/**
 * A surgeon's contacts and the one office email helper (catch-up Phase 17b;
 * US-13.6.5, DM-60; OQ-127 answered, D74). Pure, no React, never imports
 * `src/shared`.
 *
 * The system keeps no record of surgeons' rooms. Each surgeon holds one
 * personal contact (their own name, email and phone) and one or more office
 * contacts (a practice manager, PA or shared inbox), in order.
 *
 * **The one email helper.** `officeAddressFor` is the only way the office's
 * emails find a surgeon's address: the first office contact with an email is
 * the To and the other office contacts with an email are offered, never every
 * contact at once and never the personal contact. Given a List that came
 * from a rooms' PDF (catch-up Phase 34, US-02.2.4), the address the PDF
 * arrived from is the To instead, and the office contacts are all offered;
 * Phase 35's update email and Phase 40's NHI request read it and nothing else
 * (`apps/officeAddressGuard.test.ts` keeps every other reader of
 * `officeContacts` out).
 */

import type { ListOrigin, Surgeon, SurgeonContact, SurgeonId } from './types'

/** Trim each field and drop the blank ones (never `''`). */
export function cleanContact(c: SurgeonContact | undefined): SurgeonContact {
  const out: SurgeonContact = {}
  const name = c?.name?.trim() ?? ''
  const email = c?.email?.trim() ?? ''
  const phone = c?.phone?.trim() ?? ''
  if (name !== '') out.name = name
  if (email !== '') out.email = email
  if (phone !== '') out.phone = phone
  return out
}

/** True when the contact holds no name, email or phone (after trimming). */
export function isBlankContact(c: SurgeonContact | undefined): boolean {
  const cleaned = cleanContact(c)
  return cleaned.name === undefined && cleaned.email === undefined && cleaned.phone === undefined
}

/** One address the office can send to: an office contact, or the address the List's PDF arrived from (Phase 34). */
export interface OfficeAddress {
  email: string
  name?: string
  /** The office contact's phone, when held (shown beside the address to chase, Phase 40). */
  phone?: string
  source: 'officeContact' | 'listSender'
}

/** The To and the addresses offered beside it. `to` is `null` when none is held. */
export interface OfficeAddresses {
  to: OfficeAddress | null
  others: OfficeAddress[]
}

/**
 * The address the office's emails use for a surgeon: the first office contact
 * with a non-blank email is `to`; `others` are the remaining office contacts
 * with an email, in order, de-duplicated by email (ignoring case), never
 * repeating `to`. Never the personal contact. Given a `list` whose origin is a
 * rooms' PDF (US-02.2.4), its sender is `to` and every office contact is
 * offered (an office contact with the sender's address is dropped). An unknown
 * surgeon, or one with no address held, gives `{ to: null, others: [] }`.
 * Never throws.
 */
export function officeAddressFor(
  masters: { surgeons: Readonly<Record<string, Surgeon>> },
  surgeonId: SurgeonId,
  list?: { origin: ListOrigin },
): OfficeAddresses {
  const surgeon = masters.surgeons[surgeonId]
  const seen = new Set<string>()
  const addresses: OfficeAddress[] = []
  const sender = list?.origin.kind === 'pdf' ? list.origin.senderEmail.trim() : ''
  if (sender !== '') {
    seen.add(sender.toLowerCase())
    addresses.push({ email: sender, source: 'listSender' })
  }
  for (const contact of surgeon?.officeContacts ?? []) {
    const { name, email, phone } = cleanContact(contact)
    if (email === undefined) continue
    const key = email.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    addresses.push({ email, ...(name !== undefined ? { name } : {}), ...(phone !== undefined ? { phone } : {}), source: 'officeContact' })
  }
  const [to, ...others] = addresses
  return { to: to ?? null, others }
}
