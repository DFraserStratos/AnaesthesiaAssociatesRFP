/**
 * The procedure stack (catch-up Phase 20a; US-03.1.9, US-03.1.2, US-02.5.7,
 * US-08.4.6): one Procedure's procedure text, invoice description, Contract
 * and RVG code, read from one `ProcedureStackView`
 * (`domain/billing/procedureStack.ts`). It renders the view; it derives
 * nothing. Imports only domain types, theme and `shared/format`, so the PWA
 * purity rule holds.
 *
 * Full density (Booking screens): the four parts joined by a hairline rail so
 * they read as one Procedure, stacked on a phone, label beside value on a wide
 * screen. Compact density (Review cells, List drawer rows): the same parts as
 * single lines with an ellipsis, the full text in a `title`.
 *
 * Still-to-choose parts are neutral (mist, dashed): never a status colour.
 * Teal is only for the actions the caller passes in.
 */

import type { ReactNode } from 'react'
import { fontFamily, neutral, radius, type as typeScale } from '../../theme/tokens'
import type { ProcedureStackView, StackSurface } from '../../domain/billing/procedureStack'
import { INVOICE_DESCRIPTION_ORIGIN_LABELS, PROCEDURE_TEXT_SOURCE_LABELS, receivedDay } from '../format'
import { formatPricingBasis } from '../contracts/labels'

export interface ProcedureStackProps {
  view: ProcedureStackView
  density: 'full' | 'compact'
  /** Whose words: "RVG at your rate" for the anaesthetist, "the anaesthetist's rate" for the office. */
  surface: StackSurface
  /** Full density: label beside value (web and Admin) or above it (phone). */
  layout?: 'stacked' | 'columns'
  /** "Procedure" or "Procedure 2": with `actions`, the heading row (`procedure-header`). */
  heading?: string
  /** The caller's actions on the heading row (Edit, Remove, Edit invoice description). */
  actions?: ReactNode
  /** The caller's action on the newer-description cue ("Use it", office only). */
  newerAction?: ReactNode
}

const MICRO = { fontSize: typeScale.micro.size, lineHeight: `${typeScale.micro.line}px`, fontWeight: typeScale.micro.weight, letterSpacing: typeScale.micro.tracking, textTransform: 'uppercase' as const, color: neutral.mist }
const META = { fontSize: 12, lineHeight: '16px', color: neutral.mist }
const MONO = fontFamily.mono
/** Read by screen readers, not shown: the compact rows' part labels. */
const VISUALLY_HIDDEN = { position: 'absolute' as const, width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' as const }

function StillToChoose({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 13,
        lineHeight: '18px',
        color: neutral.mist,
        border: `1px dashed ${neutral.lineStrong}`,
        borderRadius: radius.ctl,
        padding: '4px 10px',
      }}
    >
      {children}
    </span>
  )
}

export function ProcedureStack(props: ProcedureStackProps) {
  return props.density === 'compact' ? <CompactStack {...props} /> : <FullStack {...props} />
}

// ---------------------------------------------------------------------------
// Full density
// ---------------------------------------------------------------------------

