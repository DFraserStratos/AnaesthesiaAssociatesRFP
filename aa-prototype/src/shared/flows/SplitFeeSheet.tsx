/**
 * The Split sheet (catch-up Phase 22; US-08.2.3, DM-28, RV-31): divide one
 * Procedure's fee between billable parties, each share typed in $ or %, one
 * party at most taking the rest. A bottom sheet on the phone, a dialog on web
 * and Admin; the office and the anaesthetist on their own Booking. No setting
 * on the Contract; every rule is `splitShare.ts`'s (parsed by `parseShare`,
 * resolved live by `resolveSplit`); this sheet only shows the result. PWA-safe.
 */

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { accent, neutral, radius } from '../../theme/tokens'
import type { CounterpartyRef, SplitShare } from '../../domain/types'
import { formatMoney } from '../../domain/billing/money'
import { PARTY_MISSING_REASON, parseShare, resolveSplit, shareText, type SplitResolution } from '../../domain/billing/splitShare'
import {
  NO_FEE_TO_SPLIT_MESSAGE,
  contractPartyFor,
  partyOptionsForProcedure,
  procedureFeeNow,
  setProcedureSplit,
  useAppStore,
  type Actor,
} from '../../store'
import { Button, FormError, TextField } from '../ui'
import { TextAction } from '../ui/TextAction'
import { useSurface } from '../surface'
import { OverlayHeader } from '../surface/OverlayHeader'
import { SheetActions } from '../surface/SheetActions'
import { PartyPicker } from '../booking/PartyPicker'

interface SplitFeeSheetProps {
  open: boolean
  bookingId: string
  procedureId: string
  actor: Actor
  onClose: () => void
}

interface Row {
  key: number
  party: CounterpartyRef | null
  text: string
  rest: boolean
}

/** The rows' shares, or the first problem in words (a row with no party, or an unreadable share). */
function sharesOf(rows: readonly Row[]): { ok: true; shares: SplitShare[] } | { ok: false; reason: string } {
  const shares: SplitShare[] = []
  for (const row of rows) {
    if (row.party === null) return { ok: false, reason: PARTY_MISSING_REASON }
    if (row.rest) {
      shares.push({ party: row.party, basis: { kind: 'rest' } })
      continue
    }
    const parsed = parseShare(row.text)
    if (!parsed.ok) return { ok: false, reason: parsed.reason }
    shares.push({ party: row.party, basis: parsed.basis })
  }
  return { ok: true, shares }
}

