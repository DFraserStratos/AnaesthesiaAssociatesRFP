/**
 * The one pattern every Master data view is built from (catch-up Phase 42,
 * work item 11; US-13.4.1 "in one place"), on the shared components:
 *
 * - `MasterHeader`: the view's title row over the shared `PageHeader`, with the
 *   primary teal "Add ..." action; a seeded view's subtitle ends with
 *   `SEEDED_SUBTITLE`, and the waiting-load banner sits under it.
 * - `MasterTable`: the shared table kit (`TableShell`, `Th`) at the `dense`
 *   density, its columns named once.
 * - `ShowRetiredToggle`, `RetiredPill`, `retiredRowStyle`: retired rows hidden by
 *   default and, when shown, in mist with a neutral "Retired" pill.
 * - `RetireSection`: Retire with a reason, or Reinstate, at the foot of an edit sheet.
 * - `LoadResultBanner`: a seed load or the go-live load waiting for review.
 */

import { useState, type CSSProperties, type ReactNode } from 'react'
import { useInRouterContext, useNavigate, useSearchParams } from 'react-router-dom'
import { mastersViewPath } from '../../mastersPaths'
import { neutral } from '../../../../theme/tokens'
import { Td, TableShell, Th, type CellAlign } from '../../../../shared/table'
import { Button, Eyebrow, FormError, Notice, PageHeader, Pill, Switch, TextAction as SharedTextAction, TextArea } from '../../../../shared/ui'
import { isRetired, retireBlockers, type RetireKind } from '../../../../domain/masterLifecycle'
import { plainDate } from '../../../../shared/format'
import { reinstateMaster, retireMaster, stagedLoadFor, useAppStore, type Actor } from '../../../../store'
import { masterViewEntry, SEEDED_SUBTITLE } from './masterViews'
import { useAdminPageMode } from '../../components/AdminPage'
import { parseMastersView, type MastersView } from './view'
import type { LoadEntity } from '../../../../domain/masterLoad/types'

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export interface MasterAdd {
  label: string
  onClick: () => void
  shot?: string
}

/**
 * A Master data view's title row (over the shared `PageHeader`, section size):
 * the title, one subtitle line, an optional count beside the title and the
 * primary teal "Add ..." action (`add`), or other `actions`. The view defaults to
 * the `?view=` one; a seeded view's subtitle ends "Loaded once at go-live from
 * AA's controlled spreadsheet, then kept here by hand." and the waiting-load
 * banner follows. `section` is a second header inside a view: no seeded line,
 * no banner.
 */
export interface MasterHeaderProps {
  title: string
  sub?: ReactNode
  count?: ReactNode
  add?: MasterAdd
  actions?: ReactNode
  view?: MastersView
  /** The seed-load sheets this list is loaded from, given outright (a Contracts tab); else the view's own (`masterViews.ts`). */
  seeded?: readonly LoadEntity[]
  section?: boolean
  shot?: string
}

/** A list's seeded sheets: those given, else its Master data view's. */
function seededSheets(seeded: readonly LoadEntity[] | undefined, view: MastersView | undefined): readonly LoadEntity[] {
  return seeded ?? (view !== undefined ? (masterViewEntry(view)?.seeded ?? []) : [])
}

export function MasterHeader(props: MasterHeaderProps) {
  // Outside a router (a view rendered on its own in a test) there is no `?view=` and no banner link.
  return useInRouterContext() ? <RoutedMasterHeader {...props} /> : <MasterHeaderRow {...props} view={props.view} />
}

function RoutedMasterHeader(props: MasterHeaderProps) {
  const [params] = useSearchParams()
  const view = props.view ?? parseMastersView(params.get('view'))
  return (
    <>
      <MasterHeaderRow {...props} view={view} />
      {props.section !== true && <LoadResultBanner view={view} {...(props.seeded !== undefined ? { seeded: props.seeded } : {})} />}
    </>
  )
}

