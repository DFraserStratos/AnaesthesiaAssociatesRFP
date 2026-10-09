/**
 * Who can take a Draft List (catch-up Phase 31; US-01.6.3 "everybody
 * potentially available", US-01.3.5 "every office path", US-01.3.6 tier
 * order; D44). Availability comes from the store's `draftListAvailabilityFor`
 * (free, not available, occupied: no preference knowledge); this component
 * ranks everyone ONCE through Phase 17's `rankAnaesthetistCandidates` (one
 * request key per opening, the tier filter applied there) and splits the
 * ranking by availability, so the tier order holds inside each group:
 * - Free: free sessions with no not-preferred pairing, tier order, shuffled
 *   within a tier;
 * - "Not preferred with Ms Reid": free, with a not-preferred pairing, still
 *   selectable;
 * - Not available: a closed session (any closed status, its own label),
 *   selectable with a warning, tier order;
 * - Already has a List: never selectable; resolve it in the Day view first.
 * One tier filter narrows every group; "Everyone / Free only" is the
 * finder's own control. Admin only (Phase 17's privacy boundary).
 */

import { useMemo, useState, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import {
  PAIRING_LABELS,
  TIER_LABELS,
  rankAnaesthetistCandidates,
  tierFor,
  type RankedCandidate,
} from '../../../../domain/pairingPreferences'
import type { PriorityTier } from '../../../../domain/types'
import { pairingLine, slotTimeRange, titledSurname } from '../../../../shared/format'
import { effectiveSlotTimes } from '../../../../domain/slots'
import { StatusChip } from '../../../../shared'
import { Segmented } from '../../../../shared/ui'
import { draftListAvailabilityFor, useAppStore } from '../../../../store'
import { accent, neutral, radius, semantic } from '../../../../theme/tokens'
import { surnameFirst } from '../../util'
import { CandidateRow, FILTER_OPTIONS, Group, type TierFilter } from './AnaesthetistCandidates'
import { TierPill } from './Pills'
import { usePairingEntries, usePriorityTiers } from './useOfficePairings'

export type CandidateGroup = 'free' | 'notPreferred' | 'notAvailable'

type Reach = 'everyone' | 'free'
const REACH_OPTIONS: { value: Reach; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'free', label: 'Free only' },
]

export interface DraftListPick {
  anaesthetistId: string
  group: CandidateGroup
}

/** The ranked groups for one Draft List, from one ranking (exported for the drawer's short list and the tests). */
export function useDraftListCandidates(listId: string, requestKey: string, tierFilter: ReadonlySet<PriorityTier> | null) {
  const lists = useAppStore((s) => s.schedule.lists)
  const slots = useAppStore((s) => s.schedule.slots)
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const slotStatuses = useAppStore((s) => s.masters.slotStatuses)
  const entries = usePairingEntries()
  const tiers = usePriorityTiers()
  const surgeonId = useAppStore((s) => s.schedule.lists[listId]?.surgeonId)
  const settings = useAppStore((s) => s.appSettings.schedule)
  return useMemo(() => {
    const availability = draftListAvailabilityFor({ schedule: { lists, slots }, masters: { anaesthetists, slotStatuses } }, listId)
    if (availability === undefined) return undefined
    const freeIds = new Set(availability.free.map((r) => r.anaesthetistId))
    const closedIds = new Set(availability.notAvailable.map((r) => r.anaesthetistId))
    const ranked = rankAnaesthetistCandidates({
      candidates: [...availability.free, ...availability.notAvailable, ...availability.occupied].map((r) => r.anaesthetistId),
      entries,
      tiers,
      surgeonId,
      requestKey,
      tierFilter,
    })
    const shown = new Set([...ranked.clear, ...ranked.notPreferred].map((c) => c.anaesthetistId))
    // Not available keeps a not-preferred row (with its pill) among the rest:
    // the helper's two tier-ordered lists merged back by tier, nothing reshuffled.
    const notAvailable = mergeByTier(ranked.clear.filter((c) => closedIds.has(c.anaesthetistId)), ranked.notPreferred.filter((c) => closedIds.has(c.anaesthetistId)))
    const occupied = availability.occupied.filter((r) => shown.has(r.anaesthetistId))
    const statusOf = new Map([...availability.free, ...availability.notAvailable].map((r) => [r.anaesthetistId, r.statusKey]))
    const timesOf = new Map(
      [...availability.free, ...availability.notAvailable].flatMap((r) => {
        const slot = slots[r.slotId]
        return slot === undefined ? [] : [[r.anaesthetistId, slotTimeRange(effectiveSlotTimes(slot, settings))] as const]
      }),
    )
    const free = ranked.clear.filter((c) => freeIds.has(c.anaesthetistId))
    const notPreferred = ranked.notPreferred.filter((c) => freeIds.has(c.anaesthetistId))
    return { free, notPreferred, notAvailable, occupied, statusOf, timesOf, surgeonId }
  }, [lists, slots, anaesthetists, slotStatuses, entries, tiers, surgeonId, requestKey, tierFilter, listId, settings])
}

