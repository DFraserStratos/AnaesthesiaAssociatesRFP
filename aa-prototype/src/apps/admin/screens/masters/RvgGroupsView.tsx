/**
 * Master data, RVG groups (catch-up Phase 19; US-05.1.1, US-05.1.3, FT-05.1):
 * the one master list base units come from. The NZSA RVG 2021 rows as
 * published and AA's own beside them, unmarked; rows sit under the anatomy
 * heading the guide prints them under (a label, not a browse); rows sharing a
 * code sit side by side, told apart by description and units. The hidden id
 * is never shown, and modifier units appear only on the edit sheet.
 *
 * Office only; add, edit, retire and restore, every change audited by the
 * store (`rvgGroupActions.ts`). Rules are the model module's.
 */

import { useMemo, useState } from 'react'
import {
  ANATOMY_HEADINGS,
  baseUnitsText,
  searchRvgGroups,
  type RvgGroup,
  type RvgGroupInput,
} from '../../../../domain/billing/rvgGroups'
import { createRvgGroup, editRvgGroup, restoreRvgGroup, retireRvgGroup, useAppStore, type Actor } from '../../../../store'
import { Button, FieldLabel, FormError, Segmented, TextField, useSurface } from '../../../../shared'
import { HistorySheet } from '../../../../shared/booking'
import { NameSearchBox } from '../../../../shared/ui'
import { neutral, radius } from '../../../../theme/tokens'
import { selectControlStyle } from '../../flows/fieldChrome'
import { Pill } from '../../components/MasterPills'
import { Header, Table, TextAction } from './chrome'
import { cellStyle, headCellStyle, rowCellStyle } from './tableStyles'
import { describeTimeRule } from '../../../../domain/billing/timeUnits'

const COLUMNS = ['Code', 'Description', 'Base units', 'Included modifiers', '', '']

type StatusFilter = 'active' | 'all'

/** "6", or "10 · range 10 to 12" where the guide prints a range. */
function baseUnitsCell(g: RvgGroup): string {
  return g.baseUnitsRange !== undefined ? `${g.baseUnits} · range ${baseUnitsText(g)}` : String(g.baseUnits)
}

