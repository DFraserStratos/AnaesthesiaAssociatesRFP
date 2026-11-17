import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import type { Actor } from './mutate'
import { createSurgeon, createSurgeonGroup, createSurgeonRoom, editSurgeon, editSurgeonGroup, editSurgeonRoom } from './surgeonActions'
import { addAnaesthetist, createHospital, editAnaesthetist, editHospital } from './mastersActions'
import { editRoomContact } from './roomContactActions'
import { ANAE, HOSP, ROOM, SPC, SURG } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }

const NEW_SURGEON = { name: 'Ms R. Kerr', specialtyIds: [SPC.orthopaedics], roomIds: [ROOM.riccarton], hpiId: ' 50kerr ', medicalRegistrationNumber: '80123' }

describe('surgeons', () => {
  it('adds a surgeon with a normalised HPI CPN, a runtime id and an audit entry', () => {
    const api = createAppStore()
    const outcome = createSurgeon(api, OFFICE, NEW_SURGEON)
    expect(outcome.ok).toBe(true)
    const id = outcome.ok ? outcome.value.id : ''
    expect(id).toBe('SN001')
    const s = api.getState()
    expect(s.masters.surgeons[id]).toMatchObject({ name: 'Ms R. Kerr', hpiId: '50KERR', roomIds: [ROOM.riccarton], medicalRegistrationNumber: '80123' })
    const entry = s.audit.at(-1)
    expect(entry).toMatchObject({ action: 'surgeon.create', entityType: 'surgeon', entityId: id, who: 'Kirsty W.' })
    expect(entry?.after).toMatchObject({ hpiId: '50KERR' })
  })

  it('refuses an anaesthetist actor, a blank name, an unknown room and a bad HPI CPN', () => {
    const api = createAppStore()
    const codes = [
      createSurgeon(api, SOUTER, NEW_SURGEON),
      createSurgeon(api, OFFICE, { ...NEW_SURGEON, name: '  ' }),
      createSurgeon(api, OFFICE, { ...NEW_SURGEON, roomIds: ['RM-NOPE'] }),
      createSurgeon(api, OFFICE, { ...NEW_SURGEON, roomIds: [] }),
      createSurgeon(api, OFFICE, { ...NEW_SURGEON, hpiId: '' }),
      createSurgeon(api, OFFICE, { ...NEW_SURGEON, hpiId: '1ABCDE' }),
    ].map((o) => (o.ok ? 'ok' : o.code))
    expect(codes).toEqual(['officeOnly', 'nameRequired', 'notFound', 'roomRequired', 'hpiCpnRequired', 'invalidHpiCpn'])
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
    const outcome = editSurgeon(api, OFFICE, SURG.reid, { name: reid.name, roomIds: reid.roomIds, hpiId: reid.hpiId, specialtyIds: reid.specialtyIds, medicalRegistrationNumber: '77150' })
    expect(outcome.ok).toBe(true)
    const entry = api.getState().audit.at(-1)
    expect(entry).toMatchObject({ action: 'surgeon.update', before: { medicalRegistrationNumber: '77149' }, after: { medicalRegistrationNumber: '77150' } })
    const clash = editSurgeon(api, OFFICE, SURG.reid, { name: reid.name, specialtyIds: reid.specialtyIds, roomIds: reid.roomIds, hpiId: '40HALT' })
    expect(clash.ok ? '' : clash.code).toBe('duplicateHpiCpn')
    expect(editSurgeon(api, SOUTER, SURG.reid, { name: reid.name, specialtyIds: reid.specialtyIds, roomIds: reid.roomIds, hpiId: reid.hpiId }).ok).toBe(false)
  })
})

