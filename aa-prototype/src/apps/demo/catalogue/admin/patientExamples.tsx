/**
 * Component catalogue examples for Admin · Patients (catch-up Phase 40), on
 * the live seed: Sarah Mitchell's record (CQY9304), Intake's Waiting for NHI
 * table (33a's seeded row; on Intake since Phase 51) and the Master data balance threshold.
 */

import { OFFICE_ACTOR } from '../../../../store'
import { PatientsScreen } from '../../../admin/screens/patients/PatientsScreen'
import { PatientRecord } from '../../../admin/screens/patients/PatientRecord'
import { PatientBalanceThresholdView } from '../../../admin/screens/masters/PatientBalanceThresholdView'
import { WaitingNhiTab } from '../../../admin/intake/WaitingNhiTab'

const noop = () => undefined

export function PatientsSearchExample() {
  return <PatientsScreen view="search" actor={OFFICE_ACTOR} onOpenList={noop} onOpenMatching={noop} />
}

export function WaitingNhiExample() {
  return <WaitingNhiTab actor={OFFICE_ACTOR} onOpenList={noop} />
}

export function PatientRecordExample() {
  return <PatientRecord nhi="CQY9304" actor={OFFICE_ACTOR} onOpenBooking={noop} />
}

export function PatientBalanceThresholdExample() {
  return <PatientBalanceThresholdView actor={OFFICE_ACTOR} />
}
