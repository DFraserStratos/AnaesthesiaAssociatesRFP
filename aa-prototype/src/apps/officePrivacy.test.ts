/**
 * The office-privacy boundary (catch-up Phase 17; OQ-43, D44: "Definitely
 * don't want either side to know"; US-13.6.3, US-13.6.4 and US-01.3.6
 * "Admin only"; US-01.4.5 "Nothing revealed"), in the idiom of
 * `moneyViewPurity.test.ts` and `pwa/pwaPurity.test.ts`.
 *
 * Pairing preferences and priority tiers live in the `officePrivate` state
 * slice. Only the Admin app, the store's office write paths and the audit
 * reading layer's labels may name it, its types or its two modules
 * (`store/officePrivate.ts`, `domain/pairingPreferences.ts`). The PWA closure
 * never reaches the office store module or the Admin app, no history the
 * anaesthetist apps open can show a pairing or tier entry, and the old names
 * ("blacklist", "whitelist") appear nowhere in the app's code.
 *
 * The limit, logged for the owner: the fake backend runs in the browser, so
 * the seeded slice still ships in every build's in-memory store. The boundary
 * here is screens, selectors and the PWA closure; a real server enforces it.
 */

import { describe, expect, it } from 'vitest'
import { OFFICE_PRIVATE_AUDIT_ACTIONS } from '../domain/pairingPreferences'
import { createAppStore } from '../store/appStore'
import type { Actor } from '../store/mutate'
import { editList } from '../store/lifecycle'
import { reassignList } from '../store/slotActions'
import { addPermanentList } from '../store/mastersActions'
import { addPairingPreference, endPairingPreference, setPriorityTier } from '../store/officePrivate'
import { ANAE, SURG } from '../domain/seed'
import { projectedListId } from '../domain/slots'