describe("surgeons' rooms and groups", () => {
  it('adds and edits a room, refusing a blank name or an implausible email', () => {
    const api = createAppStore()
    const fields = { name: 'Sumner Rooms', contactEmail: 'hello@sumner.example', phone: '03 555 0100' }
    const added = createSurgeonRoom(api, OFFICE, fields)
    expect(added.ok && added.value.id).toBe('RMN001')
    expect(createSurgeonRoom(api, OFFICE, { ...fields, contactEmail: 'nope' }).ok).toBe(false)
    expect(createSurgeonRoom(api, OFFICE, { ...fields, name: '' }).ok).toBe(false)
    expect(createSurgeonRoom(api, SOUTER, fields).ok).toBe(false)
    const bad = editSurgeonRoom(api, OFFICE, ROOM.merivale, { name: 'Merivale Eye Rooms', contactEmail: 'bookings at merivale', phone: '03 555 0172' })
    expect(bad.ok ? '' : bad.code).toBe('invalidEmail')
    expect(editSurgeonRoom(api, OFFICE, ROOM.merivale, { name: 'Merivale Eye Rooms', contactEmail: 'eyes@merivale.example', phone: '03 555 0172' }).ok).toBe(true)
    expect(api.getState().audit.at(-1)).toMatchObject({
      action: 'surgeonRoom.update',
      before: { contactEmail: 'bookings@merivaleeye.example' },
      after: { contactEmail: 'eyes@merivale.example' },
    })
  })

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
    const base = { registrationNumber: '50001', name: 'Dr New Person', phone: '', email: '', unitValue: 30, gstPeriod: 'monthly' as const, startDateISO: '2026-07-21' }
    const clash = addAnaesthetist(api, OFFICE, { ...base, hpiId: '47reia' })
    expect(clash.ok ? '' : clash.message).toBe('That HPI CPN already belongs to Ms A. Reid.')
    expect(addAnaesthetist(api, OFFICE, { ...base, hpiId: ' 24newp ' }).ok).toBe(true)
    expect(api.getState().masters.anaesthetists['50001']?.hpiId).toBe('24NEWP')
    expect(addAnaesthetist(api, OFFICE, { ...base, registrationNumber: '50002', hpiId: '' }).ok).toBe(true)
  })

  it('editAnaesthetist normalises a typed HPI CPN and refuses a clash, never its own', () => {
    const api = createAppStore()
    expect(editAnaesthetist(api, OFFICE, ANAE.sharma, { hpiId: '12shap' }).ok).toBe(true)
    expect(api.getState().masters.anaesthetists[ANAE.sharma]?.hpiId).toBe('12SHAP')
    const clash = editAnaesthetist(api, OFFICE, ANAE.sharma, { hpiId: '40HALT' })
    expect(clash.ok ? '' : clash.code).toBe('duplicateHpiCpn')
  })
})

