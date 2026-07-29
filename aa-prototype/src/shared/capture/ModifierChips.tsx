import type { ReactNode } from 'react'
import { accent, neutral } from '../../theme/tokens'
import type { ModifierCode, Procedure, RvgCode } from '../../domain/types'
import { MODIFIER_CODES, modifierBandOf, modifierUnits, toggleModifierCode } from '../../domain/billing'
import { editProcedure, useAppStore, type Actor } from '../../store'
import { useSurface } from '../surface'
import { SlidingSegmentedControl } from '../ui/SlidingSegmentedControl'
import { MODIFIER_BAND_TITLES, MODIFIER_CHIP_LABELS, MODIFIER_SEGMENT_LABELS } from './modifierLabels'
import { Caption } from './ui'

interface ModifierChipsProps {
  procedure: Procedure
  baseCode?: RvgCode | undefined
  actor: Actor
  /** isAdditional or read-only. */
  disabled: boolean
  onError: (message: string) => void
}

/**
 * The exclusive bands in master-table order with their codes, derived from the
 * DOMAIN's band rule (`modifierBandOf`) rather than a list of this file's own,
 * so the picker cannot disagree with the calculator about what is exclusive.
 * Group 'AS' is left out: the ASA seed has `AsaCard` and the M row's caption.
 */
const BANDS: readonly { band: string; codes: readonly ModifierCode[] }[] = (() => {
  const bands: { band: string; codes: ModifierCode[] }[] = []
  for (const modifier of MODIFIER_CODES) {
    if (modifier.group === 'AS') continue
    const band = modifierBandOf(modifier.code)
    if (band === undefined) continue
    const existing = bands.find((b) => b.band === band)
    if (existing === undefined) bands.push({ band, codes: [modifier] })
    else existing.codes.push(modifier)
  }
  return bands
})()

/** Everything the domain lets stack freely: PA5 plus the singleton flags. */
const STACKING_CODES: readonly ModifierCode[] = MODIFIER_CODES.filter(
  (m) => m.group !== 'AS' && modifierBandOf(m.code) === undefined,
)

/**
 * Every RFP modifier group, with the shape of each control following the RULE
 * that governs it (user-picked design, 2026-07-28). Sixteen identical chips gave
 * a 15-row wall on the phone and six ragged rows on the desktop, and neither
 * said which codes are alternatives and which add up:
 *
 *  - The three exclusive bands (PA, A, OB; 'AS' belongs to `AsaCard`) are
 *    SEGMENTED CONTROLS, the pattern `AsaCard` already uses for the fourth
 *    exclusive band. One live choice per band, `toggleModifierCode` still swaps
 *    siblings in one tap, and re-tapping the live segment clears the band just
 *    as re-tapping the old chip did.
 *  - The six free-stacking codes (PA5, ASE, P1, AI1, PO1, PO2) keep CHIPS, so a
 *    chip on this card now means one thing only: something that adds on top.
 *    Their labels drop the code prefix, which was redundant beside the band
 *    title and is still carried by the M row's caption and the audit trail.
 *
 * Ten of the sixteen chips are absorbed that way. The two surfaces differ only
 * in arrangement, because the problem differs: the phone was fighting height,
 * the desktop was fighting structure.
 *
 *   web     label column | control. The four labels align with each other and
 *           with the B / T / M rows above, and a band control sizes to its own
 *           content so a two-option band is not stretched into two slabs.
 *   mobile  label above a two-column segment grid, unit under the label.
 *
 * Neither arrangement measures anything: a desktop band control wraps inside its
 * own track when the row cannot hold it, so a narrow window degrades to wrapped
 * segments rather than clipped words.
 *
 * A code the base code absorbs stays visible but inert and struck through, with
 * the domain's verbatim refusal reason beneath. That was true of the chips and
 * is now true of the segments too.
 */
