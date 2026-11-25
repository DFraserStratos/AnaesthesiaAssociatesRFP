/**
 * The Finances section's billing status (US-13.3.1, US-13.3.2; D109, D116):
 * each story example over hand-built records, no store.
 */

import { describe, expect, it } from 'vitest'
import type { AssignedList, BillingException, Booking, BookingLedgerPair, Invoice, LedgerTransfer, XeroDivergence, XeroQueueItem } from '../types'
import {
  billingCounts,
  billingGroups,
  listBillingStatuses,
  PAYER_NO_ADDRESS_CODE,
  PAYER_NO_ADDRESS_REASON,
  problemAdvice,
  problemCountLine,
  problemListCount,
  xeroItemsOnLists,
  type BillingStatusInput,
  type ListBillingStatus,
} from './billingStatus'

const AT = '2026-11-24T10:00:00'
const SOUTER = 'A-SOUTER'
const ROPATA = 'A-ROPATA'
const ZED = 'A-ZED'

const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id, undefined, { numeric: true })

/** A small world of records, and the input the read model takes. */
class World {
  lists: Record<string, AssignedList> = {}
  bookings: Record<string, Booking> = {}
  invoices: Record<string, Invoice> = {}
  ledger: Record<string, BookingLedgerPair> = {}
  transfers: Record<string, LedgerTransfer> = {}
  exceptions: Record<string, BillingException> = {}
  xeroQueue: Record<string, XeroQueueItem> = {}
  xeroDivergences: Record<string, XeroDivergence> = {}
  patients: Record<string, { name: string }> = {}
  anaesthetists: Record<string, { name: string }> = {
    [SOUTER]: { name: 'Dr Melanie Souter' },
    [ROPATA]: { name: 'Dr Hannah Ropata' },
    [ZED]: { name: 'Dr A Zed' },
  }
  hospitals: Record<string, { name: string }> = { H1: { name: 'Southern Cross Christchurch' }, H2: { name: 'St Georges' } }

  list(id: string, opts: Partial<Pick<AssignedList, 'anaesthetistId' | 'hospitalId' | 'dateISO' | 'state' | 'billedAtISO'>> & { unbilled?: boolean } = {}): string {
    const l: AssignedList = {
      id,
      dateISO: opts.dateISO ?? '2026-11-23',
      session: 'AM',
      kind: 'private',
      hospitalId: opts.hospitalId ?? 'H1',
      surgeonId: 'S1',
      conflicts: [],
      origin: { kind: 'manual' },
      state: opts.state ?? 'AUTHORISED',
      anaesthetistId: opts.anaesthetistId ?? SOUTER,
      slotId: `SL-${id}`,
    }
    if (opts.unbilled !== true) l.billedAtISO = opts.billedAtISO ?? '2026-11-23T18:00:00'
    this.lists[id] = l
    return id
  }

  booking(id: string, listId: string, patientName: string, opts: { cancelled?: boolean } = {}): string {
    const patientId = `PT-${id}`
    this.patients[patientId] = { name: patientName }
    this.bookings[id] = {
      id,
      listId,
      patientId,
      completed: true,
      lastModifiedBy: 'test',
      lastModifiedAtISO: AT,
      ...(opts.cancelled === true ? { cancellation: { reason: 'Patient unwell', by: 'office', role: 'office', source: 'office', atISO: AT } } : {}),
    }
    return id
  }

