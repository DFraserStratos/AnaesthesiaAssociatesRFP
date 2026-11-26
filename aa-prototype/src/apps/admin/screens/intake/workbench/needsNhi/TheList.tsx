/**
 * Needs NHI bench, the List (build plan Phase 72; US-11.1.5, US-02.6.3): its date and session, how close it is
 * ("14 days to go", the Urgent pill within three days, `waitingNhiUrgency`), and the stub standing on it with a link
 * to the List on the Day view. A row with no List yet reads "None" and has no stub and no link.
 *
 * Hooks: `waiting-nhi-list` on the card (`data-list-id` when there is one), `waiting-nhi-urgent`, `waiting-nhi-stub`,
 * `waiting-nhi-stub-marker`.
 */

import type { WaitingNhiRow } from '../../../../../../store'
import { Card, DefList, DefRow, Pill, TextAction } from '../../../../../../shared/ui'
import { shortDay } from '../../../../../../shared/format'
import { sessionText } from '../../../../../../domain/outOfHours'
import { StubMarker } from '../../../../../../shared/stubs'
import { neutral, space } from '../../../../../../theme/tokens'
import { daysToGoText, useListDayLink, useListOwner } from './waitingRow'

const QUIET = { color: neutral.mist } as const

export function TheList({ row }: { row: WaitingNhiRow }) {
  const owner = useListOwner(row.listId)
  const link = useListDayLink(row.listId)
  const urgent = row.urgency === 'urgent'
  return (
    <Card title="The List" titleLevel={3} shot="waiting-nhi-list" {...(row.listId !== undefined ? { 'data-list-id': row.listId } : {})}>
      <DefList>
        <DefRow label="List" labelWidth={112}>
          {row.listId !== undefined ? (
            <>
              <span className="mono">{shortDay(row.dateISO)}</span> {sessionText(row.session)}
            </>
          ) : (
            <span style={QUIET}>None</span>
          )}
        </DefRow>
        <DefRow label="Days to go" labelWidth={112}>
          <span style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: space[2] }}>
            <span className="mono">{daysToGoText(row.daysToGo)}</span>
            {urgent && <Pill tone="error" size="sm" shot="waiting-nhi-urgent">Urgent</Pill>}
          </span>
        </DefRow>
        <DefRow label="Stub" labelWidth={112}>
          {row.stubId !== undefined && link !== undefined ? (
            <span data-shot="waiting-nhi-stub" style={{ display: 'inline-flex', alignItems: 'center', gap: space[2] }}>
              <StubMarker count={1} shot="waiting-nhi-stub-marker" />
              <TextAction size="md" flush to={link.to} linkState={link.state} label={`Open the List holding the stub for ${row.patientName}`}>
                Stub on {owner ?? 'its'} List
              </TextAction>
            </span>
          ) : (
            <span style={QUIET}>None</span>
          )}
        </DefRow>
      </DefList>
    </Card>
  )
}
