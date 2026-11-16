/**
 * The Party master (catch-up Phase 18; US-04.1.5, DM-48; AR-58 section 2.1,
 * AR-61 `#party`): the one shared record for everyone who holds Contracts.
 * It replaces the old contract holders (hospital, insurer, surgeon,
 * organisation, billable party) and the Insurer master with its
 * direct-claims flag (RV-39).
 *
 * A Party is itself the billing record: it carries no "is billed" setting, no
 * billable-party link and no practitioner link. Whether it is billed is each
 * Contract's `billsTo`; where a Contract is offered is the Contract's own
 * links (AR-58 2.2).
 *
 * Every rule about a Party lives here (`partyRefusal`, `suggestCodePrefix`),
 * behind the types the UI reads. Who is billed reads a Party only through
 * `billablePartyForProcedure` (`whoIsBilled.ts`, catch-up Phase 21).
 */

import type { CounterpartyRef, Hospital, HospitalId } from '../types'

/** Seeded `PY-<NAME>`; allocated at runtime `PYN001` (`PT` is the patient prefix). */
export type PartyId = string

/**
 * The seven kinds (AR-58 2.1). Only `aa`, `hospital`, `insurer`, `funder` and
 * `anaesthetist` drive rules; `surgeon` and `surgeonGroup` only label.
 *
 * Our reading (AR-58 A42): a funder (ACC, Health NZ, NZDF, Veterans Affairs)
 * is a kind of its own, apart from an insurer (nib, Southern Cross Health
 * Society); only an insurer named on a Booking will later warn without an
 * approval number.
 */
export type PartyKind = 'aa' | 'hospital' | 'insurer' | 'funder' | 'surgeon' | 'surgeonGroup' | 'anaesthetist'

/**
 * How invoices to this Party go out (AR-58 2.1, D2).
 *
 * PROVISIONAL (OQ-114, D55): email or post only. The other outputs (an
 * insurer's portal, an API) are still open, so there is no portal value and
 * nib's Party delivers by email. If OQ-114 names more outputs, extend this one
 * type and hand the values to Phase 22, which sends by it.
 */
export type DeliveryMethod = 'email' | 'post'

export interface Party {
  id: PartyId
  kind: PartyKind
  /** AR-58 `name`: the short name lists and the step rail show ("Christchurch Eye Surgery", "nib"). */
  name: string
  /**
   * Ours, not AR-58's: the AA code prefix for this Party's Contracts (2 to 6
   * capitals, unique, for example `CES`, `NIB`). `nextAaCode` numbers each
   * prefix's Contracts (`CES-001`).
   */
  codePrefix: string
  /** AR-58 `billingName`: printed on invoices to this Party. */
  billingName?: string
  /** AR-58 `email`: required when `deliveryMethod` is `email`. */
  email?: string
  /** AR-58 `postalAddress`: required when `deliveryMethod` is `post`. */
  postalAddress?: string
  /** AR-58 `deliveryMethod`. */
  deliveryMethod?: DeliveryMethod
  /** AR-58 `hospitalId`: kind `hospital` only, and then required. Never AA's rooms. */
  hospitalId?: HospitalId
  /**
   * Ours: the hidden identity invoices and Xero key on when a Contract bills
   * this Party (`{ insurer, I-NIB }`, `{ organisation, O-COS }`, Aria's
   * `{ billableParty, BP0002 }` folded from the retired guardian master in
   * catch-up Phase 21), so no issued counterparty or Xero contact moves. A
   * hospital Party with none bills as its hospital; any other Party with none
   * bills as `{ party, <its id> }` (`holderCounterparty`, `whoIsBilled.ts`).
   * Never shown and never edited.
   */
  billingIdentity?: CounterpartyRef
}

export interface PartyRefusal {
  code: PartyRefusalCode
  message: string
}

export type PartyRefusalCode =
  | 'nameRequired'
  | 'hospitalRequired'
  | 'hospitalOnlyOnHospital'
  | 'notAaRooms'
  | 'oneAaParty'
  | 'aaReadOnly'
  | 'codePrefixFormat'
  | 'codePrefixTaken'
  | 'kindFixedWhileHolding'
  | 'hospitalFixedWhileHolding'
  | 'oneHospitalParty'
  | 'billingNameRequired'
  | 'deliveryRequired'
  | 'emailRequired'
  | 'postalAddressRequired'

/** One sentence per rule, single-sourced: the store refuses with these, the Party panel shows them. */
export const PARTY_REFUSAL_MESSAGES: Record<PartyRefusalCode, string> = {
  nameRequired: 'A Party needs a name.',
  hospitalRequired: 'A hospital Party must name its hospital.',
  hospitalOnlyOnHospital: 'Only a hospital Party names a hospital.',
  notAaRooms: "AA's rooms is a location, never a Party.",
  oneAaParty: 'There is exactly one Anaesthesia Associates Party.',
  aaReadOnly: 'The Anaesthesia Associates Party cannot be changed.',
  codePrefixFormat: 'The code prefix must be 2 to 6 capital letters.',
  codePrefixTaken: 'Another Party already uses this code prefix.',
  kindFixedWhileHolding: "A Party's kind cannot change while it holds Contracts or is the billing record behind Bookings.",
  hospitalFixedWhileHolding: "A hospital Party's hospital cannot change while it holds Contracts.",
  oneHospitalParty: 'That hospital already has its Party.',
  billingNameRequired: 'A Party billed by a Contract needs a billing name.',
  deliveryRequired: 'A Party billed by a Contract needs a delivery method, email or post.',
  emailRequired: 'Delivery by email needs an email address.',
  postalAddressRequired: 'Delivery by post needs a postal address.',
}

