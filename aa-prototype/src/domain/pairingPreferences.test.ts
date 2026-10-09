import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PRIORITY_TIER,
  PAIRING_LABELS,
  TIER_LABELS,
  activePairings,
  groupSurgeonsForAnaesthetist,
  notPreferredEntryIds,
  notPreferredWarning,
  pairingAcknowledgement,
  pairingSentence,
  pairingStatus,
  pairingsFor,
  rankAnaesthetistCandidates,
  tierFor,
} from './pairingPreferences'
import type { Anaesthetist, PairingPreference, PriorityTier, Surgeon } from './types'

const ANAE: Record<string, Anaesthetist> = Object.fromEntries(
  [
    ['A1', 'Dr Priya Sharma'],
    ['A2', 'Dr Rawiri Hughes'],
    ['A3', 'Dr Mark Delaney'],
    ['A4', 'Dr Oliver Strand'],
    ['A5', 'Dr Kate Morrison'],
    ['A6', 'Dr Hannah Ropata'],
  ].map(([id, name]) => [
    id,
    { registrationNumber: id as string, name: name as string, phone: '', email: '', unitValue: 30, gstPeriod: 'monthly', hpiId: '', active: true },
  ]),
)
const SURG: Record<string, Surgeon> = {
  REID: { id: 'REID', name: 'Ms A. Reid', roomId: 'R1', hpiId: '47REIA' },
  WHIT: { id: 'WHIT', name: 'Mr J. Whitford', roomId: 'R1', hpiId: '42WHIJ' },
  HALE: { id: 'HALE', name: 'Mr T. Hale', roomId: 'R2', hpiId: '40HALT' },
}
const MASTERS = { anaesthetists: ANAE, surgeons: SURG }

function entry(over: Partial<PairingPreference> & Pick<PairingPreference, 'id'>): PairingPreference {
  return {
    kind: 'NOT_PREFERRED',
    raisedBy: 'SURGEON',
    anaesthetistId: 'A1',
    surgeonId: 'REID',
    addedAtISO: '2026-03-10T10:00:00',
    addedBy: 'Kirsty W.',
    ...over,
  }
}

const SURGEON_SIDE = entry({ id: 'P1', reason: "Surgeon's preference" })
const ANAE_SIDE = entry({ id: 'P2', raisedBy: 'ANAESTHETIST' })
const ENDED = entry({ id: 'P3', anaesthetistId: 'A2', raisedBy: 'ANAESTHETIST', endedAtISO: '2026-05-12T14:15:00', endedBy: 'Kirsty W.' })
const PREFERRED = entry({ id: 'P4', kind: 'PREFERRED', surgeonId: 'WHIT' })

