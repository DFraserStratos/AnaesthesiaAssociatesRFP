import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CONTRACT_BY_ID, FIT_LABEL, HOSPITALS, type Fit, type HolderKind, PROCEDURES, basisOf, contractsFor, fitOf, linesOf, matches, type Contract, type MappedLine, type MappedProcedure, type Scenario, type Selection } from '../data'
import { KIND } from '../theme/kinds'
import { accent, neutral, semantic } from '../theme/tokens'
import { KindDot, Pill } from '../ui'
import { ContractRow, GroupHeader, LineRow, Note, RvgTypeahead, ScrollArea, SearchField, Toolbar, isContract } from './shared'

/**
 * The lists behind each approach's fields. All share the same data, search
 * (every word must appear) and context filter, so the approaches compare like
 * for like. Each reports how many pickable rows it shows.
 */

/** The colour a fit group's header takes: the kind of holder it gathers. */
const FIT_KIND: Record<Fit, HolderKind | undefined> = { default: 'aa', hospital: 'hospital', surgeon: 'surgeon', anaesthetist: 'anaesthetist', insurer: 'insurer', none: undefined }

/**
 * Organisation order: how they fit the booking (as the Contract list), the
 * booking's own hospital ahead of rooms that also work there, then by name.
 */
const FIT_RANK: Record<Fit, number> = { default: 0, hospital: 1, surgeon: 2, anaesthetist: 3, insurer: 4, none: 5 }
function byOrganisation(a: { fit: Fit; kind: HolderKind; name: string }, b: { fit: Fit; kind: HolderKind; name: string }) {
  return FIT_RANK[a.fit] - FIT_RANK[b.fit] || Number(b.kind === 'hospital') - Number(a.kind === 'hospital') || a.name.localeCompare(b.name)
}

interface Base {
  onRows: (n: number) => void
  /** The key typed on the closed field: the search starts with it. */
  seed?: string
}

/**
 * What the context filter is doing, at the top of every Contract list: whose
 * Contracts are shown and how many of all of them, or that the filter is off.
 */
function ContextNote({ scenario, useContext }: { scenario: Scenario; useContext: boolean }) {
  const all = contractsFor(scenario, false).length
  const text = useContext
    ? `For this booking: ${HOSPITALS[scenario.hospitalId]}, ${scenario.surgeon.name}, ${scenario.anaesthetist.name} · ${contractsFor(scenario, true).length} of ${all} Contracts`
    : `Context filter off · all ${all} Contracts`
  return <div style={{ padding: '6px 20px', fontSize: 12.5, color: useContext ? neutral.slate : semantic.warning.onTint, background: useContext ? neutral.surface : semantic.warning.tint, borderBottom: `1px solid ${neutral.line}` }}>{text}</div>
}

function useRows(n: number, onRows: (n: number) => void) {
  useEffect(() => onRows(n), [n, onRows])
}

// ── Approach 1: the procedure list ──────────────────────────────────────────

