import { describe, expect, it } from 'vitest'
import type { AuditEntry, EmailTemplate } from './types'
import {
  EMAIL_PLACEHOLDERS,
  MAILTO_MAX_LENGTH,
  NOTHING_LEFT_TO_EMAIL_REASON,
  NOTHING_TO_EMAIL_REASON,
  NO_COVER_TO_REPORT_REASON,
  RETURNED_TO_OFFICE_REASON,
  nothingToReportReason,
  buildUpdateEmail,
  cancelledOutNote,
  defaultKindFor,
  defaultTemplateFor,
  emailLineText,
  netPicked,
  pickableChanges,
  renderTemplate,
  updateEmailContext,
  validateTemplate,
  type EmailLine,
  type PickLookups,
  type PickableChange,
  type UpdateEmailContext,
} from './updateEmail'
import { SEED_EMAIL_TEMPLATES } from './seed/emailTemplates'

// ---------------------------------------------------------------------------
// Fixtures: one Booking on Dr Rutherford's List, its List reassigned twice.
// ---------------------------------------------------------------------------

const LOOKUPS: PickLookups = {
  bookings: { BK1: { id: 'BK1', listId: 'L1', patientId: 'PT1' }, BK2: { id: 'BK2', listId: 'L1', patientId: 'PT2' } },
  procedures: {
    P1: { id: 'P1', bookingId: 'BK1', isPrimary: true, rvgGroupId: 'RG1' },
    P2: { id: 'P2', bookingId: 'BK1', isPrimary: false },
  },
  lists: {
    L1: { id: 'L1', dateISO: '2026-11-24', session: 'AM', hospitalId: 'H1', surgeonId: 'S1', anaesthetistId: 'A3' },
    L2: { id: 'L2', dateISO: '2026-11-25', session: 'PM', hospitalId: 'H2', surgeonId: 'S1', anaesthetistId: 'A2' },
  },
  rvgGroups: { RG1: { description: 'Knee arthroscopy' }, RG2: { description: 'Total knee replacement' } },
  anaesthetists: { A1: { name: 'Dr James Rutherford' }, A2: { name: 'Dr Priya Sharma' }, A3: { name: 'Dr Melanie Souter' } },
  hospitals: { H1: { name: "St George's" }, H2: { name: 'Forte Health' } },
  surgeons: { S1: { name: 'Mr T. Hale' } },
}

let n = 0
function entry(partial: Partial<AuditEntry> & Pick<AuditEntry, 'entityType' | 'entityId' | 'action'>): AuditEntry {
  n += 1
  return { id: `A${String(n).padStart(4, '0')}`, who: 'Kirsty W.', role: 'office', source: 'office', atISO: `2026-11-24T09:${String(n).padStart(2, '0')}:00`, ...partial }
}

/** A save change set: its entries, then the `booking.save` header last. */
function save(cs: string, bookingId: string, entries: Omit<AuditEntry, 'id' | 'who' | 'role' | 'source' | 'atISO'>[]): AuditEntry[] {
  const at = `2026-11-24T10:${String((n += 1)).padStart(2, '0')}:00`
  const out = entries.map((e, i) => ({ ...entry({ ...e }), atISO: at, changeSetId: cs, ...(i === 0 ? { changeSetKind: 'save' as const } : {}) }))
  out.push({ ...entry({ entityType: 'booking', entityId: bookingId, action: 'booking.save', after: { kind: 'save', fields: [] } }), atISO: at, changeSetId: cs })
  return out
}

function byKey(rows: PickableChange[], key: string): PickableChange {
  const row = rows.find((r) => r.key === key)
  if (row === undefined) throw new Error(`no row ${key}`)
  return row
}