  /**
   * A procedure invoice and its pair on a Booking, fully billed by default:
   * sent, in Xero, paid in and disbursed. Options hold it back at a step.
   */
  billed(
    bookingId: string,
    opts: {
      n?: string
      amount?: number
      delivery?: Invoice['delivery'] | null
      inXero?: boolean
      received?: number
      disbursed?: number
      noPayable?: boolean
      kind?: 'procedure' | 'prePayment'
      invoiceKind?: Invoice['kind']
    } = {},
  ): BookingLedgerPair {
    const booking = this.bookings[bookingId]!
    const list = this.lists[booking.listId]!
    const n = opts.n ?? bookingId
    const amount = opts.amount ?? 1240
    const invoiceId = `INV-${n}`
    const number = `AA-2026-${n}`
    const delivery = opts.delivery === null ? undefined : (opts.delivery ?? { method: 'email', status: 'sent', sends: [] })
    this.invoices[invoiceId] = {
      id: invoiceId,
      invoiceNumber: number,
      caseReference: `CR-${n}`,
      bookingId,
      counterparty: { kind: 'patient', id: booking.patientId },
      layout: 'patient',
      kind: opts.invoiceKind ?? (opts.kind === 'prePayment' ? 'prePayment' : 'standard'),
      subtotal: amount,
      gst: 0,
      total: amount,
      ...(delivery !== undefined ? { delivery } : {}),
    }
    const received = opts.received ?? amount
    const disbursed = opts.disbursed ?? amount
    const pair: BookingLedgerPair = {
      id: `PR-${n}`,
      kind: opts.kind ?? 'procedure',
      invoiceId,
      bookingId,
      listId: list.id,
      anaesthetistId: list.anaesthetistId,
      patientId: booking.patientId,
      procedureIds: [],
      procedureShares: [],
      createdAtISO: AT,
      receivable: {
        number,
        counterparty: { kind: 'patient', id: booking.patientId },
        amount,
        receivedAmount: received,
        ...(received >= amount ? { paidInAtISO: AT } : {}),
        ...(opts.inXero !== false ? { xeroAccRecId: `XR-${n}` } : {}),
      },
    }
    if (opts.noPayable !== true) {
      pair.payable = {
        number: `${number}-P`,
        payee: opts.kind === 'prePayment' ? { kind: 'holding' } : { kind: 'anaesthetist', anaesthetistId: list.anaesthetistId },
        amount,
        releasedAmount: received,
        disbursedAmount: disbursed,
        issuedAtISO: AT,
      }
    }
    this.ledger[pair.id] = pair
    return pair
  }

  exception(id: string, bookingId: string, opts: Partial<BillingException> = {}): BillingException {
    const x: BillingException = { id, bookingId, listId: this.bookings[bookingId]!.listId, code: 'runError', message: 'The run could not price this Booking', atISO: AT, ...opts }
    this.exceptions[id] = x
    return x
  }

  queue(id: string, opts: Partial<XeroQueueItem> = {}): XeroQueueItem {
    const q: XeroQueueItem = {
      id,
      kind: 'handoff',
      idempotencyKey: `K-${id}`,
      target: {},
      enqueuedAtISO: AT,
      attempts: 1,
      nextAttemptAtISO: '2026-11-24T08:02:00',
      status: 'waiting',
      ...opts,
    }
    this.xeroQueue[id] = q
    return q
  }

  divergence(id: string, pair: BookingLedgerPair, kind: XeroDivergence['kind'], xeroTotal: number): XeroDivergence {
    const d: XeroDivergence = {
      id,
      kind,
      accRecId: pair.receivable.xeroAccRecId ?? 'XR',
      pairId: pair.id,
      invoiceId: pair.invoiceId,
      xeroShows: { status: kind === 'voidedInXero' ? 'voided' : 'awaitingPayment', total: xeroTotal },
      engineHolds: { amount: pair.receivable.amount, outstanding: pair.receivable.amount - pair.receivable.receivedAmount },
      detectedAtISO: AT,
      status: 'open',
    }
    this.xeroDivergences[id] = d
    return d
  }

  input(): BillingStatusInput {
    const bookingsByList = new Map<string, Booking[]>()
    for (const b of Object.values(this.bookings).sort(byId)) bookingsByList.set(b.listId, [...(bookingsByList.get(b.listId) ?? []), b])
    const pairsByBooking = new Map<string, BookingLedgerPair[]>()
    for (const p of Object.values(this.ledger).sort(byId)) pairsByBooking.set(p.bookingId, [...(pairsByBooking.get(p.bookingId) ?? []), p])
    return {
      lists: this.lists,
      bookingsByList,
      invoices: this.invoices,
      ledger: this.ledger,
      pairsByBooking,
      transfers: this.transfers,
      exceptions: this.exceptions,
      xeroQueue: this.xeroQueue,
      xeroDivergences: this.xeroDivergences,
      patients: this.patients,
      anaesthetists: this.anaesthetists,
      hospitals: this.hospitals,
    }
  }

  statuses(): ListBillingStatus[] {
    return listBillingStatuses(this.input())
  }
}

