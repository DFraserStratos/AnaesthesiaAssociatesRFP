import { describe, expect, it } from 'vitest'
import type { AppState } from '../../../store/appStore'
import { freshAppState } from '../../../store/appStore'
import { allAaFeeInvoices, type AaFeeInvoiceRow } from '../../../store/selectors'
import { toCents } from '../../../domain/billing/money'
import { AA_FEE_SHOWS, aaFeeRows, parseAaFeeMonth, parseAaFeeShow, type AaFeeQuery } from './aaFeeRows'

/** A minimal fee row: only the fields the module reads. */
function mkRow(
  n: number,
  anaesthetistId: string,
  monthISO: string,
  total: number,
  amountReceived = 0,
  invoiceNumber = `AA-FEE-2026-${String(n).padStart(4, '0')}`,
): AaFeeInvoiceRow {
  return {
    id: `F${n}`,
    invoiceNumber,
    anaesthetistId,
    monthISO,
    total,
    amountReceived,
    status: toCents(amountReceived) >= toCents(total) ? 'paid' : 'unpaid',
    raisedAtISO: `${monthISO}-28T09:00:00`,
  } as AaFeeInvoiceRow
}

const NAMES: Record<string, string> = {
  A1: 'Dr Helen Walker',
  A2: 'Dr Rangi Parata',
  A3: 'Dr Sam Chen',
}
const nameOf = (id: string): string => NAMES[id] ?? id

/** The store's order: newest month first. */
const BOOK: AaFeeInvoiceRow[] = [
  mkRow(10, 'A1', '2026-10', 230, 0),
  mkRow(2, 'A2', '2026-10', 115, 0),
  mkRow(11, 'A3', '2026-10', 0.3, 0.3),
  mkRow(5, 'A1', '2026-09', 345, 345),
  mkRow(6, 'A2', '2026-09', 200, 50.25),
  mkRow(3, 'A3', '2026-08', 99.99, 99.99),
  mkRow(1, 'A1', '2026-08', 120.1, 0),
]

const numbers = (rows: AaFeeInvoiceRow[]): string[] => rows.map((r) => r.invoiceNumber)
const run = (query: AaFeeQuery, book: readonly AaFeeInvoiceRow[] = BOOK) => aaFeeRows(book, query, nameOf)

describe('parseAaFeeShow', () => {
  it('opens on Unpaid', () => {
    expect(parseAaFeeShow(null)).toBe('unpaid')
    expect(parseAaFeeShow('')).toBe('unpaid')
    expect(parseAaFeeShow('nonsense')).toBe('unpaid')
    expect(parseAaFeeShow('Paid')).toBe('unpaid')
  })

  it('accepts every named filter', () => {
    for (const show of AA_FEE_SHOWS) expect(parseAaFeeShow(show)).toBe(show)
  })
})

describe('parseAaFeeMonth', () => {
  it('accepts a YYYY-MM month', () => {
    expect(parseAaFeeMonth('2026-10')).toBe('2026-10')
    expect(parseAaFeeMonth('2026-01')).toBe('2026-01')
    expect(parseAaFeeMonth('2026-12')).toBe('2026-12')
  })

  it('rejects anything else as All months', () => {
    expect(parseAaFeeMonth('2026-13')).toBeUndefined()
    expect(parseAaFeeMonth('2026-00')).toBeUndefined()
    expect(parseAaFeeMonth('oct')).toBeUndefined()
    expect(parseAaFeeMonth('2026-1')).toBeUndefined()
    expect(parseAaFeeMonth('2026-10-01')).toBeUndefined()
    expect(parseAaFeeMonth('')).toBeUndefined()
    expect(parseAaFeeMonth(null)).toBeUndefined()
  })
})

