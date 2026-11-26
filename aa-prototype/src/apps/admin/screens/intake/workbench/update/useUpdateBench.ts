/**
 * What the update and cancellation benches read beside 68's rows (build plan Phase 69; US-02.1.2, US-02.1.3): why each
 * row cannot apply and the stubs an arriving NHI resolves (both from `store/intakeApply.ts`, so the bench and the store
 * say the same), the insurer as sent, the matcher's mild warnings and the balance warning a decision will raise, the
 * held List, and a decided arrival's decision line. Reads only; derives no match.
 */

import { useMemo } from 'react'
import type { ImportRow, List } from '../../../../../../domain/types'
import { effectiveIncoming, validNhiOf } from '../../../../../../domain/intake/matching'
import type { ArrivalItem } from '../../../../../../domain/intake/arrivals'
import { applyBlockers, stubCandidates } from '../../../../../../store/intakeApply'
import { assessImportRow } from '../../../../../../store/matchingSelectors'
import { patientBalancePreview } from '../../../../../../store/patientActions'
import { rawRowEligible } from '../../../../../../store/rawRowActions'
import { useAppStore } from '../../../../../../store/appStore'
import { formatDob } from '../../../../../../shared/format'
import { insurerText } from './updateText'

export interface UpdateBenchReads {
  heldList: List | undefined
  /** The held List's anaesthetist, as a name ("Dr J. Rutherford"); absent for a Draft List. */
  anaesthetistName?: string
  blockers: Record<string, string>
  /** rowId → the stubs its NHI resolves, labelled by the waiting patient. */
  stubs: Record<string, { stubId: string; label: string; nhi: string; patientName: string }[]>
  extras: Record<string, { insurer?: string }>
  warnings: Record<string, string[]>
  /** Rows the restricted raw view may open (as the old row panel offered it). */
  rawEligible: ReadonlySet<string>
  /** A decided arrival: who decided it and when (the latest decided row). */
  decidedBy?: { who: string; atISO: string }
}

export function useUpdateBench(arrival: ArrivalItem): UpdateBenchReads {
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const intake = useAppStore((s) => s.intake)
  const billing = useAppStore((s) => s.billing)
  const appSettings = useAppStore((s) => s.appSettings)
  const clock = useAppStore((s) => s.clock)
  return useMemo(() => {
    const state = useAppStore.getState()
    const view = { masters, schedule, intake }
    const heldList = arrival.heldListId !== undefined ? schedule.lists[arrival.heldListId] : undefined
    const anaesthetist = heldList?.anaesthetistId !== undefined ? masters.anaesthetists[heldList.anaesthetistId] : undefined
    const blockers = applyBlockers(state, arrival.key)
    const candidates = stubCandidates(state, arrival.key)
    const stubs: UpdateBenchReads['stubs'] = {}
    for (const [rowId, list] of Object.entries(candidates)) {
      stubs[rowId] = list.map((c) => {
        const waiting = intake.rows[c.waitingRowId]
        const f = waiting !== undefined ? effectiveIncoming(waiting) : undefined
        const name = f?.patient.name ?? 'Waiting patient'
        const dob = f?.patient.dobISO
        return { stubId: c.stubId, nhi: c.nhi, patientName: name, label: dob !== undefined && dob !== '' ? `${name} · ${formatDob(dob)}` : name }
      })
    }
    const extras: UpdateBenchReads['extras'] = {}
    const warnings: UpdateBenchReads['warnings'] = {}
    const rawEligible = new Set<string>()
    let decidedBy: UpdateBenchReads['decidedBy']
    const slices = { billing, schedule, masters, appSettings, clock }
    for (const rowId of arrival.rowIds) {
      const row: ImportRow | undefined = intake.rows[rowId]
      if (row === undefined) continue
      const f = effectiveIncoming(row)
      const insurer = insurerText(f)
      if (insurer !== null) extras[rowId] = { insurer }
      if (row.status !== 'open') {
        if (row.decidedAtISO !== undefined && (decidedBy === undefined || row.decidedAtISO > decidedBy.atISO)) {
          decidedBy = { who: row.decidedBy ?? 'The office', atISO: row.decidedAtISO }
        }
        continue
      }
      if (rawRowEligible(view, rowId)) rawEligible.add(rowId)
      const out: string[] = []
      const a = assessImportRow(view, rowId)
      for (const flag of a?.flags ?? []) if (flag.blocks === undefined) out.push(flag.label)
      // The balance warning the decision will raise (catch-up Phase 40): shown before deciding, never stops it.
      const nhi = validNhiOf(f)
      if (nhi !== undefined && f.hospitalStatus !== 'cancelled' && row.removalOfBookingId === undefined) {
        const matched = a?.match !== undefined ? schedule.bookings[a.match.bookingId] : undefined
        const preview =
          matched !== undefined
            ? patientBalancePreview(slices, { patientId: matched.patientId }, Object.values(schedule.procedures).filter((p) => p.bookingId === matched.id).map((p) => p.payer), { excludeBookingId: matched.id })
            : patientBalancePreview(slices, { nhi }, [{ kind: 'patient' }])
        if (preview.strength !== 'none' && preview.text !== undefined) out.push(preview.text)
      }
      if (out.length > 0) warnings[rowId] = out
    }
    return {
      heldList,
      ...(anaesthetist !== undefined ? { anaesthetistName: anaesthetist.name } : {}),
      blockers,
      stubs,
      extras,
      warnings,
      rawEligible,
      ...(decidedBy !== undefined ? { decidedBy } : {}),
    }
  }, [arrival, masters, schedule, intake, billing, appSettings, clock])
}