describe('pairing status and the warning', () => {
  it('an active not-preferred entry warns, groups and names the side (surgeon asked)', () => {
    const w = notPreferredWarning(MASTERS, [SURGEON_SIDE], 'A1', 'REID')
    expect(w?.message).toBe('Ms A. Reid prefers not to work with Dr Priya Sharma.')
    expect(w?.entries).toEqual([{ entryId: 'P1', raisedBy: 'SURGEON', reason: "Surgeon's preference" }])
    expect(pairingStatus([SURGEON_SIDE], 'A1', 'REID')).toBe('NOT_PREFERRED')
  })

  it('the anaesthetist side reads the other way round', () => {
    expect(notPreferredWarning(MASTERS, [ANAE_SIDE], 'A1', 'REID')?.message).toBe('Dr Priya Sharma prefers not to work with Ms A. Reid.')
  })

  it('both sides together give one message naming both, and group the candidate once', () => {
    const w = notPreferredWarning(MASTERS, [SURGEON_SIDE, ANAE_SIDE], 'A1', 'REID')
    expect(w?.message).toBe('Dr Priya Sharma and Ms A. Reid have each asked not to be paired.')
    expect(w?.entries.map((e) => e.entryId)).toEqual(['P1', 'P2'])
    const ranked = rankAnaesthetistCandidates({ candidates: ['A1', 'A3'], entries: [SURGEON_SIDE, ANAE_SIDE], tiers: {}, surgeonId: 'REID', requestKey: 'k' })
    expect(ranked.notPreferred.map((c) => c.anaesthetistId)).toEqual(['A1'])
    expect(ranked.notPreferred[0]?.notPreferredEntries.map((e) => e.id)).toEqual(['P1', 'P2'])
    expect(ranked.clear.map((c) => c.anaesthetistId)).toEqual(['A3'])
  })

  it('an ended entry neither warns nor groups, on either side', () => {
    expect(notPreferredWarning(MASTERS, [ENDED], 'A2', 'REID')).toBeNull()
    expect(pairingStatus([ENDED], 'A2', 'REID')).toBe('NONE')
    const ranked = rankAnaesthetistCandidates({ candidates: ['A2'], entries: [ENDED], tiers: {}, surgeonId: 'REID', requestKey: 'k' })
    expect(ranked.notPreferred).toEqual([])
  })

  it('re-adding after an end warns again', () => {
    const readded = entry({ id: 'P9', anaesthetistId: 'A2', raisedBy: 'ANAESTHETIST', addedAtISO: '2026-07-21T09:00:00' })
    expect(notPreferredWarning(MASTERS, [ENDED, readded], 'A2', 'REID')?.entries.map((e) => e.entryId)).toEqual(['P9'])
  })

  it('a preferred entry marks and never warns', () => {
    expect(notPreferredWarning(MASTERS, [PREFERRED], 'A1', 'WHIT')).toBeNull()
    expect(pairingStatus([PREFERRED], 'A1', 'WHIT')).toBe('PREFERRED')
    const ranked = rankAnaesthetistCandidates({ candidates: ['A1'], entries: [PREFERRED], tiers: {}, surgeonId: 'WHIT', requestKey: 'k' })
    expect(ranked.clear[0]?.preferred).toBe(true)
  })

  it('not preferred on one side wins over preferred on the other', () => {
    const pref = entry({ id: 'P5', kind: 'PREFERRED', raisedBy: 'ANAESTHETIST' })
    expect(pairingStatus([SURGEON_SIDE, pref], 'A1', 'REID')).toBe('NOT_PREFERRED')
    const ranked = rankAnaesthetistCandidates({ candidates: ['A1'], entries: [SURGEON_SIDE, pref], tiers: {}, surgeonId: 'REID', requestKey: 'k' })
    expect(ranked.notPreferred[0]?.preferred).toBe(false)
  })

  it('a missing or unknown id returns null, never a throw', () => {
    expect(notPreferredWarning(MASTERS, [SURGEON_SIDE], undefined, 'REID')).toBeNull()
    expect(notPreferredWarning(MASTERS, [SURGEON_SIDE], 'A1', '')).toBeNull()
    expect(notPreferredWarning(MASTERS, [SURGEON_SIDE], 'NOPE', 'REID')).toBeNull()
    expect(notPreferredWarning(MASTERS, [SURGEON_SIDE], 'A1', 'NOPE')).toBeNull()
  })

  it('entry ids and the acknowledgement name only active not-preferred entries', () => {
    expect(notPreferredEntryIds([SURGEON_SIDE, ANAE_SIDE, ENDED, PREFERRED], 'A1', 'REID')).toEqual(['P1', 'P2'])
    expect(notPreferredEntryIds([PREFERRED], 'A1', 'WHIT')).toEqual([])
    expect(notPreferredEntryIds([SURGEON_SIDE], 'A1', null)).toEqual([])
    expect(pairingAcknowledgement([SURGEON_SIDE], 'A1', 'REID')).toEqual({ anaesthetistId: 'A1', surgeonId: 'REID', pairingPreferenceIds: ['P1'] })
    expect(pairingAcknowledgement([PREFERRED], 'A1', 'WHIT')).toBeNull()
  })

  it('activePairings and pairingsFor keep a stable order and drop ended entries', () => {
    expect(activePairings({ a: PREFERRED, b: ANAE_SIDE, c: SURGEON_SIDE, d: ENDED }).map((e) => e.id)).toEqual(['P1', 'P2', 'P4'])
    expect(pairingsFor([PREFERRED, ANAE_SIDE, SURGEON_SIDE], 'A1', 'REID').map((e) => e.id)).toEqual(['P1', 'P2'])
  })
})