function listOf(statuses: readonly ListBillingStatus[], listId: string): ListBillingStatus {
  const l = statuses.find((s) => s.listId === listId)
  if (l === undefined) throw new Error(`no status for ${listId}`)
  return l
}

function bookingOf(statuses: readonly ListBillingStatus[], bookingId: string) {
  const b = statuses.flatMap((l) => l.bookings).find((x) => x.bookingId === bookingId)
  if (b === undefined) throw new Error(`no status for ${bookingId}`)
  return b
}

/** A List of five: B1 failed at the run, B2 to B5 billed all the way. */
function failedAndFourBilled(): World {
  const w = new World()
  w.list('L1')
  w.booking('B1', 'L1', 'Annette Riley')
  w.exception('BX1', 'B1')
  for (const id of ['B2', 'B3', 'B4', 'B5']) {
    w.booking(id, 'L1', `Patient ${id}`)
    w.billed(id)
  }
  return w
}

describe('Problems first (US-13.3.1)', () => {
  it('one failed Booking and four billed: the List shows under its anaesthetist with only the failed Booking', () => {
    const statuses = failedAndFourBilled().statuses()
    const groups = billingGroups(statuses, { bucket: 'problems' })
    expect(groups).toHaveLength(1)
    expect(groups[0]!.anaesthetistId).toBe(SOUTER)
    expect(groups[0]!.lists).toHaveLength(1)
    const view = groups[0]!.lists[0]!
    expect(view.bookings.map((b) => b.bookingId)).toEqual(['B1'])
    expect(view.hiddenCount).toBe(4)
    expect(view.bookingCount).toBe(5)
    expect(view.bookings[0]!.stage).toBe('failed')
    expect(view.list.status).toBe('Needs attention')
    expect(view.list.counts).toEqual({ sent: 4, inXero: 4, paidIn: 4, disbursed: 4, problems: 1, of: 5 })
    expect(groups[0]!.problemListCount).toBe(1)
  })

  it('under All the same List shows every Booking', () => {
    const view = billingGroups(failedAndFourBilled().statuses(), { bucket: 'all' })[0]!.lists[0]!
    expect(view.bookings).toHaveLength(5)
    expect(view.hiddenCount).toBe(0)
  })
})

describe('the fix beside the Booking (US-13.3.2; D116)', () => {
  it('a payer with no billing email or postal address reads the no-address reason, fix the payer, can be marked resolved', () => {
    const w = new World()
    w.list('L1')
    w.booking('B1', 'L1', 'Annette Riley')
    w.exception('BX1', 'B1', { code: PAYER_NO_ADDRESS_CODE, message: 'No address' })
    const b = bookingOf(w.statuses(), 'B1')
    expect(b.problem).toEqual({
      kind: 'billingException',
      code: PAYER_NO_ADDRESS_CODE,
      reason: PAYER_NO_ADDRESS_REASON,
      fix: 'fixPayer',
      canMarkResolved: true,
      exceptionId: 'BX1',
    })
    expect(b.bucket).toBe('problems')
  })

  it('problemAdvice: each code to its reason and fix', () => {
    expect(problemAdvice(PAYER_NO_ADDRESS_CODE, 'x')).toEqual({ reason: PAYER_NO_ADDRESS_REASON, fix: 'fixPayer' })
    expect(problemAdvice('noCounterparty', 'No one to bill')).toEqual({ reason: 'No one to bill', fix: 'fixPayer' })
    expect(problemAdvice('runError', 'The run failed')).toEqual({ reason: 'The run failed', fix: 'retry' })
    expect(problemAdvice('deliveryFailed', 'The email bounced')).toEqual({ reason: 'The email bounced', fix: 'retry' })
    expect(problemAdvice('lockMissing', 'No lock')).toEqual({ reason: 'No lock', fix: 'retry' })
    expect(problemAdvice('somethingNew', 'Something new')).toEqual({ reason: 'Something new', fix: 'retry' })
  })

  it('a failure resolved by hand counts as Done, with who and why', () => {
    const w = new World()
    w.list('L1')
    w.booking('B1', 'L1', 'Annette Riley')
    w.exception('BX1', 'B1', { resolvedAtISO: '2026-11-24T11:00:00', resolvedBy: 'Greg', resolvedNote: 'Billed outside the system' })
    const statuses = w.statuses()
    const b = bookingOf(statuses, 'B1')
    expect(b.bucket).toBe('done')
    expect(b.problems).toEqual([])
    expect(b.resolvedByHand).toEqual({ exceptionId: 'BX1', by: 'Greg', note: 'Billed outside the system', atISO: '2026-11-24T11:00:00' })
    expect(listOf(statuses, 'L1').bucket).toBe('done')
    expect(listOf(statuses, 'L1').status).toBe('Complete')
  })

  it('a failure resolved by a retry that billed reads as billed through its pairs, not resolved by hand', () => {
    const w = new World()
    w.list('L1')
    w.booking('B1', 'L1', 'Annette Riley')
    const pair = w.billed('B1')
    w.exception('BX1', 'B1', { resolvedAtISO: '2026-11-24T11:00:00', resolvedPairIds: [pair.id] })
    const b = bookingOf(w.statuses(), 'B1')
    expect(b.resolvedByHand).toBeUndefined()
    expect(b.stage).toBe('disbursed')
    expect(b.bucket).toBe('done')
  })
})

