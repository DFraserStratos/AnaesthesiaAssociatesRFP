/**
 * Component catalogue examples for Admin · Patients (catch-up Phase 40, build plan Phase 57), on
 * the live seed: the Patients list (its filter follows the catalogue page's URL, so Coming up here),
 * Sarah Mitchell's page (CQY9304), the Waiting for NHI table (33a's seeded row, on `WaitingNhiView`) and the Master data balance threshold.
 */

import { useMemo } from 'react'
import { OFFICE_ACTOR, useAppStore, waitingNhiRows } from '../../../../store'
import { PatientsScreen } from '../../../admin/screens/patients/PatientsScreen'
import { PatientRecord } from '../../../admin/screens/patients/PatientRecord'
import { PatientBalanceThresholdView } from '../../../admin/screens/masters/PatientBalanceThresholdView'
import { WaitingNhiView } from '../../../admin/intake/WaitingNhiView'

const noop = () => undefined

export function PatientsSearchExample() {
  return <PatientsScreen />
}

/** The waiting rows from the live store, on `WaitingNhiView` (Intake's old Waiting for NHI tab is gone). */
export function WaitingNhiExample() {
  const intake = useAppStore((s) => s.intake)
  const masters = useAppStore((s) => s.masters)
  const schedule = useAppStore((s) => s.schedule)
  const clock = useAppStore((s) => s.clock)
  const audit = useAppStore((s) => s.audit)
  const rows = useMemo(() => waitingNhiRows({ intake, masters, schedule, clock, audit }), [intake, masters, schedule, clock, audit])
  return <WaitingNhiView rows={rows} actor={OFFICE_ACTOR} onOpenList={noop} onOpenMatching={noop} />
}

export function PatientRecordExample() {
  return <PatientRecord nhi="CQY9304" actor={OFFICE_ACTOR} onOpenBooking={noop} />
}

export function PatientBalanceThresholdExample() {
  return <PatientBalanceThresholdView actor={OFFICE_ACTOR} />
}
