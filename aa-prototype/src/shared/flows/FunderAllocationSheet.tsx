import { useEffect, useMemo, useState } from 'react'
import { accent, neutral, radius, semantic } from '../../theme/tokens'
import type { CounterpartyRef, List, Procedure } from '../../domain/types'
import { setProcedureFunderAllocation, useAppStore, type Actor, type FunderAllocationEntry } from '../../store'
import { procedureFee } from '../capture'
import { formatCurrency } from '../format'
import { Button, FieldLabel } from '../ui'
import { useSurface } from '../surface'

interface FunderAllocationSheetProps {
  open: boolean
  procedure: Procedure
  list: List
  /** 1-based position of the procedure on its Card. */
  ordinal: number
  actor: Actor
  onClose: () => void
}

interface FunderOption {
  key: string
  label: string
  ref: CounterpartyRef | null
}

function keyOf(ref: CounterpartyRef | undefined): string {
  return ref === undefined ? 'none' : `${ref.kind}:${ref.id}`
}

interface LineDraft {
  lineId: string
  funderKey: string
  amount: string
}

/**
 * Office per-line funder allocation — the capture side of the RFP's
 * one-procedure-two-funders split (7th review A4/B4). Each of the procedure's
 * billing lines gets a funder and an amount; the allocated total vs the
 * procedure fee is shown inline, and Save is blocked when they do not reconcile
 * (the store's `allocationNotConserved` refusal is the backstop). The realistic
 * edit reassigns which funder pays each portion; amounts must keep the total.
 */
export function FunderAllocationSheet({ open, procedure, list, ordinal, actor, onClose }: FunderAllocationSheetProps) {
  const { Overlay } = useSurface()
  const billingLinesRecord = useAppStore((s) => s.schedule.billingLines)
  const masters = useAppStore((s) => s.masters)

  const lines = useMemo(
    () =>
      Object.values(billingLinesRecord)
        .filter((l) => l.procedureId === procedure.id)
        .sort((a, b) => a.id.localeCompare(b.id)),
    [billingLinesRecord, procedure.id],
  )

  const feeTotal = useMemo(() => {
    try {
      return procedureFee({ procedure, list, ordinal, masters, billingLines: billingLinesRecord }).fee.total
    } catch {
      return 0
    }
  }, [procedure, list, ordinal, masters, billingLinesRecord])

  const patientId = useAppStore((s) => s.schedule.cards[procedure.cardId]?.patientId)

  const options = useMemo<FunderOption[]>(() => {
    const opts: FunderOption[] = [{ key: 'none', label: 'Default route (no override)', ref: null }]
    // The card's patient is the natural payer for the self-funded portion.
    if (patientId !== undefined) {
      const p = masters.patients[patientId]
      opts.push({ key: `patient:${patientId}`, label: `Patient · ${p?.name ?? patientId}`, ref: { kind: 'patient', id: patientId } })
    }
    for (const insurer of Object.values(masters.insurers)) {
      opts.push({ key: `insurer:${insurer.id}`, label: `Insurer · ${insurer.name}`, ref: { kind: 'insurer', id: insurer.id } })
    }
    if (list.hospitalId !== undefined) {
      const h = masters.hospitals[list.hospitalId]
      if (h !== undefined) opts.push({ key: `hospital:${h.id}`, label: `Hospital · ${h.name}`, ref: { kind: 'hospital', id: h.id } })
    }
    for (const party of Object.values(masters.billableParties)) {
      opts.push({ key: `billableParty:${party.hiddenInternalId}`, label: `Billable party · ${party.name}`, ref: { kind: 'billableParty', id: party.hiddenInternalId } })
    }
    return opts
  }, [masters, list.hospitalId, patientId])

  const [drafts, setDrafts] = useState<LineDraft[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDrafts(lines.map((l) => ({ lineId: l.id, funderKey: keyOf(l.funderOverride), amount: l.amount.toFixed(2) })))
      setError(null)
    }
  }, [open, lines])

  const allocated = drafts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
  const conserves = Math.round(allocated * 100) === Math.round(feeTotal * 100)
  const amountsValid = drafts.every((d) => Number.isFinite(Number(d.amount)))

  function setDraft(lineId: string, patch: Partial<LineDraft>) {
    setDrafts((ds) => ds.map((d) => (d.lineId === lineId ? { ...d, ...patch } : d)))
  }

  function refFor(key: string): CounterpartyRef | null {
    return options.find((o) => o.key === key)?.ref ?? null
  }

  function save() {
    setError(null)
    // Apply all line edits atomically (a two-line re-split conserves only as a
    // set; a per-line sequence would fail conservation mid-way).
    const entries: FunderAllocationEntry[] = drafts.map((draft) => ({
      billingLineId: draft.lineId,
      funderOverride: refFor(draft.funderKey),
      amount: Number(draft.amount),
    }))
    const outcome = setProcedureFunderAllocation(useAppStore, actor, procedure.id, entries)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Funder allocation</div>
        <div style={{ fontSize: 13, color: neutral.slate }}>
          Split this procedure across funders. The line amounts must add up to the procedure fee.
        </div>
        {lines.length === 0 && (
          <div style={{ fontSize: 13, color: neutral.mist }}>
            This procedure has no billing lines to allocate. Add a billing line first.
          </div>
        )}
        {drafts.map((draft) => (
          <div key={draft.lineId} style={{ display: 'flex', flexDirection: 'column', gap: 8, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel>Funder</FieldLabel>
              <select
                value={draft.funderKey}
                onChange={(e) => setDraft(draft.lineId, { funderKey: e.target.value })}
                style={{ minHeight: 44, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.bg, padding: '0 12px', fontFamily: 'inherit', fontSize: 14 }}
              >
                {options.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel>Amount $</FieldLabel>
              <input
                className="mono"
                value={draft.amount}
                onChange={(e) => setDraft(draft.lineId, { amount: e.target.value })}
                style={{ minHeight: 44, borderRadius: radius.ctl, border: `1px solid ${neutral.line}`, background: neutral.bg, padding: '0 12px', fontFamily: 'inherit', fontSize: 14 }}
              />
            </div>
          </div>
        ))}

        {drafts.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              fontWeight: 600,
              color: conserves ? semantic.success.onTint : semantic.warning.onTint,
              background: conserves ? semantic.success.tint : semantic.warning.tint,
              borderRadius: radius.ctl,
              padding: '10px 12px',
            }}
          >
            <span>Allocated {formatCurrency(allocated)}</span>
            <span>of {formatCurrency(feeTotal)} fee</span>
          </div>
        )}

        {error !== null && (
          <div style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '10px 12px', fontSize: 13 }}>
            {error}
          </div>
        )}

        <Button variant="primary" block onClick={save} disabled={drafts.length === 0 || !amountsValid || !conserves}>
          Save allocation
        </Button>
        <div style={{ fontSize: 11, color: accent.pressed }}>
          Two-funder split: assign each portion to its funder, keeping the total equal to the fee.
        </div>
      </div>
    </Overlay>
  )
}
