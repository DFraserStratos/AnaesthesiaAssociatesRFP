/**
 * The split section of the Paid by sheet (catch-up Phase 22's Split sheet,
 * made a section of `PaidBySheet` by catch-up Phase 22a; US-08.2.3, DM-28,
 * RV-31): divide one Procedure's fee between billable parties, each share
 * typed in $ or %, one party at most taking the rest. A share can name
 * "another person" (22a): name, relationship and an email or NZ Post postal
 * address, kept on the share with their own `BP####` id. No setting on the
 * Contract; every rule is `splitShare.ts`'s (parsed by `parseShare`,
 * resolved live by `resolveSplit`); this section only shows the result and
 * hands the sheet its shares. The sheet's one Save writes it. PWA-safe.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { accent, neutral, radius } from '../../theme/tokens'
import type { CounterpartyRef, SplitShare } from '../../domain/types'
import { formatMoney } from '../../domain/billing/money'
import { cleanPostalAddress, payerHasContact } from '../../domain/billing'
import { PARTY_MISSING_REASON, parseShare, resolveSplit, shareText, type SplitResolution } from '../../domain/billing/splitShare'
import type { PartyOption } from '../../domain/billing/partyOptions'
import {
  NO_FEE_TO_SPLIT_MESSAGE,
  PAYER_NAME_REQUIRED,
  contractPartyFor,
  partyOptionsForProcedure,
  procedureFeeNow,
  useAppStore,
  type FeeSplitInput,
  type SplitPersonInput,
  type SplitShareInput,
} from '../../store'
import { CloseButton, FormError, Notice, TextField } from '../ui'
import { TextAction } from '../ui/TextAction'
import { PartyPicker } from '../booking/PartyPicker'
import { addressDraftOf } from './PostalAddressFields'
import { EMPTY_OTHER_PAYER, OtherPayerFields, otherPayerInput, type OtherPayerDraft } from './PayerFields'

/** The words the sheet shows when another person on a share has no way to receive the invoice (US-11.2.3). */
export const PERSON_CONTACT_ASK = 'Add an email or a postal address for this person. They need one to receive the invoice.'

/** Another person as typed on a share; `id` keeps the share's `BP####` when editing them. */
interface PersonDraft extends OtherPayerDraft {
  id?: string
}

interface Row {
  key: number
  party: CounterpartyRef | null
  person: PersonDraft | null
  text: string
  rest: boolean
}

function personDraftOf(share: SplitShare): PersonDraft | null {
  const p = share.person
  if (p === undefined) return null
  return { id: p.id, name: p.name, relationship: p.relationship ?? '', email: p.email ?? '', phone: p.phone ?? '', address: addressDraftOf(p.postalAddress) }
}

/** The rows' shares as the store takes them, or the first problem in words. */
function sharesOf(rows: readonly Row[]): { ok: true; shares: SplitShareInput[] } | { ok: false; reason: string } {
  const shares: SplitShareInput[] = []
  for (const row of rows) {
    if (row.party === null && row.person === null) return { ok: false, reason: PARTY_MISSING_REASON }
    if (row.person !== null && row.person.name.trim() === '') return { ok: false, reason: PAYER_NAME_REQUIRED }
    let basis: SplitShare['basis']
    if (row.rest) basis = { kind: 'rest' }
    else {
      const parsed = parseShare(row.text)
      if (!parsed.ok) return { ok: false, reason: parsed.reason }
      basis = parsed.basis
    }
    if (row.person !== null) shares.push({ person: otherPayerInput(row.person, row.person.id) as SplitPersonInput, basis })
    else shares.push({ party: row.party as CounterpartyRef, basis })
  }
  return { ok: true, shares }
}

/** For the live sums only: each typed person stands in under a placeholder reference. */
function previewShares(shares: readonly SplitShareInput[]): SplitShare[] {
  return shares.map((s, i) => ('party' in s ? { party: s.party, basis: s.basis } : { party: { kind: 'payer', id: `typed-${i}` }, basis: s.basis }))
}

/** A Paid by sheet section's heading (the sheet's Who pays, Also change and Split the fee). */
export const SECTION_HEADING = { margin: 0, fontSize: 15, fontWeight: 700, color: neutral.ink } as const

export interface SplitDraft {
  /** The fee before GST, or undefined with no fee yet. */
  feeTotal: number | undefined
  options: readonly PartyOption[]
  rows: Row[]
  /** The section is showing share rows (a split exists, or one was started). */
  active: boolean
  /** The Procedure had a split when the sheet opened. */
  hadSplit: boolean
  /** What Save writes: the shares, `null` to remove the split, undefined to leave it. */
  change: FeeSplitInput | null | undefined
  /** The first problem with the shares typed so far, or null. */
  problem: string | null
  /** Save must stop: the split was started or edited, and its shares cannot be read yet. */
  blocked: boolean
  /** The section is showing `problem` (once every row has something in it, or with no fee). */
  showsProblem: boolean
  start: () => void
  remove: () => void
  update: (key: number, patch: Partial<Row>) => void
  chooseRest: (key: number) => void
  addRow: () => void
  removeRow: (key: number) => void
}