describe('surgeon grouping for an anaesthetist', () => {
  it('puts not-preferred surgeons apart and marks preferred ones, each by surname', () => {
    const g = groupSurgeonsForAnaesthetist({ surgeons: SURG, entries: [SURGEON_SIDE, PREFERRED], anaesthetistId: 'A1' })
    expect(g.clear.map((o) => [o.surgeon.id, o.preferred])).toEqual([
      ['HALE', false],
      ['WHIT', true],
    ])
    expect(g.notPreferred.map((o) => o.surgeon.id)).toEqual(['REID'])
  })

  it('with no anaesthetist, everyone is clear', () => {
    const g = groupSurgeonsForAnaesthetist({ surgeons: SURG, entries: [SURGEON_SIDE], anaesthetistId: undefined })
    expect(g.notPreferred).toEqual([])
    expect(g.clear).toHaveLength(3)
  })
})

describe('tier ordering, shuffle and filter', () => {
  const TIERS: Record<string, PriorityTier> = { A3: 1, A4: 1, A5: 1, A1: 2, A2: 3 }
  const ALL = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6']

  function order(key: string, filter?: ReadonlySet<PriorityTier>) {
    return rankAnaesthetistCandidates({ candidates: ALL, entries: [SURGEON_SIDE], tiers: TIERS, surgeonId: 'REID', requestKey: key, tierFilter: filter ?? null })
  }

  it('an anaesthetist with no entry is at Tier 4, the default', () => {
    expect(DEFAULT_PRIORITY_TIER).toBe(4)
    expect(tierFor(TIERS, 'A6')).toBe(4)
  })

  it('lists every Tier 1 before every Tier 2, and so on, in each group', () => {
    for (let n = 0; n < 50; n++) {
      const r = order(`L1:${n}`)
      const tiers = r.clear.map((c) => c.tier)
      expect(tiers).toEqual([...tiers].sort((a, b) => a - b))
      expect(r.clear.map((c) => c.anaesthetistId).slice(0, 3).sort()).toEqual(['A3', 'A4', 'A5'])
      expect(r.clear.at(-1)?.anaesthetistId).toBe('A6')
    }
  })

  it('groups are exhaustive and disjoint', () => {
    const r = order('k')
    const ids = [...r.clear, ...r.notPreferred].map((c) => c.anaesthetistId).sort()
    expect(ids).toEqual([...ALL].sort())
    expect(r.notPreferred.map((c) => c.anaesthetistId)).toEqual(['A1'])
  })

  it('the same key replays the same order, whatever the input order', () => {
    const a = order('L1:3')
    const b = rankAnaesthetistCandidates({ candidates: [...ALL].reverse(), entries: [SURGEON_SIDE], tiers: TIERS, surgeonId: 'REID', requestKey: 'L1:3' })
    expect(b).toEqual(a)
    expect(order('L1:3')).toEqual(a)
  })

  it('across keys, same-tier candidates appear in different orders and never cross a tier', () => {
    const seen = new Set<string>()
    for (let n = 0; n < 40; n++) {
      const top = order(`L1:${n}`).clear.slice(0, 3)
      expect(top.every((c) => c.tier === 1)).toBe(true)
      seen.add(top.map((c) => c.anaesthetistId).join(','))
    }
    expect(seen.size).toBeGreaterThan(2)
    const firstOfA3A4 = new Set<string>()
    for (let n = 0; n < 40; n++) {
      const ids = order(`L1:${n}`).clear.map((c) => c.anaesthetistId).filter((id) => id === 'A3' || id === 'A4')
      firstOfA3A4.add(ids[0] as string)
    }
    expect(firstOfA3A4).toEqual(new Set(['A3', 'A4']))
  })

  it('the tier filter narrows both groups and keeps the order', () => {
    const full = order('L1:7')
    const filtered = order('L1:7', new Set<PriorityTier>([1, 2]))
    expect(filtered.clear.map((c) => c.anaesthetistId)).toEqual(full.clear.filter((c) => c.tier <= 2).map((c) => c.anaesthetistId))
    expect(filtered.notPreferred.map((c) => c.anaesthetistId)).toEqual(['A1'])
    expect(order('L1:7', new Set<PriorityTier>([1])).notPreferred).toEqual([])
  })

  it('with no surgeon, everyone is clear and still tier-ordered', () => {
    const r = rankAnaesthetistCandidates({ candidates: ALL, entries: [SURGEON_SIDE], tiers: TIERS, surgeonId: undefined, requestKey: 'k' })
    expect(r.notPreferred).toEqual([])
    expect(r.clear.map((c) => c.tier)).toEqual([1, 1, 1, 2, 3, 4])
  })
})

