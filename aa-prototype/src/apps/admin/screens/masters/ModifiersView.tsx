import { useMemo, useState } from 'react'
import { neutral, radius } from '../../../../theme/tokens'
import type { Modifier } from '../../../../domain/types'
import { addAaModifier, useAppStore, type Actor } from '../../../../store'
import { Button, FormError, TextField } from '../../../../shared'
import { OverlayHeader, SheetActions, useSurface } from '../../../../shared/surface'
import { Header, Table } from './chrome'
import { cellStyle } from './tableStyles'

const RVG_HEADS = ['Code', 'Block', 'Modifying factor', 'Units', 'Priced as', 'Applied', 'Page']
const AA_HEADS = ['Code', 'Modifying factor', 'Units']

/** "From age" for the age modifiers; P1 notes the RVG groups that include it. */
function appliedText(m: Modifier, includedSomewhere: boolean): string {
  if (m.appliedFrom === 'age') return 'From age'
  return includedSomewhere ? 'Optional, or included by the RVG group' : 'Optional'
}

/**
 * Master data, Modifiers (catch-up Phase 19b; US-05.1.5): the NZSA RVG 2021
 * modifier table as printed (generated from the catalogue, values as printed,
 * a value that is not a plain number entered at capture), then AA's own. The
 * RVG rows are not edited here (Phase 42 loads and edits masters); the office
 * can add one of AA's own. The age bands are OQ-95's answer (D29, catch-up
 * Phase 25a took the provisional note off).
 */
export function ModifiersView({ actor }: { actor: Actor }) {
  const modifiers = useAppStore((s) => s.masters.modifiers)
  const rvgGroups = useAppStore((s) => s.masters.rvgGroups)
  const [adding, setAdding] = useState(false)

  const { rvg, aa } = useMemo(() => {
    const all = Object.values(modifiers)
    return {
      // Seeded ids follow table order; AA's own sort by code.
      rvg: all.filter((m) => m.source === 'rvg'),
      aa: all.filter((m) => m.source === 'aa').sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    }
  }, [modifiers])
  const included = useMemo(() => new Set(Object.values(rvgGroups).flatMap((g) => g.includedModifierIds)), [rvgGroups])

  return (
    <div data-shot="masters-modifiers" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Header
        title="Modifiers"
        sub="The NZSA RVG 2021 modifier table, as printed, plus AA's own."
        action={<Button variant="secondary" onClick={() => setAdding(true)}>Add AA modifier</Button>}
      />

      <Table heads={RVG_HEADS} rightAlign={[3, 6]} shot="masters-modifiers-rvg">
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
          </tr>
        ))}
      </Table>

      <h3 style={{ margin: '12px 0 0', fontSize: 15, fontWeight: 700 }}>AA's own</h3>
      {aa.length === 0 ? (
        <div data-shot="masters-modifiers-aa" style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '20px', fontSize: 13, color: neutral.slate }}>
          None yet. Vanessa's list loads here; the office can add one now.
        </div>
      ) : (
        <Table heads={AA_HEADS} rightAlign={[2]} shot="masters-modifiers-aa">
          {aa.map((m) => (
            <tr key={m.id} data-modifier-code={m.code}>
              <td className="mono" style={{ ...cellStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>{m.code}</td>
              <td style={cellStyle}>{m.factor}</td>
              <td className="mono" style={{ ...cellStyle, textAlign: 'right' }}>{m.unitsAsPrinted}</td>
            </tr>
          ))}
        </Table>
      )}

      {adding && <AddAaModifierSheet actor={actor} onClose={() => setAdding(false)} />}
    </div>
  )
}

/** Add one of AA's own modifiers: code, modifying factor, units (a whole number). */
function AddAaModifierSheet({ actor, onClose }: { actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const [code, setCode] = useState('')
  const [factor, setFactor] = useState('')
  const [units, setUnits] = useState('')
  const [error, setError] = useState<string | null>(null)

  function save() {
    const t = units.trim()
    const outcome = addAaModifier(useAppStore, actor, { code, factor, units: /^\d+$/.test(t) ? Number(t) : Number.NaN })
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="add-aa-modifier" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader title="Add an AA modifier" />
        <div style={{ fontSize: 13, color: neutral.slate, marginTop: -6 }}>One of AA's own, beside the RVG table. Anaesthetists can claim it at once, with a short reason.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12 }}>
          <TextField label="Code" value={code} onChange={setCode} mono placeholder="e.g. AAX1" />
          <TextField label="Units" value={units} onChange={setUnits} mono placeholder="e.g. 1" hint="A whole number, 0 or more." />
        </div>
        <TextField label="Modifying factor" value={factor} onChange={setFactor} placeholder="What the modifier is for" />
        <FormError message={error} />
        <SheetActions primary={<Button variant="primary" block onClick={save}>Add modifier</Button>} />
      </div>
    </Overlay>
  )
}
