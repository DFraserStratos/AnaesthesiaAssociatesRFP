/**
 * Catch-up Phase 17b guard (US-13.6.5, DM-60, D74; for Phases 34, 35 and 40):
 * a surgeon's office contacts are read for an address only through
 * `officeAddressFor` (`domain/surgeonContacts.ts`), so no screen or later phase
 * grows a second lookup or sends to every contact; and nothing in the app
 * names a surgeons' room any more.
 */

import { describe, expect, it } from 'vitest'

const SRC = import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

/** `../domain/x.ts` → `domain/x.ts`; `./admin/x.tsx` (this folder) → `apps/admin/x.tsx`. */
const rel = (path: string) => path.replace(/^\.\.\//, '').replace(/^\.\//, 'apps/')
const isTest = (path: string) => /\.test\.tsx?$|\/__parity__\//.test(path)
/**
 * Code without comments, so a doc comment naming a field never counts as a read. A comment
 * opens only at a line start or after whitespace or punctuation, so a route string such as
 * `'/admin/day/*'` or a URL's `//` never swallows the code after it.
 */
const code = (text: string) =>
  text.replace(/(^|[\s;{}(),])\/\*[\s\S]*?\*\//g, '$1').replace(/(^|\s)\/\/.*$/gm, '$1')

const sources = Object.entries(SRC)
  .map(([path, text]) => [rel(path), code(text)] as const)
  .filter(([path]) => !isTest(path))

/**
 * Where `officeContacts` may be read or written: the helper, the type, the
 * surgeon actions, and the two surgeon screens that edit or list every
 * contact (the edit sheet's form, the profile's card); the surgeons table reads
 * the helper. The seed writes it.
 */
const OFFICE_CONTACT_FILES = new Set([
  'domain/surgeonContacts.ts',
  'domain/types.ts',
  'store/surgeonActions.ts',
  // The seed load's surgeons sheet (catch-up Phase 42) writes the list's practice emails and PA names as office contacts; it reads no address.
  'store/masterLoadSpecs.ts',
  'apps/admin/flows/SurgeonEditSheet.tsx',
  'apps/admin/screens/SurgeonProfile.tsx',
  'shared/audit/fieldLabels.ts',
])

describe('one helper for the office\'s emails to a surgeon (catch-up Phase 17b)', () => {
  it('no other file reads officeContacts', () => {
    const readers = sources
      .filter(([path, text]) => /\bofficeContacts\b/.test(text) && !path.startsWith('domain/seed/'))
      .map(([path]) => path)
      .filter((path) => !OFFICE_CONTACT_FILES.has(path))
    // A new reader of a surgeon's address calls officeAddressFor instead.
    expect(readers).toEqual([])
  })

  it('no other file reads personalContact: the office never sends to a surgeon\'s own contact', () => {
    const PERSONAL_CONTACT_FILES = new Set(['domain/types.ts', 'store/surgeonActions.ts', 'apps/admin/flows/SurgeonEditSheet.tsx', 'apps/admin/screens/SurgeonProfile.tsx', 'shared/audit/fieldLabels.ts'])
    const readers = sources
      .filter(([path, text]) => /\bpersonalContact\b/.test(text) && !path.startsWith('domain/seed/'))
      .map(([path]) => path)
      .filter((path) => !PERSONAL_CONTACT_FILES.has(path))
    expect(readers).toEqual([])
  })

  it('no file names a surgeons\' room, its contacts or 17a\'s helpers', () => {
    // The old `?view=surgeonRooms` URL is redirected to People's Surgeons tab (build plan Phase 53): the one file that names it.
    const room = /\b(SurgeonRoom|RoomContact|roomIds|surgeonRooms|roomContacts|roomEmailForSurgeon|otherRoomsForSurgeon|surgeonsInRoom|roomsForSurgeon|mainRoomOf|roomRequired|NO_ROOM_EMAIL|ROOM_CONTACT_ROLE)\b/
    const hits = sources.filter(([path, text]) => room.test(text) && path !== 'apps/admin/mastersRedirect.ts').map(([path]) => path)
    expect(hits).toEqual([])
  })
})
