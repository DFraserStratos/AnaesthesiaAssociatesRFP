/**
 * The Billing tab's pure view (US-13.3.1): buckets, Show all, search, the
 * anaesthetist filter, paging by List, the URL params and the summary, over
 * hand-built billing statuses.
 */

import { describe, expect, it } from 'vitest'
import type { BillingBucket, BookingBillingStatus, ListBillingStatus } from '../../../../domain/billing/billingStatus'
import { BILLING_PAGE_SIZE, billingParamsFrom, billingTabView, bucketOf, summaryLine, type BillingTabParams } from './billingTabState'

const NAMES: Record<string, string> = { A1: 'Dr Melanie Souter', A2: 'Dr Hannah Ropata', A3: 'Dr A Zed' }

function booking(bookingId: string, listId: string, bucket: BillingBucket, patientName = `Patient ${bookingId}`): BookingBillingStatus {
  const problem = bucket === 'problems' ? { kind: 'billingException' as const, reason: 'Not invoiced', fix: 'retry' as const, canMarkResolved: true, exceptionId: `X-${bookingId}` } : undefined
  return {
    bookingId,
    listId,
    patientId: `PT-${bookingId}`,
    patientName,
    stage: bucket === 'problems' ? 'failed' : bucket === 'done' ? 'disbursed' : 'invoiced',
    steps: { sent: 'notYet', inXero: 'notYet', paidIn: 'notYet', disbursed: 'notYet' },
    invoiceIds: [`INV-${bookingId}`],
    invoiceNumbers: [`AA-2026-${bookingId}`],
    bucket,
    problems: problem !== undefined ? [problem] : [],
    ...(problem !== undefined ? { problem } : {}),
  }
}

/** A List whose Bookings take the given buckets, in order. */
function list(listId: string, anaesthetistId: string, dateISO: string, buckets: BillingBucket[], opts: { hospitalName?: string; patients?: string[] } = {}): ListBillingStatus {
  const bookings = buckets.map((b, i) => booking(`${listId}-B${i + 1}`, listId, b, opts.patients?.[i]))
  const hasProblem = bookings.some((b) => b.bucket === 'problems')
  const bucket: BillingBucket = hasProblem ? 'problems' : bookings.every((b) => b.bucket === 'done') ? 'done' : 'inProgress'
  return {
    listId,
    dateISO,
    session: 'AM',
    hospitalId: 'H1',
    hospitalName: opts.hospitalName ?? 'Southern Cross Christchurch',
    anaesthetistId,
    anaesthetistName: NAMES[anaesthetistId] ?? anaesthetistId,
    status: hasProblem ? 'Needs attention' : bucket === 'done' ? 'Complete' : 'Billing',
    counts: { sent: 0, inXero: 0, paidIn: 0, disbursed: 0, problems: bookings.filter((b) => b.bucket === 'problems').length, of: bookings.length },
    hasProblem,
    bucket,
    bookings,
  }
}

const params = (p: Partial<BillingTabParams> = {}): BillingTabParams => ({ show: 'problems', q: '', page: 1, ...p })

// Souter: L1 (problem + done), L2 (in progress), L3 (done). Ropata: L4 (problem), L5 (in progress). Zed: L6 (done, St Georges).
const LISTS: ListBillingStatus[] = [
  list('L1', 'A1', '2026-11-23', ['problems', 'done', 'inProgress'], { patients: ['Aroha Ngata', 'Ben Hale', 'Cara Doyle'] }),
  list('L2', 'A1', '2026-11-22', ['inProgress', 'done']),
  list('L3', 'A1', '2026-11-21', ['done']),
  list('L4', 'A2', '2026-11-20', ['problems', 'problems', 'inProgress']),
  list('L5', 'A2', '2026-11-19', ['inProgress']),
  list('L6', 'A3', '2026-11-18', ['done', 'done'], { hospitalName: 'St Georges' }),
]

const listIds = (v: ReturnType<typeof billingTabView>) => v.groups.flatMap((g) => g.lists.map((l) => l.list.listId))
const tabList = (v: ReturnType<typeof billingTabView>, id: string) => v.groups.flatMap((g) => g.lists).find((l) => l.list.listId === id)

