/**
 * The demo guide and the registry stay in step (catch-up Phase 44, work item
 * 5). The run sheet (`docs/demo-guide/03-demo-script.md`) and the single-page
 * guide (`master-demo-guide.html`) write a harness-bar press
 * **Demo actions → Label** and a handset press **Demo sheet → Label**; every
 * such press must name a registered entry on that surface, and every entry must
 * be scripted or on `NOT_SCRIPTED` with its reason.
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { extractGuidePresses, htmlToGuideText, type GuidePress } from './demoGuidePresses'
import { DEMO_TRIGGERS } from './registry'

/**
 * Entries the run sheet does not press, each with why: diagnostics, the
 * Future-scope message surface, and handset stand-ins that repeat an Admin step
 * the scripted beat shows in Admin. An entry the run sheet does press must not
 * be listed here (the last test below).
 */
const NOT_SCRIPTED: Readonly<Record<string, string>> = {
  'fire-hospital-message': 'Future scope (HL7 v2, FHIR R4): narrated from the Future-scope surface, never a scripted beat.',
  'record-fee-payment': "The AA fee pair's own Record fee payment button tells the same story in S3's aside.",
  'arm-handoff-fault': 'Diagnostic: one failed Xero call that retries itself; the outage pair and Trigger billing failure tell the retry story.',
  'run-archive-job': 'Diagnostic: runs the nightly Xero contact-archive job now; no beat waits on it.',
  'payment-replay': 'Diagnostic: re-sends the last payment webhook to show it is ignored.',
  'run-scheduled-fee-run': "Stands in for the month-end job; the AA fee beat uses the screen's own run.",
  'xero-pay-bill': 'Pays one bill in the Xero simulation; the scripted payment week pays through the weekly run.',
  'replay-hospital-message': 'Future scope diagnostic: replays the last HL7 or FHIR message to show the dedupe.',
  'add-draft-list-for-day': 'Adds a Draft List to any day; the scripted Draft List beats use the seeded ones and Simulate incoming request.',
  'ask-colleague-make-available': 'Plays a colleague freeing a session inside the Assign picker; no scripted beat needs it.',
  'office-sets-booking-contract': "Handset stand-in for the office's step rail; the parity matrix (item 12) covers it.",
  'office-assigns-next-free': 'Handset stand-in for Assign List in Admin; the parity matrix (item 12) covers it.',
  'office-assigns-draft-list': 'Handset stand-in for Assign on Draft Lists; the parity matrix (item 12) covers it.',
  'availability-office-sets-public': "Handset stand-in for Change status in Admin Day's drawer; the parity matrix (item 12) covers it.",
  // Build plan Phase 49: the guide's S5 beat is brought in step at the owner's sweep.
  'contract-reach-change-date': 'Scripted at the owner\'s sweep',
  // Build plan Phase 52: making an anaesthetist inactive.
  'pass-last-day': 'Not yet in the run sheet; the sweep scripts it',
  'try-sign-in-after-last-day': 'Not yet in the run sheet; the sweep scripts it',
}

describe('extractGuidePresses', () => {
  const press = (surface: GuidePress['surface'], label: string, bold = true): GuidePress => ({ surface, label, bold })

  it('reads both conventions, bold, and drops the steps after the label', () => {
    const md = [
      '- Open **Demo actions → Raise sample warnings** on the Day view.',
      '- On the phone, **Demo sheet → Office authorises this List** → Run.',
      '- **Demo actions → Load full-scale data → Run → Confirm** ("Replaces the demo data").',
      '- Then **Demo actions → Hospital',
      '  description arrives** on the Booking.',
    ].join('\n')
    expect(extractGuidePresses(md)).toEqual([
      press('bar', 'Raise sample warnings'),
      press('pwa', 'Office authorises this List'),
      press('bar', 'Load full-scale data'),
      press('bar', 'Hospital description arrives'),
    ])
  })

  it('keeps the punctuation inside a label', () => {
    const md = [
      '**Demo actions → Hub: Available / Slow / Unavailable** → Unavailable.',
      '**Demo actions → Load 3-procedure Booking (7 modifier units)**, then open it.',
      "**Demo sheet → Office sets this Booking's Contract**.",
      '**Demo actions → Payment received · full**, choose the invoice.',
    ].join('\n')
    expect(extractGuidePresses(md).map((p) => p.label)).toEqual([
      'Hub: Available / Slow / Unavailable',
      'Load 3-procedure Booking (7 modifier units)',
      "Office sets this Booking's Contract",
      'Payment received · full',
    ])
  })

  it('reads a label bold on its own, a press inside a longer bold run, and a plain one (flagged not bold)', () => {
    const md = [
      'Back on PDF lists, Demo actions → **Receive updated PDF from rooms** → Run.',
      '**Admin Day → Demo actions → Simulate sickness** with Dr Sharma.',
      '**Demo actions** → **Stage a payment week**.',
      'Demo actions → Simulate incoming request, then Assign.',
      'On a handset, Demo sheet -> Sign out.',
      'Select Import hospital file (or Demo actions → Import hospital file) first.',
      'Demo actions → Run the next billing run ("Raised 1 invoice").',
    ].join('\n')
    expect(extractGuidePresses(md)).toEqual([
      press('bar', 'Receive updated PDF from rooms'),
      press('bar', 'Simulate sickness'),
      press('bar', 'Stage a payment week'),
      press('bar', 'Simulate incoming request', false),
      press('pwa', 'Sign out', false),
      press('bar', 'Import hospital file', false),
      press('bar', 'Run the next billing run', false),
    ])
  })

  it('ignores mentions that are not a press', () => {
    const md = 'Open **Demo actions** in the top bar. The panel lists **Demo actions by screen**. The Demo sheet\'s **Sign out** does the same.'
    expect(extractGuidePresses(md)).toEqual([])
  })

  it('reads an HTML guide through htmlToGuideText: bold kept, entities decoded, scripts dropped', () => {
    const html = [
      '<style>.x::after { content: "Demo actions &#8594; Nope"; }</style>',
      '<li>Back on PDF lists: Demo actions &#8594; <strong>Receive updated PDF from rooms</strong> &#8594; Run.</li>',
      '<li><strong>Demo sheet &rarr; Office reviews this credit</strong></li>',
      '<li><b>Demo actions &#x2192; Payment received &middot; half</b>, choose <strong>AA-2026-0005</strong></li>',
      '<script>const s = "Demo sheet → Nope"</script>',
    ].join('\n')
    expect(extractGuidePresses(htmlToGuideText(html))).toEqual([
      press('bar', 'Receive updated PDF from rooms'),
      press('pwa', 'Office reviews this credit'),
      press('bar', 'Payment received · half'),
    ])
  })
})