describe('aaFeeRows: order', () => {
  it('Unpaid (the default) lists unpaid only, oldest month first, then by number', () => {
    const { rows } = run({ show: parseAaFeeShow(null) })
    expect(rows.every((r) => r.status === 'unpaid')).toBe(true)
    expect(numbers(rows)).toEqual(['AA-FEE-2026-0001', 'AA-FEE-2026-0006', 'AA-FEE-2026-0002', 'AA-FEE-2026-0010'])
  })

  it('orders numbers numerically within a month, even unpadded', () => {
    const book = [
      mkRow(10, 'A1', '2026-10', 10, 0, 'AA-FEE-2026-10'),
      mkRow(2, 'A1', '2026-10', 10, 0, 'AA-FEE-2026-2'),
      mkRow(100, 'A1', '2026-10', 10, 0, 'AA-FEE-2026-100'),
    ]
    expect(numbers(run({ show: 'unpaid' }, book).rows)).toEqual(['AA-FEE-2026-2', 'AA-FEE-2026-10', 'AA-FEE-2026-100'])
    const paid = book.map((r) => ({ ...r, amountReceived: r.total, status: 'paid' as const }))
    expect(numbers(run({ show: 'paid' }, paid).rows)).toEqual(['AA-FEE-2026-2', 'AA-FEE-2026-10', 'AA-FEE-2026-100'])
  })

  it('Paid lists paid only, newest month first, then by number', () => {
    const { rows } = run({ show: 'paid' })
    expect(rows.every((r) => r.status === 'paid')).toBe(true)
    expect(numbers(rows)).toEqual(['AA-FEE-2026-0011', 'AA-FEE-2026-0005', 'AA-FEE-2026-0003'])
  })

  it('All puts every unpaid row before every paid row, each in its own order', () => {
    const { rows } = run({ show: 'all' })
    expect(rows).toHaveLength(BOOK.length)
    const firstPaid = rows.findIndex((r) => r.status === 'paid')
    expect(rows.slice(0, firstPaid).every((r) => r.status === 'unpaid')).toBe(true)
    expect(rows.slice(firstPaid).every((r) => r.status === 'paid')).toBe(true)
    expect(numbers(rows)).toEqual([
      'AA-FEE-2026-0001',
      'AA-FEE-2026-0006',
      'AA-FEE-2026-0002',
      'AA-FEE-2026-0010',
      'AA-FEE-2026-0011',
      'AA-FEE-2026-0005',
      'AA-FEE-2026-0003',
    ])
  })

  it('never reorders the input array (the store order the web fee list reads)', () => {
    const before = [...BOOK]
    for (const show of AA_FEE_SHOWS) run({ show })
    run({ show: 'all', month: '2026-10', q: 'walker' })
    expect(BOOK).toEqual(before)
    BOOK.forEach((row, i) => expect(row).toBe(before[i]))
  })
})

describe('aaFeeRows: search and month', () => {
  it('finds an invoice number, case-insensitive', () => {
    expect(numbers(run({ show: 'all', q: 'aa-fee-2026-0006' }).rows)).toEqual(['AA-FEE-2026-0006'])
    expect(numbers(run({ show: 'all', q: '  AA-FEE-2026-0011  ' }).rows)).toEqual(['AA-FEE-2026-0011'])
  })

  it('finds an anaesthetist by surname and by full name through nameOf', () => {
    expect(numbers(run({ show: 'all', q: 'walker' }).rows)).toEqual(['AA-FEE-2026-0001', 'AA-FEE-2026-0010', 'AA-FEE-2026-0005'])
    expect(numbers(run({ show: 'unpaid', q: 'Rangi Parata' }).rows)).toEqual(['AA-FEE-2026-0006', 'AA-FEE-2026-0002'])
    expect(numbers(run({ show: 'paid', q: 'DR SAM CHEN' }).rows)).toEqual(['AA-FEE-2026-0011', 'AA-FEE-2026-0003'])
  })

  it('a search that matches nothing gives no rows', () => {
    expect(run({ show: 'all', q: 'nobody' }).rows).toEqual([])
  })

  it('an empty or blank search keeps every row of the filter', () => {
    expect(run({ show: 'all', q: '' }).rows).toHaveLength(BOOK.length)
    expect(run({ show: 'all', q: '   ' }).rows).toHaveLength(BOOK.length)
  })

  it('the month filter keeps one month', () => {
    expect(numbers(run({ show: 'all', month: '2026-09' }).rows)).toEqual(['AA-FEE-2026-0006', 'AA-FEE-2026-0005'])
    expect(numbers(run({ show: 'unpaid', month: '2026-10' }).rows)).toEqual(['AA-FEE-2026-0002', 'AA-FEE-2026-0010'])
    expect(run({ show: 'all', month: '2026-07' }).rows).toEqual([])
  })

  it('month, filter and search combine', () => {
    expect(numbers(run({ show: 'unpaid', month: '2026-10', q: 'parata' }).rows)).toEqual(['AA-FEE-2026-0002'])
  })
})

