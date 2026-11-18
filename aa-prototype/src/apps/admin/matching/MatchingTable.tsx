/**
 * The Matching table (catch-up Phase 33; US-02.1.2's "Procedure as received"
 * criterion): one row per incoming row, on the shared table kit at the admin
 * `compact` density. A row click opens the row panel; its keyboard handle is
 * the patient's name (`RowOpenButton`). Flags are warning-tint pills, the
 * Admin Review mockup's flags column.
 */

import { Check } from 'lucide-react'
import { fontFamily, neutral, semantic } from '../../../theme/tokens'
import { effectiveIncoming, suggestionText, type MatchingView } from '../../../domain/intake'
import type { ImportRowView } from '../../../store'
import { ClickableRow, RowOpenButton, TableShell, Td, Th } from '../../../shared/table'
import { Eyebrow, Pill } from '../../../shared/ui'
import { locationName, stampText } from '../../../shared/format'
import { CHANNEL_CAPS, byWhen, changeTypePill, decisionText, insurerText, whenText } from './matchingText'

export function MatchingTable({
  rows,
  view,
  decided,
  selectedId,
  dimmedId,
  todayISO,
  onOpen,
}: {
  rows: readonly ImportRowView[]
  view: MatchingView
  /** The Decided filter: the Suggested column shows the decision, with who and when. */
  decided: boolean
  selectedId: string | null
  /** The row just decided: it stays in place, dimmed with a tick, until the office moves on. */
  dimmedId: string | null
  todayISO: string
  onOpen: (rowId: string) => void
}) {
  return (
    <TableShell shot="matching-table" testId="matching-table-shell" label="Matching" density="compact" minWidth={1180} tableStyle={{ tableLayout: 'fixed' }}>
      <colgroup>
        {[104, 128, 168, 128, undefined, 116, 220, 150].map((w, i) => (
          <col key={i} style={w !== undefined ? { width: w } : undefined} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {['Received', 'Hospital', 'Patient and NHI', 'Date and time', 'Procedure as received', 'Change', decided ? 'Decision' : 'Suggested', 'Flags'].map((h) => (
            <Th key={h}>{h}</Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ row, assessment }, i) => {
          const fields = assessment?.fields ?? effectiveIncoming(row)
          const nhi = fields.patient.nhi
          const insurer = insurerText(fields)
          const text = fields.procedure?.text
          const dim = row.id === dimmedId
          const change =
            assessment !== undefined
              ? changeTypePill(assessment.changeType)
              : row.decision?.kind === 'reject'
                ? { label: 'Rejected', tone: 'neutral' as const }
                : changeTypePill(row.decision?.kind === 'match' ? row.decision.changeType : 'new')
          const unmatched = assessment?.queue === 'unmatched'
          return (
            <ClickableRow
              key={row.id}
              align="top"
              onOpen={() => onOpen(row.id)}
              data-shot={`matching-row-${i + 1}`}
              data-import-row-id={row.id}
              data-selected={row.id === selectedId ? 'true' : undefined}
              style={{
                ...(row.id === selectedId ? { boxShadow: `inset 3px 0 0 ${neutral.ink}` } : {}),
                ...(dim ? { opacity: 0.55, transition: 'opacity 260ms ease' } : {}),
              }}
            >
              <Td mono nowrap style={{ fontSize: 12, color: neutral.slate }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {dim && <Check size={14} strokeWidth={3} aria-label="Decided" style={{ color: semantic.success.solid }} />}
                  {stampText(row.receivedAtISO, { weekday: false })}
                </span>
              </Td>
              <Td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 600 }}>{locationName(fields.hospitalId, view.hospitals)}</span>
                  <Eyebrow as="span">{CHANNEL_CAPS[row.channel]}</Eyebrow>
                  <Pill size="sm">{row.source === 'rooms' ? 'Rooms' : 'Hospital'}</Pill>
                </div>
              </Td>
              <Td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <RowOpenButton label={`Open row ${row.id}, ${fields.patient.name}`} onOpen={() => onOpen(row.id)} style={{ fontWeight: 600 }}>
                    {fields.patient.name}
                  </RowOpenButton>
                  {nhi !== undefined && nhi.trim() !== '' ? (
                    <span style={{ fontFamily: fontFamily.mono, fontSize: 12, color: neutral.slate }}>{nhi}</span>
                  ) : (
                    <span><Pill size="sm" tone="warning">No NHI</Pill></span>
                  )}
                  {insurer !== null && <span style={{ fontFamily: fontFamily.mono, fontSize: 11.5, color: neutral.slate }}>{insurer}</span>}
                </div>
              </Td>
              <Td mono style={{ fontSize: 12.5 }}>{whenText(fields)}</Td>
              <Td clip>
                {text !== undefined && text !== '' ? (
                  <span data-shot={i === 0 ? 'matching-received' : undefined} data-received title={text} style={{ fontFamily: fontFamily.mono, fontSize: 12.5, color: neutral.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                    “{text}”
                  </span>
                ) : (
                  <span data-received style={{ color: neutral.mist }}>Not supplied</span>
                )}
              </Td>
              <Td><Pill size="lg" tone={change.tone}>{change.label}</Pill></Td>
              <Td style={{ fontSize: 12.5, color: unmatched ? semantic.warning.onTint : neutral.ink }}>
                {decided || assessment === undefined ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span>{row.decision !== undefined ? decisionText(view, row, row.decision) : ''}</span>
                    <span style={{ fontFamily: fontFamily.mono, fontSize: 11.5, color: neutral.slate }}>{byWhen(row, todayISO)}</span>
                  </div>
                ) : (
                  suggestionText(view, assessment)
                )}
              </Td>
              <Td>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {unmatched && !assessment!.waitingForNhi && <Pill size="sm" tone="warning">Unmatched</Pill>}
                  {(assessment?.flags ?? []).map((f) => (
                    <Pill key={f.code} size="sm" tone={f.code === 'nhiInvalid' ? 'error' : 'warning'}>{f.label}</Pill>
                  ))}
                </div>
              </Td>
            </ClickableRow>
          )
        })}
      </tbody>
    </TableShell>
  )
}
