/**
 * Lists › Contracts to set (US-04.3.12; US-13.1.3): every List, any date, whose Procedures still need
 * a Contract, one row each with how many are set as a bar and "3 of 5", how many are left, and a short
 * line saying how far the rest have got. Two groups: past Lists first, marked strongly as they can't
 * be submitted until set, then the rest soonest first. A row's chevron shows each Procedure still to
 * set (nothing chosen, or where the invoice goes chosen with the Contract to pick), each with its own
 * Set Contract. Set Contracts (and a row click) opens the first one's Booking on its day, where the
 * office sets a Contract, as the Day rail's Contracts tab does; Open List opens the List's drawer.
 * Search, When and Hospital live in the URL. Rows come from the pure `contractsToSetView.ts`.
 */

import { Fragment, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../../../store'
import { neutral, space } from '../../../../theme/tokens'
import { ClickableRow, GroupRow, RowOpenButton, TableShell, Td, Th } from '../../../../shared/table'
import { DisclosureButton, EmptyState, NameSearchBox, Pill, ProgressBar, SelectField, TextAction } from '../../../../shared/ui'
import { PageBody, PageToolbar } from '../../components/AdminPage'
import { Pager, pageOf, pageParam, pageWindow } from '../../components/Pager'
import { useListParams } from '../../useListParams'
import { useAdminOutlet } from '../../outlet'
import { ListsPage } from './ListsSection'
import {
  CONTRACTS_TO_SET_DEFAULTS,
  CONTRACTS_TO_SET_PAGE_SIZE,
  CONTRACTS_WHEN_OPTIONS,
  contractsToSetCountText,
  contractsToSetHospitals,
  contractsToSetItems,
  contractsToSetStageText,
  filterContractsToSet,
  groupContractsToSet,
  parseContractsWhen,
  type ContractsToSetItem,
} from './contractsToSetView'

/** Column widths that fit a 1280 laptop's table: the List takes the spare width. */
const COLUMNS: readonly (number | undefined)[] = [150, undefined, 150, 72, 210, 196]
const SPAN = COLUMNS.length

function listName(item: ContractsToSetItem): string {
  return `${item.anaesthetistName}, ${item.dayText} ${item.sessionLabel}, ${item.hospitalName}`
}

export function ContractsToSetTab() {
  const { onOpenList } = useAdminOutlet()
  const navigate = useNavigate()
  const schedule = useAppStore((s) => s.schedule)
  const masters = useAppStore((s) => s.masters)
  const clock = useAppStore((s) => s.clock)
  const params = useListParams(CONTRACTS_TO_SET_DEFAULTS)
  const q = params.get('q')
  const when = parseContractsWhen(params.get('when'))
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set())

  const state = useMemo(() => ({ schedule, masters, clock }), [schedule, masters, clock])
  const all = useMemo(() => contractsToSetItems(state), [state])
  const hospitals = useMemo(() => contractsToSetHospitals(all), [all])
  const hospital = hospitals.some((h) => h.id === params.get('hospital')) ? params.get('hospital') : 'all'
  const rows = useMemo(() => filterContractsToSet(state, all, { q, when, hospital }), [state, all, q, when, hospital])
  const groupCounts = useMemo(() => new Map(groupContractsToSet(rows).map((g) => [g.key, g.items.length])), [rows])
  const pages = pageWindow(rows.length, CONTRACTS_TO_SET_PAGE_SIZE, pageParam(params.get('page')))
  const groups = groupContractsToSet(pageOf(rows, CONTRACTS_TO_SET_PAGE_SIZE, pages.page))
  const narrowed = q.trim() !== '' || when !== 'any' || hospital !== 'all'

  const openBooking = (dateISO: string, bookingId: string) => navigate(`/admin/day/${dateISO}/bookings/${bookingId}`)
  const toggle = (listId: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(listId)) next.delete(listId)
      else next.add(listId)
      return next
    })

  return (
    <ListsPage tab="contracts-to-set" testId="contracts-to-set-tab">
      <PageToolbar
        shot="contracts-to-set-toolbar"
        end={
          <span data-shot="contracts-to-set-count" style={{ color: neutral.ink, fontWeight: 600 }}>
            {contractsToSetCountText(rows)}
          </span>
        }
      >
        <NameSearchBox
          size="pill"
          width={300}
          value={q}
          onChange={(next) => params.set({ q: next })}
          label="Search by anaesthetist, surgeon, hospital or patient"
          placeholder="Anaesthetist, surgeon, hospital or patient"
          shot="contracts-to-set-search"
        />
        <SelectField label="When" hideLabel width={170} size="compact" fill="surface" value={when} onChange={(next) => params.set({ when: next })} shot="contracts-to-set-when">
          {CONTRACTS_WHEN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </SelectField>
        <SelectField label="Hospital" hideLabel width={220} size="compact" fill="surface" value={hospital} onChange={(next) => params.set({ hospital: next })} shot="contracts-to-set-hospital">
          <option value="all">Any hospital</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </SelectField>
      </PageToolbar>
      <PageBody>
        {all.length === 0 ? (
          <EmptyState variant="card" shot="contracts-to-set-empty">
            Every List has its Contracts.
          </EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState
            variant="card"
            shot="contracts-to-set-empty"
            title="No Lists match."
            action={narrowed ? <TextAction size="sm" flush onClick={() => params.set({ q: '', when: 'any', hospital: 'all' })}>Show every List</TextAction> : undefined}
          >
            Check the spelling, or widen the date or hospital.
          </EmptyState>
        ) : (
          <TableShell
            fit
            shot="contracts-to-set-table"
            label="Contracts to set"
            density="compact"
            minWidth={880}
            tableStyle={{ tableLayout: 'fixed' }}
            {...(pages.pages > 1
              ? { footer: <Pager total={rows.length} size={CONTRACTS_TO_SET_PAGE_SIZE} page={pages.page} onPage={(p) => params.set({ page: String(p) })} lead="Lists" shot="contracts-to-set-pager" /> }
              : {})}
          >
            <colgroup>
              {COLUMNS.map((w, i) => (
                <col key={i} style={w !== undefined ? { width: w } : undefined} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <Th nowrap>List date</Th>
                <Th nowrap>Anaesthetist · List</Th>
                <Th nowrap>Contracts set</Th>
                <Th nowrap align="right">To set</Th>
                <Th nowrap>Note</Th>
                <Th nowrap />
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.key}>
                  <GroupRow
                    span={SPAN}
                    data-contracts-group={group.key}
                    {...(group.key === 'past' ? { tone: 'error' as const } : {})}
                    counts={`${groupCounts.get(group.key) ?? group.items.length} ${(groupCounts.get(group.key) ?? group.items.length) === 1 ? 'List' : 'Lists'}`}
                  >
                    {group.label}
                  </GroupRow>
                  {group.items.map((item) => (
                    <ContractsRow
                      key={item.listId}
                      item={item}
                      open={open.has(item.listId)}
                      onToggle={() => toggle(item.listId)}
                      onOpenBooking={openBooking}
                      onOpenList={onOpenList}
                    />
                  ))}
                </Fragment>
              ))}
            </tbody>
          </TableShell>
        )}
      </PageBody>
    </ListsPage>
  )
}

