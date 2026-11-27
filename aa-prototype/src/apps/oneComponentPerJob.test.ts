/**
 * One component per job: the guardrail (UI unification Phase U7; CLAUDE.md "One component per job";
 * docs/archive/ui-unification/README.md section 8). A source scan in the style of `pwa/pwaPurity.test.ts`: a
 * scanner good enough for this codebase, not a general one.
 *
 * It reads every `.tsx` under `src/apps/` and `src/shared/` (test files skipped) and fails on:
 *
 * 1. **A component named like a shared one** (`Pill`, `TextAction`, `Th`, `Td`, `BackLink`, `Section`, `Row`,
 *    `Card`, `Avatar`) defined in any file but that component's own home.
 * 2. **A raw styled `<button>`**: an opening `<button` tag (read to its closing `>` with brace depth counted,
 *    so multi-line tags are caught) that carries `style=`.
 *
 * Exempt by scope: the shared component homes (`src/shared/ui/`, `surface/`, `table/`, `calendar/`), where
 * the one styled button lives, and `src/apps/demo/` (the simulators, the Control Panel and the catalogue,
 * question 2). `src/shell/` and `src/pwa/` are outside the scan (the phone frame and the PWA's demo chrome).
 *
 * NEVER ADD TO `ALLOW_LIST`. If a screen needs a button the shared ones cannot draw, extend the shared
 * component with a variant (src/shared/ui/README.md, "How to add a variant"). The list only shrinks: an entry
 * whose file no longer holds a raw styled button fails (remove the entry), and `ALLOW_LIST_CEILING` fails the
 * test if the list grows.
 */

import { describe, expect, it } from 'vitest'

