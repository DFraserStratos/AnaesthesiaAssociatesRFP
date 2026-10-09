/**
 * The office's candidate list for a List (catch-up Phase 17; US-01.3.5
 * "Separated", "Still selectable"; US-01.3.6 "Ordered by tier", "Shuffled
 * within a tier", "Filter"; US-13.6.4). From `rankAnaesthetistCandidates`:
 * the clear group first, in tier order, then a separately headed "Not
 * preferred with Ms Reid" group whose rows stay clickable. Every row carries
 * its tier pill and, where it applies, a Preferred pill. Reused by Phase 28's
 * availability finder and Phase 31's Draft List assignment. Admin only: the
 * anaesthetists' own views of colleagues are never tier-ordered.
 */

import { useMemo, useState, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import {
  PAIRING_LABELS,
  TIER_LABELS,
  TIER_VALUES,
  rankAnaesthetistCandidates,
  type RankedCandidate,
} from '../../../../domain/pairingPreferences'
import type { PriorityTier } from '../../../../domain/types'
import { titledSurname } from '../../../../shared/format'
import { Segmented } from '../../../../shared/ui'
import { useAppStore } from '../../../../store'
import { neutral, radius, semantic } from '../../../../theme/tokens'
import { surnameFirst } from '../../util'
import { NotPreferredPill, PreferredPill, TierPill } from './Pills'
import { usePairingEntries, usePriorityTiers } from './useOfficePairings'

type TierFilter = 'all' | '1' | '2' | '3' | '4'

const FILTER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...TIER_VALUES.map((t) => ({ value: String(t) as TierFilter, label: TIER_LABELS[t] })),
]

interface AnaesthetistCandidatesProps {
  candidates: readonly string[]
  /** The List's surgeon; with none, there is one group, still tier-ordered. */
  surgeonId: string | undefined
  /** From `useSuggestionKey` (bumped once per open). */
  requestKey: string
  onPick: (anaesthetistId: string) => void
  /** Right-hand detail per row, e.g. "Free AM". */
  trailing?: (anaesthetistId: string) => ReactNode
  /** Shown when no one is a candidate at all. */
  emptyText: string
}

export function AnaesthetistCandidates({ candidates, surgeonId, requestKey, onPick, trailing, emptyText }: AnaesthetistCandidatesProps) {
  const anaesthetists = useAppStore((s) => s.masters.anaesthetists)
  const surgeonName = useAppStore((s) => (surgeonId !== undefined ? s.masters.surgeons[surgeonId]?.name : undefined))
  const entries = usePairingEntries()
  const tiers = usePriorityTiers()
  const [filter, setFilter] = useState<TierFilter>('all')

  const ranked = useMemo(
    () =>
      rankAnaesthetistCandidates({
        candidates,
        entries,
        tiers,
        surgeonId,
        requestKey,
        tierFilter: filter === 'all' ? null : new Set<PriorityTier>([Number(filter) as PriorityTier]),
      }),
    [candidates, entries, tiers, surgeonId, requestKey, filter],
  )

  if (candidates.length === 0) {
    return <div style={{ fontSize: 13, color: neutral.mist }}>{emptyText}</div>
  }

  const nameOf = (id: string) => surnameFirst(anaesthetists[id]?.name ?? id)
  const nothingInTier = ranked.clear.length === 0 && ranked.notPreferred.length === 0

  return (
    <div data-shot="candidate-picker" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div data-shot="tier-filter">
        <Segmented label="Filter by tier" value={filter} options={FILTER_OPTIONS} onChange={setFilter} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360, overflow: 'auto', paddingRight: 2 }}>
        {nothingInTier && <div style={{ fontSize: 13, color: neutral.mist }}>No one in {TIER_LABELS[Number(filter) as PriorityTier]} is free for this session.</div>}
        {ranked.clear.length > 0 && (
          <Group shot="candidates-clear" heading="In tier order">
            {ranked.clear.map((c, i) => (
              <CandidateRow key={c.anaesthetistId} candidate={c} gapAbove={i > 0 && ranked.clear[i - 1]?.tier !== c.tier} name={nameOf(c.anaesthetistId)} trailing={trailing?.(c.anaesthetistId)} onPick={onPick} />
            ))}
          </Group>
        )}
        {ranked.notPreferred.length > 0 && (
          <Group
            shot="candidates-not-preferred"
            heading={PAIRING_LABELS.notPreferredWith(titledSurname(surgeonName ?? ''))}
            warning
          >
            {ranked.notPreferred.map((c, i) => (
              <CandidateRow key={c.anaesthetistId} candidate={c} gapAbove={i > 0 && ranked.notPreferred[i - 1]?.tier !== c.tier} name={nameOf(c.anaesthetistId)} trailing={trailing?.(c.anaesthetistId)} onPick={onPick} />
            ))}
          </Group>
        )}
      </div>
    </div>
  )
}

function Group({ heading, warning, shot, children }: { heading?: string; warning?: boolean; shot: string; children: ReactNode }) {
  return (
    <section data-shot={shot} aria-label={heading ?? 'Suggested'} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {heading !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: warning === true ? semantic.warning.onTint : neutral.slate }}>
          {warning === true && <TriangleAlert size={14} aria-hidden style={{ color: semantic.warning.solid }} />}
          {heading}
        </div>
      )}
      {children}
    </section>
  )
}

function CandidateRow({
  candidate,
  name,
  trailing,
  gapAbove,
  onPick,
}: {
  candidate: RankedCandidate
  name: string
  trailing: ReactNode
  gapAbove: boolean
  onPick: (id: string) => void
}) {
  const notPreferred = candidate.notPreferredEntries.length > 0
  return (
    <button
      type="button"
      onClick={() => onPick(candidate.anaesthetistId)}
      data-candidate={candidate.anaesthetistId}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: gapAbove ? 6 : 0,
        padding: '10px 12px',
        borderRadius: radius.card,
        border: `1px solid ${notPreferred ? `${semantic.warning.solid}55` : neutral.line}`,
        background: neutral.surface,
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: neutral.ink, flex: 1, minWidth: 0 }}>{name}</span>
      {candidate.preferred && <PreferredPill />}
      {notPreferred && <NotPreferredPill />}
      <TierPill tier={candidate.tier} />
      {trailing !== undefined && trailing !== null && <span style={{ marginLeft: 4 }}>{trailing}</span>}
    </button>
  )
}