describe('Stuck at Xero shows twice (US-13.3.2; D109)', () => {
  function stuck(): { w: World; pair: BookingLedgerPair } {
    const w = new World()
    w.list('L1')
    w.booking('B1', 'L1', 'Annette Riley')
    const pair = w.billed('B1', { inXero: false, received: 0, disbursed: 0 })
    w.booking('B2', 'L1', 'Bob Brown')
    w.billed('B2')
    w.queue('XQ0001', { target: { pairId: pair.id } })
    return { w, pair }
  }

  it('a List whose only issue is a Booking waiting for Xero has a problem; the Booking reads waiting for Xero with retry now', () => {
    const statuses = stuck().w.statuses()
    const list = listOf(statuses, 'L1')
    expect(list.hasProblem).toBe(true)
    expect(list.status).toBe('Needs attention')
    const b = bookingOf(statuses, 'B1')
    expect(b.stage).toBe('waitingForXero')
    expect(b.steps.inXero).toBe('waiting')
    expect(b.problem).toEqual({
      kind: 'waitingForXero',
      reason: 'Attempt 1 · the Xero sync queue tries again at 08:02',
      fix: 'retryNow',
      canMarkResolved: false,
      queueItemId: 'XQ0001',
    })
    expect(problemListCount(statuses)).toBe(1)
  })

  it('xeroItemsOnLists ties it under its List; an item on a List not authorised and a poll are unattached', () => {
    const { w } = stuck()
    w.list('L2', { state: 'SUBMITTED', unbilled: true })
    w.booking('B9', 'L2', 'Carol Clark')
    const other = w.billed('B9', { inXero: false })
    w.queue('XQ0002', { target: { pairId: other.id } })
    w.queue('XQ0003', { kind: 'poll', target: {} })
    w.queue('XQ0004', { target: { pairId: 'PR-B2' }, status: 'sent' })
    const { byList, unattached } = xeroItemsOnLists(w.input())
    expect(byList.get('L1')).toEqual([{ kind: 'queue', id: 'XQ0001', itemKind: 'handoff', alerted: false, pairId: 'PR-B1', bookingId: 'B1', listId: 'L1' }])
    expect([...byList.keys()]).toEqual(['L1'])
    expect(unattached.map((i) => i.id)).toEqual(['XQ0002', 'XQ0003'])
    expect(unattached[0]).toMatchObject({ pairId: 'PR-B9', bookingId: 'B9' })
    expect(unattached[0]!.listId).toBeUndefined()
  })

  it('an alerted item reads as a Xero alert, its reason ending alert raised, and flags the in Xero step', () => {
    const { w } = stuck()
    w.xeroQueue.XQ0001 = { ...w.xeroQueue.XQ0001!, status: 'alerted', attempts: 5, nextAttemptAtISO: '2026-11-24T09:30:00' }
    const b = bookingOf(w.statuses(), 'B1')
    expect(b.problem?.kind).toBe('xeroAlert')
    expect(b.problem?.reason).toBe('Attempt 5 · the Xero sync queue tries again at 09:30 · alert raised')
    expect(b.steps.inXero).toBe('flagged')
    expect(xeroItemsOnLists(w.input()).byList.get('L1')![0]!.alerted).toBe(true)
  })

  it('a transfer journal waiting for Xero ties through its prepayment pair', () => {
    const w = new World()
    w.list('L1')
    w.booking('B1', 'L1', 'Annette Riley')
    const pre = w.billed('B1', { kind: 'prePayment', n: 'P1' })
    w.transfers.T1 = {
      id: 'T1',
      kind: 'prepayTransfer',
      collectPairId: pre.id,
      invoiceId: pre.invoiceId,
      bookingId: 'B1',
      listId: 'L1',
      patientId: pre.patientId,
      createdAtISO: AT,
      out: { amount: 1240 },
      in: { number: 'T1', payee: { kind: 'anaesthetist', anaesthetistId: SOUTER }, amount: 1240, releasedAmount: 1240, disbursedAmount: 1240, issuedAtISO: AT },
    }
    w.queue('XQ0001', { kind: 'journal', target: { transferId: 'T1' } })
    const b = bookingOf(w.statuses(), 'B1')
    expect(b.problem).toMatchObject({ kind: 'waitingForXero', queueItemId: 'XQ0001' })
    expect(xeroItemsOnLists(w.input()).byList.get('L1')).toHaveLength(1)
  })
})

