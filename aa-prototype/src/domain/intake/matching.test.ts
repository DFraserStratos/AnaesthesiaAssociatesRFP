import { describe, expect, it } from 'vitest'
import type { ImportRow, IncomingBookingFields } from '../types'
import {
  classifyChange,
  diffFields,
  effectiveIncoming,
  findMatch,
  matchingQueue,
  resolveSurgeon,
  searchBookingsForRow,
  sourceTextChannelFor,
  suggestDecision,
  suggestionText,
  type MatchingBooking,
  type MatchingView,
} from './matching'

const STG = 'H-STG'
const SX = 'H-SX'
const HALE = 'S-HALE'

function booking(id: string, over: Partial<MatchingBooking> = {}): MatchingBooking {
  return {
    id,
    listId: 'L-1',
    patient: { name: 'Sarah Mitchell', nhi: 'CQY9304', dobISO: '1988-08-16' },
    scheduledTime: '08:30',
    cancelled: false,
    procedures: [
      {
        id: `P-${id}`,
        isPrimary: true,
        procedureText: { text: 'WLE MM', source: 'surgeonPdf', receivedAtISO: '2026-11-23T09:00:00' },
        invoiceDescription: { text: 'WLE MM', origin: 'rooms' },
        contractInvoiceDescription: null,
      },
    ],
    ...over,
  }
}

function view(over: Partial<MatchingView> = {}): MatchingView {
  return {
    bookings: { B1: booking('B1') },
    lists: {
      'L-1': { id: 'L-1', hospitalId: STG, surgeonId: HALE, dateISO: '2026-12-01', session: 'AM', state: 'ACTIVE', anaesthetistId: '34821', slotId: 'S-1' },
      'L-SX': { id: 'L-SX', hospitalId: SX, surgeonId: HALE, dateISO: '2026-12-01', session: 'AM', state: 'ACTIVE', anaesthetistId: '29104', slotId: 'S-2' },
    },
    openSlots: [{ id: 'S-9', anaesthetistId: '41267', dateISO: '2026-12-10', session: 'PM' }],
    surgeons: { [HALE]: { id: HALE, name: 'Mr T. Hale', hpiId: '40HALT' }, 'S-HALEY': { id: 'S-HALEY', name: 'Ms R. Haley', hpiId: '41HALR' } },
    hospitals: { [STG]: { id: STG, name: "St George's" }, [SX]: { id: SX, name: 'Southern Cross' } },
    anaesthetists: { '34821': { name: 'Dr Melanie Souter' }, '29104': { name: 'Dr James Rutherford' } },
    parties: { 'PY-NIB': { name: 'nib' } },
    rows: [],
    ...over,
  }
}

function fields(over: Partial<IncomingBookingFields> = {}): IncomingBookingFields {
  return {
    hospitalId: STG,
    dateISO: '2026-12-01',
    session: 'AM',
    surgeon: { name: 'Mr T. Hale', hpiId: '40HALT' },
    scheduledTime: '08:30',
    patient: { name: 'Sarah Mitchell', nhi: 'CQY9304', dobISO: '1988-08-16' },
    hospitalStatus: 'booked',
    ...over,
  }
}

function row(id: string, incoming: IncomingBookingFields, over: Partial<ImportRow> = {}): ImportRow {
  return { id, batchId: 'IB0001', channel: 'download', source: 'hospital', receivedAtISO: '2026-11-24T09:00:00', incoming, status: 'open', ...over }
}

describe('the match key: the List, then the patient (US-02.1.3)', () => {
  it('finds the Booking by the List key and the NHI', () => {
    const v = view()
    expect(findMatch(v, fields(), HALE)).toMatchObject({ bookingId: 'B1', basis: 'listAndPatient' })
  })
  it('a row with no NHI finds nothing', () => {
    expect(findMatch(view(), fields({ patient: { name: 'Sarah Mitchell' } }), HALE)).toBeUndefined()
  })
  it('the same patient at another hospital does not match', () => {
    expect(findMatch(view(), fields({ hospitalId: SX }), HALE)).toBeUndefined()
  })
  it('the same patient on another day is a New row, never a move (D62)', () => {
    const a = suggestDecision(view(), row('IR1', fields({ dateISO: '2026-12-02' })))
    expect(a.changeType).toBe('new')
    expect(a.match).toBeUndefined()
  })
  it('the HPI CPN beats a name that differs; an unrecognised surgeon falls back to the patient on that day, flagged', () => {
    const v = view()
    expect(resolveSurgeon(v, { incoming: fields({ surgeon: { name: 'Someone Else', hpiId: '40halt' } }) })).toBe(HALE)
    const a = suggestDecision(v, row('IR1', fields({ surgeon: { name: 'Dr Nobody' }, scheduledTime: '09:00' })))
    expect(a.match).toMatchObject({ bookingId: 'B1', basis: 'patientOnDay' })
    expect(a.flags.map((f) => f.code)).toContain('surgeonNotRecognised')
  })
})

