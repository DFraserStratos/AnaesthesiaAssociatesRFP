import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox'
import { TriangleAlert } from 'lucide-react'
import { useAppStore } from '@proto/store'
import { resolveDisplayStatus } from '@proto/shared'
import { matchesNameQuery, pairingLine, titledSurname } from '@proto/shared/format'
import { PAIRING_LABELS, TIER_LABELS, TIER_VALUES, rankAnaesthetistCandidates, tierFor, tierLabel } from '@proto/domain/pairingPreferences'
import { surnameFirst } from '@proto/apps/admin/util'
import { usePairingEntries, usePriorityTiers } from '@proto/apps/admin/components/pairing'
import { useDraftListCandidates } from '@proto/apps/admin/components/pairing/DraftListCandidates'
import { DRAFT_LISTS } from '@proto/shared/scheduleTerms'
import { useAdminDay, useSeedIds } from '@proto/apps/demo/catalogue/admin/adminData'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { SearchFieldClear, SearchFieldIcon, searchFieldClass } from '../../shared/searchField'

const search = searchFieldClass('field')
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { Echo } from '../pilot-a/Echo'
import { tokenOf, type ResolvedStatus } from './statusFill'

type Tier = 1 | 2 | 3 | 4
type TierFilter = 'all' | '1' | '2' | '3' | '4'
interface RankedCandidate {
  anaesthetistId: string
  tier: Tier
  preferred: boolean
  notPreferredEntries: unknown[]
}
/** One selectable row in the listbox, in display order. */
interface Pickable {
  id: string
  group: 'clear' | 'free' | 'notPreferred'
  candidate: RankedCandidate
}

const TIER_OPTIONS: { value: TierFilter; label: string }[] = [{ value: 'all', label: 'All' }, ...(TIER_VALUES as Tier[]).map((t) => ({ value: String(t) as TierFilter, label: TIER_LABELS[t] as string }))]

// ---------------------------------------------------------------------------
// Shared parts
// ---------------------------------------------------------------------------

/**
 * The shuffle key, read only. The prototype's useSuggestionKey bumps the store's
 * suggestion sequence (a store write), which the replacement side must not do.
 * Instead this reads the sequence once after mount: the current example beside
 * it (an earlier sibling) has bumped it by then, so both sides share the key
 * `${scope}:${seq}` and show the same shuffle within each tier.
 */
function useReadOnlySuggestionKey(scope: string): string {
  const [seq, setSeq] = useState<number>(() => (useAppStore.getState() as { shell: { suggestionSeq: number } }).shell.suggestionSeq)
  // Read once only: StrictMode re-runs mount effects after every row's first pass, by which time
  // rows further down (their own useSuggestionKey) have bumped the sequence again.
  const read = useRef(false)
  useEffect(() => {
    if (read.current) return
    read.current = true
    setSeq((useAppStore.getState() as { shell: { suggestionSeq: number } }).shell.suggestionSeq)
  }, [])
  return `${scope}:${seq}`
}