const APPS = import.meta.glob('./**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const SHARED = import.meta.glob('../shared/**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

/** Glob keys re-anchored to `src/`: `./admin/x.tsx` is `apps/admin/x.tsx`, `../shared/x.tsx` is `shared/x.tsx`. */
function srcPath(key: string): string {
  if (key.startsWith('./')) return `apps/${key.slice(2)}`
  if (key.startsWith('../')) return key.slice(3)
  return key
}

const SOURCES: Record<string, string> = Object.fromEntries(
  [...Object.entries(APPS), ...Object.entries(SHARED)].map(([key, src]) => [srcPath(key), src]),
)

/** Each shared name and the one file allowed to define it (`null`: no file may; the job has a shared component under another name). */
export const SHARED_NAMES: Readonly<Record<string, string | null>> = {
  Pill: 'shared/ui/Pill.tsx',
  TextAction: 'shared/ui/TextAction.tsx',
  Th: 'shared/table/cells.tsx',
  Td: 'shared/table/cells.tsx',
  BackLink: 'shared/ui/BackLink.tsx',
  Section: null,
  Row: null,
  Card: 'shared/ui/Card.tsx',
  Avatar: 'shared/Avatar.tsx',
}

/** The shared homes, where the styled `<button>`s that every screen reuses live. */
const SHARED_HOMES = ['shared/ui/', 'shared/surface/', 'shared/table/', 'shared/calendar/']

/** Demo only (question 2): the simulators, the Control Panel and the component catalogue. */
const DEMO_SCOPE = 'apps/demo/'

/**
 * Files still allowed a raw styled `<button>`, each with its exact count and why. Starts with the stays-custom
 * surfaces that still hold one (DayGrid; the invoice document and SlideStack hold none since U5), then the sites
 * U7's sweep left with a written reason (docs/archive/ui-unification/RESULTS.md). The count is exact: one more styled
 * button in a listed file fails, and one fewer fails until the count comes down. NEVER ADD: extend a shared
 * component instead.
 */
export const ALLOW_LIST: readonly { file: string; count: number; reason: string }[] = [
  // Stays custom (README section 5, question 2).
  { file: 'apps/admin/components/DayGrid.tsx', count: 4, reason: "Stays custom: the Admin Day grid (README section 5): its session blocks, add slots and stub markers are grid cells, and its Reset filters word belongs to the same surface" },
  { file: 'apps/web/screens/AvailabilityGrid.tsx', count: 1, reason: 'Stays custom: the web availability grid; a status-filled session cell, not a command button' },
  { file: 'shared/demoTriggers/InlineDemoTrigger.tsx', count: 1, reason: 'Demo only (question 2): the badged dashed inline demo trigger, never product UI' },
  { file: 'shared/flows/PhotoCaptureFlow.tsx', count: 1, reason: 'Demo only (question 2): the sample-photo tiles of the simulated rooms PDF capture' },
  // Mockup sizes and looks README section 5 keeps.
  { file: 'shared/capture/CompleteBar.tsx', count: 1, reason: 'Mark complete at 56px (Mobile App mockup; README section 5): no Button size draws 56' },
  { file: 'apps/mobile/screens/ListDetailScreen.tsx', count: 4, reason: "The List dock's buttons, which StickyDock contains but never restyles (54px, the grey dock you can still tap; README section 5, U7 item 4), the mockup's Booking cards, and the List options glyph, whose aria-haspopup and aria-expanded IconButton does not pass through" },
  { file: 'apps/web/screens/ListDetailView.tsx', count: 2, reason: "The web List's submit bar (Web Dashboard mockup): its two buttons share one height and shape with the read-only states beside them" },
  { file: 'shared/capture/ui.tsx', count: 2, reason: "The capture's typed-value cell and the 44x36 nudge buttons (Mobile App mockup; README section 5): IconButton draws one square or round size, never 44 by 36" },
  { file: 'shared/capture/TimesCard.tsx', count: 1, reason: "The capture's big record-now target (56 or 96px, radius 12): not a Button size" },
  // Navigation items stay buttons (question 3).
  { file: 'apps/admin/components/SideNav.tsx', count: 1, reason: 'Nav items on the ink side nav with aria-current (question 3); More and Help drawn as one of them' },
  { file: 'apps/admin/screens/masters/MasterData.tsx', count: 1, reason: 'The Master data sub-nav items with aria-current (question 3)' },
  { file: 'apps/web/components/WebNav.tsx', count: 2, reason: 'Web nav tabs and the profile link with the crimson underline (question 3; README section 5)' },
  { file: 'apps/mobile/MobileApp.tsx', count: 1, reason: 'The bottom tab bar items, teal active tab (question 3; README section 5)' },
  // Calendar and grid cells, tiles, swatches and chips: a different job from a command button.
  { file: 'apps/admin/components/RightRail.tsx', count: 2, reason: "The mini calendar's day cells (crimson today, README section 5) and 22px month arrows (no IconButton size)" },
  { file: 'apps/admin/screens/masters/HospitalsView.tsx', count: 2, reason: "The hospital calendar's day cells and the holiday chips that open their holiday" },
  { file: 'apps/mobile/screens/MyAvailabilityCalendarScreen.tsx', count: 1, reason: 'Calendar day cells with aria-current, not command buttons' },
  { file: 'apps/web/screens/MyAvailabilityCalendar.tsx', count: 1, reason: 'Calendar day cells with aria-pressed and aria-current, not command buttons' },
  { file: 'apps/mobile/screens/AvailabilityScreen.tsx', count: 4, reason: "The date strip's day cells, and the teal pill-outline mini buttons (Mobile Availability mockup) no Button variant draws yet" },
  { file: 'apps/admin/flows/SlotStatusSheet.tsx', count: 1, reason: 'Colour swatch tiles with aria-pressed, not command buttons' },
  { file: 'shared/availability/AvailabilityForm.tsx', count: 2, reason: 'Status option tiles and solid weekday toggles; OptionChip draws neither' },
  { file: 'shared/flows/VacatedSessionChoice.tsx', count: 1, reason: 'Status radio pills with a swatch and ring on useRovingRadio; OptionChip has no swatch or item props' },
  { file: 'shared/flows/SplitFeeSection.tsx', count: 1, reason: "The 'takes the rest' radio chip on useRovingRadio; OptionChip cannot take the roving item props" },
  { file: 'shared/flows/PayerFields.tsx', count: 1, reason: "Relationship chips at 12px padding with ink text; OptionChip is 14px and slate" },
  { file: 'apps/admin/flows/RemoveDraftListSheet.tsx', count: 1, reason: 'Reason chips at 5px 12px, 12.5; OptionChip has no small size' },
  { file: 'apps/web/screens/DashboardScreen.tsx', count: 2, reason: "The 'Which List?' pick rows and the status-tinted free-colleague chips that move a List" },
  { file: 'shared/StatusLegend.tsx', count: 1, reason: 'Status chip filter toggles (aria-pressed); FilterPills are solid teal' },
  // Rows and cards that open a record: one whole target, not a command button.
  { file: 'apps/admin/components/DraftListBand.tsx', count: 1, reason: 'A Draft List block placed on the Day ruler that opens its drawer' },
  { file: 'apps/admin/components/PrepaymentsRailCard.tsx', count: 1, reason: 'Rail rows that open a Booking or Invoices' },
  { file: 'apps/admin/flows/MoveBookingFlow.tsx', count: 1, reason: 'Candidate List cards that move the Booking on tap' },
  { file: 'apps/admin/components/pairing/AnaesthetistCandidates.tsx', count: 1, reason: "The office's candidate row (name, pills, tier): a pick row PickRow's two looks do not cover" },
  { file: 'apps/mobile/screens/BalancesScreen.tsx', count: 1, reason: 'An Outstanding card whose whole face is the target' },
  { file: 'apps/mobile/screens/ListsLookback.tsx', count: 2, reason: "Result rows that open a Booking, and the 48px outlined 'Go to a date' (no IconButton size)" },
  { file: 'apps/mobile/components/ListOptionsSheet.tsx', count: 1, reason: 'Menu item rows (role menuitem)' },
  { file: 'shared/stubs/StubParts.tsx', count: 1, reason: "The stub's whole-row open inside its dashed card" },
  { file: 'shared/flows/moveSheetParts.tsx', count: 1, reason: "ChoiceRow, the move sheets' choice card (icon disc, title, line, chevron)" },
  { file: 'shared/capture/ModifierPickerSheet.tsx', count: 1, reason: 'A modifier row (code, name, state grid) that opens its claim form, with aria-expanded' },
  // Fields, listboxes and composite parts.
  { file: 'shared/booking/BillingCard.tsx', count: 4, reason: "The Contract combo's trigger and options (listbox), the summary card as one target, and the slate Start again (no quiet TextAction tone)" },
  { file: 'shared/booking/PartyPicker.tsx', count: 3, reason: "The picker's trigger, its listbox options and the 'Another person' row" },
  { file: 'shared/capture/ProcedureCodeCard.tsx', count: 5, reason: "The code rows and chosen-code field that open the picker (field-like targets), the 13.5 Clear (no TextAction size) and the round clear placed inside the field (logged: IconButton 32 round would need its position through style)" },
  { file: 'shared/capture/RvgCodeList.tsx', count: 1, reason: 'RVG code listbox options' },
  { file: 'shared/flows/ManualBookingForm.tsx', count: 1, reason: 'The RVG code field that opens the code picker' },
  { file: 'shared/flows/ContractRail.tsx', count: 1, reason: 'Radio option rows with a tick column (RadioCard draws a dot)' },
  { file: 'shared/contracts/railParts.tsx', count: 3, reason: "The rail's own shared parts: the option rows and tiles and the step markers (aria-current step)" },
  { file: 'shared/help/InfoTip.tsx', count: 3, reason: "The help glyph trigger with its popover ARIA (aria-expanded, aria-controls) and enlarged hit area, which IconButton does not pass through" },
  // Words and links no TextAction size or tone draws yet (U5's handoff).
  { file: 'apps/admin/RolesInfo.tsx', count: 1, reason: 'A quiet white link on the ink nav; TextAction is teal only' },
  { file: 'apps/admin/components/drawerParts.tsx', count: 1, reason: "DrawerLink, the drawer rows' small bordered teal action; no Button or TextAction size draws it" },
  { file: 'apps/admin/flows/AssignDraftListSheet.tsx', count: 1, reason: 'A slate underlined link; TextAction has no quiet tone' },
  { file: 'apps/admin/screens/AaFeesScreen.tsx', count: 1, reason: "AA fees 'Add item' at 13px in the pressed teal (U5 handoff); no TextAction size" },
  { file: 'shared/booking/BookingDetailBody.tsx', count: 1, reason: "History, a 13px word with an icon on a 44px target: TextAction has no 13px size (U5's handoff); moving it would set the size through style, logged for a TextAction size" },
  { file: 'shared/capture/UnitsCard.tsx', count: 1, reason: "'Use seeded value', a 12px word inside a caption sentence: TextAction's smallest size is 12.5 (U5's handoff), logged for a TextAction size" },
  { file: 'shared/availability/AvailabilityEditor.tsx', count: 1, reason: "Done at 48px with radius 14, a lineStrong border and teal words; no Button variant" },
  // The breadcrumb crumb (Admin Review mockup): four copies, no shared Breadcrumb yet.
]

/** The list's length, and its buttons in all, when U7 closed (23 November 2026). Both may only come down. */
export const ALLOW_LIST_CEILING = 51
export const ALLOWED_BUTTONS_CEILING = 83

/** Block and line comments blanked (newlines kept, so offsets and line numbers hold). */
export function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
}

