/**
 * Needs NHI bench, the patient as received (build plan Phase 72; US-11.1.5): the name and date of birth as the
 * sender wrote them ("No date of birth" when none came), the procedure wording, the time, the hospital and the
 * surgeon. Read only: nothing here is a Booking or a patient record yet.
 *
 * Hooks: `waiting-nhi-patient` on the card.
 */

import type { WaitingNhiRow } from '../../../../../../store'
import { Card, DefList, DefRow } from '../../../../../../shared/ui'
import { formatDob, shortDay } from '../../../../../../shared/format'
import { sessionText } from '../../../../../../domain/outOfHours'

export function PatientAsReceived({ row }: { row: WaitingNhiRow }) {
  const hasDob = row.dobISO !== undefined && row.dobISO !== ''
  return (
    <Card title="Patient as received" titleLevel={3} shot="waiting-nhi-patient">
      <DefList>
        <DefRow label="Name" labelWidth={112} valueStyle={{ fontWeight: 600 }}>{row.patientName}</DefRow>
        <DefRow label="Date of birth" labelWidth={112} mono={hasDob}>{hasDob ? formatDob(row.dobISO!) : 'No date of birth'}</DefRow>
        {row.wording !== undefined && <DefRow label="Procedure" labelWidth={112}>{row.wording}</DefRow>}
        <DefRow label="When" labelWidth={112}>
          <span className="mono">{shortDay(row.dateISO)}</span> {sessionText(row.session)}
          {row.scheduledTime !== undefined && <span className="mono"> {row.scheduledTime}</span>}
        </DefRow>
        <DefRow label="Hospital" labelWidth={112}>{row.hospital}</DefRow>
        {row.surgeon !== undefined && <DefRow label="Surgeon" labelWidth={112}>{row.surgeon}</DefRow>}
      </DefList>
    </Card>
  )
}
