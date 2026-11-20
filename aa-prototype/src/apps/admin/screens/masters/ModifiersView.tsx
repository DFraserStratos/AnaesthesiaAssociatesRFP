import { useMemo, useState } from 'react'
import { neutral } from '../../../../theme/tokens'
import type { Modifier } from '../../../../domain/types'
import { isRetired } from '../../../../domain/masterLifecycle'
import { addAaModifier, editAaModifier, useAppStore, type Actor } from '../../../../store'
import { Button, FieldLabel, FormError, TextField } from '../../../../shared'
import { EmptyState, Pill } from '../../../../shared/ui'
import { OverlayHeader, SheetActions, useSurface } from '../../../../shared/surface'
import { ACTIONS_COLUMN, EditCell, MasterHeader, MasterTable, RetiredPill, RetireSection, ShowRetiredToggle, retiredRowStyle, type MasterColumn } from './chrome'
import { cellStyle } from './tableStyles'

const RVG_COLUMNS: readonly MasterColumn[] = ['Code', 'Block', 'Modifying factor', { label: 'Units', align: 'right' }, 'Priced as', 'Applied', { label: 'Page', align: 'right' }, 'Source']
const AA_COLUMNS: readonly MasterColumn[] = ['Code', 'Modifying factor', { label: 'Units', align: 'right' }, ACTIONS_COLUMN]

/** "From age" for the age modifiers; P1 notes the RVG groups that include it. */
function appliedText(m: Modifier, includedSomewhere: boolean): string {
  if (m.appliedFrom === 'age') return 'From age'
  return includedSomewhere ? 'Optional, or included by the RVG group' : 'Optional'
}

/** A whole number from a field's text, or NaN (the store's sentence explains). */
function wholeOrNaN(text: string): number {
  const t = text.trim()
  return /^\d+$/.test(t) ? Number(t) : Number.NaN
}

/**
 * Master data, Modifiers (catch-up Phase 19b; US-05.1.5): the NZSA RVG 2021
 * modifier table as printed (generated from the catalogue, values as printed,
 * a value that is not a plain number entered at capture), then AA's own. The
 * RVG rows are as printed and never edited. AA's own are added, edited (factor
 * and units) and retired here (catch-up Phase 42); retired ones hide behind
 * "Show retired". The age bands are OQ-95's answer (D29).
 */
