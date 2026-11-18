import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import type { Actor } from './mutate'
import { contactAuditText, createSurgeon, createSurgeonGroup, editSurgeon, editSurgeonGroup, type SurgeonFields } from './surgeonActions'
import { addAnaesthetist, createHospital, editAnaesthetist, editHospital } from './mastersActions'
import { ANAE, HOSP, SPC, SURG } from '../domain/seed'
import type { Surgeon } from '../domain/types'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

const NEW_SURGEON: SurgeonFields = { name: 'Ms R. Kerr', specialtyIds: [SPC.orthopaedics], practiceName: 'Riccarton Orthopaedic Rooms', hpiId: ' 50kerr ', medicalRegistrationNumber: '80123' }

/** A surgeon's fields as the edit sheet sends them back unchanged. */
const fieldsOf = (s: Surgeon): SurgeonFields => ({ ...s, hpiId: s.hpiId ?? '' })

describe('surgeons', () => {
  it('adds a surgeon with a normalised HPI CPN, a runtime id and an audit entry', () => {
    const api = createAppStore()
    const outcome = createSurgeon(api, OFFICE, NEW_SURGEON)
    expect(outcome.ok).toBe(true)
    const id = outcome.ok ? outcome.value.id : ''
    expect(id).toBe('SN001')
    const s = api.getState()
    expect(s.masters.surgeons[id]).toMatchObject({ name: 'Ms R. Kerr', hpiId: '50KERR', practiceName: 'Riccarton Orthopaedic Rooms', personalContact: {}, officeContacts: [], medicalRegistrationNumber: '80123' })
    const entry = s.audit.at(-1)
    expect(entry).toMatchObject({ action: 'surgeon.create', entityType: 'surgeon', entityId: id, who: 'Kirsty W.' })
    expect(entry?.after).toMatchObject({ hpiId: '50KERR' })
  })

  it('refuses an anaesthetist actor, a blank name and a malformed HPI CPN', () => {
    const api = createAppStore()
    const codes = [
      createSurgeon(api, SOUTER, NEW_SURGEON),
      createSurgeon(api, OFFICE, { ...NEW_SURGEON, name: '  ' }),
      createSurgeon(api, OFFICE, { ...NEW_SURGEON, hpiId: '1ABCDE' }),
    ].map((o) => (o.ok ? 'ok' : o.code))
    expect(codes).toEqual(['officeOnly', 'nameRequired', 'invalidHpiCpn'])
  })

  it('refuses an HPI CPN held by an anaesthetist or another surgeon, naming the holder', () => {
    const api = createAppStore()
    const a = createSurgeon(api, OFFICE, { ...NEW_SURGEON, hpiId: '12shap' })
    expect(a.ok ? '' : a.message).toBe('That HPI CPN already belongs to Dr Priya Sharma.')
    const b = createSurgeon(api, OFFICE, { ...NEW_SURGEON, hpiId: '47REIA' })
    expect(b.ok ? '' : b.code).toBe('duplicateHpiCpn')
  })

  it('edits a surgeon, keeping its own HPI CPN, and audits only the changed fields', () => {
    const api = createAppStore()
    const reid = api.getState().masters.surgeons[SURG.reid]!
    const outcome = editSurgeon(api, OFFICE, SURG.reid, { ...fieldsOf(reid), medicalRegistrationNumber: '77150' })
    expect(outcome.ok).toBe(true)
    const entry = api.getState().audit.at(-1)
    expect(entry).toMatchObject({ action: 'surgeon.update', before: { medicalRegistrationNumber: '77149' }, after: { medicalRegistrationNumber: '77150' } })
    const clash = editSurgeon(api, OFFICE, SURG.reid, { ...fieldsOf(reid), hpiId: '40HALT' })
    expect(clash.ok ? '' : clash.code).toBe('duplicateHpiCpn')
    expect(editSurgeon(api, SOUTER, SURG.reid, fieldsOf(reid)).ok).toBe(false)
  })
})

describe('surgeon groups', () => {
  it('adds and edits a group, de-duplicating members and refusing unknown ones', () => {
    const api = createAppStore()
    const added = createSurgeonGroup(api, OFFICE, { name: 'General surgeons', memberSurgeonIds: [SURG.patel, SURG.patel, SURG.doyle] })
    expect(added.ok).toBe(true)
    const id = added.ok ? added.value.id : ''
    expect(id).toBe('SGN001')
    expect(api.getState().masters.surgeonGroups[id]?.memberSurgeonIds).toEqual([SURG.patel, SURG.doyle])
    expect(createSurgeonGroup(api, OFFICE, { name: 'X', memberSurgeonIds: ['S-NOPE'] }).ok).toBe(false)
    expect(editSurgeonGroup(api, OFFICE, 'SG-EYE', { name: 'Eye surgeons', memberSurgeonIds: [SURG.reid] }).ok).toBe(true)
    expect(api.getState().audit.at(-1)?.action).toBe('surgeonGroup.update')
    expect(api.getState().masters.organisations['O-COS']).toBeDefined()
  })

  it('editSurgeonGroup audits only what changed (members as a set), and an unchanged save writes nothing', () => {
    const api = createAppStore()
    const g = api.getState().masters.surgeonGroups['SG-EYE']!
    const before = api.getState().audit.length
    const same = { name: g.name, description: g.description, memberSurgeonIds: [...g.memberSurgeonIds].reverse() }
    expect(editSurgeonGroup(api, OFFICE, 'SG-EYE', same).ok).toBe(true)
    expect(api.getState().audit.length).toBe(before)
    expect(editSurgeonGroup(api, OFFICE, 'SG-EYE', { ...same, description: 'Eye surgeons at one hospital' }).ok).toBe(true)
    expect(api.getState().audit.at(-1)?.after).toEqual({ description: 'Eye surgeons at one hospital' })
  })
})