/** Two tier-ordered lists merged by tier, each keeping its own order within a tier. */
function mergeByTier(a: RankedCandidate[], b: RankedCandidate[]): RankedCandidate[] {
  const out: RankedCandidate[] = []
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    if (j >= b.length || (i < a.length && a[i]!.tier <= b[j]!.tier)) out.push(a[i++]!)
    else out.push(b[j++]!)
  }
  return out
}

export function DraftListCandidates({
  listId,
  requestKey,
  onPick,
  onOpenOccupied,
}: {
  listId: string
  requestKey: string
  onPick: (pick: DraftListPick) => void
  /** Open the List that already holds an anaesthetist's session (the Day view drawer). */
  onOpenOccupied: (listId: string) => void
}) {
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const lists = useAppStore((s) => s.schedule.lists)
  const hospitals = useAppStore((s) => s.masters.hospitals)
  const surgeons = useAppStore((s) => s.masters.surgeons)
  const tiers = usePriorityTiers()
  const [filter, setFilter] = useState<TierFilter>('all')
  const [reach, setReach] = useState<Reach>('everyone')
  const tierFilter = useMemo(() => (filter === 'all' ? null : new Set<PriorityTier>([Number(filter) as PriorityTier])), [filter])
  const groups = useDraftListCandidates(listId, requestKey, tierFilter)
  if (groups === undefined) return null

  const nameOf = (id: string) => surnameFirst(anaesthetists[id]?.name ?? id)
  const surgeonName = groups.surgeonId !== undefined ? surgeons[groups.surgeonId]?.name : undefined
  const everyone = reach === 'everyone'
  const shown = groups.free.length + groups.notPreferred.length + (everyone ? groups.notAvailable.length + groups.occupied.length : 0)
  const rows = (list: RankedCandidate[], group: CandidateGroup, trailing: (id: string) => ReactNode) =>
    list.map((c, i) => (
      <CandidateRow
        key={c.anaesthetistId}
        candidate={c}
        gapAbove={i > 0 && list[i - 1]?.tier !== c.tier}
        name={nameOf(c.anaesthetistId)}
        trailing={trailing(c.anaesthetistId)}
        onPick={() => onPick({ anaesthetistId: c.anaesthetistId, group })}
      />
    ))
  const statusTrailing = (id: string) => {
    const key = groups.statusOf.get(id)
    if (key === undefined) return null
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <StatusChip status={key} />
        <span className="mono" style={{ fontSize: 11, color: neutral.mist, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{groups.timesOf.get(id)}</span>
      </span>
    )
  }

  return (
    <div data-shot="draft-list-candidates" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div data-shot="draft-list-reach">
        <Segmented label="Show" value={reach} options={REACH_OPTIONS} onChange={setReach} />
      </div>
      <div data-shot="tier-filter">
        <Segmented label="Filter by tier" value={filter} options={FILTER_OPTIONS} onChange={setFilter} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 380, overflow: 'auto', paddingRight: 2 }}>
        {shown === 0 && (
          <div style={{ fontSize: 13, color: neutral.mist }}>
            {filter === 'all' ? 'No one has this session free.' : `No one in ${TIER_LABELS[Number(filter) as PriorityTier]} for this session.`}
          </div>
        )}
        {groups.free.length > 0 && (
          <Group shot="candidates-clear" heading="Free">
            {rows(groups.free, 'free', statusTrailing)}
          </Group>
        )}
        {groups.notPreferred.length > 0 && (
          <Group shot="candidates-not-preferred" heading={PAIRING_LABELS.notPreferredWith(titledSurname(surgeonName ?? ''))} warning>
            {rows(groups.notPreferred, 'notPreferred', statusTrailing)}
          </Group>
        )}
        {everyone && groups.notAvailable.length > 0 && (
          <Group shot="candidates-not-available" heading="Not available">
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: semantic.warning.onTint }}>
              <TriangleAlert size={13} aria-hidden style={{ color: semantic.warning.solid, flex: 'none' }} />
              Assigning one of these flags a conflict on the List. Check with them first.
            </div>
            {rows(groups.notAvailable, 'notAvailable', statusTrailing)}
          </Group>
        )}
        {everyone && groups.occupied.length > 0 && (
          <Group shot="candidates-occupied" heading="Already has a List">
            {groups.occupied.map((r) => {
              const held = lists[r.listId]
              const what = held !== undefined ? pairingLine(held, { hospitals, surgeons }) : 'a List'
              return (
                <div
                  key={r.anaesthetistId}
                  data-candidate-occupied={r.anaesthetistId}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: radius.card, border: `1px dashed ${neutral.lineStrong}`, background: neutral.bg }}
                >
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: neutral.mist }}>{nameOf(r.anaesthetistId)}</span>
                    <span style={{ fontSize: 12, color: neutral.slate }}>Holds {what}. Resolve it in the Day view first.</span>
                  </span>
                  <TierPill tier={tierFor(tiers, r.anaesthetistId)} />
                  <button
                    type="button"
                    onClick={() => onOpenOccupied(r.listId)}
                    style={{ border: 'none', background: 'none', color: accent.base, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Open List
                  </button>
                </div>
              )
            })}
          </Group>
        )}
      </div>
    </div>
  )
}
