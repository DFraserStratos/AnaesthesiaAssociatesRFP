/**
 * Test helpers: the Admin route blocks for the People section and Master data
 * (build plan Phase 53), the Finances section (build plan Phase 58) and Intake
 * (build plan Phase 68), as
 * `router.tsx` declares them, so a test harness rendering Admin routes under a
 * `MemoryRouter` meets the same tabs, record pages and redirects. Call them
 * inside a `<Route path="/admin">`.
 */

import { Navigate, Route } from 'react-router-dom'
import {
  AdminAnaesthetistRecordRoute,
  AdminMastersRoute,
  AdminPatientRecordRoute,
  AdminPeopleAnaesthetistsRoute,
  AdminPeoplePatientsRoute,
  AdminPeopleSpecialtiesRoute,
  AdminPeopleSurgeonsRoute,
  AdminPersonRedirect,
  AdminSurgeonProfileRoute,
  AdminSpecialtyPageRoute,
  AdminArrivalRoute,
  AdminArrivalsRoute,
  AdminIntakeRoute,
  AdminSourcesRoute,
  FinanceLegacyRedirect,
  IntakeLegacyRedirect,
} from '../apps/admin/routes'
import { peoplePath } from '../apps/admin/peoplePaths'
import { arrivalsPath } from '../apps/admin/screens/intake/intakePaths'
import { AaFeesTab } from '../apps/admin/screens/finances/AaFeesTab'
import { AnaesthetistAccountPage } from '../apps/admin/screens/finances/AnaesthetistAccountPage'
import { BillingTab } from '../apps/admin/screens/finances/BillingTab'
import { CreditNotePage } from '../apps/admin/screens/finances/CreditNotePage'
import { InvoicePage } from '../apps/admin/screens/finances/InvoicePage'
import { InvoicesTab } from '../apps/admin/screens/finances/InvoicesTab'
import { LedgerTab } from '../apps/admin/screens/finances/LedgerTab'
import { PaymentRunPage } from '../apps/admin/screens/finances/PaymentRunPage'
import { PaymentsTab } from '../apps/admin/screens/finances/PaymentsTab'
import { RemittancePage } from '../apps/admin/screens/finances/RemittancePage'
import { XeroTab } from '../apps/admin/screens/finances/XeroTab'

/** `/admin/people/...`: the four tabs and the record pages under them. */
export function peopleRoutes() {
  return (
    <Route path="people">
      <Route index element={<Navigate to="anaesthetists" replace />} />
      <Route path="anaesthetists">
        <Route index element={<AdminPeopleAnaesthetistsRoute />} />
        <Route path=":anaesthetistId" element={<AdminAnaesthetistRecordRoute />} />
      </Route>
      <Route path="surgeons">
        <Route index element={<AdminPeopleSurgeonsRoute />} />
        <Route path=":surgeonId" element={<AdminSurgeonProfileRoute />} />
      </Route>
      <Route path="specialties">
        <Route index element={<AdminPeopleSpecialtiesRoute />} />
        <Route path=":specialtyId" element={<AdminSpecialtyPageRoute />} />
      </Route>
      <Route path="patients">
        <Route index element={<AdminPeoplePatientsRoute />} />
        <Route path=":nhi" element={<AdminPatientRecordRoute />} />
      </Route>
    </Route>
  )
}

/** `/admin/masters` with the old profile redirects, and the old `/admin/patients` links. */
export function mastersAndLegacyRoutes() {
  return [
    <Route key="masters" path="masters">
      <Route index element={<AdminMastersRoute />} />
      <Route path="surgeons/:surgeonId" element={<AdminPersonRedirect kind="surgeon" />} />
      <Route path="anaesthetists/:anaesthetistId" element={<AdminPersonRedirect kind="anaesthetist" />} />
    </Route>,
    <Route key="patients" path="patients">
      <Route index element={<Navigate to={peoplePath('patients')} replace />} />
      <Route path="waiting" element={<Navigate to={arrivalsPath({ filter: { kind: 'needsNhi' } })} replace />} />
      <Route path="follow-up" element={<Navigate to={peoplePath('patients', { filter: 'follow-up' })} replace />} />
      <Route path=":nhi" element={<AdminPersonRedirect kind="patient" />} />
    </Route>,
  ]
}

/** `/admin/finances/...`: the six tabs and the record pages under them. */
export function financesRoutes() {
  return (
    <Route path="finances">
      <Route index element={<Navigate to="billing" replace />} />
      <Route path="billing" element={<BillingTab />} />
      <Route path="invoices">
        <Route index element={<InvoicesTab />} />
        <Route path="credit-notes/:creditNoteId" element={<CreditNotePage />} />
        <Route path=":invoiceId" element={<InvoicePage />} />
      </Route>
      <Route path="payments">
        <Route index element={<PaymentsTab />} />
        <Route path=":runId" element={<PaymentRunPage />} />
        <Route path=":runId/remittance/:anaesthetistId" element={<RemittancePage />} />
      </Route>
      <Route path="ledger">
        <Route index element={<LedgerTab />} />
        <Route path="anaesthetists/:anaesthetistId" element={<AnaesthetistAccountPage />} />
      </Route>
      <Route path="xero" element={<XeroTab />} />
      <Route path="aa-fees">
        <Route index element={<AaFeesTab view="invoices" />} />
        <Route path="settings" element={<AaFeesTab view="settings" />} />
      </Route>
    </Route>
  )
}

/** The old Invoices, credit note, Billing monitor and Ledger addresses, redirecting into Finances. */
export function financeLegacyRoutes() {
  return ['invoices', 'credit-notes', 'billing', 'ledger'].map((head) => <Route key={head} path={`${head}/*`} element={<FinanceLegacyRedirect />} />)
}

/** The old Intake addresses (build plan Phase 68; D117), each redirected with replace. */
const INTAKE_LEGACY_ROUTES = ['intake/matching', 'intake/waiting', 'intake/pdfs', 'intake/quality', 'intake/validators', 'matching', 'integrations']

/** `/admin/intake/...` (build plan Phase 68; D117): Arrivals, Sources and every old Intake address redirected. */
export function intakeRoutes() {
  return [
    <Route key="intake" path="intake" element={<AdminIntakeRoute />}>
      <Route index element={<AdminArrivalsRoute />} />
      <Route path="sources" element={<AdminSourcesRoute />} />
    </Route>,
    <Route key="intake-arrival" path="intake/arrival/:key" element={<AdminArrivalRoute />} />,
    ...INTAKE_LEGACY_ROUTES.map((path) => <Route key={path} path={path} element={<IntakeLegacyRedirect />} />),
  ]
}