/** The split's draft state, read once per opening (the sheet is modal; the fee and options do not move under it). */
export function useSplitDraft(procedureId: string, open: boolean, startActive: boolean, onEdit?: () => void): SplitDraft {
  const procedure = useAppStore((s) => s.schedule.procedures[procedureId])
  const snapshot = useMemo(() => {
    if (!open) return undefined
    const state = useAppStore.getState()
    return {
      fee: procedureFeeNow(state, procedureId),
      options: partyOptionsForProcedure(state, procedureId),
      contractParty: contractPartyFor(state, procedureId),
    }
  }, [open, procedureId])
  const [rows, setRows] = useState<Row[]>([])
  const [nextKey, setNextKey] = useState(0)
  const [active, setActive] = useState(false)
  // Untouched since the sheet opened: an existing split is then left as stored (no write, no audit).
  const [touched, setTouched] = useState(false)

  const blankRows = (): Row[] => [
    { key: 0, party: snapshot?.contractParty ?? null, person: null, text: '', rest: true },
    { key: 1, party: null, person: null, text: '', rest: false },
  ]

  useEffect(() => {
    if (!open || snapshot === undefined) return
    const existing = procedure?.split?.shares
    const start: Row[] =
      existing !== undefined
        ? existing.map((s, i) => ({ key: i, party: s.person === undefined ? s.party : null, person: personDraftOf(s), text: shareText(s.basis), rest: s.basis.kind === 'rest' }))
        : blankRows()
    setRows(start)
    setNextKey(start.length)
    setActive(existing !== undefined || startActive)
    setTouched(false)
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const hadSplit = procedure?.split !== undefined
  const parsed = sharesOf(rows)
  const feeTotal = snapshot?.fee?.total
  const resolution: SplitResolution | undefined = feeTotal !== undefined && parsed.ok ? resolveSplit(feeTotal, previewShares(parsed.shares)) : undefined
  const problem = !active ? null : feeTotal === undefined ? NO_FEE_TO_SPLIT_MESSAGE : !parsed.ok ? parsed.reason : resolution?.ok === false ? resolution.reason : null
  const filled = rows.every((r) => (r.party !== null || (r.person !== null && r.person.name.trim() !== '')) && (r.rest || r.text.trim() !== ''))
  const showsProblem = problem !== null && (filled || feeTotal === undefined)
  // Opened by Split but untouched leaves the Procedure as it is (no split written, nothing refused).
  const pending = touched || (hadSplit && !active)
  const blocked = pending && active && !parsed.ok
  const change: SplitDraft['change'] = !pending ? undefined : active ? (parsed.ok ? { shares: parsed.shares } : undefined) : hadSplit ? null : undefined
  const edited = () => {
    setTouched(true)
    onEdit?.()
  }

  return {
    feeTotal,
    options: snapshot?.options ?? [],
    rows,
    active,
    hadSplit,
    change,
    problem,
    showsProblem,
    blocked,
    start: () => {
      edited()
      if (rows.length === 0) {
        setRows(blankRows())
        setNextKey(2)
      }
      setActive(true)
    },
    remove: () => {
      edited()
      setActive(false)
      setRows(blankRows())
      setNextKey(2)
    },
    update: (key, patch) => {
      edited()
      setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))
    },
    // "Takes the rest" is one of N: choosing it on a row takes it off the others; choosing it again clears it.
    chooseRest: (key) => {
      edited()
      setRows((rs) => rs.map((r) => ({ ...r, rest: r.key === key ? !r.rest : false })))
    },
    addRow: () => {
      edited()
      setRows((rs) => [...rs, { key: nextKey, party: null, person: null, text: '', rest: false }])
      setNextKey(nextKey + 1)
    },
    removeRow: (key) => {
      edited()
      setRows((rs) => rs.filter((r) => r.key !== key))
    },
  }
}

export interface SplitFeeSectionProps {
  draft: SplitDraft
  /** The section's own "Split the fee" heading; off when the sheet's title already says it. */
  heading?: boolean
}

