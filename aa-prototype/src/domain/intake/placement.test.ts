/** Build plan Phase 68: where a new List can go (DM-19, US-02.1.2, US-01.3.3). */
import { describe, expect, it } from 'vitest'
import type { MatchingList, MatchingSlot } from './matching'
import { placementOptions, placementSlotLabel } from './placement'

const slot = (id: string, anaesthetistId: string, session: MatchingSlot['session'], dateISO = '2026-11-25'): MatchingSlot => ({ id, anaesthetistId, dateISO, session })
const list = (id: string, over: Partial<MatchingList> = {}): MatchingList => ({
  id,
  hospitalId: 'H-FH',
  surgeonId: 'SRG-OK',
  dateISO: '2026-11-25',
  session: 'AM',
  state: 'ACTIVE',
  ...over,
})

const openSlots: MatchingSlot[] = [
  slot('S-STRAND-AM', 'A-STRAND', 'AM'),
  slot('S-RUTH-AM', 'A-RUTH', 'AM'),
  slot('S-RUTH-PM', 'A-RUTH', 'PM'),
  slot('S-LEE-OOH', 'A-LEE', 'OOH'),
  slot('S-RUTH-NEXT', 'A-RUTH', 'AM', '2026-11-26'),
]
const lists = {
  L1: list('L1', { session: 'PM' }),
  L2: list('L2'),
  L3: list('L3', { state: 'AUTHORISED' }),
  L4: list('L4', { hospitalId: 'H-SG' }),
}
const at = { hospitalId: 'H-FH', dateISO: '2026-11-25', session: 'AM' as const, surgeonId: 'SRG-OK' }

describe('placementOptions', () => {
  it("suggests the named anaesthetist's free Slot at that date and session", () => {
    expect(placementOptions({ openSlots, lists }, at, 'A-RUTH').suggested?.id).toBe('S-RUTH-AM')
  })

  it('lists the other free Slots, that session first, then the same day, never the suggested one or another day', () => {
    const o = placementOptions({ openSlots, lists }, at, 'A-RUTH')
    expect(o.otherSlots.map((s) => s.id)).toEqual(['S-STRAND-AM', 'S-RUTH-PM', 'S-LEE-OOH'])
  })

  it('suggests nothing when no anaesthetist is named, or the named one has no free Slot then', () => {
    const none = placementOptions({ openSlots, lists }, at)
    expect(none.suggested).toBeUndefined()
    expect(none.otherSlots.map((s) => s.id)).toEqual(['S-STRAND-AM', 'S-RUTH-AM', 'S-RUTH-PM', 'S-LEE-OOH'])
    expect(placementOptions({ openSlots, lists }, at, 'A-LEE').suggested).toBeUndefined()
  })

  it('offers the existing Lists that could take it (that session first), and fills the Draft List', () => {
    const o = placementOptions({ openSlots, lists }, at, 'A-RUTH')
    expect(o.lists.map((l) => l.id)).toEqual(['L2', 'L1'])
    expect(o.draft).toEqual(at)
    expect(placementOptions({ openSlots, lists }, { hospitalId: 'H-FH', dateISO: '2026-11-25', session: 'PM' }).draft).toEqual({ hospitalId: 'H-FH', dateISO: '2026-11-25', session: 'PM' })
  })

  it('is empty when nothing is free and no List could take it, the Draft List still offered', () => {
    const o = placementOptions({ openSlots: [], lists: {} }, at, 'A-RUTH')
    expect(o).toEqual({ otherSlots: [], lists: [], draft: at })
  })
})

describe('placementSlotLabel', () => {
  const anaesthetists = { 'A-RUTH': { name: 'Dr Kate Rutherford' } }

  it('names the Slot in words', () => {
    expect(placementSlotLabel(slot('S', 'A-RUTH', 'AM'), anaesthetists)).toBe("Dr Rutherford's AM, free")
    expect(placementSlotLabel(slot('S', 'A-RUTH', 'AM'), anaesthetists, { withDay: true })).toBe("Dr Rutherford's Wed 25 Nov AM, free")
    expect(placementSlotLabel(slot('S', 'A-NOBODY', 'OOH'), anaesthetists)).toBe("An anaesthetist's Out-of-hours, free")
  })
})
