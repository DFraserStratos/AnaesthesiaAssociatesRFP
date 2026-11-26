/**
 * The inbox's table (docs/explorations/intake-inbox-iterations.html #inbox, inbox B): one row per arrival, every
 * column sortable from its header. Sorted by Surgery (the default) a group row heads each date of surgery, soonest
 * first and "Date not read" last; any other order drops the headings. Quiet by design: plain ink and slate text, no
 * pills or status colours, since the office reads the dates and the Needs column for itself. A row click opens the
 * arrival; the List cell's button is the keyboard handle.
 */

import { Fragment } from 'react'
import { ARRIVAL_KIND_LABELS, type ArrivalItem } from '../../../../../domain/intake/arrivals'
import {
  INBOX_SORT_LABELS,
  arrivalFromText,
  groupBySurgeryDay,
  inboxListText,
  inboxReceivedText,
  inboxSurgeryText,
  needsText,
  type InboxQuery,
  type InboxSortKey,
} from '../../../../../domain/intake/inbox'
import { plural } from '../../../../../shared/format'
import { ClickableRow, GroupRow, RowOpenButton, TableShell, Td, Th } from '../../../../../shared/table'
import { useAppStore } from '../../../../../store'
import { neutral, type as typeScale } from '../../../../../theme/tokens'

const COLUMNS: readonly { key: InboxSortKey; width?: number; align?: 'right' }[] = [
  { key: 'surgery', width: 132 },
  { key: 'list' },
  { key: 'kind', width: 140 },
  { key: 'patients', width: 92, align: 'right' },
  { key: 'needs', width: 210 },
  { key: 'from', width: 200 },
  { key: 'received', width: 120 },
]

function InboxRow({ item, underDay, todayISO, onOpen }: { item: ArrivalItem; underDay: boolean; todayISO: string; onOpen: () => void }) {
  const intake = useAppStore((s) => s.intake)
  const list = inboxListText(item)
  const surgery = inboxSurgeryText(item, underDay)
  const empty = item.kind === 'unreadable' || item.kind === 'held'
  const needs = needsText(item)
  const from = arrivalFromText(item, intake)
  const slate = { color: neutral.slate }
  return (
    <ClickableRow onOpen={onOpen} data-shot="intake-inbox-row" data-arrival-key={item.key} data-arrival-kind={item.kind}>
      <Td mono nowrap style={slate}>{surgery}</Td>
      <Td clip style={{ color: neutral.ink, fontWeight: typeScale.label.weight }}>
        <RowOpenButton label={`Open ${list}, ${inboxSurgeryText(item)}`} onOpen={onOpen} style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
          <span title={list}>{list}</span>
        </RowOpenButton>
      </Td>
      <Td clip style={slate}>{ARRIVAL_KIND_LABELS[item.kind]}</Td>
      <Td mono align="right" style={slate}>{empty ? '' : item.counts.rows}</Td>
      <Td clip style={slate}>{needs !== undefined ? <span title={needs}>{needs}</span> : null}</Td>
      <Td clip style={slate}><span title={from}>{from}</span></Td>
      <Td mono nowrap style={slate}>{inboxReceivedText(item.receivedAtISO, todayISO)}</Td>
    </ClickableRow>
  )
}

export function InboxTable({
  items,
  query,
  todayISO,
  onSort,
  onOpen,
}: {
  items: readonly ArrivalItem[]
  query: InboxQuery
  todayISO: string
  onSort: (key: InboxSortKey) => void
  onOpen: (key: string) => void
}) {
  const grouped = query.sort.key === 'surgery'
  const direction = (key: InboxSortKey) => (query.sort.key !== key ? 'none' : query.sort.dir === 'asc' ? 'ascending' : 'descending') as 'none' | 'ascending' | 'descending'
  return (
    <TableShell fit shot="intake-inbox" label="Arrivals" density="compact" minWidth={960} tableStyle={{ tableLayout: 'fixed' }}>
      <colgroup>
        {COLUMNS.map((c) => (
          <col key={c.key} style={c.width !== undefined ? { width: c.width } : undefined} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {COLUMNS.map((c) => (
            <Th key={c.key} nowrap {...(c.align !== undefined ? { align: c.align } : {})} sort={{ direction: direction(c.key), onSort: () => onSort(c.key) }}>
              {INBOX_SORT_LABELS[c.key]}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {grouped
          ? groupBySurgeryDay(items, todayISO).map((g) => (
              <Fragment key={g.key}>
                <GroupRow span={COLUMNS.length} data-shot="intake-inbox-day" data-surgery-date={g.dateISO ?? 'undated'}>
                  <span style={{ color: neutral.ink }}>{g.label}</span>
                  <span style={{ color: neutral.mist, fontWeight: typeScale.caption.weight }}> · {plural(g.items.length, 'arrival')}</span>
                </GroupRow>
                {g.items.map((item) => (
                  <InboxRow key={item.key} item={item} underDay={g.dateISO !== undefined} todayISO={todayISO} onOpen={() => onOpen(item.key)} />
                ))}
              </Fragment>
            ))
          : items.map((item) => <InboxRow key={item.key} item={item} underDay={false} todayISO={todayISO} onOpen={() => onOpen(item.key)} />)}
      </tbody>
    </TableShell>
  )
}