describe('divergences (US-13.3.2)', () => {
  it('amended in Xero: the reason gives both totals, fix resolve', () => {
    const w = new World()
    w.list('L1')
    w.booking('B1', 'L1', 'Annette Riley')
    const pair = w.billed('B1', { received: 0, disbursed: 0 })
    w.divergence('XD0001', pair, 'amendedInXero', 1180)
    const statuses = w.statuses()
    const b = bookingOf(statuses, 'B1')
    expect(b.problem).toEqual({
      kind: 'amendedInXero',
      reason: 'Changed directly in Xero: Xero shows $1,180.00, the engine holds $1,240.00',
      fix: 'resolve',
      canMarkResolved: false,
      divergenceId: 'XD0001',
    })
    expect(b.steps.inXero).toBe('flagged')
    expect(listOf(statuses, 'L1').status).toBe('Needs attention')
    expect(xeroItemsOnLists(w.input()).byList.get('L1')).toEqual([
      { kind: 'divergence', id: 'XD0001', itemKind: 'amendedInXero', alerted: false, pairId: 'PR-B1', bookingId: 'B1', listId: 'L1' },
    ])
  })

  it('voided in Xero sets the List status to Voided in Xero', () => {
    const w = new World()
    w.list('L1')
    w.booking('B1', 'L1', 'Annette Riley')
    const pair = w.billed('B1', { received: 0, disbursed: 0 })
    w.divergence('XD0001', pair, 'voidedInXero', 0)
    const statuses = w.statuses()
    expect(listOf(statuses, 'L1').status).toBe('Voided in Xero')
    expect(bookingOf(statuses, 'B1').problem?.reason).toBe('Voided directly in Xero: the engine holds $1,240.00')
  })

  it('problems on one Booking come in kind order', () => {
    const w = new World()
    w.list('L1')
    w.booking('B1', 'L1', 'Annette Riley')
    const pair = w.billed('B1', { inXero: false, received: 0, disbursed: 0 })
    w.divergence('XD0001', pair, 'paidAfterCredit', 50)
    w.queue('XQ0002', { target: { pairId: pair.id } })
    w.queue('XQ0001', { target: { pairId: pair.id }, status: 'alerted' })
    w.exception('BX1', 'B1')
    expect(bookingOf(w.statuses(), 'B1').problems.map((p) => p.kind)).toEqual(['billingException', 'xeroAlert', 'waitingForXero', 'paidAfterCredit'])
  })
})

