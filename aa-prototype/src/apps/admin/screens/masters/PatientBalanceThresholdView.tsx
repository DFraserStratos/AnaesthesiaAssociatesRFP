/**
 * Master data, Patient balance warning (catch-up Phase 40, item 12;
 * US-11.3.2, US-13.7.4): the one rule parameter with a UI. One whole number
 * of days, saved through `setPatientBalanceThreshold` (office only, 1 to 730).
 * Warnings are derived live, so a change applies at the next Booking check.
 * Nothing else of US-13.7.4's page is built here.
 */

import { useState } from 'react'
import { patientBalanceThresholdDays, setPatientBalanceThreshold, THRESHOLD_RANGE_MESSAGE, useAppStore, type Actor } from '../../../../store'
import { HistorySheet } from '../../../../shared/booking'
import { Button, Card, FormError, ResultLine, TextAction, TextField } from '../../../../shared/ui'
import { neutral } from '../../../../theme/tokens'
import { MasterHeader } from './chrome'

export const PATIENT_BALANCE_THRESHOLD_CAPTION =
  'Counts from the invoice date, and only amounts the patient owes on invoices billed to them. Under the threshold the warning is mild; over it, strong. A patient in credit gets a mild warning. A change applies at the next Booking check.'

/** The field's live reason: a whole number of days from 1 to 730, else null. */
export function thresholdProblem(raw: string): string | null {
  const t = raw.trim()
  if (!/^\d+$/.test(t)) return THRESHOLD_RANGE_MESSAGE
  const n = Number(t)
  return n >= 1 && n <= 730 ? null : THRESHOLD_RANGE_MESSAGE
}

export function PatientBalanceThresholdView({ actor }: { actor: Actor }) {
  const current = useAppStore((s) => patientBalanceThresholdDays(s))
  const [value, setValue] = useState(String(current))
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [history, setHistory] = useState(false)
  const problem = value.trim() === '' ? null : thresholdProblem(value)

  function save() {
    const res = setPatientBalanceThreshold(useAppStore, actor, Number(value.trim()))
    if (!res.ok) {
      setError(res.message)
      setSaved(null)
      return
    }
    setError(null)
    setSaved(`Saved. The balance warning turns strong after ${Number(value.trim())} days.`)
  }

  return (
    <div data-shot="master-patient-balance-threshold" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <MasterHeader
        title="Patient balance warning"
        sub="When a patient's unpaid invoice makes the balance warning strong."
        actions={<TextAction size="sm" flush onClick={() => setHistory(true)} label="History of the patient balance warning">History</TextAction>}
      />
      <Card padding="card" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <TextField
            label="Patient balance warning after N days"
            type="number"
            inputMode="numeric"
            mono
            min={1}
            max={730}
            step={1}
            width={240}
            value={value}
            onChange={(v) => {
              setValue(v)
              setSaved(null)
              setError(null)
            }}
            invalid={problem !== null}
            hint={problem ?? `Now ${current} days.`}
            shot="patient-balance-threshold-field"
          />
          <Button
            variant="primary"
            size="desktop"
            onClick={save}
            disabled={problem !== null || value.trim() === '' || Number(value.trim()) === current}
            shot="patient-balance-threshold-save"
          >
            Save
          </Button>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: neutral.slate, lineHeight: '18px' }}>{PATIENT_BALANCE_THRESHOLD_CAPTION}</p>
        <ResultLine shot="patient-balance-threshold-saved" line={saved ?? undefined} onDismiss={() => setSaved(null)} />
        <FormError message={error} />
      </Card>
      <HistorySheet open={history} entityIds={['patientBalance']} title="Patient balance warning history" onClose={() => setHistory(false)} />
    </div>
  )
}