/** The shared names a file defines as a component (`function X`, `const X =`, `let X =`, `class X`). */
export function definedSharedNames(src: string): string[] {
  const code = stripComments(src)
  return Object.keys(SHARED_NAMES).filter((name) => new RegExp(`\\b(?:function\\s*\\*?|const|let|var|class)\\s+${name}\\b(?!\\w)`).test(code))
}

/** Every opening `<button ...>` tag, read to its `>` at brace depth 0 (quoted strings skipped), with its line. */
export function buttonTags(src: string): { tag: string; line: number }[] {
  const code = stripComments(src)
  const tags: { tag: string; line: number }[] = []
  let at = code.indexOf('<button')
  while (at !== -1) {
    const next = code[at + 7]
    if (next !== undefined && /[\s>/]/.test(next)) {
      let depth = 0
      let quote: string | null = null
      let end = at + 7
      for (; end < code.length; end++) {
        const c = code[end]
        if (quote !== null) {
          if (c === quote) quote = null
          continue
        }
        if (c === '{') depth++
        else if (c === '}') depth--
        else if (depth === 0 && (c === '"' || c === "'")) quote = c
        else if (depth === 0 && c === '>') break
      }
      tags.push({ tag: code.slice(at, end + 1), line: code.slice(0, at).split('\n').length })
      at = code.indexOf('<button', end)
    } else {
      at = code.indexOf('<button', at + 7)
    }
  }
  return tags
}