export function ProcedureList({ selectedId, onPick, onRows, seed }: Base & { selectedId?: string; onPick: (p: MappedProcedure) => void }) {
  const [q, setQ] = useState(seed ?? '')
  const shown = useMemo(() => PROCEDURES.filter((p) => matches(q, p.name, p.section, p.subgroup, p.rvg)), [q])
  useRows(shown.length, onRows)
  let last = ''
  return (
    <>
      <Toolbar>
        <SearchField autoFocus value={q} onChange={setQ} placeholder="Search 409 procedures" />
      </Toolbar>
      <ScrollArea>
        {shown.map((p) => {
          const header = p.section !== last ? p.section : null
          last = p.section
          const on = p.id === selectedId
          return (
            <div key={p.id}>
              {header && <GroupHeader count={shown.filter((x) => x.section === p.section).length}>{header.replace(/^\d+ - /, '')}</GroupHeader>}
              <button type="button" data-pick className="aa-row" aria-pressed={on} onClick={() => onPick(p)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', border: 'none', borderBottom: `1px solid ${neutral.line}`, background: on ? accent.tint : 'transparent', boxShadow: on ? `inset 3px 0 0 ${accent.base}` : 'none', padding: '9px 20px', cursor: 'pointer' }}>
                <span style={{ flex: 1, fontSize: 14 }}>{p.name}</span>
                <span style={{ fontSize: 12, color: neutral.mist }}>{p.subgroup.replace(/^\d+ - /, '')}</span>
                {p.rvg && <Pill tone="accent" mono>{p.rvg}</Pill>}
              </button>
            </div>
          )
        })}
        {shown.length === 0 && <Note>No procedure in the list matches. It would need adding to the list first.</Note>}
      </ScrollArea>
    </>
  )
}

// ── Approach 1: Contracts with a line for the procedure ─────────────────────

export function ContractsForProcedure({ procedure, scenario, useContext, pending, onPick, onRows, seed }: Base & { procedure: MappedProcedure; scenario: Scenario; useContext: boolean; pending: Selection | null; onPick: (s: Selection) => void }) {
  const [q, setQ] = useState(seed ?? '')
  // Grouped by organisation (contract holder), in the Contract list's order: under
  // each, its lines linked to the procedure and its Contracts priced from the RVG.
  const groups = useMemo(() => {
    const byHolder = new Map<string, { name: string; kind: HolderKind; fit: Fit; schedules: Set<string>; rows: Row[] }>()
    for (const c of contractsFor(scenario, useContext)) {
      if (c.isDefault) continue
      const rows: Row[] =
        c.pricing.kind === 'lines'
          ? linesOf(c.id)
              .filter((l) => l.families.some((f) => procedure.families.includes(f)) && matches(q, c.holder, c.name, l.code, l.description, l.band))
              .map((line) => ({ kind: 'line', contract: c, line }))
          : matches(q, c.holder, c.name) ? [{ kind: 'contract', contract: c }] : []
      if (rows.length === 0) continue
      const g = byHolder.get(c.holder) ?? { name: c.holder, kind: c.holderKind, fit: fitOf(c, scenario), schedules: new Set<string>(), rows: [] }
      g.schedules.add(c.id)
      g.rows.push(...rows)
      byHolder.set(c.holder, g)
    }
    return [...byHolder.entries()].sort(([, a], [, b]) => byOrganisation(a, b))
  }, [procedure, scenario, useContext, q])
  useRows(1 + groups.reduce((n, [, g]) => n + g.rows.length, 0), onRows)
  const noContract = CONTRACT_BY_ID.get('no-contract')!
  const noContractFixed = CONTRACT_BY_ID.get('no-contract-fixed')!
  const rvgOf = procedure.rvg ?? undefined
  return (
    <>
      <Toolbar>
        <SearchField autoFocus value={q} onChange={setQ} placeholder={`Contracts with a line for ${procedure.name}`} />
      </Toolbar>
      <ContextNote scenario={scenario} useContext={useContext} />
      <ScrollArea>
        <GroupHeader kind="aa">Default</GroupHeader>
        <ContractRow contract={noContract} selected={isContract(pending, noContract.id)} onClick={() => onPick({ contractId: noContract.id, rvgCode: rvgOf })} />
        <ContractRow contract={noContractFixed} selected={isContract(pending, noContractFixed.id)} onClick={() => onPick({ contractId: noContractFixed.id })} />
        {procedure.families.length === 0 && <Note>No Contract lines are linked to this procedure yet. The links are a list someone keeps up to date by hand.</Note>}
        {groups.map(([holder, g]) => (
          <div key={holder}>
            <GroupHeader kind={g.kind} count={g.rows.length}>{holder}</GroupHeader>
            {g.rows.map((r) =>
              r.kind === 'contract' ? (
                <ContractRow key={r.contract.id} contract={r.contract} selected={isContract(pending, r.contract.id)} onClick={() => onPick({ contractId: r.contract.id, rvgCode: rvgOf })} />
              ) : (
                <LineRow key={r.line.id} line={r.line} context={g.schedules.size > 1 ? r.contract : undefined} selected={pending?.lineId === r.line.id} onClick={() => onPick({ contractId: r.contract.id, lineId: r.line.id })} />
              ),
            )}
          </div>
        ))}
      </ScrollArea>
    </>
  )
}

// ── Approach 2: Contracts, then a Contract's lines ──────────────────────────

export function ContractList({ scenario, useContext, narrow, onNarrow, pendingContractId, onPick, onRows, seed }: Base & { scenario: Scenario; useContext: boolean; narrow?: string; onNarrow: (code: string | undefined) => void; pendingContractId?: string; onPick: (c: Contract) => void }) {
  const [q, setQ] = useState(seed ?? '')
  const contracts = useMemo(
    () => contractsFor(scenario, useContext).filter((c) => matches(q, c.name, c.holder) && (!narrow || c.pricing.kind === 'rvg' || linesOf(c.id).some((l) => l.rvgs.includes(narrow)))),
    [scenario, useContext, q, narrow],
  )
  useRows(contracts.length, onRows)
  let last = ''
  return (
    <>
      <Toolbar>
        <RvgTypeahead value={narrow} onChange={onNarrow} placeholder="Narrow by RVG code (optional)" />
      </Toolbar>
      <Toolbar>
        <SearchField autoFocus value={q} onChange={setQ} placeholder="Search Contracts by name or holder" />
      </Toolbar>
      <ContextNote scenario={scenario} useContext={useContext} />
      <ScrollArea>
        {contracts.map((c) => {
          const fit = fitOf(c, scenario)
          const header = fit !== last ? FIT_LABEL[fit] : null
          last = fit
          const hasLines = c.pricing.kind === 'lines'
          const matching = narrow && hasLines ? linesOf(c.id).filter((l) => l.rvgs.includes(narrow)).length : null
          return (
            <div key={c.id}>
              {header && <GroupHeader kind={FIT_KIND[fit]} count={contracts.filter((x) => fitOf(x, scenario) === fit).length}>{header}</GroupHeader>}
              <ContractRow contract={c} selected={pendingContractId === c.id} aside={
                  // Say up front whether a second layer follows: lines to choose, or none (priced from the RVG).
                  hasLines ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flex: 'none' }}>
                      {matching !== null && <Pill tone="accent">{matching} matching</Pill>}
                      <ChevronRight size={16} color={neutral.mist} />
                    </span>
                  ) : c.isDefault ? undefined : (
                    <Pill>No lines</Pill>
                  )
                } onClick={() => onPick(c)} />
            </div>
          )
        })}
        {contracts.length === 0 && <Note>No Contract matches.</Note>}
      </ScrollArea>
    </>
  )
}