describe('differences and change types (FT-02.5)', () => {
  it('a time change on the same List is a Modification; a field not supplied is never a diff', () => {
    const v = view()
    const a = suggestDecision(v, row('IR1', fields({ scheduledTime: '09:15', patient: { name: 'Sarah Mitchell', nhi: 'CQY9304' } })))
    expect(a.changeType).toBe('modification')
    expect(a.diffs.map((d) => d.key)).toEqual(['time'])
  })
  it('identical text is no diff; different text replaces, whatever the rooms held, kept verbatim', () => {
    const v = view()
    expect(diffFields(v, v.bookings.B1!, row('IR1', fields({ procedure: { text: 'WLE MM' } }))).diffs).toEqual([])
    const text = '  lap appy ?conv to open +/- drain'
    const d = diffFields(v, v.bookings.B1!, row('IR1', fields({ procedure: { text, code: '1661' } }))).diffs
    expect(d).toEqual([expect.objectContaining({ key: 'procedureText', effect: 'replaces', incoming: text, current: 'WLE MM', invoiceEffect: 'replaces' })])
  })
  it("the invoice effect reads the Procedure's origin: the Contract's description and an admin's edit stay", () => {
    const withContract = booking('B1', { procedures: [{ ...booking('B1').procedures[0]!, contractInvoiceDescription: 'Excision, melanoma' }] })
    const edited = booking('B1', { procedures: [{ ...booking('B1').procedures[0]!, invoiceDescription: { text: 'My words', origin: 'edited' } }] })
    const r = row('IR1', fields({ procedure: { text: 'WLE MM, left shoulder' } }))
    expect(diffFields(view(), withContract, r).diffs[0]?.invoiceEffect).toBe('keptContract')
    expect(diffFields(view(), edited, r).diffs[0]?.invoiceEffect).toBe('keptEdit')
  })
  it('a code is never a diff; an insurer without a Party is a note, with a Party a diff, never a flag', () => {
    const v = view()
    const noParty = diffFields(v, v.bookings.B1!, row('IR1', fields({ procedure: { code: 'A3' }, insurer: { text: 'Some insurer', approvalNumber: '9' } })))
    expect(noParty.diffs).toEqual([])
    expect(noParty.insurerNote).toEqual({ text: 'Some insurer', approvalNumber: '9' })
    const withParty = suggestDecision(v, row('IR1', fields({ insurer: { text: 'nib', insurerPartyId: 'PY-NIB', approvalNumber: '123' } })))
    expect(withParty.diffs).toEqual([expect.objectContaining({ key: 'insurer', incoming: 'nib · Approval 123' })])
    expect(withParty.flags).toEqual([])
  })
  it('a note is appended once; classifyChange covers the four types', () => {
    const v = view()
    expect(diffFields(v, v.bookings.B1!, row('IR1', fields({ note: 'Bumped' }))).diffs[0]).toMatchObject({ key: 'note', effect: 'appends' })
    const noted = booking('B1', { notes: "St George's, 24 Nov: Bumped" })
    expect(diffFields(v, noted, row('IR1', fields({ note: 'Bumped' }))).diffs).toEqual([])
    expect(classifyChange(undefined, fields(), [])).toBe('new')
    expect(classifyChange({ cancelled: false }, fields({ hospitalStatus: 'cancelled' }), [])).toBe('cancellation')
    expect(classifyChange({ cancelled: false }, fields(), [])).toBe('noChange')
  })
})

