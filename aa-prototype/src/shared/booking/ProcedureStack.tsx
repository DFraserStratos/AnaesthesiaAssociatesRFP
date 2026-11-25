/**
 * The procedure on a Booking (catch-up Phase 20a; US-02.5.7, US-03.1.9), read
 * from one `ProcedureStackView` (`domain/billing/procedureStack.ts`). It
 * renders the view; it derives nothing, and imports only domain types, theme
 * and `shared/format`, so the PWA purity rule holds.
 *
 * Full density (every Booking screen): one quiet card, as the contract picker
 * mock draws it: the latest procedure text exactly as the outside system sent
 * it (the surgeon's rooms, or the hospital's when it replaced them), with when
 * and where it came from, three lines then "Show all". The Contract and the
 * RVG code live in the Billing and RVG code cards below it; the invoice
 * description shows on the invoice only. Compact density (Admin Review's
 * Procedure lines): the RVG code chip, the text, the RVG code's description and
 * the Contract with its pricing basis, the full text in a `title`.
 */

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { fontFamily, neutral, radius, type as typeScale } from '../../theme/tokens'
import type { PricingBasis, ProcedureStackView, StackSurface } from '../../domain/billing/procedureStack'
import { PROCEDURE_TEXT_SOURCE_LABELS, receivedDay } from '../format'
import { formatPricingBasis } from '../contracts/labels'
import { Lock } from 'lucide-react'
import { LOCK_BADGE_TEXT } from '../../domain/billing/lock'
import { Eyebrow } from '../ui/Eyebrow'
import { TextAction } from '../ui/TextAction'
import { InfoTip } from '../help/InfoTip'
import { Pill } from '../ui/Pill'

export interface ProcedureStackProps {
  view: ProcedureStackView
  density: 'full' | 'compact'
  /** Whose words: "RVG at your rate" for the anaesthetist, "the anaesthetist's rate" for the office. */
  surface: StackSurface
  /** Kept for callers; the card reads the same on every surface. */
  layout?: 'stacked' | 'columns'
  /** "Procedure" or "Procedure 2": with `actions`, the heading row (`procedure-header`). */
  heading?: string
  /** The caller's actions on the heading row (Make primary, Remove). */
  actions?: ReactNode
  /** Beside the heading: the neutral "Primary" pill on a multi-procedure Booking (catch-up Phase 23). None by default. */
  badge?: ReactNode
  /** The point-of-need tip beside the heading (catch-up Phase 43a): Booking capture only, so Intake's stack shows none. */
  help?: boolean
}