export function LineList({ contract, narrow, selectedLineId, onPick, onBack, onRows, seed }: Base & { contract: Contract; narrow?: string; selectedLineId?: string; onPick: (l: MappedLine) => void; onBack: () => void }) {
  const [q, setQ] = useState(seed ?? '')
  const lines = useMemo(() => linesOf(contract.id).filter((l) => (!narrow || l.rvgs.includes(narrow)) && matches(q, l.code, l.description, l.band)), [contract, narrow, q])
  useRows(lines.length, onRows)
  return (
    <div
      style={{ display: 'contents' }}
      onKeyDown={(e) => {
        // Backspace on an empty search steps back to the Contracts, as Back does.
        if (e.key === 'Backspace' && q === '') {
          e.preventDefault()
          onBack()
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: `1px solid ${neutral.line}`, background: neutral.bg }}>
        <button type="button" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: `1px solid ${neutral.lineStrong}`, background: neutral.surface, borderRadius: 8, padding: '4px 10px 4px 6px', fontSize: 13, fontWeight: 600, color: accent.base, cursor: 'pointer', flex: 'none' }}>
          <ChevronLeft size={15} /> Contracts
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contract.name}</div>
          <div style={{ fontSize: 12, color: neutral.slate }}>{contract.holder} · {basisOf(contract)}</div>
        </div>
      </div>
      <Toolbar>
        <SearchField autoFocus value={q} onChange={setQ} placeholder={`Search ${linesOf(contract.id).length} lines by code, description or band`} />
        {narrow && <Pill tone="accent" mono>RVG {narrow}</Pill>}
      </Toolbar>
      <ScrollArea>
        <GroupHeader kind={contract.holderKind} count={lines.length}>Lines</GroupHeader>
        {lines.map((l) => (
          <LineRow key={l.id} line={l} selected={selectedLineId === l.id} onClick={() => onPick(l)} />
        ))}
        {lines.length === 0 && <Note>No line matches. Clear the search or the RVG code.</Note>}
      </ScrollArea>
    </div>
  )
}

