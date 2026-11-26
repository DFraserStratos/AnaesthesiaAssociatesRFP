/**
 * The app copy guard (catch-up Phase 44, work item 6d; the scaffold finding
 * once RV-17). Modelled on the label-coverage scan in
 * `shared/audit/auditNarrative.test.ts`: it reads every `src/**` and `pwa/**`
 * source file (tests and test-only fixtures left out) as raw text and parses
 * it with the TypeScript parser, so only string literals, template text and
 * JSX text count. Comments (`//`, `/* *\/` and JSX `{/* *\/}`) are never
 * collected, which is how they are stripped.
 *
 * It fails on:
 * - an en or em dash anywhere in that copy (CLAUDE.md);
 * - the stale caveats the earlier phases left ("(assumption)", "a discovery
 *   item", "The RFP labels" and the rest), anywhere in a string;
 * - the retired words (the catalogue vocabulary, phase doc Goal) and "slot"
 *   (OQ-64, D14), in rendered copy only: `isRenderedCopy` narrows a string to
 *   copy a person reads, so identifiers, `data-shot` values, kebab ids and
 *   context keys never trip it;
 * - a provisional or to-confirm label on an answered decision or question,
 *   and any such label that neither cites an open question nor appears on the
 *   must-keep list or the allowlist below.
 * The must-keep list asserts the live caveats are still there, so a sweep
 * cannot remove them by accident. List-state copy is checked through the one
 * label home (`LIST_STATE_LABELS`, 15b and 31), not a regex.
 *
 * When an open question is answered, delete its must-keep and allowlist
 * entries, move it out of OPEN_QUESTIONS and remove its label from the screen.
 */

import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { LIST_STATE_LABELS } from './domain/types'
import { buildSeed } from './domain/seed'
import { DRAFT_STATE } from './shared/scheduleTerms'