describe('billingTabView buckets', () => {
  it('Problems drops Lists with no problem and shows only their problem Bookings', () => {
    const v = billingTabView(LISTS, params())
    // Ropata before Souter (surname order).
    expect(v.groups.map((g) => g.anaesthetistId)).toEqual(['A2', 'A1'])
    expect(listIds(v)).toEqual(['L4', 'L1'])
    const l1 = tabList(v, 'L1')!
    expect(l1.bookings.map((b) => b.bookingId)).toEqual(['L1-B1'])
    expect(l1.hiddenCount).toBe(2)
    expect(l1.bookingCount).toBe(3)
    expect(l1.showingAll).toBe(false)
    expect(tabList(v, 'L4')!.bookings.map((b) => b.bookingId)).toEqual(['L4-B1', 'L4-B2'])
  })

  it('In progress, Done and All keep their Lists with every Booking', () => {
    expect(listIds(billingTabView(LISTS, params({ show: 'in-progress' })))).toEqual(['L5', 'L2'])
    expect(listIds(billingTabView(LISTS, params({ show: 'done' })))).toEqual(['L3', 'L6'])
    const all = billingTabView(LISTS, params({ show: 'all' }))
    expect(listIds(all)).toEqual(['L4', 'L5', 'L1', 'L2', 'L3', 'L6'])
    expect(tabList(all, 'L1')!.bookings).toHaveLength(3)
    expect(tabList(all, 'L1')!.hiddenCount).toBe(0)
  })

  it('Show all adds the rest of a List’s Bookings', () => {
    const v = billingTabView(LISTS, params(), { showAll: new Set(['L1']) })
    const l1 = tabList(v, 'L1')!
    expect(l1.bookings.map((b) => b.bookingId)).toEqual(['L1-B1', 'L1-B2', 'L1-B3'])
    expect(l1.hiddenCount).toBe(0)
    expect(l1.showingAll).toBe(true)
    expect(tabList(v, 'L4')!.showingAll).toBe(false)
  })

  it('bucketOf maps the URL value to 59’s bucket', () => {
    expect(bucketOf('in-progress')).toBe('inProgress')
    expect(bucketOf('problems')).toBe('problems')
    expect(bucketOf('done')).toBe('done')
    expect(bucketOf('all')).toBe('all')
  })
})

describe('billingTabView search and filter', () => {
  it('finds a Booking by its id, case-insensitive, and narrows the List to it', () => {
    const v = billingTabView(LISTS, params({ show: 'all', q: 'l2-b2' }))
    expect(listIds(v)).toEqual(['L2'])
    expect(tabList(v, 'L2')!.bookings.map((b) => b.bookingId)).toEqual(['L2-B2'])
    expect(tabList(v, 'L2')!.hiddenCount).toBe(1)
  })

  it('finds by patient name and invoice number', () => {
    expect(listIds(billingTabView(LISTS, params({ show: 'all', q: 'cara' })))).toEqual(['L1'])
    expect(listIds(billingTabView(LISTS, params({ show: 'all', q: 'AA-2026-L5' })))).toEqual(['L5'])
  })

  it('finds by payer name, asking for payers only while searching', () => {
    const asked: string[] = []
    const payerNames = (id: string) => {
      asked.push(id)
      return id === 'L3-B1' ? ['Southern Cross Health Society'] : ['ACC']
    }
    billingTabView(LISTS, params({ show: 'all' }), { payerNames })
    expect(asked).toEqual([])
    const v = billingTabView(LISTS, params({ show: 'all', q: 'health society' }), { payerNames })
    expect(listIds(v)).toEqual(['L3'])
    expect(asked.length).toBeGreaterThan(0)
  })

  it('a hospital or anaesthetist match keeps every Booking in view', () => {
    const byHospital = billingTabView(LISTS, params({ show: 'all', q: 'st george' }))
    expect(listIds(byHospital)).toEqual(['L6'])
    expect(tabList(byHospital, 'L6')!.bookings).toHaveLength(2)
    const byName = billingTabView(LISTS, params({ show: 'all', q: 'ropata' }))
    expect(listIds(byName)).toEqual(['L4', 'L5'])
    expect(tabList(byName, 'L4')!.bookings).toHaveLength(3)
    // Under Problems a heading match still shows only the problem Bookings.
    expect(tabList(billingTabView(LISTS, params({ q: 'ropata' })), 'L4')!.bookings).toHaveLength(2)
  })

  it('search under Problems looks only at problem Bookings, unless Show all is on', () => {
    expect(listIds(billingTabView(LISTS, params({ q: 'ben hale' })))).toEqual([])
    const v = billingTabView(LISTS, params({ q: 'ben hale' }), { showAll: new Set(['L1']) })
    expect(listIds(v)).toEqual(['L1'])
    expect(tabList(v, 'L1')!.bookings).toHaveLength(3)
  })

  it('the anaesthetist filter keeps one', () => {
    const v = billingTabView(LISTS, params({ show: 'all', anaesthetistId: 'A1' }))
    expect(v.groups.map((g) => g.anaesthetistId)).toEqual(['A1'])
    expect(listIds(v)).toEqual(['L1', 'L2', 'L3'])
    expect(v.groups[0]!.listCount).toBe(3)
    expect(v.groups[0]!.problemListCount).toBe(1)
  })
})