/**
 * Approach 2 in one list with two layers: the Contracts, then the chosen
 * Contract's lines. A Contract priced from the RVG has no lines, so it is
 * picked at the first layer. Reopening starts on the current Contract's lines.
 */
export function ContractThenLinesList({ scenario, useContext, narrow, onNarrow, pending, onPick, onStep, onRows, seed }: Base & { scenario: Scenario; useContext: boolean; narrow?: string; onNarrow: (code: string | undefined) => void; pending: Selection | null; onPick: (s: Selection) => void; onStep: () => void }) {
  const current = pending ? CONTRACT_BY_ID.get(pending.contractId) : undefined
  const [open, setOpen] = useState<Contract | null>(current?.pricing.kind === 'lines' && !seed ? current : null)
  if (open) {
    return (
      <LineList
        key={open.id}
        contract={open}
        narrow={narrow}
        selectedLineId={pending?.lineId}
        onRows={onRows}
        onPick={(l) => onPick({ contractId: open.id, lineId: l.id })}
        onBack={() => {
          setOpen(null)
          onStep()
        }}
      />
    )
  }
  return (
    <ContractList
      seed={seed}
      scenario={scenario}
      useContext={useContext}
      narrow={narrow}
      onNarrow={onNarrow}
      pendingContractId={pending?.contractId}
      onRows={onRows}
      onPick={(c) => {
        if (c.pricing.kind === 'lines') {
          setOpen(c)
          onStep()
        } else onPick({ contractId: c.id, rvgCode: narrow })
      }}
    />
  )
}

// ── Approach 3: the organisation, then its Contracts ────────────────────────

interface Holder {
  name: string
  kind: HolderKind
  fit: Fit
  contracts: Contract[]
}

/** The organisations (contract holders) the booking can use, in the Contract list's order. */
function holdersFor(scenario: Scenario, useContext: boolean, narrow?: string): Holder[] {
  const byName = new Map<string, Holder>()
  for (const c of contractsFor(scenario, useContext)) {
    if (c.isDefault) continue
    if (narrow && c.pricing.kind === 'lines' && !linesOf(c.id).some((l) => l.rvgs.includes(narrow))) continue
    const h = byName.get(c.holder) ?? { name: c.holder, kind: c.holderKind, fit: fitOf(c, scenario), contracts: [] }
    h.contracts.push(c)
    byName.set(c.holder, h)
  }
  return [...byName.values()].sort(byOrganisation)
}

/** The rows an organisation offers: each priced line is a Contract, an RVG-priced Contract is one row. */
function rowsOf(holder: Holder, narrow?: string): Row[] {
  return holder.contracts.flatMap((c): Row[] =>
    c.pricing.kind === 'lines' ? linesOf(c.id).filter((l) => !narrow || l.rvgs.includes(narrow)).map((line) => ({ kind: 'line', contract: c, line })) : [{ kind: 'contract', contract: c }],
  )
}

/**
 * Approach 3 in one list with two layers: the organisations (contract holders),
 * then everything that organisation offers as single Contracts. No contract
 * (RVG) is pinned at the top and picked directly. Reopening starts on the
 * current organisation.
 */