/** One List's row, and under it while open, a line for each Procedure still to set. */
function ContractsRow({
  item,
  open,
  onToggle,
  onOpenBooking,
  onOpenList,
}: {
  item: ContractsToSetItem
  open: boolean
  onToggle: () => void
  onOpenBooking: (dateISO: string, bookingId: string) => void
  onOpenList: (listId: string) => void
}) {
  const name = listName(item)
  const first = item.procedures[0]!
  const setContracts = () => onOpenBooking(item.dateISO, first.bookingId)
  return (
    <>
      <ClickableRow onOpen={setContracts} data-list-id={item.listId} data-past={item.past ? 'true' : 'false'}>
        <Td nowrap bold>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: space[2] }}>
            <DisclosureButton open={open} onToggle={onToggle} label={`${open ? 'Hide' : 'Show'} the Procedures to set on ${name}`} size={14} shot="contracts-to-set-expand" />
            <RowOpenButton label={`Set the Contracts on ${name}`} onOpen={setContracts}>
              {item.dayText} {item.sessionLabel}
            </RowOpenButton>
          </span>
        </Td>
        <Td>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 600 }}>{item.anaesthetistName}</span>
            <span style={{ color: neutral.slate }}>
              {' · '}
              {item.surgeonName !== '' ? `${item.surgeonName}, ` : ''}
              {item.hospitalName}
            </span>
          </div>
          <div data-shot="contracts-to-set-stages" style={{ marginTop: 2, fontSize: 12, color: neutral.slate }}>{contractsToSetStageText(item)}</div>
        </Td>
        <Td nowrap>
          <span style={{ display: 'flex', alignItems: 'center', gap: space[2] }}>
            <ProgressBar done={item.set} total={item.total} width={64} label="Contracts set" />
            <span className="mono" data-shot="contracts-to-set-progress" style={{ color: neutral.ink }}>{`${item.set} of ${item.total}`}</span>
          </span>
        </Td>
        <Td mono bold align="right">{item.procedures.length}</Td>
        <Td>
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: space[1] }}>
            {item.notes.map((n) => (
              <Pill key={n.kind} tone={n.tone} size="sm" data-note={n.kind}>{n.text}</Pill>
            ))}
          </span>
        </Td>
        <Td nowrap align="right">
          <span style={{ display: 'inline-flex', gap: space[3] }}>
            <TextAction size="sm" flush label={`Set Contracts, ${name}`} onClick={setContracts}>Set Contracts</TextAction>
            <TextAction size="sm" flush label={`Open List, ${name}`} onClick={() => onOpenList(item.listId)}>Open List</TextAction>
          </span>
        </Td>
      </ClickableRow>
      {open &&
        item.procedures.map((p) => (
          <tr key={p.procedureId} data-procedure-list={item.listId} data-procedure-to-set={p.procedureId} data-stage={p.stage} style={{ background: neutral.bg }}>
            <Td />
            <Td colSpan={3}>
              <span style={{ display: 'flex', gap: space[2], minWidth: 0 }}>
                <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.patientName}</span>
                <span style={{ flex: 'none', color: p.stage === 'partWay' ? neutral.ink : neutral.mist }}>{p.progressText}</span>
              </span>
            </Td>
            <Td />
            <Td nowrap align="right">
              <TextAction size="sm" flush label={`Set the Contract for ${p.patientName}'s Booking`} onClick={() => onOpenBooking(item.dateISO, p.bookingId)}>
                Set Contract
              </TextAction>
            </Td>
          </tr>
        ))}
    </>
  )
}