describe('catch-up Phase 17a: rooms without an email, surgeons at more than one room', () => {
  const noUndefined = (value: unknown) => expect(JSON.stringify(value ?? null)).not.toContain('undefined')

  it('adds a room with no email and no phone, holding neither as an empty string', () => {
    const api = createAppStore()
    const added = createSurgeonRoom(api, OFFICE, { name: 'Halswell Rooms', contactEmail: '  ', phone: '' })
    expect(added.ok).toBe(true)
    const room = api.getState().masters.surgeonRooms[added.ok ? added.value.id : '']!
    expect(room).toEqual({ id: 'RMN001', name: 'Halswell Rooms' })
    expect(api.getState().audit.at(-1)?.after).toEqual({ name: 'Halswell Rooms' })
    expect(createSurgeonRoom(api, OFFICE, { name: 'No fields' }).ok).toBe(true)
  })

  it("clears an existing room's email and audits '' after, never undefined; a bad email still refuses", () => {
    const api = createAppStore()
    const bad = editSurgeonRoom(api, OFFICE, ROOM.merivale, { name: 'Merivale Eye Rooms', contactEmail: 'nope', phone: '03 555 0172' })
    expect(bad.ok ? '' : bad.message).toBe('That contact email does not look right. Use the form name@example.co.nz.')
    expect(editSurgeonRoom(api, OFFICE, ROOM.merivale, { name: 'Merivale Eye Rooms', contactEmail: '', phone: '' }).ok).toBe(true)
    const room = api.getState().masters.surgeonRooms[ROOM.merivale]!
    expect('contactEmail' in room).toBe(false)
    expect('phone' in room).toBe(false)
    const entry = api.getState().audit.at(-1)
    expect(entry).toMatchObject({
      action: 'surgeonRoom.update',
      before: { contactEmail: 'bookings@merivaleeye.example', phone: '03 555 0172' },
      after: { contactEmail: '', phone: '' },
    })
    noUndefined(entry?.before)
    noUndefined(entry?.after)
    // Saving it unchanged writes nothing.
    const count = api.getState().audit.length
    expect(editSurgeonRoom(api, OFFICE, ROOM.merivale, { name: 'Merivale Eye Rooms' }).ok).toBe(true)
    expect(api.getState().audit).toHaveLength(count)
  })

  it('a room edit keeps its contacts', () => {
    const api = createAppStore()
    const before = api.getState().masters.surgeonRooms['RM-AVONHEADEN']!
    expect(editSurgeonRoom(api, OFFICE, 'RM-AVONHEADEN', { name: 'Avonhead ENT Rooms', contactEmail: before.contactEmail, phone: before.phone }).ok).toBe(true)
    expect(api.getState().masters.surgeonRooms['RM-AVONHEADEN']?.contacts).toEqual(before.contacts)
  })

  it('creates and edits a surgeon at two rooms, duplicates dropped, the rooms audited by name in order', () => {
    const api = createAppStore()
    const created = createSurgeon(api, OFFICE, { ...NEW_SURGEON, roomIds: [ROOM.riccarton, ROOM.merivale, ROOM.riccarton] })
    const id = created.ok ? created.value.id : ''
    expect(api.getState().masters.surgeons[id]?.roomIds).toEqual([ROOM.riccarton, ROOM.merivale])
    expect(api.getState().audit.at(-1)?.after).toMatchObject({ rooms: ['Riccarton Orthopaedic Rooms', 'Merivale Eye Rooms'] })
    // Make the second the main room.
    const s = api.getState().masters.surgeons[id]!
    expect(editSurgeon(api, OFFICE, id, { ...s, roomIds: [ROOM.merivale, ROOM.riccarton] }).ok).toBe(true)
    const entry = api.getState().audit.at(-1)
    expect(entry).toMatchObject({
      action: 'surgeon.update',
      before: { rooms: ['Riccarton Orthopaedic Rooms', 'Merivale Eye Rooms'] },
      after: { rooms: ['Merivale Eye Rooms', 'Riccarton Orthopaedic Rooms'] },
    })
    expect(entry?.after).not.toHaveProperty('roomIds')
    // Clearing every room refuses and leaves the surgeon as they were.
    const cleared = editSurgeon(api, OFFICE, id, { ...s, roomIds: [] })
    expect(cleared.ok ? '' : cleared.code).toBe('roomRequired')
    expect(editSurgeon(api, OFFICE, id, { ...s, roomIds: ['RM-NOPE'] }).ok).toBe(false)
    expect(api.getState().masters.surgeons[id]?.roomIds).toEqual([ROOM.merivale, ROOM.riccarton])
  })

  it("taking a room off a surgeon turns that room's contacts named for them into whole-room contacts, in one commit", () => {
    const api = createAppStore()
    const dalgety = api.getState().masters.surgeons['S-DALGETY']!
    const named = api.getState().masters.surgeonRooms['RM-AVONHEADEN']!.contacts!.filter((c) => c.forSurgeonId === 'S-DALGETY')
    expect(named.length).toBeGreaterThan(0)
    const before = api.getState().audit.length
    expect(editSurgeon(api, OFFICE, 'S-DALGETY', { ...dalgety, roomIds: [ROOM.riccarton] }).ok).toBe(true)
    const contacts = api.getState().masters.surgeonRooms['RM-AVONHEADEN']!.contacts!
    expect(contacts.some((c) => c.forSurgeonId === 'S-DALGETY')).toBe(false)
    for (const c of named) expect(contacts.find((x) => x.id === c.id)).toEqual({ id: c.id, name: c.name, email: c.email, role: c.role })
    const added = api.getState().audit.slice(before)
    expect(added.map((e) => e.action)).toEqual(['surgeon.update', ...named.map(() => 'roomContact.update')])
    expect(added[1]).toMatchObject({ entityId: 'RM-AVONHEADEN', before: { for: 'Dr H. Dalgety' }, after: { for: 'Whole room' } })
  })

  it('merges a named contact into its whole-room twin when the room is taken off, so the room never holds a duplicate', () => {
    const api = createAppStore()
    const forRoom = (id: string) => ({ ...api.getState().masters.surgeons[id]!, roomIds: [ROOM.riccarton] })
    // Leanne is named for Calder (RC-005) and for Woodville (RC-006) at Burnside.
    expect(editSurgeon(api, OFFICE, 'S-CALDER', forRoom('S-CALDER')).ok).toBe(true)
    expect(editSurgeon(api, OFFICE, 'S-WOODVILLE', forRoom('S-WOODVILLE')).ok).toBe(true)
    const leanne = api.getState().masters.surgeonRooms['RM-BURNSIDEEN']!.contacts!.filter((c) => c.name === 'Leanne')
    expect(leanne).toEqual([{ id: 'RC-005', name: 'Leanne', email: 'leanne@burnsideent.example', role: 'PA' }])
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'roomContact.remove', entityId: 'RM-BURNSIDEEN', before: { contact: 'Leanne', for: 'Mr U. Woodville' } })
    // The merged contact can still be edited (no duplicate left to clash with).
    expect(editRoomContact(api, OFFICE, 'RM-BURNSIDEEN', 'RC-005', { name: 'Leanne Ward', email: 'leanne@burnsideent.example', role: 'PA' }).ok).toBe(true)
  })
})