export function HolderThenContractsList({ scenario, useContext, narrow, onNarrow, pending, onPick, onStep, onRows, seed }: Base & { scenario: Scenario; useContext: boolean; narrow?: string; onNarrow: (code: string | undefined) => void; pending: Selection | null; onPick: (s: Selection) => void; onStep: () => void }) {
  const current = pending ? CONTRACT_BY_ID.get(pending.contractId) : undefined
  const [holderName, setHolderName] = useState<string | null>(current && !current.isDefault && !seed ? current.holder : null)
  const [q, setQ] = useState(seed ?? '')
  const holders = useMemo(() => holdersFor(scenario, useContext, narrow), [scenario, useContext, narrow])
  const holder = holderName ? holders.find((h) => h.name === holderName) : undefined

  const shownHolders = useMemo(() => holders.filter((h) => matches(q, h.name, ...h.contracts.map((c) => c.name))), [holders, q])
  const rows = useMemo(() => (holder ? rowsOf(holder, narrow).filter((r) => (r.kind === 'line' ? matches(q, r.contract.name, r.line.code, r.line.description, r.line.band) : matches(q, r.contract.name))) : []), [holder, narrow, q])
  useRows(holder ? rows.length : shownHolders.length + 1, onRows)

  const noContract = CONTRACT_BY_ID.get('no-contract')!
  const noContractFixed = CONTRACT_BY_ID.get('no-contract-fixed')!

  if (holder) {
    const back = () => {
      setHolderName(null)
      setQ('')
      onStep()
    }
    return (
      <div
        style={{ display: 'contents' }}
        onKeyDown={(e) => {
          if (e.key === 'Backspace' && q === '') {
            e.preventDefault()
            back()
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: `1px solid ${neutral.line}`, background: neutral.bg }}>
          <button type="button" onClick={back} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: `1px solid ${neutral.lineStrong}`, background: neutral.surface, borderRadius: 8, padding: '4px 10px 4px 6px', fontSize: 13, fontWeight: 600, color: accent.base, cursor: 'pointer', flex: 'none' }}>
            <ChevronLeft size={15} /> Organisations
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <KindDot kind={holder.kind} />
              {holder.name}
            </div>
            <div style={{ fontSize: 12, color: neutral.slate }}>
              {KIND[holder.kind].label} · {holder.contracts.length} {holder.contracts.length === 1 ? 'schedule' : 'schedules'}
            </div>
          </div>
        </div>
        <Toolbar>
          <SearchField autoFocus value={q} onChange={setQ} placeholder={`Search ${holder.name}'s Contracts by code, description or band`} />
          {narrow && <Pill tone="accent" mono>RVG {narrow}</Pill>}
        </Toolbar>
        <ScrollArea>
          <GroupHeader kind={holder.kind} count={rows.length}>Contracts</GroupHeader>
          {rows.map((r) =>
            r.kind === 'contract' ? (
              <ContractRow key={r.contract.id} contract={r.contract} selected={isContract(pending, r.contract.id)} onClick={() => onPick({ contractId: r.contract.id, rvgCode: narrow })} />
            ) : (
              <LineRow key={r.line.id} line={r.line} context={holder.contracts.length > 1 ? r.contract : undefined} selected={pending?.lineId === r.line.id} onClick={() => onPick({ contractId: r.contract.id, lineId: r.line.id })} />
            ),
          )}
          {rows.length === 0 && <Note>No Contract matches. Clear the search or the RVG code.</Note>}
        </ScrollArea>
      </div>
    )
  }

  let last = ''
  return (
    <>
      <Toolbar>
        <RvgTypeahead value={narrow} onChange={onNarrow} placeholder="Narrow by RVG code (optional)" />
      </Toolbar>
      <Toolbar>
        <SearchField autoFocus value={q} onChange={setQ} placeholder="Search organisations" />
      </Toolbar>
      <ContextNote scenario={scenario} useContext={useContext} />
      <ScrollArea>
        <GroupHeader kind="aa">Default</GroupHeader>
        <ContractRow contract={noContract} selected={isContract(pending, noContract.id)} onClick={() => onPick({ contractId: noContract.id, rvgCode: narrow })} />
        <ContractRow contract={noContractFixed} selected={isContract(pending, noContractFixed.id)} onClick={() => onPick({ contractId: noContractFixed.id })} />
        {shownHolders.map((h) => {
          const header = h.fit !== last ? FIT_LABEL[h.fit] : null
          last = h.fit
          const count = rowsOf(h, narrow).length
          const on = current?.holder === h.name && !current.isDefault
          return (
            <div key={h.name}>
              {header && <GroupHeader kind={FIT_KIND[h.fit]} count={shownHolders.filter((x) => x.fit === h.fit).length}>{header}</GroupHeader>}
              <button
                type="button"
                data-pick
                className="aa-row"
                aria-pressed={on}
                onClick={() => {
                  setHolderName(h.name)
                  setQ('')
                  onStep()
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', border: 'none', borderBottom: `1px solid ${neutral.line}`, background: on ? accent.tint : 'transparent', boxShadow: on ? `inset 3px 0 0 ${accent.base}` : 'none', padding: '10px 20px', cursor: 'pointer' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>
                    <KindDot kind={h.kind} />
                    {h.name}
                  </div>
                  <div style={{ fontSize: 12.5, color: neutral.slate }}>
                    {KIND[h.kind].label} · {count} {count === 1 ? 'Contract' : 'Contracts'}
                    {h.contracts.length > 1 && ` across ${h.contracts.length} schedules`}
                  </div>
                </div>
                {h.contracts.some((c) => c.isPrepay) && <Pill tone="success">Prepay</Pill>}
                <ChevronRight size={16} color={neutral.mist} />
              </button>
            </div>
          )
        })}
        {shownHolders.length === 0 && <Note>No organisation matches.</Note>}
      </ScrollArea>
    </>
  )
}

// ── Approach 4: every priced row is a Contract ──────────────────────────────

type Row = { kind: 'contract'; contract: Contract } | { kind: 'line'; contract: Contract; line: MappedLine }

export function FlatContractList({ scenario, useContext, pending, onPick, onRows, seed }: Base & { scenario: Scenario; useContext: boolean; pending: Selection | null; onPick: (s: Selection) => void }) {
  const [q, setQ] = useState(seed ?? '')
  const [narrow, setNarrow] = useState<string | undefined>()
  const groups = useMemo(() => {
    const byHolder = new Map<string, Row[]>()
    for (const c of contractsFor(scenario, useContext)) {
      const rows: Row[] =
        c.pricing.kind === 'lines'
          ? linesOf(c.id)
              .filter((l) => (!narrow || l.rvgs.includes(narrow)) && matches(q, c.holder, c.name, l.code, l.description, l.band))
              .map((line) => ({ kind: 'line', contract: c, line }))
          : matches(q, c.holder, c.name) ? [{ kind: 'contract', contract: c }] : []
      if (rows.length === 0) continue
      const key = c.isDefault ? 'Default' : c.holder
      byHolder.set(key, [...(byHolder.get(key) ?? []), ...rows])
    }
    return [...byHolder.entries()]
  }, [scenario, useContext, q, narrow])
  const rows = groups.reduce((n, [, r]) => n + r.length, 0)
  useRows(rows, onRows)
  return (
    <>
      <Toolbar>
        <RvgTypeahead value={narrow} onChange={setNarrow} placeholder="Narrow by RVG code (optional)" />
      </Toolbar>
      <Toolbar>
        <SearchField autoFocus value={q} onChange={setQ} placeholder="Search by holder, code, description or band" />
      </Toolbar>
      <ContextNote scenario={scenario} useContext={useContext} />
      <ScrollArea>
        {groups.map(([holder, list]) => (
          <div key={holder}>
            <GroupHeader kind={list[0]!.contract.holderKind} count={list.length}>{holder}</GroupHeader>
            {list.map((r) =>
              r.kind === 'contract' ? (
                <ContractRow key={r.contract.id} contract={r.contract} selected={isContract(pending, r.contract.id)} onClick={() => onPick({ contractId: r.contract.id, rvgCode: narrow })} />
              ) : (
                <LineRow key={r.line.id} line={r.line} context={r.contract} selected={pending?.lineId === r.line.id} onClick={() => onPick({ contractId: r.contract.id, lineId: r.line.id })} />
              ),
            )}
          </div>
        ))}
        {rows === 0 && <Note>No Contract matches.</Note>}
      </ScrollArea>
    </>
  )
}