export function SplitFeeSheet({ open, bookingId, procedureId, actor, onClose }: SplitFeeSheetProps) {
  const { Overlay, variant } = useSurface()
  const procedure = useAppStore((s) => s.schedule.procedures[procedureId])
  // Read once per opening: the sheet is modal, and the fee and options do not move under it.
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || snapshot === undefined) return
    const existing = procedure?.split?.shares
    const start: Row[] =
      existing !== undefined
        ? existing.map((s, i) => ({ key: i, party: s.party, text: shareText(s.basis), rest: s.basis.kind === 'rest' }))
        : [
            { key: 0, party: snapshot.contractParty ?? null, text: '', rest: true },
            { key: 1, party: null, text: '', rest: false },
          ]
    setRows(start)
    setNextKey(start.length)
    setError(null)
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const feeTotal = snapshot?.fee?.total
  const parsed = sharesOf(rows)
  const resolution: SplitResolution | undefined = feeTotal !== undefined && parsed.ok ? resolveSplit(feeTotal, parsed.shares) : undefined
  const amounts = resolution?.ok === true ? resolution.amounts : undefined
  const reason = feeTotal === undefined ? NO_FEE_TO_SPLIT_MESSAGE : !parsed.ok ? parsed.reason : resolution?.ok === false ? resolution.reason : null
  // Say what is wrong only once every row has something in it.
  const filled = rows.every((r) => r.party !== null && (r.rest || r.text.trim() !== ''))
  const total = amounts?.reduce((s, a) => s + a.amountExGst, 0)

  // Any change clears a refused save's message, so the live reason shows again.
  const update = (key: number, patch: Partial<Row>) => {
    setError(null)
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }
  // "Takes the rest" is one of N: choosing it on a row takes it off the others; choosing it again clears it.
  const chooseRest = (key: number) => {
    setError(null)
    setRows((rs) => rs.map((r) => ({ ...r, rest: r.key === key ? !r.rest : false })))
  }

  function save() {
    setError(null)
    if (!parsed.ok) {
      setError(parsed.reason)
      return
    }
    const outcome = setProcedureSplit(useAppStore, actor, bookingId, procedureId, { shares: parsed.shares })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  function removeSplit() {
    const outcome = setProcedureSplit(useAppStore, actor, bookingId, procedureId, null)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div data-shot="split-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: variant === 'web' ? 560 : undefined, maxWidth: '100%' }}>
        <OverlayHeader
          title="Split the fee"
          description={<>Invoice each party its own share of this procedure&apos;s fee. Type each share in $ or %; one party can take the rest.</>}
        />

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: neutral.bg, borderRadius: radius.ctl }}>
          <span style={{ fontSize: 13, color: neutral.slate }}>Procedure fee, before GST</span>
          <span data-shot="split-fee" className="mono" style={{ fontSize: 16, fontWeight: 700, color: neutral.ink }}>
            {feeTotal !== undefined ? formatMoney(feeTotal) : 'No fee yet'}
          </span>
        </div>

        <ol role="radiogroup" aria-label="Who takes the rest" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((row, index) => {
            const amount = amounts?.[index]
            return (
              <li
                key={row.key}
                data-shot="split-row"
                data-row={index}
                style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12, borderBottom: `1px solid ${neutral.line}` }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <PartyPicker
                      options={snapshot?.options ?? []}
                      value={row.party}
                      onChange={(party) => update(row.key, { party })}
                      label={`Party ${index + 1}`}
                      exclude={rows.filter((r) => r.key !== row.key && r.party !== null).map((r) => r.party as CounterpartyRef)}
                    />
                  </div>
                  {rows.length > 2 && (
                    <button
                      type="button"
                      aria-label={`Remove party ${index + 1}`}
                      onClick={() => {
                        setError(null)
                        setRows((rs) => rs.filter((r) => r.key !== row.key))
                      }}
                      style={{ flex: 'none', width: 44, height: 44, border: 'none', background: 'transparent', color: neutral.slate, cursor: 'pointer', borderRadius: radius.ctl }}
                    >
                      <X size={18} aria-hidden />
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  {row.rest ? (
                    <div data-shot="split-share-rest" style={{ width: 140, minHeight: 44, display: 'flex', alignItems: 'center', fontSize: 14, color: neutral.slate }}>
                      The rest of the fee
                    </div>
                  ) : (
                    <div data-shot="split-share-input" style={{ width: 140 }}>
                      <TextField label={`Share ${index + 1}, $ or %`} value={row.text} onChange={(text) => update(row.key, { text })} placeholder="$48 or 48%" mono />
                    </div>
                  )}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={row.rest}
                    aria-label={`Party ${index + 1} takes the rest`}
                    data-shot="split-rest-toggle"
                    onClick={() => chooseRest(row.key)}
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
          <TextAction
            shot="split-add-party"
            onClick={() => {
              setRows((rs) => [...rs, { key: nextKey, party: null, text: '', rest: false }])
              setNextKey(nextKey + 1)
            }}
          >
            Add a party
          </TextAction>
          {feeTotal !== undefined && (
            <span data-shot="split-total" className="mono" style={{ fontSize: 13.5, color: neutral.slate }}>
              {total !== undefined ? formatMoney(total) : '·'} of {formatMoney(feeTotal)}
            </span>
          )}
        </div>

        <FormError message={error ?? (filled || feeTotal === undefined ? reason : null)} />

        <SheetActions
          primary={
            <Button variant="primary" block onClick={save} disabled={feeTotal === undefined} shot="split-save">
              Save split
            </Button>
          }
          secondary={
            procedure?.split !== undefined ? (
              <Button variant="secondary" block={variant !== 'web'} onClick={removeSplit} shot="split-remove">
                Remove split
              </Button>
            ) : undefined
          }
        />
      </div>
    </Overlay>
  )
}
