import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ARRIVAL_KINDS, type ArrivalItem, type ArrivalKind } from '../../../../../domain/intake/arrivals'
import type { ListChangeRow } from '../../../../../domain/intake/listChanges'
import type { Actor } from '../../../../../store/mutate'
import { Workbench } from './Workbench'

const ROWS: ListChangeRow[] = [
  { rowId: 'r-1', change: 'changed', status: 'open', patientName: 'Aroha Ngata', nhi: 'ZKC4417', dobISO: '1961-03-12', scheduledTime: '08:00', procedureText: 'Right total knee joint replacement', diffs: [{ key: 'time', label: 'Time', current: '08:30', incoming: '08:00', effect: 'sets' }], flags: [] },
  { rowId: 'r-2', change: 'waiting', status: 'open', patientName: 'Sina Faleolo', scheduledTime: '11:00', procedureText: 'ACL recon', diffs: [], flags: ['needsNhi'] },
  { rowId: 'r-3', change: 'added', status: 'applied', patientName: 'Hannah Brooks', nhi: 'ZBR5521', diffs: [], flags: [] },
  { rowId: 'r-4', change: 'unchanged', status: 'leftOut', patientName: 'Peter Lindqvist', nhi: 'ZLM2290', diffs: [], flags: [] },
]

vi.mock('../../../../../store/intakeSelectors', () => ({
  useArrivalRows: (key: string | undefined) => (key === undefined || key.startsWith('none') ? [] : ROWS),
}))

vi.mock('../feed/SourceMark', () => ({
  SourceMark: ({ source }: { source: { kind: string; label: string } }) => (
    <span data-testid="source-mark" data-source-kind={source.kind}>
      {source.label}
    </span>
  ),
}))

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

const NO_ROWS: ReadonlySet<ArrivalKind> = new Set(['unreadable', 'held'])

function arrivalOf(kind: ArrivalKind, extra: Partial<ArrivalItem> = {}): ArrivalItem {
  const rowIds = NO_ROWS.has(kind) ? [] : ROWS.map((r) => r.rowId)
  return {
    key: `${kind}-key`,
    kind,
    batchId: 'batch-1',
    rowIds,
    openRowIds: rowIds,
    hospitalId: 'h-stgeorges',
    dateISO: '2026-11-25',
    session: 'AM',
    surgeonName: 'Mr C. Okafor',
    source: { kind: 'hospital', hospitalId: 'h-stgeorges', label: "St George's" },
    receivedAtISO: '2026-11-24T07:30:00',
    title: NO_ROWS.has(kind) ? 'Scan.pdf' : "Mr Okafor · St George's · Wed 25 Nov AM",
    counts: { rows: rowIds.length, open: rowIds.length, added: 1, changed: 1, cancelled: 0, unchanged: 1, removed: 0, waitingNhi: 1 },
    flags: { needsNhi: 1 },
    decided: false,
    reason: NO_ROWS.has(kind) ? 'The page is a photo too faint to read.' : undefined,
    ...extra,
  }
}

function renderBench(arrival: ArrivalItem | undefined) {
  return render(<Workbench arrival={arrival} actor={OFFICE} onDone={vi.fn()} />)
}

const BENCH_SHOT: Record<ArrivalKind, string> = {
  update: 'intake-bench-update',
  newList: 'intake-bench-newList',
  cancellation: 'intake-bench-cancellation',
  unreadable: 'intake-bench-unreadable',
  matchesExactly: 'intake-bench-matchesExactly',
  held: 'intake-bench-held',
  needsNhi: 'intake-bench-needsNhi',
}

describe('Intake Workbench', () => {
  it('with no arrival, asks for one', () => {
    const { container } = renderBench(undefined)
    expect(screen.getByText('Choose an arrival to see it here.')).toBeInTheDocument()
    expect(container.querySelector('[data-shot="intake-workbench"]')).not.toHaveAttribute('data-arrival-kind')
    expect(container.querySelector('[data-shot^="intake-bench-"]')).toBeNull()
  })

  it.each(ARRIVAL_KINDS)('dispatches a %s arrival to its one bench', (kind) => {
    const { container } = renderBench(arrivalOf(kind))
    const frame = container.querySelector('[data-shot="intake-workbench"]')!
    expect(frame).toHaveAttribute('data-arrival-kind', kind)
    expect(frame).toHaveAttribute('data-arrival-key', `${kind}-key`)
    const benches = container.querySelectorAll('[data-shot^="intake-bench-"]:not([data-shot$="-rows"]):not([data-shot$="-reason"])')
    expect(benches).toHaveLength(1)
    expect(benches[0]).toHaveAttribute('data-shot', BENCH_SHOT[kind])
  })

  it('the header shows the kind, the source and time, the title line and the flags', () => {
    const { container } = renderBench(arrivalOf('update'))
    expect(container.querySelector('[data-shot="intake-workbench-kind"]')).toHaveTextContent('Update')
    expect(screen.getByRole('heading', { level: 2, name: "Mr Okafor · St George's · Wed 25 Nov AM" })).toBeInTheDocument()
    const mark = screen.getByTestId('source-mark')
    expect(mark).toHaveAttribute('data-source-kind', 'hospital')
    expect(mark).toHaveTextContent("St George's")
    expect(container.querySelector('[data-shot="intake-workbench-received"]')).toHaveTextContent('Received Tue 24 Nov, 07:30')
    expect(container.querySelector('[data-arrival-flag="needsNhi"]')).toHaveTextContent('Needs NHI · 1')
  })

  it('a row-bearing bench lists the rows read only, with what each would do', () => {
    const { container } = renderBench(arrivalOf('update'))
    expect(container.querySelectorAll('tr[data-row-id]')).toHaveLength(ROWS.length)
    const changed = container.querySelector('tr[data-row-id="r-1"]')!
    expect(changed).toHaveTextContent('Changed')
    expect(changed).toHaveTextContent('Time')
    expect(container.querySelector('tr[data-row-id="r-2"]')).toHaveTextContent('No NHI')
    expect(container.querySelector('tr[data-row-id="r-2"]')).toHaveTextContent('Waiting for an NHI')
    expect(container.querySelector('tr[data-row-id="r-3"]')).toHaveTextContent('Applied')
    expect(container.querySelector('tr[data-row-id="r-4"]')).toHaveTextContent('Left out')
    expect(container.querySelectorAll('button, input, select, textarea')).toHaveLength(0)
  })

  it('an arrival with no rows says so', () => {
    renderBench(arrivalOf('update', { key: 'none-1' }))
    expect(screen.getByText('This arrival holds no patients.')).toBeInTheDocument()
  })

  it.each(['unreadable', 'held'] as const)('a %s arrival shows its file or message and the reason, and no table', (kind) => {
    const { container } = renderBench(arrivalOf(kind))
    const bench = container.querySelector(`[data-shot="${BENCH_SHOT[kind]}"]`)!
    expect(bench).toHaveTextContent('Scan.pdf')
    expect(bench).toHaveTextContent('The page is a photo too faint to read.')
    expect(container.querySelector('table')).toBeNull()
  })

  it.each(ARRIVAL_KINDS)('the %s workbench copy has no dash and no retired word', (kind) => {
    const { container } = renderBench(arrivalOf(kind))
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/[–—]/)
    expect(text).not.toMatch(/\bslots?\b/i)
    expect(text).not.toMatch(/\bCards?\b/)
    expect(text).not.toMatch(/\b(swap|timesheet)/i)
    expect(container.querySelectorAll('button')).toHaveLength(0)
  })
})