/** A single-select ToggleGroup in the prototype's teal segmented look, with radio semantics (as the pilot Segmented). */
function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const labelId = useId()
  return (
    <div className="tw:flex tw:flex-col tw:gap-1.5">
      <FieldLabel id={labelId}>{label}</FieldLabel>
      <ToggleGroup
        variant="teal"
        role="radiogroup"
        aria-labelledby={labelId}
        className="tw:w-full"
        value={[value]}
        onValueChange={(next) => {
          const picked = next[0] as T | undefined
          if (picked !== undefined) onChange(picked)
        }}
      >
        {options.map((o) => (
          <ToggleGroupItem key={o.value} value={o.value} role="radio" aria-checked={o.value === value} aria-pressed={undefined} className="tw:min-w-0">
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

function TierPill({ tier }: { tier: Tier }) {
  return <Badge data-tier={tier}>{tierLabel(tier)}</Badge>
}

function PairingPills({ candidate }: { candidate: RankedCandidate }) {
  return (
    <>
      {candidate.preferred && <Badge className="tw:bg-teal-tint tw:text-teal-pressed">{PAIRING_LABELS.kind.PREFERRED}</Badge>}
      {candidate.notPreferredEntries.length > 0 && <Badge className="tw:border tw:border-warning tw:bg-surface tw:text-warning-on-tint">{PAIRING_LABELS.kind.NOT_PREFERRED}</Badge>}
    </>
  )
}

function GroupHeading({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  return (
    <div className={cn('tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-semibold', warning ? 'tw:text-warning-on-tint' : 'tw:text-slate')}>
      {warning && <TriangleAlert className="tw:size-3.5 tw:text-warning" aria-hidden />}
      {children}
    </div>
  )
}

/**
 * The picker body on Base UI Combobox rendered inline: the name box is the
 * combobox input, the ranked rows its listbox (grouped with Group and
 * GroupLabel), so arrows, Home/End and Enter work from the box and the first
 * match is highlighted as she types. The ranking is untouched: the prototype's
 * rankAnaesthetistCandidates orders the rows and the type-ahead only narrows.
 * Rows that are never selectable (not available, already has a List) render
 * inside the list as plain rows, outside the listbox's options.
 */
function CandidateListbox({
  pickables,
  query,
  onQuery,
  onPick,
  nameOf,
  trailing,
  headingFor,
  emptyText,
  extra,
}: {
  pickables: Pickable[]
  query: string
  onQuery: (q: string) => void
  onPick: (p: Pickable) => void
  nameOf: (id: string) => string
  trailing: (p: Pickable) => ReactNode
  headingFor: (group: Pickable['group']) => { text: string; warning?: boolean } | undefined
  emptyText: string | null
  extra?: ReactNode
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const groups = useMemo(() => {
    const out: { group: Pickable['group']; rows: { p: Pickable; index: number }[] }[] = []
    pickables.forEach((p, index) => {
      const last = out[out.length - 1]
      if (last !== undefined && last.group === p.group) last.rows.push({ p, index })
      else out.push({ group: p.group, rows: [{ p, index }] })
    })
    return out
  }, [pickables])

  return (
    <ComboboxPrimitive.Root<Pickable>
      inline
      open
      items={pickables}
      filteredItems={pickables}
      inputValue={query}
      onInputValueChange={(v) => onQuery(v)}
      value={null}
      onValueChange={(p) => {
        if (p !== null) onPick(p)
      }}
      itemToStringLabel={(p) => nameOf(p.id)}
      isItemEqualToValue={(a, b) => a.id === b.id}
      autoHighlight={query.trim() !== ''}
    >
      <div className="tw:flex tw:flex-col tw:gap-1.5">
        <InputGroup className={search.group}>
          <SearchFieldIcon />
          <ComboboxPrimitive.Input
            ref={inputRef}
            aria-label="Find an anaesthetist"
            placeholder="Type a name"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            render={<InputGroupInput className={search.input} />}
          />
          {query !== '' && (
            <SearchFieldClear
              onClear={() => {
                onQuery('')
                inputRef.current?.focus()
              }}
            />
          )}
        </InputGroup>
      </div>
      <div className="tw:flex tw:max-h-[360px] tw:flex-col tw:gap-3 tw:overflow-auto tw:pr-0.5">
        {emptyText !== null && <div className="tw:text-[13px] tw:text-mist">{emptyText}</div>}
        <ComboboxPrimitive.List aria-label="Candidates" className="tw:flex tw:flex-col tw:gap-3 tw:outline-none tw:data-empty:hidden">
          {groups.map(({ group, rows }) => {
            const heading = headingFor(group)
            return (
              <ComboboxPrimitive.Group key={group} className="tw:flex tw:flex-col tw:gap-1.5">
                {heading !== undefined && (
                  <ComboboxPrimitive.GroupLabel render={<div />}>
                    <GroupHeading warning={heading.warning}>{heading.text}</GroupHeading>
                  </ComboboxPrimitive.GroupLabel>
                )}
                {rows.map(({ p, index }, i) => {
                  const notPreferred = p.candidate.notPreferredEntries.length > 0
                  const gapAbove = i > 0 && rows[i - 1]!.p.candidate.tier !== p.candidate.tier
                  return (
                    <ComboboxPrimitive.Item
                      key={p.id}
                      index={index}
                      value={p}
                      data-candidate={p.id}
                      className={cn(
                        'tw:flex tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-card tw:border tw:bg-surface tw:px-3 tw:py-2.5 tw:text-left tw:outline-none tw:select-none tw:data-highlighted:bg-sunken',
                        notPreferred ? 'tw:border-[color-mix(in_srgb,var(--warning)_33%,transparent)]' : 'tw:border-line',
                        gapAbove && 'tw:mt-1.5',
                      )}
                    >
                      <span className="tw:min-w-0 tw:flex-1 tw:text-[13px] tw:font-semibold tw:text-ink">{nameOf(p.id)}</span>
                      <PairingPills candidate={p.candidate} />
                      <TierPill tier={p.candidate.tier} />
                      <span className="tw:ml-1">{trailing(p)}</span>
                    </ComboboxPrimitive.Item>
                  )
                })}
              </ComboboxPrimitive.Group>
            )
          })}
        </ComboboxPrimitive.List>
        {extra}
      </div>
    </ComboboxPrimitive.Root>
  )
}

// ---------------------------------------------------------------------------
// AnaesthetistCandidates
// ---------------------------------------------------------------------------

export function AnaesthetistCandidatesReplacement() {
  const { todayISO } = useSeedIds()
  const day = useAdminDay(todayISO, 8) as { anaesthetists: { registrationNumber: string }[] }
  const surgeons = useAppStore((s: { masters: { surgeons: Record<string, { name: string }> } }) => s.masters.surgeons) as Record<string, { name: string }>
  const anaesthetists = useAppStore((s: { masters: { anaesthetists: unknown } }) => s.masters.anaesthetists) as Record<string, { name: string }>
  const surgeonId = useMemo(() => Object.keys(surgeons).sort()[0], [surgeons])
  const requestKey = useReadOnlySuggestionKey('catalogue-candidates')
  const entries = usePairingEntries()
  const tiers = usePriorityTiers()
  const [filter, setFilter] = useState<TierFilter>('all')
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const candidates = useMemo(() => day.anaesthetists.map((a) => a.registrationNumber), [day.anaesthetists])

  const ranked = useMemo(
    () =>
      rankAnaesthetistCandidates({
        candidates,
        entries,
        tiers,
        surgeonId,
        requestKey,
        tierFilter: filter === 'all' ? null : new Set<Tier>([Number(filter) as Tier]),
      }) as { clear: RankedCandidate[]; notPreferred: RankedCandidate[] },
    [candidates, entries, tiers, surgeonId, requestKey, filter],
  )
  const keep = (c: RankedCandidate) => matchesNameQuery(anaesthetists[c.anaesthetistId]?.name ?? '', query) as boolean
  const pickables: Pickable[] = [
    ...ranked.clear.filter(keep).map((c) => ({ id: c.anaesthetistId, group: 'clear' as const, candidate: c })),
    ...ranked.notPreferred.filter(keep).map((c) => ({ id: c.anaesthetistId, group: 'notPreferred' as const, candidate: c })),
  ]
  const surgeonName = surgeonId !== undefined ? surgeons[surgeonId]?.name : undefined
  const nameOf = (id: string) => surnameFirst(anaesthetists[id]?.name ?? id) as string
  const empty = pickables.length === 0 ? (query.trim() !== '' ? 'No anaesthetist matches' : `No one in ${TIER_LABELS[Number(filter) as Tier]} is free for this session.`) : null

  return (
    <div>
      <div className="tw:flex tw:flex-col tw:gap-3">
        <Segmented label="Filter by tier" value={filter} options={TIER_OPTIONS} onChange={setFilter} />
        <CandidateListbox
          pickables={pickables}
          query={query}
          onQuery={setQuery}
          onPick={(p) => setPicked(p.id)}
          nameOf={nameOf}
          trailing={() => <span className="tw:text-xs tw:text-slate">Today</span>}
          headingFor={(g) => (g === 'notPreferred' ? { text: PAIRING_LABELS.notPreferredWith(titledSurname(surgeonName ?? '')) as string, warning: true } : { text: 'In tier order' })}
          emptyText={empty}
        />
      </div>
      <Echo>{picked === null ? 'Pick a candidate.' : `Picked ${picked}`}</Echo>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DraftListCandidates
// ---------------------------------------------------------------------------

type Reach = 'everyone' | 'free'
const REACH_OPTIONS: { value: Reach; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'free', label: 'Free only' },
]

interface DraftGroups {
  free: RankedCandidate[]
  notPreferred: RankedCandidate[]
  notAvailable: RankedCandidate[]
  occupied: { anaesthetistId: string; listId: string }[]
  statusOf: Map<string, string>
  slotOf: Map<string, string>
  timesOf: Map<string, string>
  surgeonId?: string
}

export function DraftListCandidatesReplacement() {
  const { draftListId } = useSeedIds() as { draftListId?: string }
  const requestKey = useReadOnlySuggestionKey(draftListId ?? 'none')
  if (draftListId === undefined) return <div className="tw:text-[13px] tw:text-mist">The seed has no {DRAFT_LISTS} right now (try Demo reset).</div>
  return <DraftCandidates listId={draftListId} requestKey={requestKey} />
}

function DraftCandidates({ listId, requestKey }: { listId: string; requestKey: string }) {
  const anaesthetists = useAppStore((s: { masters: { anaesthetists: unknown } }) => s.masters.anaesthetists) as Record<string, { name: string }>
  const lists = useAppStore((s: { schedule: { lists: unknown } }) => s.schedule.lists) as Record<string, unknown>
  const hospitals = useAppStore((s: { masters: { hospitals: unknown } }) => s.masters.hospitals)
  const surgeons = useAppStore((s: { masters: { surgeons: unknown } }) => s.masters.surgeons) as Record<string, { name: string }>
  const slotStatuses = useAppStore((s: { masters: { slotStatuses: unknown } }) => s.masters.slotStatuses)
  const tiers = usePriorityTiers()
  const [filter, setFilter] = useState<TierFilter>('all')
  const [reach, setReach] = useState<Reach>('everyone')
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const tierFilter = useMemo(() => (filter === 'all' ? null : new Set<Tier>([Number(filter) as Tier])), [filter])
  const ranked = useDraftListCandidates(listId, requestKey, tierFilter) as DraftGroups | undefined
  if (ranked === undefined) return null

  const keep = (id: string) => matchesNameQuery(anaesthetists[id]?.name ?? '', query) as boolean
  const free = ranked.free.filter((c) => keep(c.anaesthetistId))
  const notPreferred = ranked.notPreferred.filter((c) => keep(c.anaesthetistId))
  const notAvailable = ranked.notAvailable.filter((c) => keep(c.anaesthetistId))
  const occupied = ranked.occupied.filter((r) => keep(r.anaesthetistId))
  const everyone = reach === 'everyone'
  const nameOf = (id: string) => surnameFirst(anaesthetists[id]?.name ?? id) as string
  const surgeonName = ranked.surgeonId !== undefined ? surgeons[ranked.surgeonId]?.name : undefined
  const shown = free.length + notPreferred.length + (everyone ? notAvailable.length + occupied.length : 0)
  const pickables: Pickable[] = [
    ...free.map((c) => ({ id: c.anaesthetistId, group: 'free' as const, candidate: c })),
    ...notPreferred.map((c) => ({ id: c.anaesthetistId, group: 'notPreferred' as const, candidate: c })),
  ]
  const empty = shown === 0 ? (query.trim() !== '' ? 'No anaesthetist matches' : filter === 'all' ? 'No one has this session free.' : `No one in ${TIER_LABELS[Number(filter) as Tier]} for this session.`) : null

  const statusBadge = (id: string) => {
    const key = ranked.statusOf.get(id)
    if (key === undefined) return null
    const resolved = resolveDisplayStatus(key, slotStatuses) as ResolvedStatus
    return <Badge variant={tokenOf(resolved).token}>{resolved.label}</Badge>
  }

  return (
    <div>
      <div className="tw:flex tw:flex-col tw:gap-3">
        <Segmented label="Show" value={reach} options={REACH_OPTIONS} onChange={setReach} />
        <Segmented label="Filter by tier" value={filter} options={TIER_OPTIONS} onChange={setFilter} />
        <CandidateListbox
          pickables={pickables}
          query={query}
          onQuery={setQuery}
          onPick={(p) => setPicked(`${p.id} (${p.group})`)}
          nameOf={nameOf}
          trailing={(p) => (
            <span className="tw:inline-flex tw:items-center tw:gap-1.5">
              {statusBadge(p.id)}
              <span className="tw:font-mono tw:text-[11px] tw:whitespace-nowrap tw:text-mist">{ranked.timesOf.get(p.id)}</span>
            </span>
          )}
          headingFor={(g) => (g === 'notPreferred' ? { text: PAIRING_LABELS.notPreferredWith(titledSurname(surgeonName ?? '')) as string, warning: true } : { text: 'Free' })}
          emptyText={empty}
          extra={
            everyone && (
              <>
                {notAvailable.length > 0 && (
                  <section aria-label="Not available" className="tw:flex tw:flex-col tw:gap-1.5">
                    <GroupHeading>Not available</GroupHeading>
                    {notAvailable.map((c) => (
                      <div key={c.anaesthetistId} role="group" aria-label={`${nameOf(c.anaesthetistId)}: not available this session`} className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:rounded-card tw:border tw:border-dashed tw:border-line-strong tw:bg-background tw:px-3 tw:py-2.5">
                        <span className="tw:flex tw:min-w-[140px] tw:flex-1 tw:flex-col tw:gap-0.5">
                          <span className="tw:text-[13px] tw:font-semibold tw:text-slate">{nameOf(c.anaesthetistId)}</span>
                          <span className="tw:text-xs tw:text-mist">Not available this session</span>
                        </span>
                        {statusBadge(c.anaesthetistId)}
                        <TierPill tier={c.tier} />
                        <Button variant="link" className="tw:text-xs!" onClick={() => setPicked(`Ask ${nameOf(c.anaesthetistId)} to make the session available (stubbed)`)}>
                          Ask to make available
                        </Button>
                      </div>
                    ))}
                  </section>
                )}
                {occupied.length > 0 && (
                  <section aria-label="Already has a List" className="tw:flex tw:flex-col tw:gap-1.5">
                    <GroupHeading>Already has a List</GroupHeading>
                    {occupied.map((r) => {
                      const held = lists[r.listId]
                      const what = held !== undefined ? (pairingLine(held, { hospitals, surgeons }) as string) : 'a List'
                      return (
                        <div key={r.anaesthetistId} className="tw:flex tw:items-center tw:gap-2 tw:rounded-card tw:border tw:border-dashed tw:border-line-strong tw:bg-background tw:px-3 tw:py-2.5">
                          <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-0.5">
                            <span className="tw:text-[13px] tw:font-semibold tw:text-mist">{nameOf(r.anaesthetistId)}</span>
                            <span className="tw:text-xs tw:text-slate">Holds {what}. Resolve it in the Day view first.</span>
                          </span>
                          <TierPill tier={tierFor(tiers, r.anaesthetistId) as Tier} />
                          <Button variant="link" onClick={() => setPicked(`Open occupied List ${r.listId} (stubbed)`)}>
                            Open List
                          </Button>
                        </div>
                      )
                    })}
                  </section>
                )}
              </>
            )
          }
        />
      </div>
      <Echo>{picked === null ? 'Pick a candidate.' : `Picked ${picked}`}</Echo>
    </div>
  )
}