function MasterHeaderRow({ title, sub, count, add, actions, view, seeded: given, section = false, shot }: MasterHeaderProps) {
  const seeded = !section && seededSheets(given, view).length > 0
  const subtitle: ReactNode = seeded ? (
    sub !== undefined ? (
      <>
        <span>{sub}</span> <span data-seeded-line>{SEEDED_SUBTITLE}</span>
      </>
    ) : (
      <span data-seeded-line>{SEEDED_SUBTITLE}</span>
    )
  ) : (
    sub
  )
  const addButton =
    add !== undefined ? (
      <Button variant="primary" size="desktop" onClick={add.onClick} shot={add.shot}>
        {add.label}
      </Button>
    ) : undefined
  const right =
    addButton !== undefined && actions !== undefined ? (
      <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
        {actions}
        {addButton}
      </div>
    ) : (
      addButton ?? actions
    )
  return <PageHeader size="section" title={title} sub={subtitle} count={count} actions={right} shot={shot} />
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

/** A column of a master table: its head words, or the words and an alignment. */
export type MasterColumn = string | { label: string; align?: CellAlign; width?: number | string; nowrap?: boolean }

/**
 * A master view's table: the shared `TableShell` (dense, e1) with a `Th` per
 * column. `label` names the scroller when it overflows (the view's title). On a
 * `fit` page (a list view) it is the page's list card (`TableShell fit`): it hugs
 * a short list and scrolls a long one's rows under a sticky header. `style` sizes
 * the card (a settings table at `ADMIN_FORM_WIDTH`).
 */
export function MasterTable({
  columns,
  children,
  shot,
  label = 'Master data',
  rightAlign,
  style,
  footer,
}: {
  columns: readonly MasterColumn[]
  children: ReactNode
  shot?: string
  label?: string
  /** Column indexes to right-align (a plain-string column's shorthand). */
  rightAlign?: readonly number[]
  style?: CSSProperties
  /** The card's foot row (the pager), kept below the rows (`TableShell footer`). */
  footer?: ReactNode
}) {
  const fit = useAdminPageMode() === 'fit'
  return (
    <TableShell density="dense" shot={shot} label={label} fit={fit} {...(style !== undefined ? { style } : {})} {...(footer !== undefined ? { footer } : {})}>
      <thead>
        <tr>
          {columns.map((c, i) => {
            const col: Exclude<MasterColumn, string> = typeof c === 'string' ? { label: c } : c
            return (
              <Th key={`${col.label}-${i}`} align={col.align ?? (rightAlign?.includes(i) ? 'right' : 'left')} width={col.width} {...(col.nowrap !== undefined ? { nowrap: col.nowrap } : {})}>
                {col.label}
              </Th>
            )
          })}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </TableShell>
  )
}

/**
 * A view that wraps its parts in its own column (to carry its `data-shot`): on a `fit` page it shrinks
 * with its table, so the table's rows, not the page, scroll.
 */
export const MASTER_VIEW_COLUMN: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, minHeight: 0, flex: '0 1 auto' }

/** A right-aligned head with no words (the actions column). */
export const ACTIONS_COLUMN: MasterColumn = { label: '', align: 'right' }

/** The row's "Edit" in its own right-aligned cell. */
export function EditCell({ onClick, label, style }: { onClick: () => void; label?: string; style?: CSSProperties }) {
  return (
    <Td align="right" style={style}>
      <SharedTextAction size="sm" flush onClick={onClick} label={label}>Edit</SharedTextAction>
    </Td>
  )
}

// ---------------------------------------------------------------------------
// Retired rows
// ---------------------------------------------------------------------------

/** "Show retired": off by default, so retired rows stay out of the way. */
export function ShowRetiredToggle({ checked, onChange, count }: { checked: boolean; onChange: (next: boolean) => void; count: number }) {
  return (
    <div data-shot="show-retired" style={{ width: 'fit-content' }}>
      <Switch
        checked={checked}
        onChange={onChange}
        label="Show retired"
        description={count === 0 ? 'None retired' : `${count} retired`}
      />
    </div>
  )
}

/** A retired row's cells: mist text on the `bg` band. */
export const retiredRowStyle: CSSProperties = { background: neutral.bg, color: neutral.mist }

/** The neutral "Retired" pill, its reason in the title. */
export function RetiredPill({ reason }: { reason?: string }) {
  return (
    <Pill tone="neutral" size="sm" title={reason !== undefined && reason !== '' ? `Retired: ${reason}` : 'Retired'} data-retired-pill="true">
      Retired
    </Pill>
  )
}

// ---------------------------------------------------------------------------
// Retire and reinstate, at the foot of an edit sheet
// ---------------------------------------------------------------------------

type RetireRecord = { id: string; retiredAtISO?: string; retiredReason?: string; locationType?: string }

function useRetireRecord(kind: RetireKind, id: string): RetireRecord | undefined {
  return useAppStore((s) => {
    switch (kind) {
      case 'hospital':
        return s.masters.hospitals[id]
      case 'surgeon':
        return s.masters.surgeons[id]
      case 'surgeonGroup':
        return s.masters.surgeonGroups[id]
      case 'aaModifier':
        return s.masters.modifiers[id]
    }
  })
}

const NOUN: Record<RetireKind, string> = { hospital: 'hospital', surgeon: 'surgeon', surgeonGroup: 'group', aaModifier: 'modifier' }

/**
 * Retire (with a required reason) or Reinstate a hospital, surgeon, surgeon
 * group or AA modifier, at the foot of its edit sheet. A refused retire lists
 * the store's blockers as a warning; AA rooms (built in) says it cannot be retired.
 * `onDone` runs after a retire or reinstate goes through.
 */
