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
        ...style,
      }}
    >
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

/** The heading with an `aside` beside it (outside the heading), or the heading alone. */
function TitleWithAside({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  if (aside === undefined) return <>{children}</>
  return <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>{children}{aside}</div>
}
