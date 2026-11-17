/**
 * Catch-up Phase 17a guard (US-13.6.5, DM-60; for Phases 35 and 40): a
 * surgeons' room's email is resolved for the office's emails only through
 * `domain/roomContacts.ts` (`roomEmailForSurgeon`, `otherRoomsForSurgeon`), so
 * no screen or later phase grows a second lookup; a surgeon's rooms are read
 * only through `roomsForSurgeon`, `mainRoomOf` and `surgeonsInRoom`; and no
 * anaesthetist app or the PWA names a room's email or its contacts.
 */

import { describe, expect, it } from 'vitest'

const SRC = import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const PWA = import.meta.glob('../../pwa/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

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

/** Where a surgeons' room's email may be read or written: the one helper, its type, the room's own actions, its sheet, the seed. */
const ROOM_EMAIL_FILES = new Set([
  'domain/roomContacts.ts',
  'domain/types.ts',
  'store/surgeonActions.ts',
  'store/roomContactActions.ts',
  'apps/admin/flows/SurgeonRoomSheet.tsx',
  'shared/audit/fieldLabels.ts',
])
/** Hospitals hold their own optional contact email (Phase 17); these files read only that one. */
const HOSPITAL_EMAIL_FILES = new Set([
  'store/mastersActions.ts',
  'apps/admin/screens/masters/HospitalsView.tsx',
  'apps/admin/flows/EditHospitalSheet.tsx',
  'apps/admin/flows/AddHospitalSheet.tsx',
])

describe("one helper for a surgeons' room's email (catch-up Phase 17a)", () => {
  it('no other file reads contactEmail', () => {
    const readers = sources
      .filter(([path, text]) => /\bcontactEmail\b/.test(text) && !path.startsWith('domain/seed/'))
      .map(([path]) => path)
      .filter((path) => !ROOM_EMAIL_FILES.has(path) && !HOSPITAL_EMAIL_FILES.has(path))
    // A new reader of a room's email calls roomEmailForSurgeon or roomContactEmail instead.
    expect(readers).toEqual([])
  })

  it('the hospital files never touch a surgeons\' room', () => {
    for (const [path, text] of sources) {
      if (HOSPITAL_EMAIL_FILES.has(path)) expect(/\bsurgeonRooms\b|\bSurgeonRoom\b/.test(text), path).toBe(false)
    }
  })

  it('the scan sees the files it guards', () => {
    const paths = new Set(sources.map(([path]) => path))
    for (const path of [...ROOM_EMAIL_FILES, ...HOSPITAL_EMAIL_FILES]) expect(paths.has(path), path).toBe(true)
  })

  it("no file reads Surgeon.roomIds except the room lookups, the surgeon actions, the edit sheet's form state and the seed", () => {
    const allowed = new Set(['domain/surgeons.ts', 'domain/types.ts', 'store/surgeonActions.ts', 'store/roomContactActions.ts', 'apps/admin/flows/SurgeonEditSheet.tsx'])
    const readers = sources
      .filter(([path, text]) => /\broomIds\b/.test(text) && !allowed.has(path) && !path.startsWith('domain/seed/'))
      .map(([path]) => path)
    expect(readers).toEqual([])
    // No single-room reader survives anywhere.
    expect(sources.filter(([, text]) => /\.roomId\b/.test(text)).map(([path]) => path)).toEqual([])
  })

  it('the comment stripper keeps code after a route string', () => {
    expect(code("const r = '/admin/day/*'\nroom.contactEmail")).toContain('room.contactEmail')
    expect(code("const u = 'http://x.example'\nroom.contactEmail")).toContain('room.contactEmail')
    expect(code('/* room.contactEmail */\n// room.contactEmail\nok')).not.toContain('contactEmail')
  })

  it('no shared module (it ships to the anaesthetist apps and the PWA) reads the room contacts', () => {
    const words = /\broomContacts\b|\bRoomContact\b|\bcontactsForSurgeon\b|\bcontactsForRoom\b|\broomEmailForSurgeon\b|\botherRoomsForSurgeon\b|\bNO_ROOM_EMAIL\b/
    expect(sources.filter(([path, text]) => path.startsWith('shared/') && words.test(text)).map(([path]) => path)).toEqual([])
  })

  it('no anaesthetist app or the PWA names a room email or its contacts', () => {
    const words = /\bcontactEmail\b|\broomContacts\b|\bRoomContact\b|\bcontactsForSurgeon\b|\broomEmailForSurgeon\b|\bNO_ROOM_EMAIL\b|\bsurgeonRooms\b|Practice manager|\bPAs?\b/
    const offenders = [
      ...sources.filter(([path]) => path.startsWith('apps/mobile/') || path.startsWith('apps/web/')),
      ...Object.entries(PWA).map(([path, text]) => [path, code(text)] as const),
    ]
      .filter(([, text]) => words.test(text))
      .map(([path]) => path)
    expect(offenders).toEqual([])
  })
})