/** The raw `<button>` tags that carry their own `style=`. */
export function styledButtons(src: string): { tag: string; line: number }[] {
  return buttonTags(src).filter((t) => /\sstyle=/.test(t.tag))
}

/** Whether the button rule scans this file (`src/`-relative path). */
export function inButtonScope(file: string): boolean {
  return !SHARED_HOMES.some((home) => file.startsWith(home)) && !file.startsWith(DEMO_SCOPE)
}

const isTest = (file: string) => /\.test\.tsx?$/.test(file)

describe('one component per job (the guardrail)', () => {
  const files = Object.keys(SOURCES).filter((f) => !isTest(f))

  it('finds the app and shared sources', () => {
    expect(files.length).toBeGreaterThan(300)
    expect(files).toContain('shared/ui/Pill.tsx')
    expect(files).toContain('apps/admin/components/DayGrid.tsx')
  })

  it('no file defines a component named like a shared one, outside its home', () => {
    const offenders: string[] = []
    for (const file of files) {
      if (file.startsWith(DEMO_SCOPE)) continue
      for (const name of definedSharedNames(SOURCES[file] ?? '')) {
        if (SHARED_NAMES[name] !== file) {
          const home = SHARED_NAMES[name]
          offenders.push(`${file} defines its own \`${name}\`: use ${home === null ? 'the shared component for that job' : home} (or name it for its own job)`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('no screen styles a raw <button> outside the allow-list', () => {
    const allowed = new Map(ALLOW_LIST.map((a) => [a.file, a.count]))
    const offenders: string[] = []
    for (const file of files) {
      if (!inButtonScope(file)) continue
      const found = styledButtons(SOURCES[file] ?? '')
      const allowance = allowed.get(file) ?? 0
      if (found.length <= allowance) continue
      for (const b of found) {
        offenders.push(`${file}:${b.line} styles a raw <button>${allowance > 0 ? ` (the file is allowed ${allowance}, it has ${found.length})` : ''}: use Button, TextAction, IconButton or another shared control (extend it with a variant if none fits)`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('the allow-list only shrinks: every entry still needed, a reason each, no more than the ceiling', () => {
    expect(ALLOW_LIST.length).toBeLessThanOrEqual(ALLOW_LIST_CEILING)
    const stale: string[] = []
    expect(ALLOW_LIST.reduce((sum, a) => sum + a.count, 0)).toBeLessThanOrEqual(ALLOWED_BUTTONS_CEILING)
    for (const { file, count, reason } of ALLOW_LIST) {
      expect(reason.trim().length, `${file} needs a reason`).toBeGreaterThan(10)
      const found = file in SOURCES ? styledButtons(SOURCES[file] ?? '').length : -1
      if (found === -1) stale.push(`${file} no longer exists: remove its entry`)
      else if (found === 0) stale.push(`${file} has no raw styled <button> left: remove its entry and lower both ceilings`)
      else if (found < count) stale.push(`${file} now has ${found} raw styled <button>s, not ${count}: lower its count and ALLOWED_BUTTONS_CEILING`)
    }
    expect(stale).toEqual([])
    expect(new Set(ALLOW_LIST.map((a) => a.file)).size).toBe(ALLOW_LIST.length)
  })
})

describe('the scanner itself', () => {
  it('flags a local component named like a shared one, as a function or a const', () => {
    expect(definedSharedNames('function Pill({ children }) { return <span>{children}</span> }')).toEqual(['Pill'])
    expect(definedSharedNames('export const Section = ({ title }) => <h3>{title}</h3>')).toEqual(['Section'])
    expect(definedSharedNames('const Th = styled.th``\nfunction Card() {}')).toEqual(['Th', 'Card'])
  })

  it('passes names that only start like a shared one, and comments', () => {
    expect(definedSharedNames('function PillRow() {}\nconst Rows = []\nfunction SectionCard() {}\nconst rowStyle = {}')).toEqual([])
    expect(definedSharedNames('// function Pill() was here\n/* const Card = 1 */')).toEqual([])
  })

  it('flags a styled multi-line <button>, braces and arrows inside included', () => {
    const src = `
      <button
        type="button"
        onClick={() => go(a > b)}
        style={{ padding: 4, color: x > 1 ? 'a' : 'b' }}
      >
        Go
      </button>`
    expect(styledButtons(src)).toHaveLength(1)
    expect(styledButtons(src)[0]?.line).toBe(2)
  })

  it('passes an unstyled <button type="button">, a shared <Button style=...> and a <ButtonGroup>', () => {
    expect(styledButtons('<button type="button" className="aa-ctl" onClick={() => go()}>Go</button>')).toEqual([])
    expect(styledButtons('<Button style={{ width: 1 }}>Go</Button>')).toEqual([])
    expect(styledButtons('<buttonGroup style={{}} />')).toEqual([])
  })

  it('stops a tag at its own `>`, so a styled child is not blamed on the button', () => {
    expect(styledButtons('<button type="button" aria-label="a > b"><span style={{ color: 1 }}>x</span></button>')).toEqual([])
  })

  it('skips test files, the shared homes and the demo folder', () => {
    expect(isTest('apps/mobile/x.test.tsx')).toBe(true)
    expect(isTest('apps/mobile/x.tsx')).toBe(false)
    expect(inButtonScope('shared/ui/Button.tsx')).toBe(false)
    expect(inButtonScope('shared/surface/Dialog.tsx')).toBe(false)
    expect(inButtonScope('apps/demo/DemoXero.tsx')).toBe(false)
    expect(inButtonScope('apps/admin/screens/ReviewScreen.tsx')).toBe(true)
    expect(inButtonScope('shared/flows/MoveListSheet.tsx')).toBe(true)
  })
})
