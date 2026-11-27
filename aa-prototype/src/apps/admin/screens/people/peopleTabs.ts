/**
 * The People section's tabs in one registry (build plan Phase 53; D99,
 * US-13.4.1): each tab's label, path, the rows of US-13.4.1's People list it
 * maintains (in the catalogue's words) and the seed-load sheets that load it
 * once at go-live. With Master data's registry (`masters/masterViews.ts`) and
 * the Contracts section's (`contracts/contractsTabs.ts`) it maps every row of
 * US-13.4.1's three places; the sample-sheet trigger reads `seeded` for the tab
 * published under `adminPeople.tab`.
 */

import type { LoadEntity } from '../../../../domain/masterLoad/types'
import { peoplePath, type PeopleTab } from '../../peoplePaths'

export type { PeopleTab }

export interface PeopleTabEntry {
  tab: PeopleTab
  label: string
  path: string
  catalogueRows: readonly string[]
  /** The one-line sub under the People title, the same height on every tab (`AdminPage` keeps a tabbed page's sub to one line). */
  sub: string
  /** Patients come from Bookings, never added by hand (US-13.4.1). */
  add: boolean
  edit: true
  seeded: readonly LoadEntity[]
}

export const PEOPLE_TABS: readonly PeopleTabEntry[] = [
  { tab: 'anaesthetists', label: 'Anaesthetists', path: peoplePath('anaesthetists'), sub: 'Record, rate, offer order and pairing preferences for each anaesthetist.', catalogueRows: ['anaesthetists'], add: true, edit: true, seeded: ['anaesthetists'] },
  { tab: 'surgeons', label: 'Surgeons', path: peoplePath('surgeons'), sub: 'Contacts, pairing preferences, Contracts and next Lists for each surgeon.', catalogueRows: ['surgeons'], add: true, edit: true, seeded: ['surgeons'] },
  { tab: 'specialties', label: 'Specialties', path: peoplePath('specialties'), sub: 'Broad surgical specialties, such as General surgery rather than Upper GI.', catalogueRows: ['specialties'], add: true, edit: true, seeded: ['specialties'] },
  { tab: 'patients', label: 'Patients', path: peoplePath('patients'), sub: 'Find a patient by name, NHI or date of birth.', catalogueRows: ['patients, whose records come from Bookings'], add: false, edit: true, seeded: [] },
]

/** Each tab's seeded sheets, for its subtitle line and waiting-load banner. */
export const PEOPLE_TAB_SEEDED = Object.fromEntries(PEOPLE_TABS.map((t) => [t.tab, t.seeded])) as Readonly<Record<PeopleTab, readonly LoadEntity[]>>

/** Every People list shows 50 rows a page (the mock's "165, 50 a page"). */
export const PEOPLE_PAGE_SIZE = 50