describe('the one label set', () => {
  it('builds every kind, tier and side word, with no dashes and no old names', () => {
    const strings = [
      ...Object.values(PAIRING_LABELS.kind),
      ...Object.values(PAIRING_LABELS.side),
      ...Object.values(PAIRING_LABELS.verb),
      PAIRING_LABELS.section,
      PAIRING_LABELS.entry,
      PAIRING_LABELS.notPreferredWith('Dr Sharma'),
      PAIRING_LABELS.optionSuffix('NOT_PREFERRED'),
      PAIRING_LABELS.optionSuffix('PREFERRED'),
      PAIRING_LABELS.bothAsked('Dr Priya Sharma', 'Ms A. Reid'),
      ...Object.values(TIER_LABELS),
      pairingSentence('NOT_PREFERRED', 'SURGEON', 'Dr Priya Sharma', 'Ms A. Reid'),
      pairingSentence('PREFERRED', 'ANAESTHETIST', 'Dr Priya Sharma', 'Mr J. Whitford'),
      notPreferredWarning(MASTERS, [SURGEON_SIDE], 'A1', 'REID')?.message ?? '',
    ]
    for (const s of strings) {
      expect(s).not.toMatch(/[–—]/)
      expect(s.toLowerCase()).not.toMatch(/blacklist|whitelist/)
    }
    expect(PAIRING_LABELS.notPreferredWith('Dr Sharma')).toBe('Not preferred with Dr Sharma')
    expect(PAIRING_LABELS.optionSuffix('NOT_PREFERRED')).toBe(' · not preferred')
    expect(TIER_LABELS[1]).toBe('Tier 1')
  })

  it('words each direction of the side sentence', () => {
    expect(pairingSentence('NOT_PREFERRED', 'SURGEON', 'Dr Priya Sharma', 'Ms A. Reid')).toBe('Ms A. Reid prefers not to work with Dr Priya Sharma')
    expect(pairingSentence('NOT_PREFERRED', 'ANAESTHETIST', 'Dr Priya Sharma', 'Ms A. Reid')).toBe('Dr Priya Sharma prefers not to work with Ms A. Reid')
    expect(pairingSentence('PREFERRED', 'SURGEON', 'Dr Priya Sharma', 'Mr J. Whitford')).toBe('Mr J. Whitford prefers to work with Dr Priya Sharma')
    expect(pairingSentence('PREFERRED', 'ANAESTHETIST', 'Dr Priya Sharma', 'Mr J. Whitford')).toBe('Dr Priya Sharma prefers to work with Mr J. Whitford')
  })
})