const CONTEXT: UpdateEmailContext = { patient: 'Aroha Ngata', date: 'Tue 24 Nov', session: 'AM', hospital: "St George's", surgeon: 'Mr T. Hale', anaesthetist: 'Dr Melanie Souter', previousAnaesthetist: '', bookingCount: 4 }
const TEMPLATE = SEED_EMAIL_TEMPLATES.find((t) => t.kind === 'bookingChange')!

describe('pickableChanges', () => {
  it('lists a save as one row, newest first, with only allowlisted lines', () => {
    n = 0
    const audit = [
      ...save('CS0001', 'BK1', [
        { entityType: 'booking', entityId: 'BK1', action: 'booking.update', before: { scheduledTime: '09:00', notes: 'old' }, after: { scheduledTime: '09:30', notes: 'Internal note' } },
        { entityType: 'procedure', entityId: 'P1', action: 'procedure.contract', before: { bookingId: 'BK1', governingContractId: 'CT-A' }, after: { bookingId: 'BK1', governingContractId: 'CT-B' } },
        { entityType: 'procedure', entityId: 'P1', action: 'procedure.payer', before: { bookingId: 'BK1', payer: { kind: 'patient' } }, after: { bookingId: 'BK1', payer: { kind: 'party', partyId: 'PY-NIB' } } },
        { entityType: 'procedure', entityId: 'P1', action: 'procedure.price', before: { bookingId: 'BK1', enteredPrice: undefined }, after: { bookingId: 'BK1', enteredPrice: 1200 } },
        { entityType: 'procedure', entityId: 'P1', action: 'procedure.invoiceDescription.set', before: { bookingId: 'BK1', invoiceDescription: 'Knee' }, after: { bookingId: 'BK1', invoiceDescription: 'Knee scope' } },
        { entityType: 'procedure', entityId: 'P1', action: 'procedure.procedureText.replace', before: { bookingId: 'BK1', procedureText: 'knee scope' }, after: { bookingId: 'BK1', procedureText: 'L knee scope' } },
        { entityType: 'patient', entityId: 'PT1', action: 'patient.update', before: { nhi: 'ZZZ0016', dobISO: '1970-05-07' }, after: { nhi: 'ZZZ0024', dobISO: '1971-05-07' } },
      ]),
      ...save('CS0002', 'BK1', [
        { entityType: 'procedure', entityId: 'P1', action: 'procedure.contract', before: { bookingId: 'BK1', governingContractId: 'CT-B' }, after: { bookingId: 'BK1', governingContractId: 'CT-C' } },
      ]),
    ]
    const rows = pickableChanges(audit, { kind: 'booking', bookingId: 'BK1' }, LOOKUPS)
    expect(rows.map((r) => r.key)).toEqual(['cs:CS0002', 'cs:CS0001'])
    const first = byKey(rows, 'cs:CS0001')
    expect(first).toMatchObject({ kind: 'save', who: 'Kirsty W.', role: 'office', emailable: true })
    expect(first.lines.map(emailLineText)).toEqual(['- Time: was 09:00, now 09:30'])
    // A save that changed only the Contract has nothing to email.
    expect(byKey(rows, 'cs:CS0002')).toMatchObject({ emailable: false, reason: NOTHING_TO_EMAIL_REASON, lines: [] })
  })

  it('names a Procedure by its RVG group, else "Procedure n", never its text', () => {
    n = 0
    const audit = save('CS0001', 'BK1', [
      { entityType: 'procedure', entityId: 'P1', action: 'procedure.update', before: { bookingId: 'BK1', rvgGroupId: 'RG1' }, after: { bookingId: 'BK1', rvgGroupId: 'RG2' } },
      { entityType: 'procedure', entityId: 'P3', action: 'procedure.create', after: { id: 'P3', bookingId: 'BK1', procedureText: { text: 'bilat TKJR' }, isPrimary: false } },
      { entityType: 'procedure', entityId: 'P2', action: 'procedure.remove', before: { id: 'P2', bookingId: 'BK1', isPrimary: false, rvgGroupId: 'RG2' } },
    ])
    const [row] = pickableChanges(audit, { kind: 'booking', bookingId: 'BK1' }, LOOKUPS)
    const text = row!.lines.map(emailLineText)
    expect(text).toEqual([
      '- Procedure: was Knee arthroscopy, now Total knee replacement',
      '- Procedure added: Procedure 3',
      '- Procedure removed: Total knee replacement',
    ])
    expect(text.join(' ')).not.toContain('TKJR')
  })

  it('coalesces ungrouped edits by one person in one minute into one edit row', () => {
    n = 0
    const at = '2026-11-24T11:00:00'
    const audit = [
      { ...entry({ entityType: 'booking', entityId: 'BK1', action: 'booking.update', before: { scheduledTime: '09:00' }, after: { scheduledTime: '09:15' } }), who: 'Dr Melanie Souter', role: 'anaesthetist' as const, source: 'anaesthetist' as const, atISO: at },
      { ...entry({ entityType: 'booking', entityId: 'BK1', action: 'booking.update', before: { scheduledTime: '09:15' }, after: { scheduledTime: '09:45' } }), who: 'Dr Melanie Souter', role: 'anaesthetist' as const, source: 'anaesthetist' as const, atISO: at },
      entry({ entityType: 'booking', entityId: 'BK1', action: 'booking.update', before: { notes: 'a' }, after: { notes: 'b' } }),
    ]
    const rows = pickableChanges(audit, { kind: 'booking', bookingId: 'BK1' }, LOOKUPS)
    expect(rows).toHaveLength(2)
    const edit = rows.find((r) => r.who === 'Dr Melanie Souter')!
    expect(edit).toMatchObject({ kind: 'edit', key: `a:${audit[0]!.id}`, emailable: true })
    expect(edit.lines.map(emailLineText)).toEqual(['- Time: was 09:00, now 09:45'])
    expect(rows.find((r) => r.who === 'Kirsty W.')).toMatchObject({ emailable: false })
  })

  it("includes the List's owner changes while the Booking was on it, not before it was made", () => {
    n = 0
    const audit = [
      entry({ entityType: 'list', entityId: 'L1', action: 'list.reassign', before: { anaesthetistId: 'A3' }, after: { anaesthetistId: 'A1' }, stampBookingId: null } as Partial<AuditEntry> & Pick<AuditEntry, 'entityType' | 'entityId' | 'action'>),
      entry({ entityType: 'booking', entityId: 'BK1', action: 'booking.create', after: { listId: 'L1', scheduledTime: '08:30' } }),
      entry({ entityType: 'list', entityId: 'L1', action: 'list.reassign', before: { slotId: 'S-a', anaesthetistId: 'A1' }, after: { slotId: 'S-b', anaesthetistId: 'A2' } }),
      entry({ entityType: 'list', entityId: 'L2', action: 'list.reassign', before: { anaesthetistId: 'A2' }, after: { anaesthetistId: 'A3' } }),
    ]
    const rows = pickableChanges(audit, { kind: 'booking', bookingId: 'BK1' }, LOOKUPS)
    expect(rows.map((r) => r.kind)).toEqual(['cover', 'create'])
    expect(rows[0]!.lines.map(emailLineText)).toEqual(['- Anaesthetist: was Dr James Rutherford, now Dr Priya Sharma'])
  })

  it('a cover row picked from a Booking and from its List gives the same anaesthetist line', () => {
    n = 0
    const audit = [
      entry({ entityType: 'booking', entityId: 'BK1', action: 'booking.create', after: { listId: 'L1' } }),
      entry({ entityType: 'list', entityId: 'L1', action: 'list.reassign', before: { anaesthetistId: 'A1' }, after: { anaesthetistId: 'A2' } }),
    ]
    const fromBooking = pickableChanges(audit, { kind: 'booking', bookingId: 'BK1' }, LOOKUPS).filter((r) => r.kind === 'cover')
    const fromList = pickableChanges(audit, { kind: 'list', listId: 'L1' }, LOOKUPS)
    expect(fromList).toHaveLength(1)
    expect(netPicked(fromBooking).lines).toEqual(netPicked(fromList).lines)
    expect(defaultKindFor(fromList)).toBe('anaesthetistChange')
  })

  it('two covers back to the first anaesthetist cancel out: nothing to report, never an empty name', () => {
    n = 0
    const audit = [
      entry({ entityType: 'list', entityId: 'L1', action: 'list.reassign', before: { anaesthetistId: 'A1' }, after: { anaesthetistId: 'A2' } }),
      entry({ entityType: 'list', entityId: 'L1', action: 'list.reassign', before: { anaesthetistId: 'A2' }, after: { anaesthetistId: 'A1' } }),
    ]
    const rows = pickableChanges(audit, { kind: 'list', listId: 'L1' }, LOOKUPS)
    const net = netPicked(rows)
    expect(net.lines).toEqual([])
    const cover = SEED_EMAIL_TEMPLATES.find((t) => t.kind === 'anaesthetistChange')!
    expect(nothingToReportReason(cover, net.lines)).toBe(NOTHING_LEFT_TO_EMAIL_REASON)
    // A time change picked as well: the cover template would print an empty "previous" name, so it is refused.
    const time: EmailLine = { key: 'time', label: 'Time', before: '09:00', after: '09:30' }
    expect(nothingToReportReason(cover, [time])).toBe(NO_COVER_TO_REPORT_REASON)
    expect(nothingToReportReason(SEED_EMAIL_TEMPLATES.find((t) => t.kind === 'bookingChange')!, [time])).toBeNull()
  })

  it('a double reassignment picked together gives one line, first to last', () => {
    n = 0
    const audit = [
      entry({ entityType: 'list', entityId: 'L1', action: 'list.reassign', before: { anaesthetistId: 'A1' }, after: { anaesthetistId: 'A2' } }),
      entry({ entityType: 'list', entityId: 'L1', action: 'list.ownerMove', before: { anaesthetistId: 'A2', state: 'ACTIVE' }, after: { anaesthetistId: 'A3', route: 'colleague' } }),
    ]
    const rows = pickableChanges(audit, { kind: 'list', listId: 'L1' }, LOOKUPS)
    expect(rows).toHaveLength(2)
    const { lines } = netPicked(rows)
    expect(lines.map(emailLineText)).toEqual(['- Anaesthetist: was Dr James Rutherford, now Dr Melanie Souter'])
  })

  it('a return to the office alone is not emailable; with the later assignment it nets to one line', () => {
    n = 0
    const audit = [
      entry({ entityType: 'list', entityId: 'L1', action: 'draftList.detach', before: { state: 'ACTIVE', anaesthetistId: 'A1', slotId: 'S-a' }, after: { state: 'DRAFT', anaesthetistId: null, slotId: null, origin: 'movedToOffice' } }),
      entry({ entityType: 'list', entityId: 'L1', action: 'draftList.assign', before: { state: 'DRAFT', anaesthetistId: null, slotId: null }, after: { state: 'ACTIVE', anaesthetistId: 'A2', slotId: 'S-b' } }),
    ]
    const rows = pickableChanges(audit, { kind: 'list', listId: 'L1' }, LOOKUPS)
    const [assign, back] = rows
    expect(back).toMatchObject({ kind: 'cover', emailable: false, reason: RETURNED_TO_OFFICE_REASON })
    expect(assign).toMatchObject({ kind: 'cover', emailable: true })
    const both = netPicked(rows).lines.map(emailLineText)
    const alone = netPicked([assign!]).lines.map(emailLineText)
    expect(both).toEqual(['- Anaesthetist: was Dr James Rutherford, now Dr Priya Sharma'])
    expect(alone).toEqual(both)
  })

  it("an anaesthetist's own move back to the office (list.ownerMove, route office) is not emailable", () => {
    n = 0
    const audit = [entry({ entityType: 'list', entityId: 'L1', action: 'list.ownerMove', before: { anaesthetistId: 'A1', state: 'ACTIVE' }, after: { slotId: null, anaesthetistId: null, state: 'DRAFT', route: 'office' } })]
    expect(pickableChanges(audit, { kind: 'list', listId: 'L1' }, LOOKUPS)).toMatchObject([{ emailable: false, reason: RETURNED_TO_OFFICE_REASON }])
  })

  it('a move to another List gives the List, anaesthetist and hospital lines', () => {
    n = 0
    const audit = [entry({ entityType: 'booking', entityId: 'BK1', action: 'booking.reassign', before: { listId: 'L1' }, after: { listId: 'L2' } })]
    const rows = pickableChanges(audit, { kind: 'booking', bookingId: 'BK1' }, LOOKUPS)
    expect(rows[0]!.kind).toBe('move')
    expect(rows[0]!.lines.map(emailLineText)).toEqual([
      '- List: was Tue 24 Nov AM, now Wed 25 Nov PM',
      '- Anaesthetist: was Dr Melanie Souter, now Dr Priya Sharma',
      "- Hospital: was St George's, now Forte Health",
    ])
  })

  it("a single Booking moved to a colleague is a move, not a cover: a Booking change to the surgeon's office naming the new anaesthetist", () => {
    n = 0
    const moved = entry({ entityType: 'booking', entityId: 'BK1', action: 'booking.movedToAnaesthetist', before: { listId: 'L1', anaesthetistId: 'A3' }, after: { listId: 'L2', anaesthetistId: 'A2' } })
    const templates: Record<string, EmailTemplate> = Object.fromEntries(SEED_EMAIL_TEMPLATES.map((t) => [t.id, t]))
    for (const audit of [[moved], [{ ...moved, changeSetId: 'CS0009', changeSetKind: 'move' as const }]]) {
      const rows = pickableChanges(audit, { kind: 'booking', bookingId: 'BK1' }, LOOKUPS)
      expect(rows[0]!.kind).toBe('move')
      expect(rows[0]!.lines.map(emailLineText)).toContain('- Anaesthetist: was Dr Melanie Souter, now Dr Priya Sharma')
      const kind = defaultKindFor(rows)
      expect(kind).toBe('bookingChange')
      expect(defaultTemplateFor(templates, kind)?.recipient).toBe('office')
    }
  })

  it('never offers a drafted update email as a row', () => {
    n = 0
    const audit = [
      entry({ entityType: 'booking', entityId: 'BK1', action: 'booking.update', before: { scheduledTime: '09:00' }, after: { scheduledTime: '09:30' } }),
      entry({ entityType: 'booking', entityId: 'BK1', action: 'updateEmail.drafted', after: { pickedKeys: ['a:A0001'] } }),
    ]
    const rows = pickableChanges(audit, { kind: 'booking', bookingId: 'BK1' }, LOOKUPS)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.lines.map(emailLineText)).toEqual(['- Time: was 09:00, now 09:30'])
  })
})