function FullStack({ view, surface, layout = 'stacked', heading, actions, newerAction }: ProcedureStackProps) {
  const columns = layout === 'columns'
  const part = (label: string, shot: string, value: ReactNode) => (
    <li
      data-shot={shot}
      style={{
        display: 'grid',
        gridTemplateColumns: columns ? '148px minmax(0, 1fr)' : 'minmax(0, 1fr)',
        columnGap: 16,
        rowGap: 4,
        alignItems: 'baseline',
        padding: '10px 0 10px 16px',
        position: 'relative',
      }}
    >
      {/* The rail's node for this part. */}
      <span aria-hidden style={{ position: 'absolute', left: -4, top: columns ? 15 : 14, width: 7, height: 7, borderRadius: 999, background: neutral.surface, border: `1.5px solid ${neutral.lineStrong}` }} />
      <span style={MICRO}>{label}</span>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>{value}</div>
    </li>
  )

  const text = view.procedureText
  const invoice = view.invoiceDescription
  const contract = view.contract
  const rvg = view.rvg

  return (
    <div data-shot="procedure-stack" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {(heading !== undefined || actions !== undefined) && (
        <div data-testid="procedure-header" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ ...MICRO, color: neutral.slate }}>{heading ?? 'Procedure'}</span>
          {actions !== undefined && <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 14, flex: 'none' }}>{actions}</div>}
        </div>
      )}
      <ol
        aria-label={heading ?? 'Procedure'}
        style={{ listStyle: 'none', margin: 0, padding: 0, marginLeft: 4, borderLeft: `1.5px solid ${neutral.line}` }}
      >
        {part(
          'Procedure text',
          'procedure-text',
          text === null ? (
            <StillToChoose>No description received</StillToChoose>
          ) : (
            <>
              <span style={{ fontFamily: MONO, fontSize: 15, lineHeight: '22px', fontWeight: 500, color: neutral.ink, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                <span aria-hidden style={{ color: neutral.mist }}>“</span>
                {text.text}
                <span aria-hidden style={{ color: neutral.mist }}>”</span>
              </span>
              <span style={META}>
                {PROCEDURE_TEXT_SOURCE_LABELS[text.source]}
                {text.from !== undefined ? `, ${text.from}` : ''} · {receivedDay(text.receivedAtISO)}
              </span>
            </>
          ),
        )}
        {part(
          'Invoice description',
          'procedure-invoice-description',
          invoice === null ? (
            <StillToChoose>Invoice description to choose</StillToChoose>
          ) : (
            <>
              <span style={{ fontSize: 15, lineHeight: '22px', color: neutral.ink, overflowWrap: 'anywhere' }}>{invoice.text}</span>
              <span style={META}>{INVOICE_DESCRIPTION_ORIGIN_LABELS[invoice.origin]}</span>
              {invoice.newer !== undefined && (
                <div
                  data-shot="procedure-newer-description"
                  role="status"
                  style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 12px', background: neutral.bg, border: `1px solid ${neutral.line}`, borderRadius: radius.ctl, padding: '8px 12px' }}
                >
                  <span style={{ fontSize: 13, lineHeight: '18px', color: neutral.slate, flex: '1 1 200px', minWidth: 0, overflowWrap: 'anywhere' }}>
                    A newer description has arrived: ‘{invoice.newer.text}’ ({INVOICE_DESCRIPTION_ORIGIN_LABELS[invoice.newer.origin].toLowerCase()})
                  </span>
                  {newerAction}
                </div>
              )}
            </>
          ),
        )}
        {part(
          'Contract',
          'procedure-contract',
          contract === null ? (
            <StillToChoose>Needs an invoice destination</StillToChoose>
          ) : (
            <>
              <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '2px 10px' }}>
                <span style={{ fontSize: 15, lineHeight: '22px', fontWeight: 600, color: neutral.ink }}>{contract.name}</span>
                {contract.aaCode !== undefined && <span style={{ fontFamily: MONO, fontSize: 12, color: neutral.slate }}>{contract.aaCode}</span>}
              </span>
              <span style={{ fontSize: 13, lineHeight: '18px', color: neutral.slate }}>Held by {contract.holderName}</span>
              <span style={{ fontSize: 13, lineHeight: '18px', color: neutral.slate }}>
                Invoiced: {contract.invoiced !== null ? contract.invoiced.name : 'not yet known'}
              </span>
              <span style={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, color: neutral.ink }}>
                {formatPricingBasis(contract.basis, surface)}
              </span>
            </>
          ),
        )}
        {rvg !== null &&
          part(
            'RVG code',
            'procedure-rvg-code',
            typeof rvg === 'string' ? (
              <StillToChoose>{rvg === 'forAnaesthetist' ? 'RVG code: for the anaesthetist to fill in' : 'RVG code to choose'}</StillToChoose>
            ) : (
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
                <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: neutral.ink, flex: 'none' }}>{rvg.code}</span>
                <span style={{ fontSize: 13, lineHeight: '18px', color: neutral.slate, overflowWrap: 'anywhere' }}>{rvg.description}</span>
              </span>
            ),
          )}
      </ol>
    </div>
  )
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
  const invoice = view.invoiceDescription
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
        'procedure-invoice-description',
        'Invoice description',
        invoice?.text ?? 'Invoice description to choose',
        invoice !== null ? `Invoice: ${invoice.text}${invoice.newer !== undefined ? ' (newer description waiting)' : ''}` : 'Invoice description to choose',
        invoice === null,
      )}
      {line(
        'procedure-contract',
        'Contract',
        contract !== null ? `${contract.name}, held by ${contract.holderName}, invoiced ${contract.invoiced?.name ?? 'not yet known'}, ${basis}` : 'Needs an invoice destination',
        contract !== null ? (
          <>
            <span style={{ color: neutral.ink, fontWeight: 600 }}>{contract.name}</span> · {basis}
          </>
        ) : (
          'Needs an invoice destination'
        ),
        contract === null,
      )}
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