describe('filters, groups and search (US-13.3.1)', () => {
  /** Souter: L1 complete, L2 in progress. Ropata: L3 complete. */
  function twoAnaesthetists(): World {
    const w = new World()
    w.list('L1', { anaesthetistId: SOUTER, dateISO: '2026-11-20' })
    w.booking('B1', 'L1', 'Annette Riley')
    w.billed('B1')
    w.list('L2', { anaesthetistId: SOUTER, dateISO: '2026-11-21' })
    w.booking('B2', 'L2', 'Bob Brown')
    w.billed('B2', { received: 0, disbursed: 0 })
    w.list('L3', { anaesthetistId: ROPATA, hospitalId: 'H2' })
    w.booking('B3', 'L3', 'Carol Clark')
    w.billed('B3')
    return w
  }

  it('Done for one anaesthetist shows only that anaesthetist\'s complete Lists', () => {
    const groups = billingGroups(twoAnaesthetists().statuses(), { bucket: 'done', anaesthetistId: SOUTER })
    expect(groups.map((g) => g.anaesthetistId)).toEqual([SOUTER])
    expect(groups[0]!.lists.map((v) => v.list.listId)).toEqual(['L1'])
    expect(groups[0]!.listCount).toBe(1)
  })

  it('In progress holds the List still being paid', () => {
    const groups = billingGroups(twoAnaesthetists().statuses(), { bucket: 'inProgress' })
    expect(groups.flatMap((g) => g.lists.map((v) => v.list.listId))).toEqual(['L2'])
    expect(listOf(twoAnaesthetists().statuses(), 'L2').status).toBe('Complete')
  })

  it('groups sort by surname, titles ignored; Lists within a group newest first', () => {
    const w = twoAnaesthetists()
    w.list('L4', { anaesthetistId: ZED })
    w.booking('B4', 'L4', 'Dan Doe')
    w.billed('B4')
    const groups = billingGroups(w.statuses(), { bucket: 'all' })
    expect(groups.map((g) => g.anaesthetistName)).toEqual(['Dr Hannah Ropata', 'Dr Melanie Souter', 'Dr A Zed'])
    expect(groups[1]!.lists.map((v) => v.list.listId)).toEqual(['L2', 'L1'])
  })

  it('search by patient and by invoice number narrows to the matching Bookings; a hospital search keeps the whole List', () => {
    const w = twoAnaesthetists()
    w.booking('B5', 'L3', 'Eve Evans')
    w.billed('B5')
    const statuses = w.statuses()
    const byPatient = billingGroups(statuses, { bucket: 'all', q: '  RILEY ' })
    expect(byPatient.flatMap((g) => g.lists.flatMap((v) => v.bookings.map((b) => b.bookingId)))).toEqual(['B1'])
    const byNumber = billingGroups(statuses, { bucket: 'all', q: 'aa-2026-b5' })
    const view = byNumber[0]!.lists[0]!
    expect(view.bookings.map((b) => b.bookingId)).toEqual(['B5'])
    expect(view.hiddenCount).toBe(1)
    const byHospital = billingGroups(statuses, { bucket: 'all', q: 'st georges' })
    expect(byHospital.flatMap((g) => g.lists.map((v) => v.list.listId))).toEqual(['L3'])
    expect(byHospital[0]!.lists[0]!.bookings.map((b) => b.bookingId)).toEqual(['B3', 'B5'])
    expect(billingGroups(statuses, { bucket: 'all', q: 'nobody' })).toEqual([])
  })

  it('the four counts and the problem line', () => {
    const w = twoAnaesthetists()
    w.list('L5', { anaesthetistId: ROPATA })
    w.booking('B6', 'L5', 'Fay Ford')
    w.exception('BX1', 'B6')
    w.list('L6', { anaesthetistId: ZED })
    w.booking('B7', 'L6', 'Gus Grey')
    w.exception('BX2', 'B7')
    const statuses = w.statuses()
    const counts = billingCounts(statuses)
    expect(counts).toEqual({ problems: 2, inProgress: 1, done: 2, all: 5, problemAnaesthetists: 2 })
    expect(problemCountLine(counts)).toBe('2 Lists with a problem, 2 anaesthetists')
    expect(problemListCount(statuses)).toBe(2)
    const souter = billingCounts(statuses, { anaesthetistId: SOUTER })
    expect(souter).toEqual({ problems: 0, inProgress: 1, done: 1, all: 2, problemAnaesthetists: 0 })
    const searched = billingCounts(statuses, { q: 'fay' })
    expect(searched).toEqual({ problems: 1, inProgress: 0, done: 0, all: 1, problemAnaesthetists: 1 })
    expect(problemCountLine(searched)).toBe('1 List with a problem, 1 anaesthetist')
  })
})