export function RetireSection({ kind, id, actor, onDone }: { kind: RetireKind; id: string; actor: Actor; onDone?: () => void }) {
  const record = useRetireRecord(kind, id)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [blockers, setBlockers] = useState<readonly string[]>([])
  if (record === undefined) return null
  const noun = NOUN[kind]
  if (kind === 'hospital' && record.locationType === 'aaRooms') {
    const name = (record as { name?: string }).name ?? 'This location'
    return (
      <section data-shot="retire-section" data-built-in="true" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 14, borderTop: `1px solid ${neutral.line}` }}>
        <Eyebrow as="h3" style={{ margin: 0 }}>{`Retire this ${noun}`}</Eyebrow>
        <div style={{ fontSize: 13, color: neutral.slate, lineHeight: '19px' }}>{retireBlockers(kind, { name, builtIn: true })[0]}</div>
      </section>
    )
  }
  const retired = isRetired(record)

  function retire() {
    const outcome = retireMaster(useAppStore, actor, kind, id, reason)
    if (!outcome.ok) {
      const details = outcome.details as { blockers?: string[] } | undefined
      if (outcome.code === 'inUse' && details?.blockers !== undefined) {
        setBlockers(details.blockers)
        setError(null)
      } else {
        setBlockers([])
        setError(outcome.message)
      }
      return
    }
    setBlockers([])
    setError(null)
    setReason('')
    onDone?.()
  }

  function reinstate() {
    const outcome = reinstateMaster(useAppStore, actor, kind, id)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setError(null)
    onDone?.()
  }

  return (
    <section data-shot="retire-section" data-retired={retired ? 'true' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 14, borderTop: `1px solid ${neutral.line}` }}>
      <Eyebrow as="h3" style={{ margin: 0 }}>{retired ? 'Retired' : `Retire this ${noun}`}</Eyebrow>
      {retired ? (
        <>
          <div style={{ fontSize: 13, color: neutral.slate, lineHeight: '19px' }}>
            Retired{record.retiredAtISO !== undefined ? ` on ${plainDate(record.retiredAtISO)}` : ''}
            {record.retiredReason !== undefined && record.retiredReason !== '' ? `: ${record.retiredReason}` : '.'} Past records keep it; it is not offered for new work.
          </div>
          <FormError message={error} />
          <div>
            <Button variant="secondary" size="compact" onClick={reinstate}>Reinstate {noun}</Button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 13, color: neutral.slate, lineHeight: '19px' }}>
            Retired records stay on past Lists and invoices but are no longer offered. Nothing upcoming may depend on it.
          </div>
          <TextArea label="Why it is being retired" value={reason} onChange={(v) => { setReason(v); setError(null) }} rows={2} placeholder="e.g. Closed in March" />
          {blockers.length > 0 && (
            <Notice tone="warning" title={`This ${noun} cannot be retired yet`} live="alert" shot="retire-blockers">
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {blockers.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </Notice>
          )}
          <FormError message={error} />
          <div>
            <Button variant="secondary" size="compact" onClick={retire}>Retire {noun}</Button>
          </div>
        </>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Waiting loads
// ---------------------------------------------------------------------------

/**
 * The one-line banner for a load waiting for review: on a seeded view while a
 * seed load for one of its sheets is staged ("Open Seed load"), and on every
 * view while the go-live load is staged ("Open"). The Go-live views show none.
 */
export function LoadResultBanner({ view, seeded: given }: { view?: MastersView; seeded?: readonly LoadEntity[] }) {
  // Navigates by path rather than setting `?view=`: the banner also shows on the Contracts section's tabs (build plan Phases 45 and 48).
  const navigate = useNavigate()
  const seeded = seededSheets(given, view)
  const seedWaiting = useAppStore((s) => seeded.some((e) => stagedLoadFor(s, e) !== undefined))
  const goLiveWaiting = useAppStore((s) => s.masterLoads.goLive?.status === 'staged')
  if (view === 'seedLoad' || view === 'goLive') return null
  if (!seedWaiting && !goLiveWaiting) return null

  function open(next: MastersView) {
    navigate(mastersViewPath(next))
  }

  return (
    <div data-shot="load-banner" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {seedWaiting && (
        <Notice tone="neutral" data-load-banner="seed" action={<SharedTextAction size="sm" flush onClick={() => open('seedLoad')}>Open Seed load</SharedTextAction>}>
          A seed load for this list is waiting.
        </Notice>
      )}
      {goLiveWaiting && (
        <Notice tone="neutral" data-load-banner="goLive" action={<SharedTextAction size="sm" flush onClick={() => open('goLive')} label="Open the go-live load">Open</SharedTextAction>}>
          A go-live load is ready to review.
        </Notice>
      )}
    </div>
  )
}