describe('netPicked', () => {
  it('nets two picked saves: first before, last after', () => {
    n = 0
    const audit = [
      ...save('CS0001', 'BK1', [{ entityType: 'booking', entityId: 'BK1', action: 'booking.update', before: { scheduledTime: '09:00' }, after: { scheduledTime: '09:30' } }]),
      ...save('CS0002', 'BK1', [{ entityType: 'booking', entityId: 'BK1', action: 'booking.update', before: { scheduledTime: '09:30' }, after: { scheduledTime: '10:00' } }]),
    ]
    const rows = pickableChanges(audit, { kind: 'booking', bookingId: 'BK1' }, LOOKUPS)
    expect(netPicked(rows)).toEqual({ lines: [{ key: 'time', label: 'Time', before: '09:00', after: '10:00' }], cancelledOut: 0 })
    // Only the picked rows appear.
    expect(netPicked([byKey(rows, 'cs:CS0002')]).lines.map(emailLineText)).toEqual(['- Time: was 09:30, now 10:00'])
  })

  it('drops a field changed and changed back, and counts it', () => {
    n = 0
    const audit = [
      ...save('CS0001', 'BK1', [
        { entityType: 'booking', entityId: 'BK1', action: 'booking.update', before: { scheduledTime: '09:00' }, after: { scheduledTime: '09:30' } },
        { entityType: 'patient', entityId: 'PT1', action: 'patient.update', before: { name: 'Aroha Ngata' }, after: { name: 'Arohanui Ngata' } },
      ]),
      ...save('CS0002', 'BK1', [{ entityType: 'booking', entityId: 'BK1', action: 'booking.update', before: { scheduledTime: '09:30' }, after: { scheduledTime: '09:00' } }]),
    ]
    const rows = pickableChanges(audit, { kind: 'booking', bookingId: 'BK1' }, LOOKUPS)
    const net = netPicked(rows)
    expect(net.lines.map(emailLineText)).toEqual(['- Patient name: was Aroha Ngata, now Arohanui Ngata'])
    expect(net.cancelledOut).toBe(1)
    expect(cancelledOutNote(1)).toBe('1 picked change cancelled out and is not listed')
    expect(cancelledOutNote(2)).toBe('2 picked changes cancelled out and are not listed')
  })
})