describe('Booking stages (US-13.3.1)', () => {
  it('a $0 no-charge invoice, paid in, in Xero and delivered, with no payable, is Done', () => {
    const w = new World()
    w.list('L1')
    w.booking('B1', 'L1', 'Annette Riley')
    w.billed('B1', { amount: 0, received: 0, noPayable: true })
    const b = bookingOf(w.statuses(), 'B1')
    expect(b.steps).toEqual({ sent: 'done', inXero: 'done', paidIn: 'done', disbursed: 'done' })
    expect(b.bucket).toBe('done')
    expect(b.sentBy).toBe('email')
  })

  it('a cancelled Booking reads cancelled, sits in Done and is left out of the counts', () => {
    const w = new World()
    w.list('L1')
    w.booking('B1', 'L1', 'Annette Riley', { cancelled: true })
    w.booking('B2', 'L1', 'Bob Brown')
    w.billed('B2')
    const statuses = w.statuses()
    const b = bookingOf(statuses, 'B1')
    expect(b.stage).toBe('cancelled')
    expect(b.bucket).toBe('done')
    expect(b.problems).toEqual([])
    const list = listOf(statuses, 'L1')
    expect(list.counts.of).toBe(1)
    expect(list.bookings).toHaveLength(2)
    expect(list.bucket).toBe('done')
  })

  it('steps follow the pair: not in Xero, handed off, part paid, paid, part paid out', () => {
    const w = new World()
    w.list('L1')
    w.booking('B1', 'L1', 'A One')
    w.billed('B1', { inXero: false, received: 0, disbursed: 0, delivery: { method: 'post', status: 'toPost', address: [], markedAtISO: AT } })
    w.booking('B2', 'L1', 'B Two')
    w.billed('B2', { received: 0, disbursed: 0, delivery: { method: 'email', status: 'noAddress' } })
    w.booking('B3', 'L1', 'C Three')
    w.billed('B3', { received: 1240, disbursed: 600 })
    w.booking('B4', 'L1', 'D Four')
    const statuses = w.statuses()
    expect(bookingOf(statuses, 'B1')).toMatchObject({ stage: 'invoiced', sentBy: 'post', steps: { sent: 'done', inXero: 'notYet', paidIn: 'notYet', disbursed: 'notYet' } })
    expect(bookingOf(statuses, 'B2')).toMatchObject({ stage: 'handedOff', steps: { sent: 'flagged', inXero: 'done' } })
    expect(bookingOf(statuses, 'B3')).toMatchObject({ stage: 'partPaidOut', steps: { paidIn: 'done', disbursed: 'notYet' }, bucket: 'inProgress' })
    expect(bookingOf(statuses, 'B4')).toMatchObject({ stage: 'pending', bucket: 'inProgress', invoiceIds: [] })
    expect(listOf(statuses, 'L1').status).toBe('Billing')
  })

  it('an additional invoice is not the run\'s: only the run invoice counts', () => {
    const w = new World()
    w.list('L1')
    w.booking('B1', 'L1', 'Annette Riley')
    w.billed('B1', { n: '1' })
    w.billed('B1', { n: '2', invoiceKind: 'additional', inXero: false, received: 0, disbursed: 0 })
    const b = bookingOf(w.statuses(), 'B1')
    expect(b.invoiceIds).toEqual(['INV-1'])
    expect(b.bucket).toBe('done')
  })
})

describe('which Lists (US-13.3.1)', () => {
  it('a List not authorised and a backdrop List are left out; billed Lists first, newest run first, then unbilled by id', () => {
    const w = new World()
    w.list('L1', { billedAtISO: '2026-11-20T18:00:00' })
    w.list('L2', { billedAtISO: '2026-11-22T18:00:00' })
    w.list('L10', { unbilled: true })
    w.list('L9', { unbilled: true })
    w.list('L3', { state: 'SUBMITTED', unbilled: true })
    w.list('L-HIST-001')
    expect(w.statuses().map((l) => l.listId)).toEqual(['L2', 'L1', 'L9', 'L10'])
  })

  it('is deterministic: the same input gives the same output', () => {
    const w = failedAndFourBilled()
    w.queue('XQ0001', { target: { pairId: 'PR-B2' } })
    const input = w.input()
    expect(listBillingStatuses(input)).toEqual(listBillingStatuses(input))
    expect(billingGroups(listBillingStatuses(input), { bucket: 'all' })).toEqual(billingGroups(w.statuses(), { bucket: 'all' }))
    expect(xeroItemsOnLists(input)).toEqual(xeroItemsOnLists(w.input()))
  })
})
