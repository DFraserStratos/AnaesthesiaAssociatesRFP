/**
 * Refresh from the NHI register on the patient record (catch-up Phase 40a;
 * US-14.4.1's note, DM-30). The Details card's "NHI register" row says when
 * the record was last refreshed, beside a teal Refresh and the Provisional
 * pill (on demand, per patient, by the office: to confirm with AA). The panel
 * looks the NHI up through the simulated Hub (its states and wait), then
 * shows what would change in Phase 40's details table: differences default to
 * Keep, enrichments read "Will be added". Apply runs
 * `refreshPatientFromRegister`, which re-reads the register itself.
 */

import { useEffect, useMemo, useState } from 'react'
import { refreshPatientFromRegister, registerRefreshPreview, useAppStore, type Actor } from '../../../../store'
import type { RegisterChoices, RegisterField } from '../../../../domain/nhiRegister'
import { Button, DefRow, FieldHint, FormError, Pill } from '../../../../shared/ui'
import { useSurface } from '../../../../shared'
import { OverlayHeader, SheetActions } from '../../../../shared/surface'
import { AA_OFFICE, NHI_LOOKUP_COPY, NhiLookupStatus, NhiPurposeNote, useNhiHubLookup } from '../../../../shared/nhiHub'
import { useDemoTriggerContext } from '../../../../shared/demoTriggers/context'
import { hhmm, plainDate } from '../../../../shared/format'
import { DetailChoiceTable, type DetailChoiceRow } from './patientParts'

export const REGISTER_REFRESH_COPY = {
  rowLabel: 'NHI register',
  notYet: 'Not refreshed yet',
  /** The year and the time, as the record keeps it ("21 Jul 2026, 08:00"): a stamp read months later, so not `stampText`'s weekday form. */
  last: (iso: string) => `${plainDate(iso)}, ${hhmm(iso)}`,
  button: 'Refresh from NHI register',
  provisional: 'Provisional',
  provisionalTitle: 'On demand, to confirm with AA',
  title: 'Refresh from the NHI register',
  description: (name: string, nhi: string) => `${name}, NHI ${nhi}. Missing details are filled in; for each that differs, keep this record's or use the register's.`,
  waiting: 'Waiting for the NHI register.',
  nothing: 'On the register and on this record, nothing to change.',
  markRefreshed: 'Mark refreshed',
  apply: 'Apply',
  done: 'Refreshed from the NHI register.',
} as const

export function RegisterRefreshRow({ lastRefreshedAtISO, open, onRefresh }: { lastRefreshedAtISO?: string; open: boolean; onRefresh: () => void }) {
  return (
    <DefRow label={REGISTER_REFRESH_COPY.rowLabel} labelWidth={104} shot="patient-register-row">
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
        <span data-shot="patient-register-stamp">
          {lastRefreshedAtISO !== undefined ? (
            <>
              Last refreshed <span className="mono">{REGISTER_REFRESH_COPY.last(lastRefreshedAtISO)}</span>
            </>
          ) : (
            REGISTER_REFRESH_COPY.notYet
          )}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="compact" onClick={onRefresh} disabled={open} shot="patient-register-refresh-button">
            {REGISTER_REFRESH_COPY.button}
          </Button>
          <Pill tone="neutral" size="sm" title={REGISTER_REFRESH_COPY.provisionalTitle} shot="patient-register-provisional">
            {REGISTER_REFRESH_COPY.provisional}
          </Pill>
        </span>
      </span>
    </DefRow>
  )
}

export function RegisterRefreshPanel({
  patientId,
  nhi,
  patientName,
  actor,
  onClose,
  onDone,
}: {
  patientId: string
  nhi: string
  patientName: string
  actor: Actor
  onClose: () => void
  onDone: (line: string) => void
}) {
  const { Overlay } = useSurface()
  const hub = useNhiHubLookup()
  useDemoTriggerContext('nhiHub.inUse', true)
  const masters = useAppStore((s) => s.masters)
  const [choices, setChoices] = useState<RegisterChoices>({})
  const [error, setError] = useState<string | null>(null)
  const { lookup, mode } = hub

  // Looks the NHI up on open, and again when the Hub's demo mode changes while the panel is open.
  useEffect(() => {
    lookup(nhi)
  }, [lookup, nhi, mode])

  const preview = useMemo(() => (hub.state.status === 'found' ? registerRefreshPreview({ masters }, patientId) : undefined), [hub.state.status, masters, patientId])
  const rows: DetailChoiceRow[] =
    preview?.kind === 'ready'
      ? [
          ...preview.differences.map((d) => ({ field: d.field, existing: d.onRecord, incoming: d.onRegister })),
          ...preview.enrichments.map((e) => ({ field: e.field, incoming: e.onRegister, added: true })),
        ]
      : []

  function apply() {
    const res = refreshPatientFromRegister(useAppStore, actor, patientId, choices)
    if (!res.ok) {
      setError(res.message)
      return
    }
    onDone(REGISTER_REFRESH_COPY.done)
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="patient-register-refresh" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <OverlayHeader title={REGISTER_REFRESH_COPY.title} description={REGISTER_REFRESH_COPY.description(patientName, nhi)} />
      <NhiLookupStatus state={hub.state} manualEntry={false} onStopWaiting={hub.cancel} onRetry={hub.retry} found={(s) => NHI_LOOKUP_COPY.onRegister(s.person.name, s.person.dobISO)} />
      {preview?.kind === 'ready' && (rows.length === 0 ? (
        <FieldHint tone="slate" shot="patient-register-nothing">{REGISTER_REFRESH_COPY.nothing}</FieldHint>
      ) : (
        <DetailChoiceTable
          rows={rows}
          recordHeader="On this record"
          incomingHeader="On the register"
          shot="patient-register-differences"
          choice={{
            header: 'Keep / Use register',
            useLabel: 'Use register',
            value: (field) => (choices[field as RegisterField] === 'useRegister' ? 'use' : 'keep'),
            onChange: (field, v) => setChoices((c) => ({ ...c, [field]: v === 'use' ? 'useRegister' : 'keep' })),
          }}
        />
      ))}
      <NhiPurposeNote practitioner={AA_OFFICE} />
      <FormError message={error} shot="patient-register-refusal" />
      <SheetActions
        secondary={<Button variant="secondary" size="desktop" onClick={onClose}>Cancel</Button>}
        primary={
          <Button variant="primary" size="desktop" block onClick={apply} disabled={preview?.kind !== 'ready'} disabledReason={preview?.kind !== 'ready' ? REGISTER_REFRESH_COPY.waiting : undefined} shot="patient-register-apply">
            {rows.length === 0 ? REGISTER_REFRESH_COPY.markRefreshed : REGISTER_REFRESH_COPY.apply}
          </Button>
        }
      />
      </div>
    </Overlay>
  )
}