describe('hospitals and the anaesthetist HPI CPN', () => {
  it('createHospital takes an optional contact email; editHospital round-trips it', () => {
    const api = createAppStore()
    const created = createHospital(api, OFFICE, 'Burwood Day Surgery', 'theatre@burwood.example')
    expect(created.ok && created.value.hospital.contactEmail).toBe('theatre@burwood.example')
    expect(createHospital(api, OFFICE, 'Other', 'bad').ok).toBe(false)
    expect(editHospital(api, OFFICE, HOSP.stg, { contactEmail: 'theatre@stgeorges.example' }).ok).toBe(true)
    expect(api.getState().masters.hospitals[HOSP.stg]?.contactEmail).toBe('theatre@stgeorges.example')
    expect(api.getState().audit.at(-1)).toMatchObject({
      action: 'hospital.update',
      before: { contactEmail: 'bookings@stgeorges.example' },
      after: { contactEmail: 'theatre@stgeorges.example' },
    })
    expect(editHospital(api, OFFICE, HOSP.stg, { contactEmail: 'nope' }).ok).toBe(false)
    expect(editHospital(api, OFFICE, HOSP.stg, { name: 'Southern Cross' }).ok).toBe(false)
    expect(editHospital(api, SOUTER, HOSP.stg, { contactEmail: '' }).ok).toBe(false)
  })

  it('editHospital audits only what changed, and an unchanged save writes nothing', () => {
    const api = createAppStore()
    const before = api.getState().audit.length
    const h = api.getState().masters.hospitals[HOSP.stg]!
    expect(editHospital(api, OFFICE, HOSP.stg, { name: h.name, contactEmail: h.contactEmail ?? '' }).ok).toBe(true)
    expect(api.getState().audit.length).toBe(before)
    expect(editHospital(api, OFFICE, HOSP.stg, { name: h.name, contactEmail: 'theatre@stgeorges.example' }).ok).toBe(true)
    expect(api.getState().audit.at(-1)?.after).toEqual({ contactEmail: 'theatre@stgeorges.example' })
  })

  it("addAnaesthetist refuses a surgeon's HPI CPN and stores a typed one upper-cased", () => {
    const api = createAppStore()
    const base = { registrationNumber: '50001', name: 'Dr New Person', phone: '', email: '', unitValue: 30, bankAccount: { accountName: 'Test Account', accountNumber: '99-0101-0099001-00' }, startDateISO: '2026-07-21' }
    const clash = addAnaesthetist(api, OFFICE, { ...base, hpiId: '47reia' })
    expect(clash.ok ? '' : clash.message).toBe('That HPI CPN already belongs to Ms A. Reid.')
    expect(addAnaesthetist(api, OFFICE, { ...base, hpiId: ' 24newp ' }).ok).toBe(true)
    expect(api.getState().masters.anaesthetists['50001']?.hpiId).toBe('24NEWP')
    expect(addAnaesthetist(api, OFFICE, { ...base, registrationNumber: '50002', hpiId: '' })).toMatchObject({ ok: false, code: 'hpiCpnRequired' })
  })

  it('editAnaesthetist normalises a typed HPI CPN and refuses a clash, never its own', () => {
    const api = createAppStore()
    expect(editAnaesthetist(api, OFFICE, ANAE.sharma, { hpiId: '12shap' }).ok).toBe(true)
    expect(api.getState().masters.anaesthetists[ANAE.sharma]?.hpiId).toBe('12SHAP')
    const clash = editAnaesthetist(api, OFFICE, ANAE.sharma, { hpiId: '40HALT' })
    expect(clash.ok ? '' : clash.code).toBe('duplicateHpiCpn')
  })
})