const MICRO = { fontSize: typeScale.micro.size, lineHeight: `${typeScale.micro.line}px`, fontWeight: typeScale.micro.weight, letterSpacing: typeScale.micro.tracking, textTransform: 'uppercase' as const, color: neutral.mist }
const MONO = fontFamily.mono
/** Read by screen readers, not shown: the compact rows' part labels. */
const VISUALLY_HIDDEN = { position: 'absolute' as const, width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' as const }

export function ProcedureStack(props: ProcedureStackProps) {
  return props.density === 'compact' ? <CompactStack {...props} /> : <FullStack {...props} />
}

// ---------------------------------------------------------------------------
// Full density
// ---------------------------------------------------------------------------

function FullStack({ view, heading, actions, badge, help = false }: ProcedureStackProps) {
  const text = view.procedureText
  const [expanded, setExpanded] = useState(false)
  const [clipped, setClipped] = useState(false)
  const body = useRef<HTMLDivElement>(null)

  // Three lines, then "Show all": a long hospital text never pushes the capture cards away.
  useLayoutEffect(() => {
    const el = body.current
    if (el === null || expanded) return
    const measure = () => setClipped(el.scrollHeight > el.clientHeight + 1)
    measure()
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [text?.text, expanded])

  return (
    <section
      data-shot="procedure-stack"
      aria-label={heading ?? 'Procedure'}
      style={{ background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: radius.card, padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <div data-testid="procedure-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 24 }}>
        {/* The heading, any badge, and the point-of-need tip (catch-up Phase 43a; full density only). */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Eyebrow as="h3" style={{ lineHeight: MICRO.lineHeight }}>{heading ?? 'Procedure'}</Eyebrow>
          {badge}
          {help && <InfoTip topic="capture.stack" />}
        </span>
        {actions !== undefined && <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 14, flex: 'none' }}>{actions}</div>}
      </div>
      <div data-shot="procedure-text" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {text === null ? (
          <span style={{ fontSize: 15, lineHeight: '22px', color: neutral.mist }}>No procedure text received yet</span>
        ) : (
          <>
            <div
              ref={body}
              style={{
                fontSize: 16,
                lineHeight: '23px',
                fontWeight: 500,
                color: neutral.ink,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                ...(expanded ? {} : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }),
              }}
            >
              {text.text}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: neutral.slate }}>
                <span style={{ fontFamily: MONO }}>{receivedStamp(text.receivedAtISO)}</span> · {PROCEDURE_TEXT_SOURCE_LABELS[text.source]}
                {text.from !== undefined ? `, ${text.from}` : ''}
              </span>
              {(clipped || expanded) && (
                <TextAction size="sm" flush onClick={() => setExpanded(!expanded)} style={{ flex: 'none' }}>
                  {expanded ? 'Show less' : 'Show all'}
                </TextAction>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

/** "20 Jul, 16:00": when the latest text arrived. */
function receivedStamp(iso: string): string {
  return `${receivedDay(iso).replace(/^\w+ /, '')}, ${iso.slice(11, 16)}`
}

// ---------------------------------------------------------------------------
// Compact density
// ---------------------------------------------------------------------------

/**
 * Compact density: one Procedure line on Admin Review, in the List drawer's parts (Day view): the RVG
 * code as the drawer's mono chip, the procedure text in ink as the line the eye lands on, the RVG
 * code's description in full under it, then the Contract with its pricing basis in mist. A typed price
 * is left to Review's Fee cell and flag, so it is said once. `badge` sits after the text (Review's
 * Primary or Additional).
 */
function CompactStack({ view, surface, heading, badge }: ProcedureStackProps) {
  const text = view.procedureText
  const contract = view.contract
  const rvg = view.rvg
  // The basis without a typed price, and without repeating "RVG" after a Contract named "... RVG".
  const fullBasis = contract !== null ? formatPricingBasis(withoutTyped(contract.basis), surface) : ''
  const basis = contract !== null && /\bRVG$/.test(contract.name) && fullBasis.startsWith('RVG ') ? fullBasis.slice(4) : fullBasis
  const rvgText = rvg === null ? null : typeof rvg === 'string' ? (rvg === 'forAnaesthetist' ? 'RVG code: for the anaesthetist' : 'RVG code to choose') : rvg.description
  const rvgFull = rvg === null ? '' : typeof rvg === 'string' ? (rvg === 'forAnaesthetist' ? 'For the anaesthetist to fill in' : 'To choose') : `${rvg.code} ${rvg.description}`
  const small = { fontSize: 12.5, lineHeight: '17px', color: neutral.slate } as const
  return (
    <div
      data-shot="procedure-stack"
      role="group"
      aria-label={heading ?? 'Procedure'}
      style={{ display: 'grid', gridTemplateColumns: 'minmax(28px, max-content) minmax(0, 1fr)', columnGap: 10, rowGap: 1, minWidth: 0 }}
    >
      <span style={{ gridRow: '1 / span 4', paddingTop: 1 }}>
        {rvg !== null && typeof rvg === 'object' && (
          <Pill size="sm" mono shot="procedure-rvg-chip" title={rvgFull}>
            {rvg.code}
          </Pill>
        )}
      </span>
      <div
        data-shot="procedure-text"
        title={text?.text ?? 'No description received'}
        style={{
          fontSize: 13.5,
          lineHeight: '19px',
          fontWeight: text !== null ? 500 : 400,
          color: text !== null ? neutral.ink : neutral.mist,
          overflowWrap: 'anywhere',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        <span style={VISUALLY_HIDDEN}>Procedure text: </span>
        {text?.text ?? 'No description received'}
        {badge !== undefined && <span style={{ marginLeft: 8, whiteSpace: 'nowrap' }}>{badge}</span>}
      </div>
      {rvgText !== null && (
        <div data-shot="procedure-rvg-code" title={rvgFull} style={{ ...small, ...(typeof rvg === 'string' ? { color: neutral.mist } : {}) }}>
          <span style={VISUALLY_HIDDEN}>RVG code: </span>
          {rvgText}
        </div>
      )}
      <div
        data-shot="procedure-contract"
        title={contract !== null ? `${contract.name}, held by ${contract.holderName}, invoiced ${contract.invoiced?.name ?? 'not yet known'}, ${fullBasis}${contract.locked === true ? `, ${LOCK_BADGE_TEXT.toLowerCase()}` : ''}` : 'Needs an invoice destination'}
        style={{ fontSize: 12, lineHeight: '16px', color: neutral.mist, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        <span style={VISUALLY_HIDDEN}>Contract: </span>
        {contract !== null ? (
          <>
            {/* Locked at authorise (catch-up Phase 25): the small mist lock glyph of Admin Review's locked rows. */}
            {contract.locked === true && <Lock data-shot="procedure-contract-locked" size={11} strokeWidth={2.25} color={neutral.mist} aria-label={LOCK_BADGE_TEXT} style={{ display: 'inline-block', marginRight: 4, verticalAlign: '-1px' }} />}
            {contract.name}, {basis}
          </>
        ) : (
          'Needs an invoice destination'
        )}
      </div>
      {contract?.split !== undefined && (
        <div data-shot="procedure-split" title={contract.split.text} style={{ ...small, color: contract.split.fits ? neutral.ink : neutral.slate, fontWeight: 600 }}>
          {contract.split.text}
        </div>
      )}
    </div>
  )
}

/** The basis without its typed price (Review says a typed price in its Fee cell and flag). */
function withoutTyped(basis: PricingBasis): PricingBasis {
  const rest = { ...basis }
  delete rest.typed
  return rest
}