describe('defaultKindFor and the default template', () => {
  const row = (kind: PickableChange['kind'], lines: EmailLine[] = []): PickableChange => ({ key: kind, atISO: '', who: '', role: 'office', kind, lines, emailable: true, seq: 0 })
  const templates: Record<string, EmailTemplate> = Object.fromEntries(SEED_EMAIL_TEMPLATES.map((t) => [t.id, t]))

  it('a cover goes to the hospital as a change of anaesthetist', () => {
    const kind = defaultKindFor([row('save'), row('cover')])
    expect(kind).toBe('anaesthetistChange')
    expect(defaultTemplateFor(templates, kind)?.recipient).toBe('hospital')
  })

  it("a cancellation goes to the surgeon's office as a cancellation", () => {
    const kind = defaultKindFor([row('cancel')])
    expect(kind).toBe('cancellation')
    expect(defaultTemplateFor(templates, kind)?.recipient).toBe('office')
  })

  it("a time change goes to the surgeon's office as a booking change; a retired template is skipped", () => {
    const kind = defaultKindFor([row('save', [{ key: 'time', label: 'Time', before: '09:00', after: '09:30' }])])
    expect(kind).toBe('bookingChange')
    expect(defaultTemplateFor(templates, kind)).toMatchObject({ id: 'ET004', recipient: 'office' })
    expect(defaultTemplateFor({ ...templates, ET004: { ...templates.ET004!, active: false } }, kind)).toBeUndefined()
  })
})

