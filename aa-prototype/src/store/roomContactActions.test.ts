import { describe, expect, it } from 'vitest'
import { createAppStore } from './appStore'
import type { Actor } from './mutate'
import { addRoomContact, editRoomContact, removeRoomContact } from './roomContactActions'
import { ANAE } from '../domain/seed'

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }
const SOUTER: Actor = { who: 'Dr Melanie Souter', role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: ANAE.souter }
const ROOM = 'RM-GENERALSUR'
const PA = { name: 'Fran', email: 'fran@gsp.example', role: 'PA' as const, forSurgeonId: 'S-YEOMAN' }

const noUndefined = (value: unknown) => expect(JSON.stringify(value ?? null)).not.toContain('undefined')

describe('room contacts (US-13.6.5)', () => {
  it('adds a PA named for a surgeon of the room, with a runtime id, audited on the room by name', () => {
    const api = createAppStore()
    const added = addRoomContact(api, OFFICE, ROOM, { ...PA, email: ' fran@gsp.example ' })
    expect(added.ok && added.value.id).toBe('RCN001')
    const contacts = api.getState().masters.surgeonRooms[ROOM]!.contacts!
    expect(contacts.at(-1)).toEqual({ id: 'RCN001', name: 'Fran', email: 'fran@gsp.example', role: 'PA', forSurgeonId: 'S-YEOMAN' })
    const entry = api.getState().audit.at(-1)
    expect(entry).toMatchObject({ entityType: 'surgeonRoom', entityId: ROOM, action: 'roomContact.add', after: { contact: 'Fran', role: 'PA', for: 'Mr B. Yeoman' } })
    noUndefined(entry?.after)
  })

  it('adds a whole-room contact to a room that had none', () => {
    const api = createAppStore()
    expect(api.getState().masters.surgeonRooms['RM-EYEPARTNER']?.contacts).toBeUndefined()
    expect(addRoomContact(api, OFFICE, 'RM-EYEPARTNER', { name: 'Gail', email: 'gail@eye.example', role: 'PRACTICE_MANAGER', forSurgeonId: '' }).ok).toBe(true)
    expect(api.getState().masters.surgeonRooms['RM-EYEPARTNER']?.contacts).toEqual([{ id: 'RCN001', name: 'Gail', email: 'gail@eye.example', role: 'PRACTICE_MANAGER' }])
    expect(api.getState().audit.at(-1)?.after).toMatchObject({ for: 'Whole room', role: 'Practice manager' })
  })

  it('refuses each bad input with its own code', () => {
    const api = createAppStore()
    addRoomContact(api, OFFICE, ROOM, PA)
    const codes = [
      addRoomContact(api, SOUTER, ROOM, PA),
      addRoomContact(api, OFFICE, 'RM-NOPE', PA),
      addRoomContact(api, OFFICE, ROOM, { ...PA, name: ' ' }),
      addRoomContact(api, OFFICE, ROOM, { ...PA, email: '' }),
      addRoomContact(api, OFFICE, ROOM, { ...PA, email: 'fran at gsp' }),
      addRoomContact(api, OFFICE, ROOM, { ...PA, role: '' }),
      addRoomContact(api, OFFICE, ROOM, { ...PA, forSurgeonId: 'S-DALGETY' }),
      addRoomContact(api, OFFICE, ROOM, { ...PA, email: 'FRAN@gsp.example' }),
      editRoomContact(api, OFFICE, ROOM, 'RC-NOPE', PA),
      removeRoomContact(api, OFFICE, ROOM, 'RC-NOPE'),
    ].map((o) => (o.ok ? 'ok' : o.code))
    expect(codes).toEqual(['officeOnly', 'notFound', 'nameRequired', 'invalidEmail', 'invalidEmail', 'roleRequired', 'surgeonNotInRoom', 'duplicateContact', 'notFound', 'notFound'])
    // The same email for another surgeon, or the whole room, is not a duplicate.
    expect(addRoomContact(api, OFFICE, ROOM, { ...PA, forSurgeonId: '' }).ok).toBe(true)
  })

  it('edits a contact, auditing the name and the changed fields only; an unchanged save writes nothing', () => {
    const api = createAppStore()
    const contact = api.getState().masters.surgeonRooms['RM-AVONHEADEN']!.contacts![0]!
    expect(editRoomContact(api, OFFICE, 'RM-AVONHEADEN', contact.id, { name: 'Bev', email: 'bev.k@avonheadent.example', role: 'PA', forSurgeonId: '' }).ok).toBe(true)
    const entry = api.getState().audit.at(-1)
    expect(entry).toMatchObject({
      action: 'roomContact.update',
      before: { contact: 'Bev', email: 'bev@avonheadent.example', for: 'Dr H. Dalgety' },
      after: { contact: 'Bev', email: 'bev.k@avonheadent.example', for: 'Whole room' },
    })
    expect(entry?.after).not.toHaveProperty('role')
    const count = api.getState().audit.length
    expect(editRoomContact(api, OFFICE, 'RM-AVONHEADEN', contact.id, { name: 'Bev', email: 'bev.k@avonheadent.example', role: 'PA' }).ok).toBe(true)
    expect(api.getState().audit).toHaveLength(count)
    const other = editRoomContact(api, OFFICE, 'RM-AVONHEADEN', contact.id, { name: 'Bev', email: 'x@y.example', role: 'PA', forSurgeonId: 'S-HALE' })
    expect(other.ok ? '' : other.code).toBe('surgeonNotInRoom')
    expect(editRoomContact(api, SOUTER, 'RM-AVONHEADEN', contact.id, { name: 'B', email: 'b@b.example', role: 'PA' }).ok).toBe(false)
  })

  it('moving a contact to another surgeon of the room is a change, compared by id', () => {
    const api = createAppStore()
    expect(editRoomContact(api, OFFICE, 'RM-BURNSIDEEN', 'RC-002', { name: 'Maree', email: 'maree@burnsideent.example', role: 'PA', forSurgeonId: 'S-CALDER' }).ok).toBe(true)
    expect(api.getState().masters.surgeonRooms['RM-BURNSIDEEN']!.contacts!.find((c) => c.id === 'RC-002')?.forSurgeonId).toBe('S-CALDER')
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'roomContact.update', before: { contact: 'Maree', for: 'Mr I. Forsythe' }, after: { contact: 'Maree', for: 'Dr T. Calder' } })
  })

  it('refuses an edit that would duplicate another contact of the room', () => {
    const api = createAppStore()
    const r = editRoomContact(api, OFFICE, 'RM-BURNSIDEEN', 'RC-006', { name: 'Leanne', email: 'leanne@burnsideent.example', role: 'PA', forSurgeonId: 'S-CALDER' })
    expect(r.ok ? '' : r.code).toBe('duplicateContact')
  })

  it('removes a contact, audited with what was removed', () => {
    const api = createAppStore()
    expect(removeRoomContact(api, OFFICE, 'RM-BRYNDWRNEU', 'RC-008').ok).toBe(true)
    expect(api.getState().masters.surgeonRooms['RM-BRYNDWRNEU']?.contacts).toEqual([])
    expect(api.getState().audit.at(-1)).toMatchObject({ action: 'roomContact.remove', before: { contact: 'Wendy', for: 'Mr T. Mathieson' } })
    expect(removeRoomContact(api, SOUTER, 'RM-AVONHEADEN', 'RC-001').ok).toBe(false)
  })
})