const refusal = (code: PartyRefusalCode): PartyRefusal => ({ code, message: PARTY_REFUSAL_MESSAGES[code] })

export interface PartyRefusalContext {
  /** The Party as stored before this save (absent on create). */
  prev?: Party
  /** Every Party, the one being saved included or not. */
  parties: Readonly<Record<PartyId, Party>>
  hospitals: Readonly<Record<HospitalId, Pick<Hospital, 'locationType'>>>
  /** True when at least one Contract holds this Party (any status). */
  holdsContracts: boolean
  /**
   * True when at least one Contract bills this Party as its holder.
   *
   * Our reading (AR-58 A43): a Party's billing name and delivery details are
   * required only once a Contract bills it, so a Party can be created bare
   * and filled in when it starts to be invoiced.
   */
  billedByAContract: boolean
}

const blank = (s: string | undefined): boolean => s === undefined || s.trim() === ''

/** The first save guard a Party breaks, or null. Applied by the store on every create and edit. */
export function partyRefusal(next: Party, ctx: PartyRefusalContext): PartyRefusal | null {
  if (ctx.prev?.kind === 'aa') return refusal('aaReadOnly')
  if (next.kind === 'aa') return refusal('oneAaParty')
  if (blank(next.name)) return refusal('nameRequired')

  if (next.kind === 'hospital') {
    if (blank(next.hospitalId)) return refusal('hospitalRequired')
    const hospital = ctx.hospitals[next.hospitalId as string]
    if (hospital === undefined) return refusal('hospitalRequired')
    if (hospital.locationType === 'aaRooms') return refusal('notAaRooms')
    if (Object.values(ctx.parties).some((p) => p.id !== next.id && p.kind === 'hospital' && p.hospitalId === next.hospitalId)) {
      return refusal('oneHospitalParty')
    }
  } else if (next.hospitalId !== undefined) {
    return refusal('hospitalOnlyOnHospital')
  }

  if (!/^[A-Z]{2,6}$/.test(next.codePrefix)) return refusal('codePrefixFormat')
  if (Object.values(ctx.parties).some((p) => p.id !== next.id && p.codePrefix === next.codePrefix)) {
    return refusal('codePrefixTaken')
  }

  // A Party that holds Contracts, or stands behind Bookings' counterparty
  // (`billingIdentity`, e.g. an insurer named on Procedures), keeps its kind.
  if (ctx.prev !== undefined && ctx.prev.kind !== next.kind && (ctx.holdsContracts || ctx.prev.billingIdentity !== undefined)) {
    return refusal('kindFixedWhileHolding')
  }
  if (ctx.prev !== undefined && ctx.prev.hospitalId !== next.hospitalId && ctx.holdsContracts) {
    return refusal('hospitalFixedWhileHolding')
  }

  if (ctx.billedByAContract) {
    const billingRefusal = billingDetailsRefusal(next)
    if (billingRefusal !== null) return billingRefusal
  }
  return null
}

/** The billing-details half of `partyRefusal` (A43), for a Contract about to bill this Party. */
export function billingDetailsRefusal(party: Party): PartyRefusal | null {
  if (blank(party.billingName)) return refusal('billingNameRequired')
  if (party.deliveryMethod === undefined) return refusal('deliveryRequired')
  if (party.deliveryMethod === 'email' && blank(party.email)) return refusal('emailRequired')
  if (party.deliveryMethod === 'post' && blank(party.postalAddress)) return refusal('postalAddressRequired')
  return null
}


/** The kinds the office can create: exactly one AA Party exists, seeded and read-only. */
export const CREATABLE_PARTY_KINDS: readonly Exclude<PartyKind, 'aa'>[] = [
  'hospital',
  'insurer',
  'funder',
  'surgeon',
  'surgeonGroup',
  'anaesthetist',
]


/** The insurer Parties a billing line's `funderOverride` can name, each with its interim insurer id, by name (INTERIM until Phase 22's Split). */
export function insurerPartyOptions(
  parties: Readonly<Record<PartyId, Party>>,
): { insurerId: string; party: Party }[] {
  return Object.values(parties)
    .filter((p) => p.kind === 'insurer' && p.billingIdentity?.kind === 'insurer')
    .map((p) => ({ insurerId: (p.billingIdentity as CounterpartyRef).id, party: p }))
    .sort((a, b) => a.party.name.localeCompare(b.party.name))
}

/**
 * A free code prefix from a name's initials or first word ("Rangiora Day
 * Surgery" to `RDS`); when those are taken, the base plus one or two more
 * letters. Never returns a taken prefix.
 */
export function suggestCodePrefix(name: string, taken: ReadonlySet<string>): string {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w !== '')
  const candidates: string[] = []
  const initials = words.map((w) => w[0]).join('').slice(0, 6)
  if (initials.length >= 2) candidates.push(initials)
  const first = words[0] ?? ''
  if (first.length >= 2) candidates.push(first.slice(0, 6), first.slice(0, 3))
  for (const c of candidates) if (!taken.has(c)) return c
  const base = (candidates[0] ?? 'PY').slice(0, 4)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (const a of letters) {
    if (!taken.has(`${base}${a}`)) return `${base}${a}`
  }
  for (const a of letters) for (const b of letters) {
    if (!taken.has(`${base}${a}${b}`)) return `${base}${a}${b}`
  }
  throw new Error('No free code prefix')
}
