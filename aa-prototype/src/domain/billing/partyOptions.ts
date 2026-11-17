/**
 * The parties an invoice can be addressed to, in the order a picker offers
 * them (catch-up Phase 22; the Split sheet's party field, reused by Phases
 * 38b, 39 and 39b): the Procedure's payer, then the party the Procedure's
 * Contract bills, then every Party that can be billed, by name. It creates no
 * party record. Pure; the store gathers the names.
 */

import type { CounterpartyRef, Procedure, SplitShare } from '../types'
import { matchesNameQuery } from '../names'
import type { Party, PartyKind } from './parties'
import { holderCounterparty, partyForCounterparty, payerCounterparty } from './whoIsBilled'

export interface PartyOption {
  ref: CounterpartyRef
  name: string
  /** "Payer", "Contract's party", or the Party's kind. */
  hint: string
  /** The group a picker shows it under. */
  group: 'booking' | 'parties'
}

/** The Party kinds never billed through a picker: AA itself, and an anaesthetist. */
const NOT_BILLABLE: ReadonlySet<PartyKind> = new Set(['aa', 'anaesthetist'])

export const PARTY_OPTION_KIND_HINT: Record<PartyKind, string> = {
  aa: 'AA',
  hospital: 'Hospital',
  insurer: 'Insurer',
  funder: 'Funder',
  surgeon: 'Surgeon',
  surgeonGroup: 'Surgeon group',
  anaesthetist: 'Anaesthetist',
}

const keyOf = (ref: CounterpartyRef): string => `${ref.kind}:${ref.id}`

/**
 * The options: the Procedure's payer first, the Contract's party next (when
 * it is not the payer), then the Parties by name; each reference once.
 */
export function partyOptionsFor(
  procedure: Pick<Procedure, 'payer'>,
  patientId: string,
  contractParty: CounterpartyRef | undefined,
  parties: Readonly<Record<string, Party>>,
  nameOf: (ref: CounterpartyRef) => string,
): PartyOption[] {
  const out: PartyOption[] = []
  const seen = new Set<string>()
  const add = (option: PartyOption): void => {
    const key = keyOf(option.ref)
    if (seen.has(key)) return
    seen.add(key)
    out.push(option)
  }
  const payer = payerCounterparty(procedure, patientId)
  add({ ref: payer, name: nameOf(payer), hint: 'Payer', group: 'booking' })
  if (contractParty !== undefined) add({ ref: contractParty, name: nameOf(contractParty), hint: "Contract's party", group: 'booking' })
  const rest = Object.values(parties)
    .filter((p) => !NOT_BILLABLE.has(p.kind))
    .sort((a, b) => a.name.localeCompare(b.name))
  for (const party of rest) add({ ref: holderCounterparty(party), name: party.name, hint: PARTY_OPTION_KIND_HINT[party.kind], group: 'parties' })
  return out
}

/** The options whose name matches the typed text (the one name matcher, `matchesNameQuery`); all when blank. */
export function filterPartyOptions(options: readonly PartyOption[], query: string): PartyOption[] {
  return options.filter((o) => matchesNameQuery(o.name, query))
}

/**
 * True when this party can be billed on this Procedure: the Procedure's payer
 * as it is now, or a Party that can be billed (not AA, not an anaesthetist).
 * A share whose payer was renamed (a new BP id) or replaced fails it, so the
 * Split action refuses it and the run, review and the warning say the split no
 * longer fits rather than bill someone who has left the Procedure.
 */
export function isBillablePartyOn(
  procedure: Pick<Procedure, 'payer'>,
  patientId: string,
  ref: CounterpartyRef,
  parties: Readonly<Record<string, Party>>,
): boolean {
  const payer = payerCounterparty(procedure, patientId)
  if (ref.kind === payer.kind && ref.id === payer.id) return true
  const party = partyForCounterparty(ref, parties)
  return party !== undefined && !NOT_BILLABLE.has(party.kind)
}

/** True when every share's party can still be billed on the Procedure. */
export function splitPartiesOn(
  procedure: Pick<Procedure, 'payer'>,
  patientId: string,
  shares: readonly SplitShare[],
  parties: Readonly<Record<string, Party>>,
): boolean {
  return shares.every((share) => isBillablePartyOn(procedure, patientId, share.party, parties))
}