export function ModifierChips({ procedure, baseCode, actor, disabled, onError }: ModifierChipsProps) {
  const { variant } = useSurface()
  const web = variant === 'web'
  const selected = new Set(procedure.selectedModifierCodes)

  const absorbs = (code: string) =>
    baseCode !== undefined && baseCode.absorbsModifierCodes.includes(code)

  function toggle(code: string) {
    const next = toggleModifierCode(procedure.selectedModifierCodes, code)
    const outcome = editProcedure(useAppStore, actor, procedure.id, { selectedModifierCodes: next })
    if (!outcome.ok) onError(outcome.message)
  }

  const absorbed = [...BANDS.flatMap((b) => b.codes), ...STACKING_CODES].filter((m) => absorbs(m.code))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: web ? 12 : 14, opacity: disabled ? 0.55 : 1 }}>
      {/* The seam: seeded arithmetic above it, the clinical facts that drive the
          M total below. A desktop card is wide enough for the rule to read as
          structure; on the phone the band titles carry it alone. */}
      {web && <div style={{ height: 1, background: neutral.line, margin: '2px 0' }} />}

      {BANDS.map(({ band, codes }) => (
        <Row key={band} web={web} label={MODIFIER_BAND_TITLES[band] ?? band}>
          <SlidingSegmentedControl
            value={codes.find((m) => selected.has(m.code))?.code}
            options={codes.map((m) => ({
              value: m.code,
              disabled: absorbs(m.code),
              title: MODIFIER_CHIP_LABELS[m.code] ?? m.description,
              label: (
                <>
                  <span>{MODIFIER_SEGMENT_LABELS[m.code] ?? m.description}</span>
                  <span className="mono" style={{ fontSize: 11, fontWeight: 600, opacity: 0.72 }}>
                    +{m.units}
                  </span>
                </>
              ),
            }))}
            onSelect={toggle}
            layout={web ? 'wrap' : 'two-column'}
            disabled={disabled}
            ariaLabel={MODIFIER_BAND_TITLES[band] ?? band}
            buttonStyle={(option) => ({
              height: web ? 40 : 44,
              padding: web ? '0 14px' : '0 8px',
              fontSize: 13,
              display: 'flex',
              flexDirection: web ? 'row' : 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: web ? 6 : 0,
              lineHeight: web ? undefined : 1.15,
              whiteSpace: 'nowrap',
              textDecoration: option.disabled === true ? 'line-through' : 'none',
            })}
          />
        </Row>
      ))}

      <Row web={web} label="Also applies" align="start">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STACKING_CODES.map((m) => {
            const on = selected.has(m.code)
            const isAbsorbed = absorbs(m.code)
            const inert = disabled || isAbsorbed
            return (
              <button
                key={m.code}
                type="button"
                disabled={inert}
                aria-pressed={on}
                onClick={inert ? undefined : () => toggle(m.code)}
                style={{
                  padding: web ? '10px 14px' : '11px 14px',
                  borderRadius: 999,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: inert ? 'default' : 'pointer',
                  transition: 'background 150ms, border-color 150ms',
                  background: on ? accent.tint : neutral.surface,
                  color: isAbsorbed ? neutral.lineStrong : on ? accent.hover : neutral.slate,
                  border: `1.5px solid ${on ? accent.base : neutral.line}`,
                  textDecoration: isAbsorbed ? 'line-through' : 'none',
                }}
              >
                {MODIFIER_CHIP_LABELS[m.code] ?? m.description} · +{m.units}
              </button>
            )
          })}
        </div>
      </Row>

      {absorbed.map((m) => {
        const reason = modifierUnits([m.code], baseCode).refused[0]?.reason
        return reason !== undefined ? <Caption key={m.code}>{reason}</Caption> : null
      })}
      <Caption>
        Modifier values are demo-plausible within the RFP's stated ranges, not an authoritative
        NZSA schedule.
      </Caption>
    </div>
  )
}

/**
 * One labelled decision. The desktop puts the label in a fixed left column, so
 * the four labels align with each other and the block continues the card's own
 * row anatomy; the phone stacks the label over its control, because 318px has
 * no column to spare.
 */
function Row({
  web,
  label,
  align = 'center',
  children,
}: {
  web: boolean
  label: string
  align?: 'center' | 'start'
  children: ReactNode
}) {
  if (!web) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: neutral.slate }}>{label}</span>
        {children}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: align === 'start' ? 'flex-start' : 'center', gap: 12 }}>
      <span
        style={{
          width: 140,
          flex: 'none',
          fontSize: 13,
          fontWeight: 600,
          color: neutral.slate,
          paddingTop: align === 'start' ? 10 : 0,
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex' }}>{children}</span>
    </div>
  )
}