describe('billingTabView paging', () => {
  // A1 has 15 Lists, A2 has 15: 30 Lists, two pages of 20, A2 split across them.
  const many: ListBillingStatus[] = []
  for (let i = 1; i <= 15; i += 1) many.push(list(`S${i}`, 'A1', `2026-10-${String(i).padStart(2, '0')}`, ['inProgress']))
  for (let i = 1; i <= 15; i += 1) many.push(list(`R${i}`, 'A2', `2026-10-${String(i).padStart(2, '0')}`, [i === 3 ? 'problems' : 'done']))

  it('pages 20 Lists at a time with a group split across pages', () => {
    const p1 = billingTabView(many, params({ show: 'all' }))
    expect(p1.totalLists).toBe(30)
    expect(p1.pages).toBe(2)
    expect(p1.page).toBe(1)
    expect(p1.groups.map((g) => [g.anaesthetistId, g.lists.length])).toEqual([
      ['A2', 15],
      ['A1', 5],
    ])
    const p2 = billingTabView(many, params({ show: 'all', page: 2 }))
    expect(p2.groups.map((g) => [g.anaesthetistId, g.lists.length])).toEqual([['A1', 10]])
    // The group's counts cover the whole result, not the page.
    expect(p2.groups[0]!.listCount).toBe(15)
    expect(p1.groups[0]!.listCount).toBe(15)
    expect(p1.groups[0]!.problemListCount).toBe(1)
    expect(BILLING_PAGE_SIZE).toBe(20)
  })

  it('clamps the page to [1, pages], with at least one page', () => {
    expect(billingTabView(many, params({ show: 'all', page: 9 })).page).toBe(2)
    expect(billingTabView(many, params({ show: 'all', page: 0 })).page).toBe(1)
    const empty = billingTabView([], params({ page: 4 }))
    expect(empty).toMatchObject({ groups: [], totalLists: 0, page: 1, pages: 1 })
  })

  it('a listId lands on its page and shows all its Bookings', () => {
    const multi = [...many, list('S99', 'A1', '2026-09-01', ['problems', 'done', 'inProgress'])]
    const v = billingTabView(multi, params({ show: 'all', page: 1, listId: 'S99' }))
    expect(v.page).toBe(2)
    const s99 = tabList(v, 'S99')!
    expect(s99.showingAll).toBe(true)
    expect(s99.bookings).toHaveLength(3)
    expect(s99.hiddenCount).toBe(0)
  })
})

describe('billingParamsFrom', () => {
  it('defaults to Problems, page 1, no search', () => {
    expect(billingParamsFrom(new URLSearchParams())).toEqual({ show: 'problems', q: '', page: 1 })
  })

  it('reads the legacy ?problems=1 and an unknown show as Problems', () => {
    expect(billingParamsFrom(new URLSearchParams('problems=1')).show).toBe('problems')
    expect(billingParamsFrom(new URLSearchParams('show=bogus')).show).toBe('problems')
  })

  it('reads show, q, anaesthetist and page', () => {
    expect(billingParamsFrom(new URLSearchParams('show=in-progress&q=%20aroha%20&anaesthetist=A1&page=3'))).toEqual({
      show: 'in-progress',
      q: 'aroha',
      anaesthetistId: 'A1',
      page: 3,
    })
    expect(billingParamsFrom(new URLSearchParams('page=-2')).page).toBe(1)
    expect(billingParamsFrom(new URLSearchParams('page=two')).page).toBe(1)
    expect(billingParamsFrom(new URLSearchParams('page=1.5')).page).toBe(1)
  })

  it('a list forces All', () => {
    expect(billingParamsFrom(new URLSearchParams('list=L7&show=done'))).toEqual({ show: 'all', q: '', page: 1, listId: 'L7' })
  })
})

describe('the summary', () => {
  it('counts Lists with a problem and their anaesthetists, whatever the bucket', () => {
    const v = billingTabView(LISTS, params({ show: 'done' }))
    expect(v.summary).toEqual({ problems: 2, problemAnaesthetists: 2 })
    expect(summaryLine(v)).toBe('2 Lists with a problem, 2 anaesthetists')
  })

  it('follows the anaesthetist filter and search', () => {
    const one = billingTabView(LISTS, params({ anaesthetistId: 'A2' }))
    expect(summaryLine(one)).toBe('1 List with a problem, 1 anaesthetist')
    expect(billingTabView(LISTS, params({ show: 'all', q: 'aroha' })).summary).toEqual({ problems: 1, problemAnaesthetists: 1 })
    expect(billingTabView(LISTS, params({ show: 'all', q: 'ben hale' })).summary).toEqual({ problems: 0, problemAnaesthetists: 0 })
  })
})

describe('practice scale', () => {
  it('18,000 Lists finish well inside a loose bound', () => {
    const big: ListBillingStatus[] = []
    for (let i = 0; i < 18_000; i += 1) {
      const a = `A${i % 85}`
      const buckets: BillingBucket[] = i % 37 === 0 ? ['problems', 'done', 'inProgress'] : i % 3 === 0 ? ['done', 'done'] : ['inProgress', 'done', 'done']
      big.push(list(`L${i}`, a, `2026-${String((i % 11) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`, buckets))
    }
    const payerNames = () => ['Southern Cross Health Society']
    const t0 = performance.now()
    const all = billingTabView(big, params({ show: 'all', page: 9999 }))
    const searched = billingTabView(big, params({ show: 'all', q: 'patient l1799' }), { payerNames })
    const landed = billingTabView(big, params({ show: 'all', listId: 'L17999' }))
    const elapsed = performance.now() - t0
    expect(all.totalLists).toBe(18_000)
    expect(all.page).toBe(all.pages)
    expect(searched.totalLists).toBeGreaterThan(0)
    expect(tabList(landed, 'L17999')!.showingAll).toBe(true)
    expect(elapsed).toBeLessThan(1500)
  })
})