export function ModifiersView({ actor }: { actor: Actor }) {
  const modifiers = useAppStore((s) => s.masters.modifiers)
  const rvgGroups = useAppStore((s) => s.masters.rvgGroups)
  const [sheet, setSheet] = useState<{ modifier?: Modifier } | null>(null)
  const [showRetired, setShowRetired] = useState(false)

  const { rvg, aa } = useMemo(() => {
    const all = Object.values(modifiers)
    return {
      // Seeded ids follow table order; AA's own sort by code.
      rvg: all.filter((m) => m.source === 'rvg'),
      aa: all.filter((m) => m.source === 'aa').sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    }
  }, [modifiers])
  const included = useMemo(() => new Set(Object.values(rvgGroups).flatMap((g) => g.includedModifierIds)), [rvgGroups])
  const retiredCount = aa.filter((m) => isRetired(m)).length
  const aaRows = showRetired ? aa : aa.filter((m) => !isRetired(m))

  return (
    <div data-shot="masters-modifiers" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <MasterHeader
        title="Modifiers"
        sub="The NZSA RVG 2021 modifier table, as printed, plus AA's own."
        add={{ label: 'Add AA modifier', onClick: () => setSheet({}) }}
      />

      <MasterTable columns={RVG_COLUMNS} shot="masters-modifiers-rvg" label="RVG modifiers">
        {rvg.map((m) => (
          <tr key={m.id} data-modifier-code={m.code}>
            <td className="mono" style={{ ...cellStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>{m.code}</td>
            <td style={{ ...cellStyle, whiteSpace: 'nowrap', color: neutral.slate }}>{m.block}</td>
            <td style={cellStyle}>{m.factor}</td>
            <td className="mono" style={{ ...cellStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>{m.unitsAsPrinted}</td>
            <td style={{ ...cellStyle, whiteSpace: 'nowrap', color: m.units === null ? neutral.slate : neutral.ink }}>
              {m.units === null ? 'Entered at capture' : <span className="mono">{m.units}</span>}
            </td>
            <td style={{ ...cellStyle, color: neutral.slate }}>{appliedText(m, included.has(m.id))}</td>
            <td className="mono" style={{ ...cellStyle, textAlign: 'right', color: neutral.mist }}>{m.page ?? ''}</td>
            <td style={{ ...cellStyle, whiteSpace: 'nowrap' }} title="As printed in the RVG">
              <Pill tone="neutral" size="sm" title="As printed in the RVG">NZSA RVG 2021</Pill>
            </td>
          </tr>
        ))}
      </MasterTable>
      <div style={{ fontSize: 12, color: neutral.mist, marginTop: -4 }}>As printed in the RVG: these rows are not edited.</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>AA's own</h3>
        {aa.length > 0 && <ShowRetiredToggle checked={showRetired} onChange={setShowRetired} count={retiredCount} />}
      </div>
      {aaRows.length === 0 ? (
        <EmptyState variant="card" shot="masters-modifiers-aa" style={{ padding: 20 }}>
          {aa.length === 0 ? "None yet. Add one of AA's own when it is needed." : 'None in use. Show retired to see the rest.'}
        </EmptyState>
      ) : (
        <MasterTable columns={AA_COLUMNS} shot="masters-modifiers-aa" label="AA's own modifiers">
          {aaRows.map((m) => {
            const retired = isRetired(m)
            return (
              <tr key={m.id} data-modifier-code={m.code} data-retired={retired ? 'true' : undefined} style={retired ? retiredRowStyle : undefined}>
                <td className="mono" style={{ ...cellStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {m.code}
                    {retired && <RetiredPill reason={m.retiredReason} />}
                  </span>
                </td>
                <td style={cellStyle}>{m.factor}</td>
                <td className="mono" style={{ ...cellStyle, textAlign: 'right' }}>{m.unitsAsPrinted}</td>
                <EditCell onClick={() => setSheet({ modifier: m })} label={`Edit ${m.code}`} style={cellStyle} />
              </tr>
            )
          })}
        </MasterTable>
      )}

      {sheet !== null && <AaModifierSheet key={sheet.modifier?.id ?? 'new'} modifier={sheet.modifier} actor={actor} onClose={() => setSheet(null)} />}
    </div>
  )
}

/**
 * Add or edit one of AA's own modifiers: code (fixed once added, claims keep
 * it), modifying factor, units (a whole number). Editing adds Retire or
 * Reinstate at the foot.
 */
function AaModifierSheet({ modifier, actor, onClose }: { modifier?: Modifier; actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const editing = modifier !== undefined
  const [code, setCode] = useState(modifier?.code ?? '')
  const [factor, setFactor] = useState(modifier?.factor ?? '')
  const [units, setUnits] = useState(modifier?.units !== undefined && modifier.units !== null ? String(modifier.units) : '')
  const [error, setError] = useState<string | null>(null)

  function save() {
    const outcome = editing
      ? editAaModifier(useAppStore, actor, modifier.id, { factor, units: wholeOrNaN(units) })
      : addAaModifier(useAppStore, actor, { code, factor, units: wholeOrNaN(units) })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot={editing ? 'edit-aa-modifier' : 'add-aa-modifier'} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader
          title={editing ? `Edit ${modifier.code}` : 'Add an AA modifier'}
          description={editing ? 'The code stays: claims keep it. Procedures not yet authorised follow the change.' : "One of AA's own, beside the RVG table. Anaesthetists can claim it at once, with a short reason."}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12 }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel>Code</FieldLabel>
              <div className="mono" style={{ fontSize: 15, fontWeight: 600, color: neutral.ink, minHeight: 48, display: 'flex', alignItems: 'center' }}>{code}</div>
            </div>
          ) : (
            <TextField label="Code" value={code} onChange={setCode} mono placeholder="e.g. AAX1" />
          )}
          <TextField label="Units" value={units} onChange={(v) => { setUnits(v); setError(null) }} mono placeholder="e.g. 1" hint="A whole number, 0 or more." />
        </div>
        <TextField label="Modifying factor" value={factor} onChange={(v) => { setFactor(v); setError(null) }} placeholder="What the modifier is for" />
        <FormError message={error} />
        <SheetActions primary={<Button variant="primary" block onClick={save}>{editing ? 'Save changes' : 'Add modifier'}</Button>} />
        {editing && <RetireSection kind="aaModifier" id={modifier.id} actor={actor} onDone={onClose} />}
      </div>
    </Overlay>
  )
}
