/**
 * The Intake section (build plan Phase 68; D117; docs/explorations/intake-ideas.html #idea1, #sources,
 * #principles): the front door for every List and change from the rooms and the hospitals. One `fit`
 * `AdminPage` titled Intake over two routed tabs (`intakeTabs.ts`), Arrivals and Sources, with the quiet
 * sources strip at the tab row's right end: each connected source and its state in words, and "Inbound
 * only" (AA reads, never writes back). There is no import or upload button: arrivals come by themselves.
 *
 * The section owns the one quiet "Add a PDF by hand" and its sheet (`AddPdfByHand`), disabled until that
 * sheet is ready. The action reaches the Arrivals feed's foot through the outlet (`intakeOutlet.ts`), where
 * #idea1's layout B draws it; the Admin shell's outlet context passes through untouched.
 */

import { useState } from 'react'
import { Outlet, useLocation, useOutletContext } from 'react-router-dom'
import type { IntakeSource } from '../../../../domain/types'
import { stampText } from '../../../../shared/format'
import { CountBadge, LineTabLink, LineTabs, TextAction } from '../../../../shared/ui'
import { useArrivalFeedCounts, useIntakeSources } from '../../../../store/intakeSelectors'
import type { Actor } from '../../../../store/mutate'
import { neutral, radius, semantic, type as typeScale } from '../../../../theme/tokens'
import { AdminPage } from '../../components/AdminPage'
import { SOURCE_STATE_WORDS } from './feed/feedText'
import type { IntakeOutletExtras } from './intakeOutlet'
import { INTAKE_TABS, intakeTabFromPath, type IntakeTab } from './intakeTabs'
import { ADD_PDF_BY_HAND_READY, AddPdfByHand } from './workbench/newList/AddPdfByHand'

/** The tab strip, Arrivals carrying the number still to decide (hidden at zero). */
function IntakeTabs({ active }: { active: IntakeTab }) {
  const counts = useArrivalFeedCounts()
  return (
    <LineTabs label="Intake" shot="intake-tabs" style={{ borderBottom: 'none' }}>
      {INTAKE_TABS.map((t) => (
        <LineTabLink
          key={t.tab}
          to={t.path}
          active={active === t.tab}
          data-intake-tab={t.tab}
          {...(t.tab === 'arrivals' ? { badge: <CountBadge count={counts.toDecide} tone="warning" srNoun="to decide" /> } : {})}
        >
          {t.label}
        </LineTabLink>
      ))}
    </LineTabs>
  )
}

/** One quiet line: each connected source with its state in words, then "Inbound only". */
function IntakeSourcesStrip({ sources }: { sources: readonly IntakeSource[] }) {
  const connected = sources.filter((s) => s.state !== 'notConnected')
  return (
    <ul
      aria-label="Sources"
      data-shot="intake-sources-strip"
      style={{
        listStyle: 'none',
        margin: 0,
        padding: '0 0 10px',
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
        columnGap: 16,
        rowGap: 4,
        fontSize: typeScale.caption.size,
        lineHeight: `${typeScale.caption.line}px`,
        color: neutral.slate,
      }}
    >
      {connected.map((s) => (
        <li
          key={s.id}
          data-source-id={s.id}
          data-source-state={s.state}
          {...(s.lastReceivedAtISO !== undefined ? { title: `Last received ${stampText(s.lastReceivedAtISO)}` } : {})}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
        >
          <span aria-hidden style={{ width: 7, height: 7, borderRadius: radius.pill, background: semantic.success.solid, flex: 'none' }} />
          {s.name} · {SOURCE_STATE_WORDS[s.state]}
        </li>
      ))}
      <li style={{ fontWeight: 600, color: neutral.ink, whiteSpace: 'nowrap' }}>Inbound only</li>
    </ul>
  )
}

export function IntakeSection({ actor }: { actor: Actor }) {
  const parent = useOutletContext<object | null | undefined>()
  const { pathname } = useLocation()
  const active = intakeTabFromPath(pathname)
  const sources = useIntakeSources()
  const [addingPdf, setAddingPdf] = useState(false)

  const addPdfByHand = (
    <TextAction size="sm" flush shot="intake-add-pdf" disabled={!ADD_PDF_BY_HAND_READY} onClick={() => setAddingPdf(true)}>
      Add a PDF by hand
    </TextAction>
  )
  const extras: IntakeOutletExtras = { addPdfByHand }

  return (
    <AdminPage
      mode="fit"
      title="Intake"
      sub="From the rooms and hospitals. Nothing changes until you apply it."
      shot="intake-section"
      data-intake-tab={active}
      tabs={
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, borderBottom: `1px solid ${neutral.line}` }}>
          <IntakeTabs active={active} />
          <IntakeSourcesStrip sources={sources} />
        </div>
      }
    >
      <Outlet context={{ ...(parent ?? {}), actor, ...extras }} />
      <AddPdfByHand open={addingPdf} onClose={() => setAddingPdf(false)} actor={actor} />
    </AdminPage>
  )
}
