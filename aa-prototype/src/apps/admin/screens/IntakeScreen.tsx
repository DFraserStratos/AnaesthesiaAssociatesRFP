/**
 * Admin Intake (catch-up Phase 34; FT-02.1, FT-02.2, EP-14): one home for
 * everything that arrives from outside. Matching (33's screen), the rooms' PDF
 * lists, data quality and the NHI validators sit on URL-routed tabs
 * (`/admin/intake/<tab>`), all product UI and unbadged. The HL7 and FHIR
 * tooling is not here: it is Future scope, on `/demo/integrations`.
 *
 * Intake is the one `AdminPage` around its tabs. The mode follows the tab:
 * Matching and PDF lists are `fit` list pages, Data quality and Validators
 * `fluid`. A tab names the page's primary action and can ask for `fluid`
 * while it shows a record (a PDF list under review) through
 * `useIntakePage`. The tab pages render in this screen's `<Outlet>`, which
 * passes the Admin shell's outlet context straight through.
 */

import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { LineTabLink, LineTabs } from '../../../shared/ui'
import { AdminPage, type AdminPageMode } from '../components/AdminPage'

export const INTAKE_TABS = [
  { path: '/admin/intake/matching', label: 'Matching', mode: 'fit' },
  { path: '/admin/intake/pdfs', label: 'PDF lists', mode: 'fit' },
  { path: '/admin/intake/quality', label: 'Data quality', mode: 'fluid' },
  { path: '/admin/intake/validators', label: 'Validators', mode: 'fluid' },
] as const satisfies readonly { path: string; label: string; mode: AdminPageMode }[]

interface IntakePageSlots {
  setActions: (actions: ReactNode) => void
  setFluid: (fluid: boolean) => void
}

const IntakePageContext = createContext<IntakePageSlots | null>(null)

/**
 * A tab's say in the Intake page: its primary action (right of the Intake title, while the tab
 * shows) and `fluid` while it shows a record rather than its list. Returns whether an Intake page
 * hosts the tab; rendered on its own (a component test), the tab places its action itself.
 * The action is read when the tab mounts and when `actions` comes or goes, so it must only close
 * over stable callbacks (a state setter).
 */
export function useIntakePage(actions: ReactNode | undefined, fluid = false): boolean {
  const slots = useContext(IntakePageContext)
  const latest = useRef(actions)
  latest.current = actions
  const hasActions = actions !== undefined && actions !== null && actions !== false
  useLayoutEffect(() => {
    if (slots === null) return
    slots.setActions(hasActions ? latest.current : undefined)
    slots.setFluid(fluid)
    return () => {
      slots.setActions(undefined)
      slots.setFluid(false)
    }
  }, [slots, hasActions, fluid])
  return slots !== null
}

export function IntakeScreen() {
  const parent = useOutletContext()
  const { pathname } = useLocation()
  const [actions, setActions] = useState<ReactNode>(undefined)
  const [fluid, setFluid] = useState(false)
  const slots = useMemo<IntakePageSlots>(() => ({ setActions: (a) => setActions(() => a), setFluid }), [])
  const tab = INTAKE_TABS.find((t) => pathname.startsWith(t.path))
  const mode: AdminPageMode = fluid ? 'fluid' : (tab?.mode ?? 'fluid')
  return (
    <AdminPage
      mode={mode}
      shot="admin-intake"
      title="Intake"
      sub="Imported hospital files from St George's and Southern Cross, and the rooms' PDF lists, arrive here. Every row waits for your decision."
      {...(actions !== undefined ? { actions } : {})}
      tabs={
        <LineTabs label="Intake" shot="intake-tabs">
          {INTAKE_TABS.map((t) => (
            <LineTabLink key={t.path} to={t.path} active={pathname.startsWith(t.path)}>
              {t.label}
            </LineTabLink>
          ))}
        </LineTabs>
      }
    >
      <IntakePageContext.Provider value={slots}>
        <Outlet context={parent} />
      </IntakePageContext.Provider>
    </AdminPage>
  )
}