describe('validateTemplate and renderTemplate', () => {
  it('the four seeded templates validate, one per kind, with no dashes', () => {
    expect(SEED_EMAIL_TEMPLATES).toHaveLength(4)
    expect(new Set(SEED_EMAIL_TEMPLATES.map((t) => t.kind)).size).toBe(4)
    for (const t of SEED_EMAIL_TEMPLATES) {
      expect(validateTemplate(t)).toEqual([])
      expect(`${t.name}${t.subject}${t.body}`).not.toMatch(/[–—]/)
    }
  })

  it('reports an unknown placeholder, an empty subject and a body without {changes}', () => {
    const issues = validateTemplate({ name: 'X', kind: 'bookingChange', subject: '', body: 'Hello {unknown}' })
    expect(issues.map((i) => i.field)).toEqual(['subject', 'body', 'body'])
    expect(issues.map((i) => i.message).join(' ')).toContain('{unknown}')
    expect(issues.some((i) => i.message.includes('{changes}'))).toBe(true)
  })

  it('a change of anaesthetist may carry both anaesthetists instead of {changes}', () => {
    expect(validateTemplate({ name: 'X', kind: 'anaesthetistChange', subject: 'S', body: '{previousAnaesthetist} to {anaesthetist}' })).toEqual([])
    expect(validateTemplate({ name: 'X', kind: 'anaesthetistChange', subject: 'S', body: 'Only {anaesthetist}' })).toHaveLength(1)
  })

  it('rendering never leaves braces, even for an unknown or missing placeholder', () => {
    const out = renderTemplate('Hi {patient}, {unknown}{date} {} {changes}', { patient: 'Aroha' })
    expect(out).toBe('Hi Aroha,   ')
    expect(out).not.toMatch(/[{}]/)
    const all = renderTemplate(EMAIL_PLACEHOLDERS.map((p) => `{${p}}`).join(' '), {})
    expect(all).not.toMatch(/[{}]/)
  })
})

