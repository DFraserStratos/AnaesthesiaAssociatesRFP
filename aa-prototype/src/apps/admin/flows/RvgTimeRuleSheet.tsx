import { useRef, useState } from 'react'
import { editRvgTimeRule, PART_INTERVAL_FIXED, useAppStore, type Actor } from '../../../store'
import { describeTimeRule, timeUnitsFromMinutes, validateRvgTimeRule, type RvgTimeRule } from '../../../domain/billing/timeUnits'
import { Button, FormError, TextField, useSurface } from '../../../shared'
import { AddRowButton, Eyebrow, IconButton } from '../../../shared/ui'
import { OverlayHeader, SheetActions } from '../../../shared/surface'
import { neutral, radius } from '../../../theme/tokens'
import { Minus } from 'lucide-react'

/** The worked examples the sheet prices under the rule being edited. */
const EXAMPLE_MINUTES = [95, 125] as const

interface TierDraft {
  key: number
  fromMinute: string
  intervalMinutes: string
}

/** A whole number from a field's text, or NaN (the store's sentences explain). */
function wholeOrNaN(text: string): number {
  const t = text.trim()
  return /^\d+$/.test(t) ? Number(t) : Number.NaN
}

function ruleOf(tiers: readonly TierDraft[]): RvgTimeRule {
  return {
    tiers: tiers.map((t) => ({ fromMinute: wholeOrNaN(t.fromMinute), intervalMinutes: wholeOrNaN(t.intervalMinutes) })),
    partInterval: 'roundUp',
  }
}

/**
 * Edit the RVG time rule (catch-up Phase 42; US-05.2.2, 19a's handoff): one
 * row per tier (the minute it starts at and the minutes per unit), a tier
 * added or removed, the part interval fixed ("A part interval always rounds
 * up."), a live preview of the rule in words and the units for 95 and 125
 * minutes under it. Save calls `editRvgTimeRule`; a refusal shows its sentence
 * inline. Procedures not yet authorised re-price; authorised ones and raised
 * invoices keep their figures.
 */
export function RvgTimeRuleSheet({ actor, onClose }: { actor: Actor; onClose: () => void }) {
  const { Overlay } = useSurface()
  const nextKey = useRef(0)
  const [tiers, setTiers] = useState<TierDraft[]>(() =>
    useAppStore.getState().masters.rvgTimeRule.tiers.map((t) => ({ key: nextKey.current++, fromMinute: String(t.fromMinute), intervalMinutes: String(t.intervalMinutes) })),
  )
  const [error, setError] = useState<string | null>(null)
  const rule = ruleOf(tiers)
  const invalid = validateRvgTimeRule(rule)

  function update(key: number, patch: Partial<TierDraft>) {
    setTiers((list) => list.map((t) => (t.key === key ? { ...t, ...patch } : t)))
    setError(null)
  }

  function addTier() {
    setTiers((list) => {
      const last = list.at(-1)
      const from = last !== undefined && Number.isFinite(wholeOrNaN(last.fromMinute)) ? wholeOrNaN(last.fromMinute) + 60 : 0
      return [...list, { key: nextKey.current++, fromMinute: String(from), intervalMinutes: last?.intervalMinutes ?? '10' }]
    })
    setError(null)
  }

  function removeTier(key: number) {
    setTiers((list) => list.filter((t) => t.key !== key))
    setError(null)
  }

  function save() {
    const outcome = editRvgTimeRule(useAppStore, actor, rule)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    onClose()
  }

  return (
    <Overlay open onClose={onClose}>
      <div data-shot="rvg-time-rule-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <OverlayHeader
          title="Edit the RVG time rule"
          description="The anaesthetist enters the anaesthetic start and finish; the time units follow these tiers. Procedures not yet authorised re-price; authorised ones and raised invoices keep their figures."
        />

        <section aria-label="Tiers" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tiers.map((t, i) => (
            <div key={t.key} data-rvg-tier={i + 1} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 44px', gap: 12, alignItems: 'end' }}>
              <TextField
                label={`Tier ${i + 1} from minute`}
                value={t.fromMinute}
                onChange={(v) => update(t.key, { fromMinute: v })}
                mono
                inputMode="numeric"
                {...(i === 0 ? { hint: 'The first tier starts at 0.' } : {})}
              />
              <TextField
                label="Minutes per unit"
                value={t.intervalMinutes}
                onChange={(v) => update(t.key, { intervalMinutes: v })}
                mono
                inputMode="numeric"
                {...(i === 0 ? { hint: 'A whole number above 0.' } : {})}
              />
              <div style={{ paddingBottom: i === 0 ? 24 : 2 }}>
                {tiers.length > 1 && (
                  <IconButton label={`Remove tier ${i + 1}`} size={44} onClick={() => removeTier(t.key)}>
                    <Minus size={18} aria-hidden />
                  </IconButton>
                )}
              </div>
            </div>
          ))}
          <div>
            <AddRowButton onClick={addTier}>Add tier</AddRowButton>
          </div>
          <div style={{ fontSize: 13, color: neutral.slate }} data-shot="rvg-time-rule-part-interval">{PART_INTERVAL_FIXED}</div>
        </section>

        <section data-shot="rvg-time-rule-preview" aria-live="polite" style={{ background: neutral.bg, borderRadius: radius.ctl, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Eyebrow as="h3" style={{ margin: 0 }}>Preview</Eyebrow>
          {invalid !== null ? (
            <div style={{ fontSize: 13, color: neutral.slate }}>{invalid}</div>
          ) : (
            <>
              <div style={{ fontSize: 13.5, color: neutral.ink }}>{describeTimeRule(rule)}</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: neutral.slate, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {EXAMPLE_MINUTES.map((m) => {
                  const units = timeUnitsFromMinutes(m, rule)
                  return (
                    <li key={m} data-rvg-example={m}>
                      <span className="mono">{m}</span> minutes is <span className="mono">{units}</span> {units === 1 ? 'time unit' : 'time units'}
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>

        <FormError message={error} />
        <SheetActions
          primary={<Button variant="primary" block onClick={save}>Save rule</Button>}
          secondary={<Button variant="secondary" block onClick={onClose}>Cancel</Button>}
        />
      </div>
    </Overlay>
  )
}