describe("catch-up Phase 17b: contacts on the surgeon, the HPI CPN optional (D74, D76; OQ-143's default)", () => {
  const noUndefined = (value: unknown) => expect(JSON.stringify(value ?? null)).not.toMatch(/undefined|""/)

  it('saves a surgeon with no HPI CPN, held as absent, audited as "None"', () => {
    const api = createAppStore()
    const created = createSurgeon(api, OFFICE, { ...NEW_SURGEON, hpiId: '   ' })
    expect(created.ok).toBe(true)
    const id = created.ok ? created.value.id : ''
    expect(api.getState().masters.surgeons[id]).not.toHaveProperty('hpiId')
    expect(api.getState().audit.at(-1)?.after).toMatchObject({ hpiId: 'None' })
    // Clearing a held one on edit.
    const reid = api.getState().masters.surgeons[SURG.reid]!
    expect(editSurgeon(api, OFFICE, SURG.reid, { ...fieldsOf(reid), hpiId: '' }).ok).toBe(true)
    expect(api.getState().masters.surgeons[SURG.reid]).not.toHaveProperty('hpiId')
    const entry = api.getState().audit.at(-1)
    expect(entry).toMatchObject({ action: 'surgeon.update', before: { hpiId: '47REIA' }, after: { hpiId: 'None' } })
    noUndefined(entry?.before)
    noUndefined(entry?.after)
  })

  it("the anaesthetist's HPI CPN stays mandatory (catch-up Phase 26): a blank one is still refused", () => {
    const api = createAppStore()
    const base = { registrationNumber: '50003', name: 'Dr Blank Number', phone: '', email: '', unitValue: 30, bankAccount: { accountName: 'Test Account', accountNumber: '99-0101-0099001-00' }, startDateISO: '2026-07-21' }
    expect(addAnaesthetist(api, OFFICE, { ...base, hpiId: '' })).toMatchObject({ ok: false, code: 'hpiCpnRequired' })
  })

  it('cleans contacts: blank fields dropped, all-blank office sets dropped, order kept', () => {
    const api = createAppStore()
    const created = createSurgeon(api, OFFICE, {
      ...NEW_SURGEON,
      personalContact: { name: ' Ms R. Kerr ', email: '', phone: ' 021 555 0999 ' },
      officeContacts: [{ name: '', email: '  ', phone: '' }, { name: 'Pat', email: 'pat@kerr.example' }, {}, { phone: '03 555 0101' }],
    })
    const id = created.ok ? created.value.id : ''
    const s = api.getState().masters.surgeons[id]!
    expect(s.personalContact).toEqual({ name: 'Ms R. Kerr', phone: '021 555 0999' })
    expect(s.officeContacts).toEqual([{ name: 'Pat', email: 'pat@kerr.example' }, { phone: '03 555 0101' }])
  })

  it('refuses a bad contact email by the contact it is in, saving nothing', () => {
    const api = createAppStore()
    const personal = createSurgeon(api, OFFICE, { ...NEW_SURGEON, personalContact: { email: 'kerr at home' } })
    expect(personal).toMatchObject({ ok: false, code: 'invalidEmail', message: 'Personal contact: that email does not look right. Use the form name@example.co.nz.' })
    const office = createSurgeon(api, OFFICE, { ...NEW_SURGEON, officeContacts: [{ name: 'Pat', email: 'pat@kerr.example' }, { email: 'nope' }] })
    expect(office.ok ? '' : office.message).toMatch(/^Office contact 2: /)
    // A blank set before it keeps the numbering the form shows.
    const third = createSurgeon(api, OFFICE, { ...NEW_SURGEON, officeContacts: [{ name: 'Pat' }, {}, { email: 'nope' }] })
    expect(third.ok ? '' : third.message).toMatch(/^Office contact 3: /)
    expect(Object.values(api.getState().masters.surgeons).some((s) => s.name === 'Ms R. Kerr')).toBe(false)
  })

  it('audits the practice and contacts as text: "name · email · phone", office contacts one per entry, never undefined', () => {
    const api = createAppStore()
    const dalgety = api.getState().masters.surgeons['S-DALGETY']!
    const outcome = editSurgeon(api, OFFICE, 'S-DALGETY', {
      ...fieldsOf(dalgety),
      practiceName: 'Avonhead ENT Rooms',
      personalContact: { name: 'Dr H. Dalgety', email: 'h.dalgety@avonhead.example' },
      officeContacts: [dalgety.officeContacts[1]!],
    })
    expect(outcome.ok).toBe(true)
    const entry = api.getState().audit.at(-1)!
    expect(entry.before).toEqual({
      practiceName: 'Avonhead ENT',
      personalContact: 'Dr H. Dalgety',
      officeContacts: ['Bev · bev@avonheadent.example', 'Avonhead ENT · info@avonheadent.example · 03 555 1000'],
    })
    expect(entry.after).toEqual({
      practiceName: 'Avonhead ENT Rooms',
      personalContact: 'Dr H. Dalgety · h.dalgety@avonhead.example',
      officeContacts: ['Avonhead ENT · info@avonheadent.example · 03 555 1000'],
    })
    expect(contactAuditText({})).toBe('None')
    // Unchanged: nothing written.
    const count = api.getState().audit.length
    expect(editSurgeon(api, OFFICE, 'S-DALGETY', fieldsOf(api.getState().masters.surgeons['S-DALGETY']!)).ok).toBe(true)
    expect(api.getState().audit).toHaveLength(count)
  })
})
