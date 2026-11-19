/**
 * Admin Intake (catch-up Phase 34; FT-02.1, FT-02.2, EP-14): one home for
 * everything that arrives from outside. Matching (33's screen), the rooms' PDF
 * lists, data quality and the NHI validators sit on URL-routed tabs
 * (`/admin/intake/<tab>`), all product UI and unbadged. The HL7 and FHIR
 * tooling is not here: it is Future scope, on `/demo/integrations`.
 *
 * The tab pages render in this screen's `<Outlet>`, which passes the Admin
 * shell's outlet context straight through.
 */

import { Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { LineTabLink, LineTabs, PageHeader } from '../../../shared/ui'

export const INTAKE_TABS = [
  { path: '/admin/intake/matching', label: 'Matching' },
  { path: '/admin/intake/pdfs', label: 'PDF lists' },
  { path: '/admin/intake/quality', label: 'Data quality' },
  { path: '/admin/intake/validators', label: 'Validators' },
] as const

export function IntakeScreen() {
  const parent = useOutletContext()
  const { pathname } = useLocation()
  return (
    <div data-shot="admin-intake" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHeader
        size="admin"
        title="Intake"
        subStyle={{ maxWidth: 760, lineHeight: '19px' }}
        sub="Imported hospital files from St George's and Southern Cross, and the rooms' PDF lists, arrive here. Every row waits for your decision."
      />
      <LineTabs label="Intake" shot="intake-tabs">
        {INTAKE_TABS.map((t) => (
          <LineTabLink key={t.path} to={t.path} active={pathname.startsWith(t.path)}>
            {t.label}
          </LineTabLink>
        ))}
      </LineTabs>
      <Outlet context={parent} />
    </div>
  )
}
