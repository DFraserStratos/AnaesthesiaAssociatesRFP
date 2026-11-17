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
 * description shows on the invoice only. Compact density (Admin Review cells,
 * List drawer rows): the text, the Contract with its pricing basis and the RVG
 * code as single lines with an ellipsis, the full text in a `title`.
 */

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { accent, fontFamily, neutral, radius, type as typeScale } from '../../theme/tokens'
import type { ProcedureStackView, StackSurface } from '../../domain/billing/procedureStack'
import { PROCEDURE_TEXT_SOURCE_LABELS, receivedDay } from '../format'
import { formatPricingBasis } from '../contracts/labels'
import { Lock } from 'lucide-react'
import { LOCK_BADGE_TEXT } from '../../domain/billing/lock'

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

function FullStack({ view, heading, actions, badge }: ProcedureStackProps) {
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
        {badge === undefined ? (
          <h3 style={{ ...MICRO, margin: 0 }}>{heading ?? 'Procedure'}</h3>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <h3 style={{ ...MICRO, margin: 0 }}>{heading ?? 'Procedure'}</h3>
            {badge}
          </span>
        )}
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
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  style={{ flex: 'none', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: accent.base }}
                >
                  {expanded ? 'Show less' : 'Show all'}
                </button>
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

function CompactStack({ view, surface, heading }: ProcedureStackProps) {
  const line = (shot: string, label: string, full: string, value: ReactNode, muted = false) => (
    <li
      data-shot={shot}
      title={full}
      style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12.5, lineHeight: '17px', color: muted ? neutral.mist : neutral.slate }}
    >
      <span style={VISUALLY_HIDDEN}>{label}: </span>
      {value}
    </li>
  )
  const text = view.procedureText
  const contract = view.contract
  const rvg = view.rvg
  const basis = contract !== null ? formatPricingBasis(contract.basis, surface) : ''
  return (
    <ol
      data-shot="procedure-stack"
      aria-label={heading ?? 'Procedure'}
      style={{ listStyle: 'none', margin: 0, padding: '0 0 0 8px', borderLeft: `1.5px solid ${neutral.line}`, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, maxWidth: '100%' }}
    >
      {line(
        'procedure-text',
        'Procedure text',
        text?.text ?? 'No description received',
        text !== null ? (
          <span style={{ fontFamily: MONO, fontSize: 12.5, color: neutral.ink }}>
            <span aria-hidden>“</span>
            {text.text}
            <span aria-hidden>”</span>
          </span>
        ) : (
          'No description received'
        ),
        text === null,
      )}
      {line(
        'procedure-contract',
        'Contract',
        contract !== null ? `${contract.name}, held by ${contract.holderName}, invoiced ${contract.invoiced?.name ?? 'not yet known'}, ${basis}${contract.locked === true ? `, ${LOCK_BADGE_TEXT.toLowerCase()}` : ''}` : 'Needs an invoice destination',
        contract !== null ? (
          <>
            {/* Locked at authorise (catch-up Phase 25): the small mist lock glyph of Admin Review's locked rows. */}
            {contract.locked === true && <Lock data-shot="procedure-contract-locked" size={11} strokeWidth={2.25} color={neutral.mist} aria-label={LOCK_BADGE_TEXT} style={{ display: 'inline-block', marginRight: 4, verticalAlign: '-1px' }} />}
            <span style={{ color: neutral.ink, fontWeight: 600 }}>{contract.name}</span> · {basis}
          </>
        ) : (
          'Needs an invoice destination'
        ),
        contract === null,
      )}
      {contract?.split !== undefined &&
        line('procedure-split', 'Split', contract.split.text, <span style={{ color: contract.split.fits ? neutral.ink : undefined, fontWeight: 600 }}>{contract.split.text}</span>, false)}
      {rvg !== null &&
        line(
          'procedure-rvg-code',
          'RVG code',
          typeof rvg === 'string' ? (rvg === 'forAnaesthetist' ? 'For the anaesthetist to fill in' : 'To choose') : `${rvg.code} ${rvg.description}`,
          typeof rvg === 'string' ? (rvg === 'forAnaesthetist' ? 'RVG code: for the anaesthetist' : 'RVG code to choose') : (
            <>
              <span style={{ fontFamily: MONO, fontWeight: 600, color: neutral.ink }}>{rvg.code}</span> {rvg.description}
            </>
          ),
          typeof rvg === 'string',
        )}
    </ol>
  )
}