describe('buildUpdateEmail', () => {
  const line = (i: number): EmailLine => ({ key: `procedure:P${i}`, label: 'Procedure', before: null, after: `Total knee replacement number ${i} with a longer name`, collection: true })

  it('renders plain text with CRLF and the change lines', () => {
    const email = buildUpdateEmail({ template: TEMPLATE, context: CONTEXT, lines: [{ key: 'time', label: 'Time', before: '09:00', after: '09:30' }], to: 'office@x.example', signature: 'Kirsty W.' })
    expect(email.subject).toBe('Booking update: Aroha Ngata, Tue 24 Nov AM')
    expect(email.body).toContain('- Time: was 09:00, now 09:30')
    expect(email.body).toContain('\r\n')
    expect(email.body.replace(/\r\n/g, '')).not.toContain('\n')
    expect(email.body).toMatch(/Ngā mihi,\r\nKirsty W\.$/)
    expect(email.shortened).toBe(false)
    expect(email.omittedCount).toBe(0)
    expect(email.length).toBe(email.href.length)
    expect(email.href.startsWith('mailto:office@x.example?subject=')).toBe(true)
    expect(`${email.subject}${email.body}`).not.toMatch(/[–—]/)
  })

  it('an over-long pick is shortened to fit, keeping the first line and the sign-off (plural and singular)', () => {
    const lines = Array.from({ length: 40 }, (_, i) => line(i + 1))
    const email = buildUpdateEmail({ template: TEMPLATE, context: CONTEXT, lines, to: 'office@x.example', signature: 'Kirsty W.' })
    expect(email.href.length).toBeLessThanOrEqual(MAILTO_MAX_LENGTH)
    expect(email.shortened).toBe(true)
    expect(email.omittedCount).toBeGreaterThan(1)
    expect(email.body).toContain(`This list was shortened to fit an email link. ${email.omittedCount} more changes are in the booking record.`)
    expect(email.body).toContain(emailLineText(lines[0]!))
    expect(email.body).toContain('Kia ora,')
    expect(email.body).toContain('Kirsty W.')

    // The pick where exactly one line has to go.
    // (A long last line: dropping it frees more than the note takes.)
    const long: EmailLine = { key: 'patient:PT1:name', label: 'Patient name', before: 'A'.repeat(300), after: 'B'.repeat(300) }
    const one = Array.from({ length: 40 }, (_, i) => buildUpdateEmail({ template: TEMPLATE, context: CONTEXT, lines: [...lines.slice(0, i + 1), long], to: 'office@x.example', signature: 'Kirsty W.' }))
      .find((e) => e.omittedCount === 1)!
    expect(one).toBeDefined()
    expect(one.body).toContain('This list was shortened to fit an email link. 1 more change is in the booking record.')
    expect(one.href.length).toBeLessThanOrEqual(MAILTO_MAX_LENGTH)
  })

  it('drops every change line if need be; a template too long on its own does not fit (and validateTemplate says so)', () => {
    const huge: EmailLine = { key: 'patient:PT1:name', label: 'Patient name', before: 'A'.repeat(1500), after: 'B'.repeat(1500) }
    const none = buildUpdateEmail({ template: TEMPLATE, context: CONTEXT, lines: [huge], to: 'office@x.example', signature: 'Kirsty W.' })
    expect(none.omittedCount).toBe(1)
    expect(none.fits).toBe(true)
    expect(none.href.length).toBeLessThanOrEqual(MAILTO_MAX_LENGTH)
    const longBody = `${'Kia ora, this is a very long template. '.repeat(80)}\n{changes}`
    const tooLong = buildUpdateEmail({ template: { subject: 'S', body: longBody }, context: CONTEXT, lines: [huge], to: 'office@x.example', signature: '' })
    expect(tooLong.fits).toBe(false)
    expect(tooLong.href.length > MAILTO_MAX_LENGTH || tooLong.fits).toBe(true)
    expect(validateTemplate({ name: 'Long', kind: 'bookingChange', subject: 'S', body: longBody })).toEqual([{ field: 'body', message: 'The body is too long to fit an email link. Shorten it.' }])
  })

  it("encodes &, ?, #, +, apostrophes, line breaks and macrons so they round-trip", () => {
    const tricky = "Tom & Jerry? #1 + O'Brien, Ngā Mātua"
    const email = buildUpdateEmail({
      template: { subject: '{patient}', body: 'Kia ora {patient},\n{changes}\nNgā mihi' },
      context: { ...CONTEXT, patient: tricky },
      lines: [{ key: 'time', label: 'Time', before: '09:00', after: '09:30' }],
      to: '',
      signature: '',
    })
    const query = email.href.slice('mailto:?'.length)
    expect(email.href.startsWith('mailto:?subject=')).toBe(true)
    const [subjectPart, bodyPart] = query.split('&')
    expect(subjectPart!.includes('#')).toBe(false)
    expect(decodeURIComponent(subjectPart!.slice('subject='.length))).toBe(tricky)
    expect(decodeURIComponent(bodyPart!.slice('body='.length))).toBe(`Kia ora ${tricky},\r\n- Time: was 09:00, now 09:30\r\nNgā mihi`)
  })

  it('an empty To is valid; two addresses are joined', () => {
    expect(buildUpdateEmail({ template: TEMPLATE, context: CONTEXT, lines: [], to: '  ', signature: '' }).href.startsWith('mailto:?subject=')).toBe(true)
    expect(buildUpdateEmail({ template: TEMPLATE, context: CONTEXT, lines: [], to: 'a@x.example, b@y.example', signature: '' }).href.startsWith('mailto:a@x.example,b@y.example?')).toBe(true)
  })

  it('a List email names no patient: the context is the List and its Booking count', () => {
    const cover: EmailLine = { key: 'anaesthetist', label: 'Anaesthetist', before: 'Dr James Rutherford', after: 'Dr Priya Sharma' }
    const context = updateEmailContext({ list: LOOKUPS.lists.L1!, lookups: LOOKUPS, bookingCount: 3, lines: [cover] })
    expect(context.patient).toBeUndefined()
    const template = SEED_EMAIL_TEMPLATES.find((t) => t.kind === 'anaesthetistChange')!
    const email = buildUpdateEmail({ template, context, lines: [cover], to: 'bookings@stgeorges.example', signature: 'Kirsty W.' })
    expect(email.body).toContain('Dr James Rutherford is no longer the anaesthetist for the Tue 24 Nov AM List at St George\'s. Dr Priya Sharma will be the anaesthetist.')
    expect(email.body).toContain('3 booking')
    expect(email.subject).toBe("Change of anaesthetist: Tue 24 Nov AM list at St George's")
  })
})
