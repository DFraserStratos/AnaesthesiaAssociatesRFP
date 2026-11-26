/**
 * Component catalogue examples for Admin · Patients (catch-up Phase 40, build plan Phase 57), on
 * the live seed: the Patients list (its filter follows the catalogue page's URL, so Coming up here),
 * Sarah Mitchell's page (CQY9304) and the Master data balance threshold. The rows waiting for an NHI
 * are Intake's Needs NHI bench (`needsNhiBenchExample.tsx`, build plan Phase 72).
 */

import { OFFICE_ACTOR } from '../../../../store'
import { PatientsScreen } from '../../../admin/screens/patients/PatientsScreen'
import { PatientRecord } from '../../../admin/screens/patients/PatientRecord'
import { PatientBalanceThresholdView } from '../../../admin/screens/masters/PatientBalanceThresholdView'

const noop = () => undefined

export function PatientsSearchExample() {
  return <PatientsScreen />
}

export function PatientRecordExample() {
  return <PatientRecord nhi="CQY9304" actor={OFFICE_ACTOR} onOpenBooking={noop} />
}

export function PatientBalanceThresholdExample() {
  return <PatientBalanceThresholdView actor={OFFICE_ACTOR} />
}
