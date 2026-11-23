import { useId, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { neutral } from '../../theme/tokens'
import { easing, motion } from '../../theme/motion'
import { dataAttributesOf, type DataAttributes } from './Field'

/** React 18 knows no `inert`: the attribute as a string, cast (as `SlideStack` does). */
const INERT = { inert: '' } as unknown as HTMLAttributes<HTMLDivElement>

interface DisclosureProps extends DataAttributes {
  /** What the toggle says ("Ended (2)", "Show the 3 steps"). A function gets whether it is open. */
  summary: ReactNode | ((open: boolean) => ReactNode)
  children: ReactNode
  /** Controlled open state; omit it and the disclosure keeps its own, starting at `defaultOpen`. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The turning chevron before the summary (Phase 17's pairing look). Off where a site draws none today. */
  chevron?: boolean
  /** The summary's type and colour (each site keeps its own: slate 13/600, or a teal word). */
  summaryStyle?: CSSProperties
  /** Space between the summary and what it opens. */
  gap?: number
  shot?: string
  style?: CSSProperties
}

/**
 * Show and hide a section under a one-line summary (UI unification U7, U35; J N9). The summary is a
 * `type="button"` with `aria-expanded` and `aria-controls` (Enter and Space toggle it, as every button); the
 * content opens with HistoryTimeline's grid-rows motion (no motion under reduced motion, in `global.css`)
 * and, while closed, is inert and hidden from screen readers. The chevron turns 90 degrees when open.
 * `shot` and `data-*` land on the wrapper, whose first child is the summary button.
 */
export function Disclosure({ summary, children, open: openProp, defaultOpen = false, onOpenChange, chevron = true, summaryStyle, gap = 6, shot, style, ...rest }: DisclosureProps) {
  const [own, setOwn] = useState(defaultOpen)
  const open = openProp ?? own
  const id = useId()
  const toggle = () => {
    if (openProp === undefined) setOwn(!open)
    onOpenChange?.(!open)
  }
  return (
    <div data-shot={shot} {...dataAttributesOf(rest)} style={style}>
      <button
        type="button"
        className="aa-ctl aa-disclosure"
        aria-expanded={open}
        aria-controls={id}
        onClick={toggle}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: neutral.slate, ...summaryStyle }}
      >
        {chevron && <ChevronRight size={14} aria-hidden className="aa-disclosure-chevron" />}
        {typeof summary === 'function' ? summary(open) : summary}
      </button>
      <div
        id={id}
        className="aa-disclosure-region"
        data-open={open ? 'true' : 'false'}
        style={{ transition: `grid-template-rows ${motion.sheetIn.out}ms ${easing.sheet}` }}
        {...(open ? {} : { ...INERT, 'aria-hidden': true })}
      >
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div style={{ paddingTop: gap }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * The bare toggle for a table row or a card heading that opens detail somewhere else (the AA fees invoice
 * row, a payables row, a Billing monitor group or List): a `type="button"` with `aria-expanded`, the
 * chevron (slate) pointing down when open and right when shut, then any words in the surrounding colour.
 * `label` names it when it has no words.
 */
export function DisclosureButton({
  open,
  onToggle,
  label,
  controls,
  size = 16,
  chevronTone = 'slate',
  children,
  shot,
  style,
  ...rest
}: {
  open: boolean
  onToggle: () => void
  label?: string
  controls?: string
  size?: 14 | 16
  /** The chevron slate (default), or in the words' own colour (the payables row's ink). */
  chevronTone?: 'slate' | 'inherit'
  children?: ReactNode
  shot?: string
  style?: CSSProperties
} & DataAttributes) {
  const Chevron = open ? ChevronDown : ChevronRight
  return (
    <button
      type="button"
      className="aa-ctl"
      data-shot={shot}
      {...dataAttributesOf(rest)}
      aria-expanded={open}
      {...(controls !== undefined ? { 'aria-controls': controls } : {})}
      {...(label !== undefined ? { 'aria-label': label } : {})}
      onClick={onToggle}
      style={{ display: 'inline-flex', alignItems: 'center', gap: children !== undefined ? 6 : 0, padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', textAlign: 'left', color: 'inherit', cursor: 'pointer', ...style }}
    >
      <Chevron size={size} color={chevronTone === 'slate' ? neutral.slate : 'currentColor'} aria-hidden />
      {children}
    </button>
  )
}
