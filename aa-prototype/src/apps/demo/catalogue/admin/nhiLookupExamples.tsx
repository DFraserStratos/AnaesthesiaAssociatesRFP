/**
 * Component catalogue examples for the NHI lookup (catch-up Phase 40a): the
 * status line in each Hub state, the purpose note, and the details comparison
 * table as the register refresh uses it. Static views; the live lookup is on
 * any Add a booking and on a patient record's Refresh from NHI register.
 */

import { nhiRegister } from '../../../../domain/seed/nhiRegister'
import { NHI_REASONS } from '../../../../domain/nhi'
import { ANAE } from '../../../../domain/seed'
import { useAppStore } from '../../../../store'
import { AA_OFFICE, NhiLookupStatus, NhiPurposeNote, type NhiLookupState } from '../../../../shared/nhiHub'
import { DefList } from '../../../../shared/ui'
import { DetailChoiceTable } from '../../../admin/screens/patients/patientParts'
import { RegisterRefreshRow } from '../../../admin/screens/patients/RegisterRefresh'

const noop = () => undefined
const mereana = nhiRegister().get('ZBR4417')!
const ana = nhiRegister().get('ZBX41AL')!

const STATES: NhiLookupState[] = [
  { status: 'checking', nhi: 'ZBR4417' },
  { status: 'slow', nhi: 'ZBR4417' },
  { status: 'found', nhi: 'ZBR4417', person: mereana },
  { status: 'found', nhi: 'ZBX41AL', person: ana },
  { status: 'notFound', nhi: 'ZBW6638' },
  { status: 'unavailable', nhi: 'ZBR4417' },
  { status: 'invalid', reason: NHI_REASONS.checkDigit },
  { status: 'cancelled', nhi: 'ZBR4417' },
]

export function NhiLookupStatusExample() {
  const souter = useAppStore((s) => s.masters.anaesthetists[ANAE.souter])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
      {STATES.map((state, i) => (
        <NhiLookupStatus key={i} state={state} onStopWaiting={noop} onRetry={noop} />
      ))}
      {souter !== undefined && <NhiPurposeNote practitioner={{ name: souter.name, hpiId: souter.hpiId }} />}
      <NhiPurposeNote practitioner={AA_OFFICE} />
    </div>
  )
}

export function DetailChoiceTableExample() {
  return (
    <div style={{ maxWidth: 620 }}>
      <DetailChoiceTable
        rows={[
          { field: 'name', existing: 'Fiona Gray', incoming: 'Fiona Tamihana' },
          { field: 'address', existing: '236 Halswell Road, Halswell, Christchurch 8025', incoming: '5 Kowhai Lane, Halswell, Christchurch 8025' },
          { field: 'phone', incoming: '03 555 4678', added: true },
        ]}
        recordHeader="On this record"
        incomingHeader="On the register"
        choice={{ header: 'Keep / Use register', useLabel: 'Use register', value: (f) => (f === 'name' ? 'use' : 'keep'), onChange: noop }}
      />
    </div>
  )
}

export function RegisterRefreshRowExample() {
  return (
    <div style={{ maxWidth: 420 }}>
      <DefList gap={8}>
        <RegisterRefreshRow open={false} onRefresh={noop} />
        <RegisterRefreshRow open={false} onRefresh={noop} lastRefreshedAtISO="2026-07-21T08:00:00" />
      </DefList>
    </div>
  )
}