describe('aaFeeRows: totals and months', () => {
  it('counts the whole book unpaid and what it owes, whatever the filters', () => {
    const expected = { unpaidCount: 4, owed: 230 + 115 + (200 - 50.25) + 120.1 }
    for (const query of [
      { show: 'unpaid' },
      { show: 'paid' },
      { show: 'all', month: '2026-08' },
      { show: 'all', q: 'nobody' },
    ] as AaFeeQuery[]) {
      const list = run(query)
      expect(list.unpaidCount).toBe(expected.unpaidCount)
      expect(toCents(list.owed)).toBe(toCents(expected.owed))
      expect(list.owed).toBe(614.85)
    }
  })

  it('owes total less received, cents-exact', () => {
    const book = [mkRow(1, 'A1', '2026-10', 0.1, 0), mkRow(2, 'A1', '2026-10', 0.2, 0)]
    expect(run({ show: 'all' }, book).owed).toBe(0.3)
    const partial = [mkRow(3, 'A1', '2026-10', 0.3, 0.1), mkRow(4, 'A1', '2026-10', 1.1, 0.2)]
    expect(run({ show: 'all' }, partial).owed).toBe(1.1)
    expect(run({ show: 'all' }, partial).unpaidCount).toBe(2)
  })

  it('a part-received unpaid row counts only what is left', () => {
    const list = run({ show: 'all' }, [mkRow(1, 'A1', '2026-10', 100, 33.33)])
    expect(list.unpaidCount).toBe(1)
    expect(list.owed).toBe(66.67)
  })

  it('a paid row owes nothing and an empty book owes nothing', () => {
    expect(run({ show: 'all' }, [mkRow(1, 'A1', '2026-10', 0.3, 0.3)])).toMatchObject({ unpaidCount: 0, owed: 0 })
    expect(run({ show: 'all' }, [])).toEqual({ rows: [], unpaidCount: 0, owed: 0, months: [] })
  })

  it('lists every month newest first with its invoices, total and unpaid count', () => {
    expect(run({ show: 'paid', month: '2026-09', q: 'nobody' }).months).toEqual([
      { monthISO: '2026-10', invoices: 3, total: 345.3, unpaid: 2 },
      { monthISO: '2026-09', invoices: 2, total: 545, unpaid: 1 },
      { monthISO: '2026-08', invoices: 2, total: 220.09, unpaid: 1 },
    ])
  })
})

describe('aaFeeRows over the store rows', () => {
  it("a row whose received equals its total is 'paid' (cents, not floats)", () => {
    const state = {
      billing: {
        aaFeeInvoices: {
          F1: { id: 'F1', invoiceNumber: 'AA-FEE-2026-0001', anaesthetistId: 'A1', monthISO: '2026-10', total: 0.3, raisedAtISO: '2026-10-31T09:00:00', ledgerPairId: 'L1' },
          F2: { id: 'F2', invoiceNumber: 'AA-FEE-2026-0002', anaesthetistId: 'A1', monthISO: '2026-10', total: 0.3, raisedAtISO: '2026-10-31T09:00:00', ledgerPairId: 'L2' },
        },
        ledger: {
          L1: { receivable: { receivedAmount: 0.1 + 0.2 } },
          L2: { receivable: { receivedAmount: 0.29 } },
        },
      },
    } as unknown as Pick<AppState, 'billing'>
    const rows = allAaFeeInvoices(state)
    expect(rows.find((r) => r.id === 'F1')?.status).toBe('paid')
    expect(rows.find((r) => r.id === 'F2')?.status).toBe('unpaid')
    const list = aaFeeRows(rows, { show: 'unpaid' }, nameOf)
    expect(numbers(list.rows)).toEqual(['AA-FEE-2026-0002'])
    expect(list.owed).toBe(0.01)
  })

  it('agrees with the fresh seed, and leaves its newest-first order alone', () => {
    const store = allAaFeeInvoices(freshAppState())
    expect(store.length).toBeGreaterThan(0)
    for (const row of store) {
      if (row.status === 'paid') expect(toCents(row.amountReceived)).toBeGreaterThanOrEqual(toCents(row.total))
      else expect(toCents(row.amountReceived)).toBeLessThan(toCents(row.total))
    }
    const before = [...store]

    const all = aaFeeRows(store, { show: 'all' }, (id) => id)
    expect(store).toEqual(before)
    store.forEach((row, i) => expect(row).toBe(before[i]))
    expect(all.rows).toHaveLength(store.length)

    const unpaid = store.filter((r) => r.status === 'unpaid')
    const firstPaid = all.rows.findIndex((r) => r.status === 'paid')
    expect(firstPaid === -1 ? all.rows.length : firstPaid).toBe(unpaid.length)
    expect(all.unpaidCount).toBe(unpaid.length)
    expect(toCents(all.owed)).toBe(unpaid.reduce((s, r) => s + toCents(r.total) - toCents(r.amountReceived), 0))

    const unpaidRows = aaFeeRows(store, { show: 'unpaid' }, (id) => id).rows
    for (let i = 1; i < unpaidRows.length; i++) expect(unpaidRows[i - 1]!.monthISO <= unpaidRows[i]!.monthISO).toBe(true)
    const paidRows = aaFeeRows(store, { show: 'paid' }, (id) => id).rows
    for (let i = 1; i < paidRows.length; i++) expect(paidRows[i - 1]!.monthISO >= paidRows[i]!.monthISO).toBe(true)

    expect(all.months.reduce((s, m) => s + m.invoices, 0)).toBe(store.length)
    expect(all.months.map((m) => m.monthISO)).toEqual([...new Set(store.map((r) => r.monthISO))].sort().reverse())
  })
})
