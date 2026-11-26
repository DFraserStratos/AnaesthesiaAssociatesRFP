/**
 * The Intake section (build plan Phase 68; D117; 27 Nov 2026 rebuild, docs/explorations/intake-inbox-iterations.html
 * #where): the front door for every List and change from the rooms and the hospitals. One `fit` `AdminPage` titled
 * Intake over two routed tabs (`intakeTabs.ts`), Arrivals (with the number still to decide) and Sources. There is no
 * import or upload button: arrivals come by themselves.
 *
 * "Add a PDF by hand" makes something new, so it sits in the page header's actions, where the Admin app puts New
 * Draft List and Add anaesthetist; the section owns its sheet (`AddPdfByHand`). The Admin shell's outlet context
 * passes through untouched.
 */

import { useState } from 'react'
import { Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { FilePlus } from 'lucide-react'
import { Button, CountBadge, LineTabLink, LineTabs } from '../../../../shared/ui'
import { useArrivalFeedCounts } from '../../../../store/intakeSelectors'
import type { Actor } from '../../../../store/mutate'
import { neutral } from '../../../../theme/tokens'
import { AdminPage } from '../../components/AdminPage'
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

export function IntakeSection({ actor }: { actor: Actor }) {
  const parent = useOutletContext<object | null | undefined>()
  const { pathname } = useLocation()
  const active = intakeTabFromPath(pathname)
  const [addingPdf, setAddingPdf] = useState(false)

  return (
    <AdminPage
      mode="fit"
      title="Intake"
      shot="intake-section"
      data-intake-tab={active}
      actions={
        <Button variant="secondary" size="desktop" shot="intake-add-pdf" disabled={!ADD_PDF_BY_HAND_READY} onClick={() => setAddingPdf(true)}>
          <FilePlus size={16} aria-hidden /> Add a PDF by hand
        </Button>
      }
      tabs={
        <div style={{ borderBottom: `1px solid ${neutral.line}` }}>
          <IntakeTabs active={active} />
        </div>
      }
    >
      <Outlet context={{ ...(parent ?? {}), actor }} />
      <AddPdfByHand open={addingPdf} onClose={() => setAddingPdf(false)} actor={actor} />
    </AdminPage>
  )
}
