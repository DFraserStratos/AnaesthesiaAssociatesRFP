import { useId, type CSSProperties, type ReactNode, type Ref } from 'react'
import { accent, elevation as shadow, neutral, radius, semantic } from '../../theme/tokens'
import type { DataAttributes } from './Field'

export type CardPadding = 'panel' | 'card'
export type CardElevation = 'flat' | 'e1'

/**
 * A white bordered card grouping content, with an optional heading and action (UI unification U6,
 * group U14). Two looks from the mockups: `panel` is a page's main surface (20px, gap 14, e1, a
 * 17/600 heading: the Web Dashboard panels); `card` is a rail, profile or phone card (16px, gap 10,
 * flat, a 14/600 heading: the Admin Day rail cards, the Mobile App cards). Radius `radius.card` (14)
 * on all three apps (question 20). `elevation` overrides the look's own shadow.
 *
 * The title is a real heading (`h2`, or `h3` with `titleLevel`) and the `section` is named by it
 * (`aria-labelledby`), as the rail cards always were; `headingRef` takes the heading for focus
 * return (it then gets `tabIndex={-1}`). `title` may hold a count badge beside the words (part of the
 * heading's name); `aside` sits beside the heading outside it (a Sample pill), 10px away. `flush`
 * drops the padding for a full-bleed body (the heading keeps its inset). `tone="warning"` is the
 * warning tint with a warning edge. `shot` and `data-*` land on the `section`.
 *
 * Build plan Phase 45 (a Contract page's cards, each saved on its own): `footer` puts right-aligned
 * actions under a hairline (Cancel then Save; the Admin Review sheet footer's alignment), and
 * `editing` marks a card in edit: `data-editing`, the teal edge and halo (`accent.editingRing`) and a
 * quiet "Editing" label in the heading's action slot (docs/explorations/contracts-section.html
 * #updating). Both default off, so every other card keeps its look.
 *
 * Build plan Phase 46 (New contract, filled in rule order): `step` puts a numbered chip, teal on the
 * teal tint, in a 26px column before the heading and the body (docs/explorations/contracts-section.html
 * #new, `.formsec`). The chip is decoration (`aria-hidden`), so the heading keeps its own name; the
 * card carries `data-card-step`. Default none.
 */
export function Card({
  as: Tag = 'section',
  title,
  titleLevel = 2,
  headingId,
  headingRef,
  action,
  aside,
  elevation,
  padding = 'card',
  flush = false,
  tone,
  footer,
  editing = false,
  step,
  bare = false,
  shot,
  style,
  children,
  ...data
}: {
  as?: 'section' | 'div' | 'article'
  title?: ReactNode
  titleLevel?: 2 | 3
  headingId?: string
  headingRef?: Ref<HTMLHeadingElement>
  action?: ReactNode
  aside?: ReactNode
  elevation?: CardElevation
  padding?: CardPadding
  flush?: boolean
  tone?: 'warning'
  /** Right-aligned actions under a hairline (a card saved on its own: Cancel, Save). */
  footer?: ReactNode
  /** The card is in edit: the teal edge and halo, and "Editing" in place of the heading's action. */
  editing?: boolean
  /** A numbered step: the chip before the heading and body (New contract's four steps). */
  step?: number
  /**
   * No border, fill or padding: a section that sits straight on a sheet (Replace from a date's
   * numbered steps, docs/explorations/contracts-section.html #updating; build plan Phase 49).
   */
  bare?: boolean
  shot?: string
  style?: CSSProperties
  children?: ReactNode
} & DataAttributes) {
  const autoId = useId()
  const id = headingId ?? `card-heading-${autoId.replace(/:/g, '')}`
  const panel = padding === 'panel'
  const inset = panel ? 20 : 16
  const lifted = (elevation ?? (panel ? 'e1' : 'flat')) === 'e1'
  const H = titleLevel === 3 ? 'h3' : 'h2'
  const headAction = editing ? (
    <span data-card-editing-label style={{ fontSize: 12, fontWeight: 500, color: neutral.mist, flex: 'none' }}>Editing</span>
  ) : (
    action
  )
  const hasHead = title !== undefined || headAction !== undefined
  const edge = editing ? accent.base : tone === 'warning' ? `${semantic.warning.solid}55` : neutral.line
  const halo = [editing ? accent.editingRing : null, lifted ? shadow.e1 : null].filter((v) => v !== null).join(', ')
  return (
    <Tag
      {...data}
      data-shot={shot}
      {...(editing ? { 'data-editing': '' } : {})}
      {...(step !== undefined ? { 'data-card-step': step } : {})}
      {...(title !== undefined ? { 'aria-labelledby': id } : {})}
      style={{
        background: tone === 'warning' ? semantic.warning.tint : neutral.surface,
        border: `1px solid ${edge}`,
        borderRadius: radius.card,
        ...(halo !== '' ? { boxShadow: halo } : {}),
        padding: flush ? 0 : inset,
        display: 'flex',
        flexDirection: 'column',
        gap: panel ? 14 : 10,
        ...(bare ? { border: 'none', background: 'none', boxShadow: 'none', padding: 0 } : {}),
        ...style,
      }}
    >
      <StepColumn step={step} gap={panel ? 14 : 10}>
        {hasHead && (
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
              ...(flush ? { padding: `${inset}px ${inset}px 0` } : {}),
            }}
          >
            {title !== undefined ? (
              <TitleWithAside aside={aside}>
              <H
                id={id}
                ref={headingRef}
                {...(headingRef !== undefined ? { tabIndex: -1 } : {})}
                style={{
                  margin: 0,
                  fontSize: panel ? 17 : 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  ...(headingRef !== undefined ? { outline: 'none' } : {}),
                }}
              >
                {title}
              </H>
              </TitleWithAside>
            ) : (
              <span />
            )}
            {headAction}
          </div>
        )}
        {children}
      </StepColumn>
      {footer !== undefined && (
        <div
          data-card-footer
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 10,
            borderTop: `1px solid ${neutral.line}`,
            paddingTop: 12,
            ...(flush ? { padding: `12px ${inset}px ${inset}px` } : {}),
          }}
        >
          {footer}
        </div>
      )}
    </Tag>
  )
}

/** With a `step`, the numbered chip in its own column beside the heading and body; otherwise the content as it is. */
function StepColumn({ step, gap, children }: { step: number | undefined; gap: number; children: ReactNode }) {
  if (step === undefined) return <>{children}</>
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '26px minmax(0, 1fr)', gap: 12, alignItems: 'start' }}>
      <span
        aria-hidden
        data-card-step-chip
        style={{
          width: 26,
          height: 26,
          borderRadius: radius.pill,
          background: accent.tint,
          color: accent.base,
          fontWeight: 700,
          fontSize: 12.5,
          display: 'grid',
          placeItems: 'center',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {step}
      </span>
      {/* 3px down, so the heading's first line sits level with the chip (`.formsec h6`). */}
      <div style={{ display: 'flex', flexDirection: 'column', gap, minWidth: 0, paddingTop: 3 }}>{children}</div>
    </div>
  )
}

/** The heading with an `aside` beside it (outside the heading), or the heading alone. */
function TitleWithAside({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  if (aside === undefined) return <>{children}</>
  return <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>{children}{aside}</div>
}
