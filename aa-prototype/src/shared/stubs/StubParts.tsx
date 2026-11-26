/**
 * Stubs on a List, drawn (catch-up Phase 33a; US-02.6.2): one component set
 * for the three apps, PWA-safe. A stub is not a Booking: these rows never open
 * one. No mockup draws a stub; the row extends the Booking row with the Design
 * Language's dashed placeholder edge (the Free treatment) on the mild warning
 * tint, and 15a's disc-and-triangle marker (`AttentionDot`), never a Warning.
 */

import { useState, type CSSProperties, type ReactNode } from 'react'
import type { Stub } from '../../domain/types'
import { STUB_OWNER_TEXT, STUB_READINGS_CAPTION, STUB_REASON_TEXT } from '../../domain/intake/stubs'
import { neutral, radius, semantic } from '../../theme/tokens'
import { AttentionDot } from '../warnings/AttentionDot'
import { useAppStore } from '../../store/appStore'
import { PopoverPanel } from '../ui/PopoverPanel'
import { Notice } from '../ui/Notice'
import { DefList, DefRow } from '../ui/DefRow'

const TONE = semantic.warning

interface StubRowProps {
  stub: Stub
  /** `touch` the phone's List, `table` the web and Admin rows. */
  density?: 'touch' | 'table'
  /** Opens what was received (the phone's sheet, the web details). Never a Booking. */
  onOpen?: () => void
  /** What `onOpen` opens: the phone's sheet is a dialog, the web details expand in place. */
  opens?: 'dialog' | 'details'
  /** Trailing content beside the row (Admin's "Resolve at Intake"), never inside its open control. */
  trailing?: ReactNode
  ariaExpanded?: boolean
  style?: CSSProperties
}

/**
 * The stub on its List: time as received, the patient name as received, the
 * wording in mono as received, the reason and who is resolving it.
 */
export function StubRow({ stub, density = 'touch', onOpen, opens = 'dialog', trailing, ariaExpanded, style }: StubRowProps) {
  const touch = density === 'touch'
  const r = stub.asReceived
  const gap = touch ? 12 : 10
  const body = (
    <>
      <span className="mono" style={{ width: touch ? 44 : 40, flex: 'none', fontSize: 12, fontWeight: 600, color: neutral.mist }}>
        {r.scheduledTime ?? '·'}
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: touch ? 16 : 14, fontWeight: 600, color: neutral.ink }}>{r.patientName}</span>
          <AttentionDot size={touch ? 15 : 13} glyph="triangle" tone="warning" />
        </span>
        {r.procedureText !== undefined && (
          <span className="mono" style={{ fontSize: touch ? 12 : 11.5, color: neutral.slate }}>
            {r.procedureText}
          </span>
        )}
        <span style={{ fontSize: touch ? 12.5 : 12, color: TONE.onTint, fontWeight: 600 }}>
          {STUB_REASON_TEXT[stub.reason]}
          <span style={{ fontWeight: 400, color: neutral.slate }}> · {STUB_OWNER_TEXT}</span>
        </span>
      </span>
    </>
  )
  return (
    <div
      data-shot="list-stub"
      data-stub-id={stub.id}
      data-import-row-id={stub.importRowId}
      role={onOpen === undefined ? 'group' : undefined}
      aria-label={onOpen === undefined ? `Stub: ${r.patientName}` : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap,
        padding: touch ? '13px 15px' : '9px 12px',
        background: TONE.tint,
        border: `1.5px dashed ${TONE.solid}`,
        borderRadius: touch ? radius.card : radius.ctl,
        width: '100%',
        boxSizing: 'border-box',
        color: neutral.ink,
        ...style,
      }}
    >
      {onOpen !== undefined ? (
        <button
          type="button"
          onClick={onOpen}
          aria-expanded={ariaExpanded}
          aria-haspopup={opens === 'dialog' ? 'dialog' : undefined}
          style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap, padding: 0, margin: 0, border: 'none', background: 'none', font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}
        >
          {body}
        </button>
      ) : (
        body
      )}
      {trailing}
    </div>
  )
}

/** What was received, the reason, the source and the readings caption (the sheet and the web details). */
export function StubDetails({ stub }: { stub: Stub }) {
  const hospital = useAppStore((s) => s.masters.hospitals[stub.asReceived.hospitalId]?.name)
  const r = stub.asReceived
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Notice tone="warning" icon={<AttentionDot size={16} glyph="triangle" tone="warning" />} title={`${STUB_REASON_TEXT[stub.reason]}.`}>
        <span>The booking has not been made yet. {STUB_OWNER_TEXT}.</span>
      </Notice>
      <DefList>
        <DefRow label="Patient">{r.patientName}</DefRow>
        <DefRow label="Procedure" mono={r.procedureText !== undefined}>{r.procedureText ?? 'No wording sent'}</DefRow>
        <DefRow label="Time" mono={r.scheduledTime !== undefined}>{r.scheduledTime ?? 'No time sent'}</DefRow>
        <DefRow label="From">{`${hospital ?? 'The hospital'} · ${r.sourceLabel}`}</DefRow>
      </DefList>
      <p data-shot="stub-readings" style={{ margin: 0, fontSize: 12, color: neutral.mist }}>
        {STUB_READINGS_CAPTION}
      </p>
    </div>
  )
}

/**
 * A stub inside a Bookings table (web List detail, Admin Review): one cell
 * across the row's columns holding `StubRow`; selecting it shows what was
 * received inline (`PopoverPanel` inline). Never opens a Booking.
 */
export function StubTableRow({ stub, colSpan, trailing }: { stub: Stub; colSpan: number; trailing?: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <tr data-shot="list-stub-row" data-stub-id={stub.id}>
      <td colSpan={colSpan} style={{ padding: '6px 12px' }}>
        <StubRow stub={stub} density="table" opens="details" onOpen={() => setOpen((o) => !o)} ariaExpanded={open} trailing={trailing} />
        {open && (
          <PopoverPanel placement="inline" shot="stub-sheet">
            <StubDetails stub={stub} />
          </PopoverPanel>
        )}
      </td>
    </tr>
  )
}