describe('NOT_SCRIPTED', () => {
  it('names registered entries only, each with a one-line reason', () => {
    const ids = new Set(DEMO_TRIGGERS.map((t) => t.id))
    for (const [id, reason] of Object.entries(NOT_SCRIPTED)) {
      expect(ids.has(id), id).toBe(true)
      expect(reason.trim(), id).not.toBe('')
      expect(reason, id).not.toMatch(/\n/)
    }
  })
})

/** `docs/demo-guide/` beside the app: the repo root is four folders up from this file. */
const GUIDE_DIR = resolve(__dirname, '../../../../docs/demo-guide')
const RUN_SHEET = resolve(GUIDE_DIR, '03-demo-script.md')
const MASTER = resolve(GUIDE_DIR, 'master-demo-guide.html')
const guidePresent = existsSync(RUN_SHEET) && existsSync(MASTER)
const SKIP_NOTE = guidePresent ? '' : ` (skipped: no demo guide at ${GUIDE_DIR}; the app was copied without the repo's docs folder)`

describe.skipIf(!guidePresent)(`the demo guide against the registry${SKIP_NOTE}`, () => {
  const guides = (): { file: string; presses: GuidePress[] }[] => [
    { file: '03-demo-script.md', presses: extractGuidePresses(readFileSync(RUN_SHEET, 'utf8')) },
    { file: 'master-demo-guide.html', presses: extractGuidePresses(htmlToGuideText(readFileSync(MASTER, 'utf8'))) },
  ]

  it('finds presses in both files', () => {
    for (const { file, presses } of guides()) expect(presses.length, file).toBeGreaterThan(0)
  })

  it('every scripted press names a registered entry on its surface (write the label bold, exactly as the entry reads)', () => {
    const unknown: string[] = []
    for (const { file, presses } of guides()) {
      for (const p of presses) {
        const known = DEMO_TRIGGERS.some((t) => t.label === p.label && t.surfaces.includes(p.surface))
        if (!known) unknown.push(`${file}: ${p.surface === 'bar' ? 'Demo actions' : 'Demo sheet'} → "${p.label}"${p.bold ? '' : ' (not bold)'}`)
      }
    }
    expect(unknown).toEqual([])
  })

  it('every registered entry is pressed in the run sheet or is on NOT_SCRIPTED', () => {
    const presses = guides().find((g) => g.file === '03-demo-script.md')!.presses
    const missing = DEMO_TRIGGERS.filter(
      (t) => NOT_SCRIPTED[t.id] === undefined && !presses.some((p) => p.label === t.label && t.surfaces.includes(p.surface)),
    ).map((t) => `${t.id} "${t.label}" (${t.surfaces.join(', ')})`)
    expect(missing).toEqual([])
  })

  it('NOT_SCRIPTED names no entry the run sheet presses', () => {
    const presses = guides().find((g) => g.file === '03-demo-script.md')!.presses
    const pressed = DEMO_TRIGGERS.filter(
      (t) => NOT_SCRIPTED[t.id] !== undefined && presses.some((p) => p.label === t.label && t.surfaces.includes(p.surface)),
    ).map((t) => t.id)
    expect(pressed).toEqual([])
  })
})