export function SplitFeeSection({ draft, heading = true }: SplitFeeSectionProps) {
  const { feeTotal, rows, active } = draft
  // A removed party's X leaves with its row: focus goes to Add a party (bug 9, U5).
  const addPartyRef = useRef<HTMLButtonElement>(null)
  const parsed = sharesOf(rows)
  const resolution = feeTotal !== undefined && parsed.ok ? resolveSplit(feeTotal, previewShares(parsed.shares)) : undefined
  const amounts = resolution?.ok === true ? resolution.amounts : undefined
  const total = amounts?.reduce((s, a) => s + a.amountExGst, 0)
  const options = draft.options

  return (
    <section data-shot="split-sheet" aria-label="Split the fee" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(heading || (active && draft.hadSplit)) && (
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: heading ? 'space-between' : 'flex-end', gap: 12 }}>
        {heading && <h3 style={SECTION_HEADING}>Split the fee</h3>}
        {active && draft.hadSplit && (
          <TextAction shot="split-remove" onClick={draft.remove} label="Remove the split">
            Remove split
          </TextAction>
        )}
      </div>
      )}

      {!active ? (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 13, lineHeight: '19px', color: neutral.slate }}>
            {draft.hadSplit ? 'The split is removed when you save.' : 'Invoice each party its own share of this procedure’s fee.'}
          </span>
          <TextAction shot="split-start" onClick={draft.start} label={draft.hadSplit ? 'Keep the split' : 'Split the fee'}>
            {draft.hadSplit ? 'Keep split' : 'Split'}
          </TextAction>
        </div>
      ) : (
        <>
          <span style={{ fontSize: 13, lineHeight: '19px', color: neutral.slate }}>Type each share in $ or %; one party can take the rest.</span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: neutral.bg, borderRadius: radius.ctl }}>
            <span style={{ fontSize: 13, color: neutral.slate }}>Procedure fee, before GST</span>
            <span data-shot="split-fee" className="mono" style={{ fontSize: 16, fontWeight: 700, color: neutral.ink }}>
              {feeTotal !== undefined ? formatMoney(feeTotal) : 'No fee yet'}
            </span>
          </div>

          <ol role="radiogroup" aria-label="Who takes the rest" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rows.map((row, index) => {
              const amount = amounts?.[index]
              const person = row.person
              const personNeedsContact =
                person !== null && person.name.trim() !== '' && !payerHasContact({ email: person.email, postalAddress: cleanPostalAddress(person.address) })
              return (
                <li
                  key={row.key}
                  data-shot="split-row"
                  data-row={index}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12, borderBottom: `1px solid ${neutral.line}` }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {person === null ? (
                        <PartyPicker
                          options={options}
                          value={row.party}
                          onChange={(party) => draft.update(row.key, { party })}
                          label={`Party ${index + 1}`}
                          exclude={rows.filter((r) => r.key !== row.key && r.party !== null).map((r) => r.party as CounterpartyRef)}
                          onAnotherPerson={() => draft.update(row.key, { party: null, person: { ...EMPTY_OTHER_PAYER } })}
                        />
                      ) : (
                        <div data-shot="split-person" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: neutral.ink }}>Party {index + 1}: another person</span>
                            <TextAction size="sm" onClick={() => draft.update(row.key, { person: null })} label={`Choose a party for share ${index + 1} instead`}>
                              Choose a party
                            </TextAction>
                          </div>
                          <OtherPayerFields draft={person} onChange={(next) => draft.update(row.key, { person: { ...next, ...(person.id !== undefined ? { id: person.id } : {}) } })} />
                          {personNeedsContact && (
                            <Notice tone="warning" live="status" shot="split-person-contact-ask">
                              {PERSON_CONTACT_ASK}
                            </Notice>
                          )}
                        </div>
                      )}
                    </div>
                    {rows.length > 2 && (
                      <CloseButton
                        label={`Remove party ${index + 1}`}
                        iconSize={18}
                        returnFocusTo={addPartyRef}
                        onClick={() => draft.removeRow(row.key)}
                        style={{ flex: 'none', width: 44, height: 44, padding: 0, borderRadius: radius.ctl, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    {row.rest ? (
                      <div data-shot="split-share-rest" style={{ width: 140, minHeight: 44, display: 'flex', alignItems: 'center', fontSize: 14, color: neutral.slate }}>
                        The rest of the fee
                      </div>
                    ) : (
                      <div data-shot="split-share-input" style={{ width: 140 }}>
                        <TextField label={`Share ${index + 1}, $ or %`} value={row.text} onChange={(text) => draft.update(row.key, { text })} placeholder="$48 or 48%" mono />
                      </div>
                    )}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={row.rest}
                      aria-label={`Party ${index + 1} takes the rest`}
                      data-shot="split-rest-toggle"
                      onClick={() => draft.chooseRest(row.key)}
                      style={{
                        minHeight: 44,
                        padding: '0 14px',
                        borderRadius: radius.pill,
                        border: `1px solid ${row.rest ? accent.base : neutral.line}`,
                        background: row.rest ? accent.tint : neutral.surface,
                        color: row.rest ? accent.pressed : neutral.ink,
                        fontFamily: 'inherit',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Takes the rest
                    </button>
                    <span data-shot="split-amount" className="mono" style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 14, fontWeight: 600, color: amount !== undefined ? neutral.ink : neutral.mist }}>
                      {amount !== undefined ? formatMoney(amount.amountExGst) : '·'}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <TextAction shot="split-add-party" buttonRef={addPartyRef} onClick={draft.addRow}>
              Add a party
            </TextAction>
            {feeTotal !== undefined && (
              <span data-shot="split-total" className="mono" style={{ fontSize: 13.5, color: neutral.slate }}>
                {total !== undefined ? formatMoney(total) : '·'} of {formatMoney(feeTotal)}
              </span>
            )}
          </div>
          {/* Say what is wrong only once every row has something in it. */}
          <FormError message={draft.showsProblem ? draft.problem : null} />
        </>
      )}
    </section>
  )
}