export function RvgGroupsView({ actor }: { actor: Actor }) {
  const groups = useAppStore((s) => s.masters.rvgGroups)
  const modifiers = useAppStore((s) => s.masters.modifiers)
  const [query, setQuery] = useState('')
  const [anatomy, setAnatomy] = useState('')
  const [status, setStatus] = useState<StatusFilter>('active')
  const [sheet, setSheet] = useState<{ group?: RvgGroup } | null>(null)
  const [retiring, setRetiring] = useState<RvgGroup | null>(null)
  const [history, setHistory] = useState<RvgGroup | null>(null)
  const [error, setError] = useState<string | null>(null)

  const anatomyOptions = useMemo(() => {
    const present = new Set(Object.values(groups).map((g) => g.anatomy))
    return [...ANATOMY_HEADINGS.filter((h) => present.has(h)), ...[...present].filter((h) => !ANATOMY_HEADINGS.includes(h)).sort()]
  }, [groups])

  const results = useMemo(
    () =>
      searchRvgGroups(query, groups, { includeRetired: status === 'all' }).filter((g) => anatomy === '' || g.anatomy === anatomy),
    [groups, query, status, anatomy],
  )

  // Rows under their anatomy heading, headings in guide order (a search keeps its own order inside each).
  const sections = useMemo(() => {
    const by = new Map<string, RvgGroup[]>()
    for (const g of results) {
      const arr = by.get(g.anatomy)
      if (arr === undefined) by.set(g.anatomy, [g])
      else arr.push(g)
    }
    return anatomyOptions.filter((h) => by.has(h)).map((h) => [h, by.get(h)!] as const)
  }, [results, anatomyOptions])

  function act(outcome: { ok: boolean; message?: string }) {
    setError(outcome.ok ? null : (outcome.message ?? null))
  }

  const filtered = query.trim() !== '' || anatomy !== '' || status !== 'active'

  return (
    <>
      <Header
        title="RVG groups"
        sub="The NZSA RVG 2021 groups AA prices from, plus AA's own. Demo-sized; the full set loads at go-live."
        action={<Button variant="secondary" onClick={() => { setError(null); setSheet({}) }}>Add group</Button>}
      />

      <TimeRulePanel />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div data-shot="rvg-group-search" style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Search</FieldLabel>
          <NameSearchBox value={query} onChange={setQuery} label="Search RVG code or description" />
          <div style={{ fontSize: 12.5, color: neutral.slate }}>
            <span className="mono">{results.length}</span>
            {status === 'active' ? ' active' : ''} {results.length === 1 ? 'group' : 'groups'}
            {anatomy !== '' ? ` under ${anatomy}` : ''}
            {query.trim() !== '' ? ` matching "${query.trim()}"` : ''}
          </div>
        </div>
        <label style={{ width: 230, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Anatomy heading</FieldLabel>
          <select value={anatomy} onChange={(e) => setAnatomy(e.target.value)} style={selectControlStyle}>
            <option value="">Every heading</option>
            {anatomyOptions.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </label>
        <div style={{ width: 200 }}>
          <Segmented
            label="Show"
            value={status}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'all', label: 'All' },
            ]}
            onChange={setStatus}
          />
        </div>
      </div>

      <FormError message={error} />

      {results.length === 0 ? (
        <div data-shot="masters-rvg-groups" style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No RVG groups match.</div>
          <div style={{ fontSize: 13, color: neutral.slate }}>Check the code or a word of the description, or add the group if AA needs it.</div>
          {filtered && (
            <TextAction onClick={() => { setQuery(''); setAnatomy(''); setStatus('all') }}>Search every group</TextAction>
          )}
        </div>
      ) : (
        <Table heads={COLUMNS} rightAlign={[2, 5]} shot="masters-rvg-groups">
          {sections.map(([heading, rows]) => [
            <tr key={`h-${heading}`} data-rvg-anatomy={heading}>
              <td colSpan={COLUMNS.length} style={{ ...rowCellStyle, background: neutral.bg, paddingTop: 10, paddingBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: neutral.ink }}>{heading}</span>
              </td>
            </tr>,
            ...rows.map((g) => (
              <tr key={g.id} data-rvg-group-code={g.code} data-retired={g.retired ? 'true' : undefined} style={g.retired ? { background: neutral.bg } : undefined}>
                <td className="mono" style={{ ...rowCellStyle, fontWeight: 600, whiteSpace: 'nowrap', color: g.retired ? neutral.mist : neutral.ink }}>{g.code}</td>
                <td style={{ ...rowCellStyle, color: g.retired ? neutral.mist : neutral.ink }}>{g.description}</td>
                <td className="mono" style={{ ...rowCellStyle, textAlign: 'right', whiteSpace: 'nowrap', color: g.retired ? neutral.mist : neutral.ink }}>{baseUnitsCell(g)}</td>
                {/* The modifiers the base units include (catch-up Phase 19b, US-05.1.4): P1 at 0 on the Neurosurgery and Spine rows. */}
                <td style={rowCellStyle} data-shot={g.includedModifierIds.length > 0 ? 'masters-rvg-included' : undefined}>
                  <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                    {g.includedModifierIds.map((id) => (
                      <Pill key={id} size="small">
                        <span className="mono">{modifiers[id]?.code ?? '?'} · 0</span>
                      </Pill>
                    ))}
                  </span>
                </td>
                <td style={rowCellStyle}>{g.retired && <Pill>Retired</Pill>}</td>
                <td style={{ ...rowCellStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', gap: 12 }}>
                    <TextAction onClick={() => setHistory(g)} label={`History of ${g.code} ${g.description}`}>History</TextAction>
                    <TextAction onClick={() => { setError(null); setSheet({ group: g }) }} label={`Edit ${g.code} ${g.description}`}>Edit</TextAction>
                    {g.retired ? (
                      <TextAction onClick={() => act(restoreRvgGroup(useAppStore, actor, g.id))} label={`Restore ${g.code} ${g.description}`}>Restore</TextAction>
                    ) : (
                      <TextAction onClick={() => { setError(null); setRetiring(g) }} label={`Retire ${g.code} ${g.description}`}>Retire</TextAction>
                    )}
                  </span>
                </td>
              </tr>
            )),
          ])}
        </Table>
      )}

      {sheet !== null && <RvgGroupSheet key={sheet.group?.id ?? 'new'} group={sheet.group} actor={actor} headings={anatomyOptions} onClose={() => setSheet(null)} />}
      {retiring !== null && <RetireRvgGroup group={retiring} actor={actor} onClose={() => setRetiring(null)} />}
      <HistorySheet open={history !== null} entityIds={history !== null ? [history.id] : []} title={history !== null ? `History · ${history.code} ${history.description}` : 'RVG group history'} onClose={() => setHistory(null)} />
    </>
  )
}

/** A whole number from a field's text, or NaN (the store's sentences explain the rest). */
function wholeOrNaN(text: string): number {
  const t = text.trim()
  return /^\d+$/.test(t) ? Number(t) : Number.NaN
}

/** Add or edit a row: code, description, anatomy heading, base units, an optional range, modifier units. */
function RvgGroupSheet({ group, actor, headings, onClose }: { group?: RvgGroup; actor: Actor; headings: readonly string[]; onClose: () => void }) {
  const { Overlay } = useSurface()
  const [code, setCode] = useState(group?.code ?? '')
  const [description, setDescription] = useState(group?.description ?? '')
  const [anatomy, setAnatomy] = useState(group?.anatomy ?? '')
  const [baseUnits, setBaseUnits] = useState(group !== undefined ? String(group.baseUnits) : '')
  const [hasRange, setHasRange] = useState(group?.baseUnitsRange !== undefined)
  const [rangeMin, setRangeMin] = useState(group?.baseUnitsRange !== undefined ? String(group.baseUnitsRange.min) : '')
  const [rangeMax, setRangeMax] = useState(group?.baseUnitsRange !== undefined ? String(group.baseUnitsRange.max) : '')
  const [modifierUnits, setModifierUnits] = useState(String(group?.modifierUnits ?? 0))
  const [error, setError] = useState<string | null>(null)

  function save() {
    const input: RvgGroupInput = {
      code,
      description,
      anatomy,
      baseUnits: wholeOrNaN(baseUnits),
      ...(hasRange ? { baseUnitsRange: { min: wholeOrNaN(rangeMin), max: wholeOrNaN(rangeMax) } } : {}),
      modifierUnits: wholeOrNaN(modifierUnits),
    }
    const outcome = group === undefined ? createRvgGroup(useAppStore, actor, input) : editRvgGroup(useAppStore, actor, group.id, input)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="rvg-group-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{group === undefined ? 'Add an RVG group' : `Edit ${group.code} · ${group.description}`}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
          <TextField label="RVG code" value={code} onChange={setCode} mono placeholder="e.g. H3" />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel>Anatomy heading</FieldLabel>
            <input list="rvg-anatomy-headings" value={anatomy} onChange={(e) => setAnatomy(e.target.value)} placeholder="e.g. Head" style={selectControlStyle} />
            <datalist id="rvg-anatomy-headings">
              {headings.map((h) => <option key={h} value={h} />)}
            </datalist>
          </label>
        </div>
        <TextField label="Description" value={description} onChange={setDescription} placeholder="e.g. Brow lift" hint="Users find the group by its code or a word from this." />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <TextField label="Base units" value={baseUnits} onChange={setBaseUnits} mono placeholder="e.g. 5" hint="The starting figure: a whole number above 0." />
          <TextField label="Modifier units" value={modifierUnits} onChange={setModifierUnits} mono hint="Usually 0." />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <input type="checkbox" checked={hasRange} onChange={(e) => setHasRange(e.target.checked)} />
          The guide prints a range of base units
        </label>
        {hasRange && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <TextField label="Range from" value={rangeMin} onChange={setRangeMin} mono placeholder="e.g. 10" />
            <TextField label="Range to" value={rangeMax} onChange={setRangeMax} mono placeholder="e.g. 12" />
          </div>
        )}
        {hasRange && <div style={{ fontSize: 12.5, color: neutral.slate, marginTop: -6 }}>The anaesthetist sees the range when choosing the value. The base units must sit within it.</div>}
        <FormError message={error} />
        <Button variant="primary" block onClick={save}>{group === undefined ? 'Add group' : 'Save changes'}</Button>
      </div>
    </Overlay>
  )
}

function RetireRvgGroup({ group, actor, onClose }: { group: RvgGroup; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const [error, setError] = useState<string | null>(null)

  function retire() {
    const outcome = retireRvgGroup(useAppStore, actor, group.id)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="rvg-group-retire" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Retire {group.code}?</div>
        <div style={{ fontSize: 14, color: neutral.slate, lineHeight: '20px' }}>
          {group.description} leaves the RVG code search. Procedures that already carry it keep it and price as before. You can restore it later.
        </div>
        <FormError message={error} />
        <Button variant="primary" block onClick={retire}>Retire group</Button>
        <Button variant="secondary" block onClick={onClose}>Cancel</Button>
      </div>
    </Overlay>
  )
}

/**
 * The RVG time rule, read only (catch-up Phase 19a; US-05.2.2, D25): the
 * tiers held as data in `masters.rvgTimeRule`, in words and as a small table.
 * Phase 42 makes it editable.
 */
function TimeRulePanel() {
  const rule = useAppStore((s) => s.masters.rvgTimeRule)
  return (
    <section
      data-shot="masters-rvg-time-rule"
      aria-labelledby="rvg-time-rule-title"
      style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '14px 16px', display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}
    >
      <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h3 id="rvg-time-rule-title" style={{ margin: 0, fontSize: 14, fontWeight: 700, color: neutral.ink }}>RVG time rule</h3>
        <div style={{ fontSize: 13, color: neutral.slate, maxWidth: 520 }}>{describeTimeRule(rule)}</div>
        <div style={{ fontSize: 12, color: neutral.mist }}>A part interval always rounds up. The anaesthetist enters start and finish; the time units follow these tiers.</div>
      </div>
      <table style={{ borderCollapse: 'collapse', flex: '0 1 300px' }}>
        <thead>
          <tr>
            <th style={headCellStyle}>From minute</th>
            <th style={{ ...headCellStyle, textAlign: 'right' }}>Minutes per unit</th>
          </tr>
        </thead>
        <tbody>
          {rule.tiers.map((t) => (
            <tr key={t.fromMinute}>
              <td style={cellStyle} className="mono">{t.fromMinute}</td>
              <td style={{ ...cellStyle, textAlign: 'right' }} className="mono">{t.intervalMinutes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