const SOURCES = import.meta.glob(
  [
    './**/*.{ts,tsx}',
    '../pwa/**/*.{ts,tsx}',
    '!./**/*.test.{ts,tsx}',
    '!./**/*.d.ts',
    // Imported only by tests: never rendered.
    '!./test/**',
    '!./store/__parity__/**',
    '!./domain/seed/__fixtures__/**',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

// ---------------------------------------------------------------------------
// Reading the copy out of a source file
// ---------------------------------------------------------------------------

type CopyKind = 'jsx' | 'string' | 'template'

interface CopyString {
  file: string
  line: number
  kind: CopyKind
  text: string
}

const ENTITIES: Record<string, string> = {
  '&apos;': "'",
  '&quot;': '"',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&middot;': '·',
  '&ndash;': '–',
  '&mdash;': '—',
}

function decodeJsxText(raw: string): string {
  return raw
    .replace(/&[a-z]+;/g, (e) => ENTITIES[e] ?? e)
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim()
}

/** A string that names a module, not copy: an import or export path, or `import()`. */
function isModuleSpecifier(node: ts.Node): boolean {
  const p = node.parent
  return ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p) || (ts.isCallExpression(p) && p.expression.kind === ts.SyntaxKind.ImportKeyword)
}

/**
 * Every string literal, template text and JSX text in a source file, with its
 * line. Comments are trivia to the parser, so none is ever returned; nor are
 * module paths or string literal types (`'open' | 'fixed'`), which never render.
 */
function copyStrings(file: string, source: string): CopyString[] {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const out: CopyString[] = []
  const push = (node: ts.Node, kind: CopyKind, text: string) => {
    if (text === '') return
    out.push({ file, line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, kind, text })
  }
  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteral(node)) {
      if (!isModuleSpecifier(node) && !ts.isLiteralTypeNode(node.parent)) push(node, 'string', node.text)
    } else if (ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      if (!ts.isLiteralTypeNode(node.parent)) push(node, 'template', node.text)
    } else if (ts.isJsxText(node)) {
      push(node, 'jsx', decodeJsxText(node.getText(sf)))
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return out
}

/**
 * Whether a string reads as copy a person sees: JSX text always; a string
 * literal or template text only when it holds a space (a sentence, a label, a
 * message). Identifiers, `data-shot` values, kebab ids and context keys hold
 * none, so `'adminDay.selectedSlotId'` and `'slot-am'` are not copy.
 */
function isRenderedCopy(s: Pick<CopyString, 'kind' | 'text'>): boolean {
  if (s.kind === 'jsx') return s.text.trim() !== ''
  return /\s/.test(s.text)
}

// ---------------------------------------------------------------------------
// The patterns
// ---------------------------------------------------------------------------

const DASH = /[–—]/

/** Stale caveats, anywhere in a string: the earlier phases' "RFP", "discovery" and "assumption" labels. */
const STALE_CAVEATS: readonly RegExp[] = [
  /RFP (open question|leaves|labels|is silent|does not (state|specify)|defines the tiers)/i,
  /open RFP question/i,
  /RFP('s)? immutability answer/i,
  /discovery (item|question|point)/i,
  /\(assumption\)/i,
  /(demo|prototype) assumption/i,
  /proposed reading/i,
  /to confirm (with AA )?in discovery/i,
]

/**
 * Retired words, in rendered copy only (the phase doc's Goal). One narrowing:
 * the Goal retires "holder references" (the plural, D82: no per-Booking
 * references on the holder's invoice), while the Contract's "holder reference
 * code" (US-08.4.1) and its short label "Holder reference" stay.
 */
const RETIRED_WORDS: readonly RegExp[] = [
  /\bswap(s|ped)?\b/i,
  /Permanent lists?/i,
  /timesheet/i,
  /cover request/i,
  /Copy (a )?booking/i,
  /addendum/i,
  /blacklist|whitelist/i,
  /Type [123]\b/,
  /billing route/i,
  /(protected )?default (hospital|insurer) Contract/i,
  /Funder allocation/i,
  /(pre-?payment|prepaid) (estimate|deposit)|estimated fee|agreed deposit/i,
  /balance (is )?invoiced/i,
  /prepay(ment)? holding account/i,
  /Insurers? master/i,
  /second pair/i,
  /prepay\w* deduct|deduct\w* .{0,20}prepay/i,
  /surgeons?['’]? rooms?|Public (List|kind)|hospital (reference|sync)|Simulate sync|part credit|holder references\b/i,
  /Contract (lines?|versions?)|staged (Contract )?changes?|contract holder|No contract \(RVG\)|Needs a Contract/i,
]

const SLOT = /\bslots?\b/i

/** A provisional or to-confirm label: the words a screen uses to mark an open point. */
const PROVISIONAL_MARKER =
  /\bprovisional\b|\bTBC\b|still to check|to confirm with AA|being confirmed with AA|awaiting AA's confirmation|still to be (confirmed|agreed|decided)|to be agreed with AA|for AA to (agree|confirm)|\bour reading\b/i

/**
 * The questions not answered at HEAD (2026-11-23, catalogue `questions/`):
 * Open, OQ-73 at Confirm (D23) and OQ-47 Proposed. A label may cite only these.
 */
const OPEN_QUESTIONS = new Set([
  'OQ-12', 'OQ-13', 'OQ-29', 'OQ-60', 'OQ-83', 'OQ-112', 'OQ-114', 'OQ-120', 'OQ-122', 'OQ-123', 'OQ-124',
  'OQ-125', 'OQ-132', 'OQ-138', 'OQ-141', 'OQ-142', 'OQ-143', 'OQ-73', 'OQ-47',
])

/** The owner decisions whose default is still open (ROADMAP D1 to D89): D23 at Confirm; D55's part, D68, D70 to D72, D78, D87 to D89. */
const OPEN_DECISIONS = new Set(['D23', 'D55', 'D68', 'D70', 'D71', 'D72', 'D78', 'D87', 'D88', 'D89'])

/** Answered decisions and questions the phase doc names: never labelled provisional. */
const NAMED_ANSWERED = [
  'D9', 'D11', 'D16', 'D26', 'D29', 'D31', 'D34', 'D36', 'D38', 'D39', 'D40', 'D41', 'D52', 'D73', 'D74', 'D76', 'D77',
  'D79', 'D80', 'D81', 'D82', 'D83', 'D85', 'OQ-84', 'OQ-89', 'OQ-90', 'OQ-140',
] as const

/** Answered questions whose old labels phases cleared (25a and others): no copy outside the component catalogue cites them. */
const CLEARED_QUESTIONS = ['OQ-30', 'OQ-31', 'OQ-43', 'OQ-50', 'OQ-61', 'OQ-75', 'OQ-76', 'OQ-78', 'OQ-84', 'OQ-89', 'OQ-90', 'OQ-95', 'OQ-102', 'OQ-103', 'OQ-119', 'OQ-121', 'OQ-140']

const citedIds = (text: string): string[] => [...text.matchAll(/\b(OQ-\d+|D\d{1,2})\b/g)].map((m) => m[1]!)

// ---------------------------------------------------------------------------
// The kept caveats
// ---------------------------------------------------------------------------

interface AllowEntry {
  /** The file, relative to `src/` (or `../pwa/`). */
  file: string
  /** A phrase the string contains. */
  phrase: string
  reason: string
  /** The catalogue item or open question that keeps it. Never an answered OQ. */
  item: string
}

/**
 * Strings that would trip a pattern above, kept on purpose. An entry whose OQ
 * is answered is deleted, not kept (there is no OQ-30, 31, 43, 50, 61, 75, 76
 * or 78 entry).
 */
const ALLOWLIST: readonly AllowEntry[] = [
  {
    file: 'shared/support/supportCopy.ts',
    phrase: 'The label is for AA to confirm.',
    reason: "The NHI mod-11 flag, in Admin's Help since the Validators tab went: US-11.1.2 still says modulus 24, which its own example fails; the catalogue text needs correcting.",
    item: 'US-11.1.2',
  },
  {
    file: 'domain/intake/rawRow.ts',
    phrase: 'Type 2 diabetes',
    reason: "A hospital row's clinical note, kept as received; not the retired Contract type.",
    item: 'US-02.1.1',
  },
  {
    file: 'apps/admin/screens/masters/masterViews.ts',
    phrase: 'Slot availability statuses',
    reason: "US-13.4.1's row in the catalogue's words, read by the registry test and never rendered; Slot stays a planning word.",
    item: 'US-13.4.1',
  },
  {
    file: 'shared/audit/fieldLabels.ts',
    phrase: 'Provisional record',
    reason: "The audit field label for a Xero mismatch resolution recorded under the policy AA has still to agree.",
    item: 'US-09.2.2',
  },
  {
    file: 'apps/mobile/screens/SignInScreen.tsx',
    phrase: 'Provisional',
    reason: 'The sign-in pill; its title and note cite OQ-83.',
    item: 'OQ-83',
  },
  {
    file: 'shared/help/InfoTip.tsx',
    phrase: 'Provisional',
    reason: "The help tip's pill, shown only for a topic resting on an open question (none today); the topic names the OQ.",
    item: 'US-15.0.1',
  },
]

interface MustKeep {
  file: string
  /** Copy the file must still hold, exactly (a JSX text may hold more around it). */
  text?: string
  /** A label constant the file must still render. */
  renders?: string
  item: string
  phase: string
}

/** The live caveats, as built: each open default whose phase put a label on screen. */
const MUST_KEEP: readonly MustKeep[] = [
  // BCTI granularity, with OQ-29 and OQ-60: the AA fee count rule (16) and the ACCPAY held as a BCTI (22).
  { file: 'apps/admin/screens/AaFeesScreen.tsx', text: "Provisional: being confirmed with AA's accountant (OQ-29, OQ-60).", item: 'BCTI granularity, with OQ-29 and OQ-60', phase: '16' },
  { file: 'domain/billing/invoicePresentation.ts', text: 'Provisional (OQ-29)', item: 'OQ-29', phase: '22' },
  {
    file: 'domain/billing/invoicePresentation.ts',
    text: "Supplier, agent and buyer-created wording are provisional until AA's accountant confirms the GST agency treatment and IRD's current name for this document.",
    item: 'OQ-29',
    phase: '22',
  },
  { file: 'shared/billing/docParts.tsx', renders: 'OQ29_PILL', item: 'OQ-29 (the invoice)', phase: '22' },
  { file: 'apps/demo/DemoXero.tsx', renders: 'OQ29_PILL', item: 'OQ-29 (the ACCPAY held as a BCTI)', phase: '22' },
  // D70: a payer with only a postal address (21, 22).
  { file: 'domain/billing/invoicePresentation.ts', text: 'Provisional (OQ-122)', item: 'OQ-122, D70', phase: '21, 22' },
  { file: 'apps/admin/screens/InvoiceDocument.tsx', renders: 'OQ122_PILL', item: 'OQ-122, D70', phase: '22' },
  // D68: the patient email when a prepaid Booking changes anaesthetist (41).
  { file: 'shared/booking/PrepaymentMovedCard.tsx', text: 'Provisional (OQ-120)', item: 'OQ-120, D68', phase: '41' },
  // D72: the holding account's release trigger (27a).
  { file: 'domain/billing/prepayHolding.ts', text: 'Moves to the anaesthetist when the List is authorised', item: 'OQ-125, D72', phase: '27a' },
  { file: 'apps/admin/components/HoldingAccountPanel.tsx', text: '· to confirm with AA (OQ-125)', item: 'OQ-125, D72', phase: '27a' },
  { file: 'apps/admin/components/HoldingAccountPanel.tsx', text: 'The release trigger is still to confirm with AA (OQ-125)', item: 'OQ-125, D72', phase: '27a' },
  // D78: base units on a mixed Booking whose primary has a fixed price (23).
  { file: 'shared/capture/UnitsCard.tsx', text: 'No base units billed on a fixed price (provisional, OQ-132)', item: 'OQ-132, D78', phase: '23' },
  { file: 'shared/booking/BookingDetailBody.tsx', text: 'No base units billed (provisional, OQ-132)', item: 'OQ-132, D78', phase: '23' },
  // D23 at Confirm: labelled once, awaiting confirmation (27); one home, New contract's step 1 (build plan Phase 46), which the Contract page's card imports.
  { file: 'apps/admin/screens/contracts/new/NewContractPage.tsx', text: "A prepaid Contract always bills the payer, awaiting AA's confirmation.", item: 'OQ-73, D23', phase: '46' },
  // Other open points a phase labelled on screen.
  { file: 'shared/procedureEventCopy.ts', text: "Codes to confirm with AA's accountant (OQ-12).", item: 'OQ-12', phase: '39b' },
  { file: 'shared/session/anaesthetistSession.ts', text: 'How anaesthetists sign in (two-step codes, single sign-on, Face ID) is still to be decided. This screen stands in for it.', item: 'OQ-83', phase: '43a' },
  { file: 'apps/mobile/screens/SignInScreen.tsx', text: 'Provisional', item: 'OQ-83', phase: '43a' },
  { file: 'domain/support.ts', text: 'whether AA needs cover from 8:00am is still to be agreed (OQ-141).', item: 'OQ-141, D87', phase: '43b' },
  { file: 'apps/admin/screens/patients/RegisterRefresh.tsx', text: 'On demand, to confirm with AA', item: 'US-14.4.1 (the refresh cadence)', phase: '40a' },
  { file: 'domain/intake/stubs.ts', text: 'How a stub reads is our reading, to confirm with AA.', item: "US-02.6.1 to US-02.6.3 (33a's own readings, on the owner review list)", phase: '33a' },
  { file: 'domain/privacy/mask.ts', text: 'Masking policy is for AA to agree', item: 'US-15.0.6', phase: '43' },
  { file: 'apps/admin/components/XeroPanels.tsx', text: 'Provisional: the policy for each mismatch is to be agreed with AA.', item: 'US-09.2.2', phase: '37' },
  { file: 'apps/demo/DemoXero.tsx', text: 'How this posts in Xero is still to be confirmed.', item: 'US-06.5.1 (how Xero posts the move is still open)', phase: '27a' },
  { file: 'shared/support/supportCopy.ts', text: 'The label is for AA to confirm.', item: 'US-11.1.2 (the Modulus 24 label, in Admin Help)', phase: '72' },
]

// ---------------------------------------------------------------------------
// The scan
// ---------------------------------------------------------------------------

const relPath = (key: string): string => key.replace(/^\.\//, '')

const ALL: CopyString[] = Object.entries(SOURCES).flatMap(([key, source]) => copyStrings(relPath(key), source))

const allowed = (s: CopyString): boolean => ALLOWLIST.some((a) => a.file === s.file && s.text.includes(a.phrase))
const mustKept = (s: CopyString): boolean => MUST_KEEP.some((m) => m.file === s.file && m.text !== undefined && (s.text.includes(m.text) || m.text.includes(s.text.trim())))
const show = (s: CopyString): string => `${s.file}:${s.line}  ${s.text.slice(0, 160)}`

/** Curly quotes read as straight ones, so "AA’s" and "Surgeons’" match the same patterns as "AA's" (Phase 44 review). */
const plain = (text: string): string => text.replace(/[‘’]/g, "'")

/** Build history and internal ids never show in demo copy (Phase 44 review): "(catch-up Phase 34)", "BK0074". */
const DEMO_COPY_LEAK = /\bphase \d|\b(BK|INV|LG)\d{4}\b/i
const isDemoCopyFile = (file: string): boolean =>
  (file.startsWith('apps/demo/') && !file.startsWith('apps/demo/catalogue/')) || file.startsWith('shared/demoTriggers/')

/** Every way a string can fail the guard: the dash, a stale caveat, a retired word or "slot" in rendered copy. */
function copyFailures(s: Pick<CopyString, 'kind' | 'text'> & { file?: string }): string[] {
  const failures: string[] = []
  const text = plain(s.text)
  if (DASH.test(text)) failures.push('dash')
  for (const re of STALE_CAVEATS) if (re.test(text)) failures.push(`stale caveat ${re}`)
  if (isRenderedCopy(s)) {
    for (const re of RETIRED_WORDS) if (re.test(text)) failures.push(`retired word ${re}`)
    if (SLOT.test(text)) failures.push('slot')
    if (s.file !== undefined && isDemoCopyFile(s.file) && DEMO_COPY_LEAK.test(text)) failures.push('build history or internal id in demo copy')
  }
  return failures
}

/** The component catalogue's rows describe the labels the screens carry; they label nothing themselves. */
const isCatalogueDescription = (s: CopyString): boolean => s.file.startsWith('apps/demo/catalogue/')

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('copyStrings and isRenderedCopy (the narrowing helper)', () => {
  const tsx = [
    "// part intervals round up (assumption)",
    "/* The RFP defines the tiers but not the rounding */",
    "const id = 'adminDay.selectedSlotId'",
    "const shot = 'slot-am'",
    "import { x } from './slots'",
    "type K = 'Copy booking' | 'other'",
    'export const A = () => (',
    '  <div data-shot="slot-am">',
    '    {/* Reassign to a free slot */}',
    '    Reassign to a free slot',
    '    <span title="the agreed deposit">{`${3} vacated slot`}</span>',
    '  </div>',
    ')',
  ].join('\n')
  const strings = copyStrings('fixture.tsx', tsx)

  it('collects string literals, template text and JSX text, never comments, module paths or literal types', () => {
    const texts = strings.map((s) => s.text)
    expect(texts).toContain('Reassign to a free slot')
    expect(texts).toContain('the agreed deposit')
    expect(texts).toContain(' vacated slot')
    expect(texts.some((t) => /assumption|defines the tiers/.test(t))).toBe(false)
    expect(texts).not.toContain('./slots')
    expect(texts).not.toContain('Copy booking')
  })

  it('"Reassign to a free slot" fails; \'adminDay.selectedSlotId\' and \'slot-am\' pass', () => {
    expect(isRenderedCopy({ kind: 'jsx', text: 'Reassign to a free slot' })).toBe(true)
    expect(copyFailures({ kind: 'jsx', text: 'Reassign to a free slot' })).toEqual(['slot'])
    expect(copyFailures({ kind: 'string', text: 'Reassign to a free slot' })).toEqual(['slot'])
    for (const id of ['adminDay.selectedSlotId', 'slot-am', 'slots']) {
      expect(isRenderedCopy({ kind: 'string', text: id })).toBe(false)
      expect(copyFailures({ kind: 'string', text: id })).toEqual([])
    }
    const fromFixture = strings.filter((s) => copyFailures(s).includes('slot')).map((s) => s.text)
    expect(fromFixture).toEqual(['Reassign to a free slot', ' vacated slot'])
  })
})

describe('the guard catches every plan-time hit (phase doc, Reference list)', () => {
  // Each pattern seeded from a real string an earlier phase shipped.
  it.each([
    ['part intervals round up (assumption)', 'stale caveat'],
    ['The RFP defines the tiers but not the rounding', 'stale caveat'],
    ['GST is shown at the foot, a demo assumption', 'stale caveat'],
    ['15% prototype assumption. The RFP does not specify', 'stale caveat'],
    ['The RFP labels the current algorithm "Modulus 24"', 'stale caveat'],
    ['Configuring this in the AA Xero org is an open item to confirm in discovery.', 'stale caveat'],
    ['Locked after authorisation: the RFP immutability answer', 'stale caveat'],
    ['flags the label as a discovery item', 'stale caveat'],
    ['A PROPOSED reading of the open question', 'stale caveat'],
    ['Copy booking', 'retired word'],
    ['The vacated slot becomes free', 'slot'],
    ['the agreed deposit', 'retired word'],
    ['the full estimated fee', 'retired word'],
    ['Permanent lists', 'retired word'],
    ['Post-op addendum', 'retired word'],
    ['Billed under the default hospital Contract', 'retired word'],
    ['Needs a Contract', 'retired word'],
    ['Dr Souter swapped with Dr Sharma', 'retired word'],
    ['Range – dashes', 'dash'],
  ])('%s', (text, kind) => {
    expect(copyFailures({ kind: 'jsx', text }).some((f) => f.startsWith(kind))).toBe(true)
  })

  it('reads curly quotes as straight, and catches build history and ids in demo copy only (Phase 44 review)', () => {
    expect(copyFailures({ kind: 'jsx', text: 'Surgeons’ rooms email their Lists' }).some((f) => f.startsWith('retired word'))).toBe(true)
    expect(PROVISIONAL_MARKER.test(plain('Awaiting AA’s confirmation'))).toBe(true)
    expect(PROVISIONAL_MARKER.test('The unarchive step is TBC in the sandbox')).toBe(true)
    for (const text of ['Stands in for the office (catch-up Phase 34): it imports', 'Staged on BK0074 unless this one names an insurer']) {
      expect(copyFailures({ kind: 'string', text, file: 'shared/demoTriggers/registry.ts' })).toContain('build history or internal id in demo copy')
      expect(copyFailures({ kind: 'string', text, file: 'apps/admin/screens/DayView.tsx' })).toEqual([])
    }
  })

  it('passes the catalogue words that look alike', () => {
    expect(copyFailures({ kind: 'jsx', text: 'No holder references on the invoice' }).some((f) => f.startsWith('retired word'))).toBe(true)
    for (const text of ['Holder reference code', 'Holder reference', 'Needs an invoice destination', 'No contract · RVG', 'Bank deposit · SOUTER JULY', 'Recurring bookings']) {
      expect(copyFailures({ kind: 'jsx', text }), text).toEqual([])
    }
  })
})

describe('app copy (src and pwa, tests left out)', () => {
  it('reads the whole app', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(500)
    expect(ALL.length).toBeGreaterThan(10000)
  })

  it('has no dash, stale caveat, retired word or "slot" outside the allowlist', () => {
    const hits = ALL.filter((s) => copyFailures(s).length > 0 && !allowed(s)).map((s) => `${show(s)}  [${copyFailures(s).join(', ')}]`)
    expect(hits).toEqual([])
  })

  it('labels nothing provisional that is answered: every label cites an open question or is a kept caveat', () => {
    const hits: string[] = []
    for (const s of ALL) {
      if (!isRenderedCopy(s) || !PROVISIONAL_MARKER.test(plain(s.text))) continue
      const ids = citedIds(s.text)
      const answered = ids.filter((id) => (id.startsWith('OQ-') ? !OPEN_QUESTIONS.has(id) : !OPEN_DECISIONS.has(id)))
      if (answered.length > 0) hits.push(`${show(s)}  [answered: ${answered.join(', ')}]`)
      else if (ids.length === 0 && !isCatalogueDescription(s) && !allowed(s) && !mustKept(s)) hits.push(`${show(s)}  [no open question cited, not a kept caveat]`)
    }
    expect(hits).toEqual([])
  })

  it.each(NAMED_ANSWERED)('%s is never labelled provisional', (id) => {
    const re = new RegExp(`\\b${id}\\b`)
    expect(ALL.filter((s) => isRenderedCopy(s) && PROVISIONAL_MARKER.test(plain(s.text)) && re.test(s.text)).map(show)).toEqual([])
  })

  it('no screen cites a question whose label a phase cleared', () => {
    const re = new RegExp(`\\b(${CLEARED_QUESTIONS.join('|')})\\b`)
    expect(ALL.filter((s) => isRenderedCopy(s) && !isCatalogueDescription(s) && re.test(s.text)).map(show)).toEqual([])
  })

  it('if the Control Panel callout exists, it states the rounding rule with no "confirm"', () => {
    const panel = Object.entries(SOURCES).find(([key]) => key.endsWith('apps/demo/DemoControlPanel.tsx'))
    expect(panel).toBeDefined()
    const strings = copyStrings('apps/demo/DemoControlPanel.tsx', panel![1])
    expect(strings.some((s) => /Billing assumption/i.test(s.text))).toBe(false)
    const rule = strings.filter((s) => /part interval/i.test(s.text))
    for (const s of rule) {
      expect(s.text).toMatch(/rounds up/)
      expect(s.text).not.toMatch(/confirm/i)
    }
  })
})

// The two HTML entries (the framed prototype and the PWA) carry copy too: the
// browser-tab title and the install metadata. Comments are stripped; an
// entity (&ndash; or &mdash;) counts as its dash.
const HTML_ENTRIES = import.meta.glob(['../index.html', '../pwa/index.html'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function htmlDashLines(html: string): string[] {
  const visible = html.replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ' '))
  return visible
    .split('\n')
    .map((line, i) => ({ line: i + 1, text: line.replace(/&(ndash|mdash);/g, (e) => ENTITIES[e] ?? e) }))
    .filter((l) => DASH.test(l.text))
    .map((l) => `${l.line}: ${l.text.trim()}`)
}

describe('HTML entries (index.html and pwa/index.html)', () => {
  it('reads both entries', () => {
    expect(Object.keys(HTML_ENTRIES).sort()).toEqual(['../index.html', '../pwa/index.html'])
  })

  it.each(Object.entries(HTML_ENTRIES))('%s has no en or em dash outside comments', (_key, html) => {
    expect(htmlDashLines(html)).toEqual([])
  })

  it('catches a dash or its entity, and ignores one in a comment', () => {
    expect(htmlDashLines('<title>A — B</title>')).toHaveLength(1)
    expect(htmlDashLines('<title>A &ndash; B</title>')).toHaveLength(1)
    expect(htmlDashLines('<!-- a — b\n c – d -->\n<title>A · B</title>')).toEqual([])
  })
})

describe('the allowlist and the must-keep list', () => {
  it('every allowlist entry still matches, has a reason, and names no answered question', () => {
    for (const a of ALLOWLIST) {
      expect(ALL.some((s) => s.file === a.file && s.text.includes(a.phrase)), `${a.file}: ${a.phrase}`).toBe(true)
      expect(a.reason.length).toBeGreaterThan(10)
      for (const id of citedIds(a.item)) expect(id.startsWith('OQ-') ? OPEN_QUESTIONS.has(id) : OPEN_DECISIONS.has(id), `${a.file}: ${id}`).toBe(true)
    }
  })

  it.each(MUST_KEEP.map((m) => [`${m.file}: ${m.text ?? `renders ${m.renders}`}`, m] as const))('keeps %s', (_name, m) => {
    for (const id of citedIds(m.item)) expect(id.startsWith('OQ-') ? OPEN_QUESTIONS.has(id) : OPEN_DECISIONS.has(id), id).toBe(true)
    if (m.text !== undefined) {
      expect(ALL.some((s) => s.file === m.file && s.text.includes(m.text!)), `${m.file} lost "${m.text}"`).toBe(true)
    }
    if (m.renders !== undefined) {
      const source = Object.entries(SOURCES).find(([key]) => relPath(key) === m.file)?.[1] ?? ''
      expect(source, `${m.file} no longer renders ${m.renders}`).toMatch(new RegExp(`\\{\\s*${m.renders}\\s*\\}`))
    }
  })
})

describe('List-state copy (one label home: LIST_STATE_LABELS, 15b and 31)', () => {
  const lists = Object.values(buildSeed().schedule.lists)

  it('reads the seeded Lists, assigned and Draft', () => {
    expect(lists.some((l) => l.anaesthetistId !== undefined)).toBe(true)
    expect(lists.some((l) => l.anaesthetistId === undefined)).toBe(true)
  })

  it('an assigned List renders ACTIVE, SUBMITTED or AUTHORISED, never DRAFT or Open', () => {
    for (const list of lists.filter((l) => l.anaesthetistId !== undefined)) {
      expect(['ACTIVE', 'SUBMITTED', 'AUTHORISED'], list.id).toContain(LIST_STATE_LABELS[list.state])
    }
  })

  it('DRAFT renders only for a List with no anaesthetist, from the one label home', () => {
    for (const list of lists) {
      if (LIST_STATE_LABELS[list.state] === DRAFT_STATE) expect(list.anaesthetistId, list.id).toBeUndefined()
    }
    expect(DRAFT_STATE).toBe(LIST_STATE_LABELS.DRAFT)
    expect(Object.values(LIST_STATE_LABELS)).not.toContain('Open')
  })

  it('no screen types a DRAFT chip of its own', () => {
    const own = ALL.filter((s) => s.kind === 'jsx' && /^DRAFT( LIST)?$/i.test(s.text) && !s.file.startsWith('apps/demo/catalogue/'))
    expect(own.map(show)).toEqual([])
  })
})