describe('suggestions and the unmatched queue (US-02.1.2, US-02.1.4)', () => {
  it('a row with no NHI waits, offers nothing and exposes its target List (D11, D66)', () => {
    const a = suggestDecision(view(), row('IR1', fields({ patient: { name: 'Tama Henare' } })))
    expect(a).toMatchObject({ waitingForNhi: true, queue: 'unmatched', targetListId: 'L-1', unmatchedReason: 'No NHI. Add the NHI to continue.' })
    expect(a.suggestion).toBeUndefined()
    expect(a.flags.find((f) => f.code === 'noNhi')?.blocks).toBe('allButReject')
    const none = suggestDecision(view(), row('IR1', fields({ dateISO: '2026-12-10', patient: { name: 'Tama Henare' } })))
    expect(none.targetListId).toBeUndefined()
  })
  it('a valid NHI added by a correction makes it a ready New row; corrections never touch the wording', () => {
    const r = row('IR1', fields({ patient: { name: 'Tama Henare' }, procedure: { text: 'T&A' } }), { corrections: { nhi: 'ZQA1008' } })
    expect(effectiveIncoming(r).procedure?.text).toBe('T&A')
    const a = suggestDecision(view(), r)
    expect(a).toMatchObject({ changeType: 'new', queue: 'ready', suggestion: { kind: 'createBooking', listId: 'L-1' } })
  })
  it('a New row onto a Draft List when no assigned List has the key', () => {
    const v = view({
      lists: { 'LD-1': { id: 'LD-1', hospitalId: STG, surgeonId: HALE, dateISO: '2026-12-01', session: 'AM', state: 'DRAFT' } },
      bookings: {},
    })
    expect(suggestDecision(v, row('IR1', fields({ procedure: { text: 'x' } }))).suggestion).toEqual({ kind: 'createBooking', listId: 'LD-1' })
  })
  it('a session with no List is unmatched with the reason; a cancellation with no Booking is unmatched', () => {
    const a = suggestDecision(view(), row('IR1', fields({ dateISO: '2026-12-10', session: 'PM', procedure: { text: 'lap chole' } })))
    expect(a.queue).toBe('unmatched')
    expect(a.unmatchedReason).toBe("No List at St George's for Mr Hale on Thu 10 Dec PM")
    expect(suggestionText(view(), a)).toBe("Unmatched: no List at St George's for Mr Hale on Thu 10 Dec PM")
    const c = suggestDecision(view(), row('IR2', fields({ patient: { name: 'X', nhi: 'ZQA1008' }, hospitalStatus: 'cancelled' })))
    expect(c.queue).toBe('unmatched')
    expect(c.unmatchedReason).toMatch(/^No Booking for this patient on Mr Hale's List at St George's/)
  })
  it('flags: authorised, cancelled, invalid NHI, no wording, an earlier open row; none for a SUBMITTED List', () => {
    const authorised = view({ lists: { 'L-1': { ...view().lists['L-1']!, state: 'AUTHORISED' } } })
    expect(suggestDecision(authorised, row('IR1', fields({ scheduledTime: '10:00' }))).flags.map((f) => f.code)).toContain('listAuthorised')
    const submitted = view({ lists: { 'L-1': { ...view().lists['L-1']!, state: 'SUBMITTED' } } })
    expect(suggestDecision(submitted, row('IR1', fields({ scheduledTime: '10:00' }))).flags).toEqual([])
    const cancelled = view({ bookings: { B1: booking('B1', { cancelled: true }) } })
    const ca = suggestDecision(cancelled, row('IR1', fields({ scheduledTime: '10:00' })))
    expect(ca.flags.map((f) => f.code)).toContain('bookingCancelled')
    expect(ca.suggestion?.kind).toBe('reject')
    expect(suggestDecision(view(), row('IR1', fields({ patient: { name: 'X', nhi: 'ZQA1009' } }))).flags.map((f) => f.code)).toContain('nhiInvalid')
    expect(suggestDecision(view(), row('IR1', fields({ patient: { name: 'X', nhi: 'ZQA1008' } }))).flags.map((f) => f.code)).toContain('noWording')
    const first = row('IR1', fields({ patient: { name: 'X', nhi: 'ZQA1008' }, procedure: { text: 'a' } }))
    const second = row('IR2', fields({ patient: { name: 'X', nhi: 'ZQA1008' }, procedure: { text: 'b' } }))
    expect(suggestDecision(view({ rows: [first, second] }), second).flags).toContainEqual(expect.objectContaining({ code: 'earlierRowOpen', otherRowId: 'IR1' }))
  })
  it('a later row for a Booking an earlier decision created matches it as a Modification, never applied by itself', () => {
    const a = suggestDecision(view(), row('IR9', fields({ scheduledTime: '09:00', procedure: { text: 'Laparoscopic appendicectomy, may convert to open' } })))
    expect(a.changeType).toBe('modification')
    expect(a.suggestion).toEqual({ kind: 'match', bookingId: 'B1', changeType: 'modification', fieldsApplied: ['time', 'procedureText'] })
  })
  it('no suggestion ever carries a Contract or an RVG code; the result is deterministic', () => {
    const rows = [row('IR1', fields({ procedure: { text: 'x' }, scheduledTime: '10:00' })), row('IR2', fields({ dateISO: '2026-12-02', procedure: { text: 'y' } }))]
    const once = matchingQueue(view({ rows }), rows)
    expect(JSON.stringify(once)).not.toMatch(/contract|rvgGroup/i)
    expect(matchingQueue(view({ rows }), rows)).toEqual(once)
    expect(once.counts).toMatchObject({ open: 2, new: 1, modification: 1 })
  })
  it('the office searches by name or NHI on that hospital and date', () => {
    expect(searchBookingsForRow(view(), fields(), 'mitch').map((b) => b.id)).toEqual(['B1'])
    expect(searchBookingsForRow(view(), fields({ hospitalId: SX }), '')).toEqual([])
  })
  it("each channel's text source", () => {
    expect([sourceTextChannelFor('download'), sourceTextChannelFor('feedMessage'), sourceTextChannelFor('manualSheet')]).toEqual(['hospitalDownload', 'hospitalFeed', 'hospitalSheet'])
  })
})
