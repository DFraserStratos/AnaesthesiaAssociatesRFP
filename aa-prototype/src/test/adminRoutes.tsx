/**
 * Test helpers: the Admin route blocks for the People section and Master data
 * (build plan Phase 53), as `router.tsx` declares them, so a test harness
 * rendering Admin routes under a `MemoryRouter` meets the same tabs, record
 * pages and redirects. Call them inside a `<Route path="/admin">`.
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
} from '../apps/admin/routes'
import { peoplePath } from '../apps/admin/peoplePaths'

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
      <Route path="waiting" element={<Navigate to="/admin/intake/waiting" replace />} />
      <Route path="follow-up" element={<Navigate to={peoplePath('patients', { show: 'followUp' })} replace />} />
      <Route path=":nhi" element={<AdminPersonRedirect kind="patient" />} />
    </Route>,
  ]
}
