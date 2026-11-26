/**
 * The match-basis strip (build plan Phase 69, Work item 3; US-02.1.3, US-02.1.4; docs/explorations/intake-ideas.html
 * #idea1 mock A, `.basis`): why an arriving List matched the List AA holds, as four lines side by side, each ticked or
 * crossed. Surgeon, Hospital, Day and session (agreed only when both agree) and Patients ("4 of 4 found", then
 * "3 by NHI · 1 by name and date of birth to a stub"). A crossed key names what AA holds. Never a score or a
 * percentage. Reads `useMatchBasis`, `usePatientRowCount` and `useStubMatchCount`; draws nothing for an arrival with
 * no held List.
 */

import { Check, X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ArrivalItem } from '../../../../../../domain/intake/arrivals'
import { sessionLabel } from '../../../../../../domain/intake/matching'
import { useAppStore } from '../../../../../../store/appStore'
import { formatHpiCpn, titledSurname } from '../../../../../../shared/format'
import { Card, DefList, DefRow } from '../../../../../../shared/ui'
import { neutral, radius, semantic } from '../../../../../../theme/tokens'
import { useHeldList, useMatchBasis, usePatientRowCount, useStubMatchCount } from './updateReads'

type BasisLineKey = 'surgeon' | 'hospital' | 'daySession' | 'patients'

interface BasisLine {
  key: BasisLineKey
  label: string
  agreed: boolean
  value: string
  note?: string
}

/** How the patients were found: "3 by NHI · 1 by name and date of birth to a stub". */
function patientsNote(byNhi: number, byStub: number): string {
  const parts = [...(byNhi > 0 ? [`${byNhi} by NHI`] : []), ...(byStub > 0 ? [`${byStub} by name and date of birth to a stub`] : [])]
  return parts.length > 0 ? parts.join(' · ') : 'None found by NHI'
}

function Mark({ agreed }: { agreed: boolean }) {
  const Icon = agreed ? Check : X
  return (
    <span
      role="img"
      aria-label={agreed ? 'Agrees' : 'Differs'}
      style={{
        width: 16,
        height: 16,
        borderRadius: radius.pill,
        background: agreed ? semantic.success.solid : semantic.error.solid,
        color: neutral.surface,
        display: 'grid',
        placeItems: 'center',
        flex: 'none',
      }}
    >
      <Icon size={11} strokeWidth={3} aria-hidden />
    </span>
  )
}

function Line({ line, first }: { line: BasisLine; first: boolean }): ReactNode {
  return (
    <DefRow
      layout="stacked"
      label={line.label}
      data-key={line.key}
      data-agreed={line.agreed ? 'true' : 'false'}
      {...(line.note !== undefined ? { note: line.note } : {})}
      valueStyle={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
      style={{ padding: '11px 14px', minWidth: 0, ...(first ? {} : { borderLeft: `1px solid ${neutral.line}` }) }}
    >
      <Mark agreed={line.agreed} />
      <span style={{ minWidth: 0 }}>{line.value}</span>
    </DefRow>
  )
}

export function MatchBasisStrip({ arrival, shot = 'intake-match-basis' }: { arrival: ArrivalItem; shot?: string }) {
  const basis = useMatchBasis(arrival)
  const total = usePatientRowCount(arrival)
  const byStub = useStubMatchCount(arrival)
  const list = useHeldList(arrival.heldListId)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  if (basis === undefined || list === undefined) return null

  const agreed = (key: string) => basis.keys.find((k) => k.key === key)?.agreed === true
  const heldSurgeon = surgeons[list.surgeonId]
  const sentSurgeon = arrival.surgeonId !== undefined ? surgeons[arrival.surgeonId] : undefined
  const surgeonAgreed = agreed('surgeon')
  const surgeonCpn = formatHpiCpn(heldSurgeon?.hpiId)
  const hospitalAgreed = agreed('hospital')
  const daySessionAgreed = agreed('day') && agreed('session')
  const byNhi = basis.patientsByNhi.found
  const found = byNhi + byStub

  const lines: BasisLine[] = [
    {
      key: 'surgeon',
      label: 'Surgeon',
      agreed: surgeonAgreed,
      value: sentSurgeon !== undefined ? titledSurname(sentSurgeon.name) : (arrival.surgeonName ?? 'None named'),
      ...(surgeonAgreed
        ? surgeonCpn !== null
          ? { note: surgeonCpn }
          : {}
        : { note: `We hold ${heldSurgeon !== undefined ? titledSurname(heldSurgeon.name) : 'no surgeon'}` }),
    },
    {
      key: 'hospital',
      label: 'Hospital',
      agreed: hospitalAgreed,
      value: hospitals[arrival.hospitalId]?.name ?? arrival.hospitalId,
      ...(hospitalAgreed ? {} : { note: `We hold ${hospitals[list.hospitalId]?.name ?? list.hospitalId}` }),
    },
    {
      key: 'daySession',
      label: 'Day and session',
      agreed: daySessionAgreed,
      value: arrival.dateISO !== undefined && arrival.session !== undefined ? sessionLabel(arrival.dateISO, arrival.session) : 'Not given',
      ...(daySessionAgreed ? {} : { note: `We hold ${sessionLabel(list.dateISO, list.session)}` }),
    },
    {
      key: 'patients',
      label: 'Patients',
      agreed: found > 0,
      value: `${found} of ${total} found`,
      note: patientsNote(byNhi, byStub),
    },
  ]

  return (
    <Card flush shot={shot} data-list-id={list.id} style={{ overflow: 'hidden' }}>
      <DefList gap={0} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {lines.map((line, i) => (
          <Line key={line.key} line={line} first={i === 0} />
        ))}
      </DefList>
    </Card>
  )
}