const SRC = import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const ENTRY_DIR = import.meta.glob('../../pwa/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

const HERE = 'aa-prototype/src/apps'
const ENTRY = 'aa-prototype/pwa/main.tsx'

function normalise(path: string): string {
  const out: string[] = []
  for (const part of path.split('/')) {
    if (part === '.' || part === '') continue
    if (part === '..') out.pop()
    else out.push(part)
  }
  return out.join('/')
}

const MODULES = new Map<string, string>()
for (const [key, source] of Object.entries({ ...SRC, ...ENTRY_DIR })) {
  MODULES.set(normalise(`${HERE}/${key}`), source)
}

/** Strip block + line comments so a doc comment naming the slice never trips the scan. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

// ---------------------------------------------------------------------------
// 1. Allowlist source scan
// ---------------------------------------------------------------------------

/** The slice, its types and its two modules (an import path names them too). */
const PRIVATE_NAMES = /(officePrivate|OfficePrivate|pairingPreferences|priorityTiers|PairingPreference|PriorityTier)/

/** Where they may appear, relative to `src/`. */
const ALLOWED: readonly { label: string; test: (p: string) => boolean }[] = [
  { label: 'domain types', test: (p) => p === 'domain/types.ts' },
  { label: 'the pure helper', test: (p) => p === 'domain/pairingPreferences.ts' },
  { label: 'the seed', test: (p) => p.startsWith('domain/seed/') },
  { label: 'the office store module', test: (p) => p === 'store/officePrivate.ts' },
  { label: 'the store and its Reset', test: (p) => p === 'store/appStore.ts' || p === 'store/mutate.ts' },
  { label: 'the persist files', test: (p) => p === 'store/persistStorage.ts' },
  { label: 'the office write paths (acknowledgement)', test: (p) => p === 'store/lifecycle.ts' || p === 'store/mastersActions.ts' || p === 'store/slotActions.ts' },
  { label: 'the audit labels', test: (p) => p.startsWith('shared/audit/') },
  { label: 'tests', test: (p) => /\.test\.tsx?$/.test(p) },
  { label: 'the Admin app', test: (p) => p.startsWith('apps/admin/') },
]

describe('office privacy: allowlist source scan', () => {
  const files = [...MODULES.keys()].filter((p) => p.startsWith('aa-prototype/src/')).map((p) => p.slice('aa-prototype/src/'.length))

  it('scans the whole of src', () => {
    expect(files.length).toBeGreaterThan(300)
    expect(files).toContain('apps/mobile/MobileApp.tsx')
  })

  it('names the slice, its types and its modules only in allowed files', () => {
    const hits = files.filter((p) => PRIVATE_NAMES.test(stripComments(MODULES.get(`aa-prototype/src/${p}`) ?? '')))
    const outside = hits.filter((p) => !ALLOWED.some((a) => a.test(p)))
    expect(
      outside,
      `office-private names (officePrivate, pairing preferences, priority tiers) must stay in Admin and the store's office paths:\n${outside.join('\n')}`,
    ).toEqual([])
    // The scan is live: the Admin app and the store really do use it.
    expect(hits).toContain('store/officePrivate.ts')
    expect(hits.some((p) => p.startsWith('apps/admin/'))).toBe(true)
  })

  for (const area of ['apps/mobile/', 'apps/web/', 'apps/demo/', 'shell/', 'pwa/']) {
    it(`no ${area} file reads office-private data`, () => {
      const hits = files.filter((p) => p.startsWith(area) && !/\.test\.tsx?$/.test(p) && PRIVATE_NAMES.test(stripComments(MODULES.get(`aa-prototype/src/${p}`) ?? '')))
      expect(hits).toEqual([])
    })
  }
})

// ---------------------------------------------------------------------------
// 2. PWA closure
// ---------------------------------------------------------------------------

function resolve(fromPath: string, specifier: string): string | null {
  const dir = fromPath.split('/').slice(0, -1).join('/')
  const base = normalise(`${dir}/${specifier}`)
  for (const c of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`, base.replace(/\.js$/, '.ts'), base.replace(/\.js$/, '.tsx')]) {
    if (MODULES.has(c)) return c
  }
  return null
}

function specifiersOf(src: string): string[] {
  const code = stripComments(src)
  const found: string[] = []
  for (const m of code.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)) found.push(m[1] as string)
  for (const m of code.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) found.push(m[1] as string)
  for (const m of code.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm)) found.push(m[1] as string)
  return found
}

function closureFrom(entry: string): Set<string> {
  const seen = new Set<string>([entry])
  const queue = [entry]
  while (queue.length > 0) {
    const current = queue.shift() as string
    for (const spec of specifiersOf(MODULES.get(current) ?? '')) {
      if (!spec.startsWith('.')) continue
      const target = resolve(current, spec)
      if (target === null || seen.has(target)) continue
      seen.add(target)
      queue.push(target)
    }
  }
  return seen
}

describe('office privacy: the PWA closure', () => {
  const closure = closureFrom(ENTRY)

  it('walks a real closure', () => {
    expect(closure.size).toBeGreaterThan(100)
  })

  it('never reaches the office store module', () => {
    expect([...closure].filter((p) => p.endsWith('src/store/officePrivate.ts'))).toEqual([])
  })

  it('never reaches the Admin app (or its pairing pieces)', () => {
    expect([...closure].filter((p) => p.includes('/apps/admin/'))).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 3. Histories the anaesthetist apps open
// ---------------------------------------------------------------------------

const OFFICE: Actor = { who: 'Kirsty W.', role: 'office', source: 'office' }

describe('office privacy: no anaesthetist-app history shows a pairing or tier entry', () => {
  it('mobile and web open history only through the shared Booking detail', () => {
    const appFiles = [...MODULES.keys()].filter((p) => /src\/apps\/(mobile|web)\//.test(p) && !/\.test\.tsx?$/.test(p))
    const direct = appFiles.filter((p) => /\b(HistorySheet|HistoryTimeline)\b/.test(stripComments(MODULES.get(p) ?? '')))
    expect(direct).toEqual([])
  })

  it("the Booking detail's history reads only Booking, Procedure and billing-line ids", () => {
    const body = stripComments(MODULES.get('aa-prototype/src/shared/booking/BookingDetailBody.tsx') ?? '')
    expect(body).toMatch(/return \[bookingId, \.\.\.procedureIds, \.\.\.lineIds, \.\.\.removedEntityIds\]/)
  })

  it('every office-private audit entry sits on a List, Permanent List, pairing or anaesthetist, never a Booking', () => {
    const api = createAppStore()
    addPairingPreference(api, OFFICE, { kind: 'PREFERRED', raisedBy: 'ANAESTHETIST', anaesthetistId: ANAE.chen, surgeonId: SURG.lim })
    endPairingPreference(api, OFFICE, 'PP-001')
    addPairingPreference(api, OFFICE, { kind: 'NOT_PREFERRED', raisedBy: 'SURGEON', anaesthetistId: ANAE.sharma, surgeonId: SURG.reid })
    setPriorityTier(api, OFFICE, ANAE.sharma, 1)
    editList(api, OFFICE, projectedListId(ANAE.sharma, '2026-07-21', 'AM'), { surgeonId: SURG.reid })
    reassignList(api, OFFICE, projectedListId(ANAE.chen, '2026-07-21', 'PM'), ANAE.sharma)
    addPermanentList(api, OFFICE, { anaesthetistId: ANAE.sharma, dayOfWeek: 5, session: 'PM', kind: 'private', hospitalId: null, surgeonId: SURG.reid })

    const s = api.getState()
    const privateEntries = s.audit.filter((a) => OFFICE_PRIVATE_AUDIT_ACTIONS.has(a.action))
    expect(new Set(privateEntries.map((a) => a.action))).toEqual(OFFICE_PRIVATE_AUDIT_ACTIONS)
    for (const entry of privateEntries) {
      expect(['list', 'permanentList', 'pairingPreference', 'anaesthetist']).toContain(entry.entityType)
    }
    const historyIds = new Set([
      ...Object.keys(s.schedule.bookings),
      ...Object.keys(s.schedule.procedures),
      ...Object.keys(s.schedule.billingLines),
    ])
    expect(privateEntries.filter((a) => historyIds.has(a.entityId))).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 4. Vocabulary
// ---------------------------------------------------------------------------

describe('office privacy: vocabulary', () => {
  it('no app code says "blacklist" or "whitelist" (comments and tests aside)', () => {
    const hits = [...MODULES.keys()]
      .filter((p) => p.startsWith('aa-prototype/') && !/\.test\.tsx?$/.test(p))
      .filter((p) => /blacklist|whitelist/i.test(stripComments(MODULES.get(p) ?? '')))
    expect(hits).toEqual([])
  })
})
