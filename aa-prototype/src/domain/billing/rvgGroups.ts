/**
 * The RVG groups (catch-up Phase 19; US-05.1.1, US-05.1.3, FT-05.1; DM-13,
 * DM-43; AR-61 `#rvg-group`): the one master list base units come from.
 *
 * Each row is an NZSA RVG 2021 group as published, or one of AA's own beside
 * them (never marked as AA's). A row has a hidden id (a unique identifier only,
 * never shown, D39), a printed code that is NOT unique (the guide prints two
 * T2s and two P6s, and AA may add more rows with the same code), a description,
 * the anatomy heading the guide prints it under (a label only), base units (a
 * whole number above 0, the starting figure), the published range beside it
 * where the guide prints one (D35, shown to the anaesthetist when choosing) and
 * modifier units (0 by default, held quietly; only the Admin edit sheet shows
 * them). There is no procedure list, no general procedure and no body-section
 * picker (OQ-88).
 *
 * The starting-units resolver lives here too: base units come from the picked
 * row alone (a Contract states none, D12 as extended 5 November; Phase 19a only
 * lets a Contract name a default RVG code that fills an empty one), then the
 * recorded value wins: a typed override, else a chosen value on a ranged row.
 * Any value is accepted (D3); one that differs from the starting value and lies
 * outside the guide is `outsideGuide`, which the `baseUnitsOutsideGuide` warning
 * rule reads. Nothing outside this module computes a source or a range check.
 *
 * Never key anything by a printed code: P1, A1 and A2 as RVG rows are not the
 * modifiers of the same name, and T1, T2 are not time codes.
 *
 * Pure (enforced by `domainPurity.test.ts`).
 */

import type { Procedure } from '../types'
import type { ModifierId } from './modifiers'

/** Seeded `RG001`…; allocated at runtime `RGN001`. Never shown. */
export type RvgGroupId = string

/** A published range of base units (min <= the starting figure <= max). */
export interface BaseUnitsRange {
  min: number
  max: number
}

export interface RvgGroup {
  id: RvgGroupId
  /** As printed (H4, T2, UL1). Not unique. */
  code: string
  description: string
  /** The anatomy heading the guide prints the row under (Head, Neurosurgery…). A label only. */
  anatomy: string
  /** The starting figure: whole, above 0. For a ranged row, the range's lower bound unless AA sets another. */
  baseUnits: number
  /** The published range, where the guide prints one (D35). Holds `baseUnits`. */
  baseUnitsRange?: BaseUnitsRange
  /** Whole, 0 or more, 0 by default. Resolved and added to M (Phase 19b combines it). */
  modifierUnits: number
  /** Retired rows are hidden from the picker and keep pricing the Procedures that carry them. */
  retired: boolean
  /**
   * The modifiers this row's base units already include (catch-up Phase 19b,
   * US-05.1.4, D43): P1 on the 20 Neurosurgery and Spine rows, from the
   * catalogue's included-modifiers CSV. Pre-applied at 0 units, removable,
   * never added twice. Empty on every other row.
   */
  includedModifierIds: ModifierId[]
  /**
   * The row is already split by age (H6b, P2), so no age modifier is
   * pre-applied on it (D29's default; OQ-95 part 1).
   */
  noAgeModifier?: boolean
}

/**
 * The anatomy headings in the order the guide prints them (Section II). A row's
 * `anatomy` is free text; these only order the Admin table and the picker.
 */
export const ANATOMY_HEADINGS: readonly string[] = [
  'Supervision',
  'Head',
  'Neurosurgery',
  'Neck',
  'Upper limb',
  'Thorax',
  'Spine',
  'Abdomen',
  'Perineum',
  'Pelvic',
  'Vascular',
  'Lower limb',
  'Anaesthesia in remote locations',
  'Pain consultations and procedures',
]

function anatomyRank(anatomy: string): number {
  const i = ANATOMY_HEADINGS.indexOf(anatomy)
  return i === -1 ? ANATOMY_HEADINGS.length : i
}

/** Guide order: anatomy heading, then code (natural: H2 before H10), then description. */
export function compareRvgGroups(a: RvgGroup, b: RvgGroup): number {
  return (
    anatomyRank(a.anatomy) - anatomyRank(b.anatomy) ||
    a.anatomy.localeCompare(b.anatomy) ||
    a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }) ||
    a.baseUnits - b.baseUnits ||
    a.description.localeCompare(b.description) ||
    a.id.localeCompare(b.id)
  )
}

/** The row behind an id (undefined for none or an unknown id). */
export function groupOf(
  groups: Readonly<Record<RvgGroupId, RvgGroup>>,
  id: RvgGroupId | undefined,
): RvgGroup | undefined {
  return id === undefined ? undefined : groups[id]
}

// ---------------------------------------------------------------------------
// Display text (the picker, the capture card, Admin)
// ---------------------------------------------------------------------------

/** The guide value a row offers: its figure, and its range where it has one. */
export interface GuideValue {
  figure: number
  range?: BaseUnitsRange
}

export function guideOf(group: RvgGroup): GuideValue {
  return group.baseUnitsRange !== undefined
    ? { figure: group.baseUnits, range: { ...group.baseUnitsRange } }
    : { figure: group.baseUnits }
}

/** "6", or "10 to 12" for a ranged row. */
export function baseUnitsText(group: Pick<RvgGroup, 'baseUnits' | 'baseUnitsRange'>): string {
  return group.baseUnitsRange !== undefined
    ? `${group.baseUnitsRange.min} to ${group.baseUnitsRange.max}`
    : String(group.baseUnits)
}

/** "B 6" or "B 10 to 12", the picker's units cell. */
export function baseUnitsShort(group: Pick<RvgGroup, 'baseUnits' | 'baseUnitsRange'>): string {
  return `B ${baseUnitsText(group)}`
}

/** "H4 · Complex procedures… · B 10 to 12": a row told apart from its namesakes. */
export function rvgGroupLabel(group: RvgGroup): string {
  return `${group.code} · ${group.description} · ${baseUnitsShort(group)}`
}

// ---------------------------------------------------------------------------
// Search (the type-ahead and the Admin table)
// ---------------------------------------------------------------------------

export interface RvgSearchOptions {
  /** Retired rows are left out unless asked for (Admin's "All"). */
  includeRetired?: boolean
}

/**
 * The type-ahead: case-insensitive on code and description. Rows whose code is
 * the query come first, then rows whose code starts with it, then rows whose
 * description holds every word of it; each band in guide order. Typing "H1"
 * lists every H1 row. An empty query returns every row in guide order.
 */
export function searchRvgGroups(
  query: string,
  groups: Readonly<Record<RvgGroupId, RvgGroup>> | readonly RvgGroup[],
  options: RvgSearchOptions = {},
): RvgGroup[] {
  const rows = (Array.isArray(groups) ? groups : Object.values(groups)) as RvgGroup[]
  const live = rows.filter((g) => options.includeRetired === true || !g.retired)
  const q = query.trim().toLowerCase()
  if (q === '') return [...live].sort(compareRvgGroups)
  const words = q.split(/\s+/)
  const band = (g: RvgGroup): number => {
    const code = g.code.toLowerCase()
    if (code === q) return 0
    if (code.startsWith(q)) return 1
    const hay = `${code} ${g.description.toLowerCase()}`
    return words.every((w) => hay.includes(w)) ? 2 : -1
  }
  return live
    .map((g) => ({ g, b: band(g) }))
    .filter((x) => x.b >= 0)
    .sort((x, y) => x.b - y.b || compareRvgGroups(x.g, y.g))
    .map((x) => x.g)
}

/**
 * What the picker shows before anything is typed: a short list, the first rows
 * by anatomy heading and code, led by the current row when there is one.
 */
export function defaultPickerRows(
  groups: Readonly<Record<RvgGroupId, RvgGroup>>,
  currentId?: RvgGroupId,
  limit = 12,
): RvgGroup[] {
  const ordered = searchRvgGroups('', groups)
  const current = currentId !== undefined ? groups[currentId] : undefined
  const head = current !== undefined ? [current] : []
  return [...head, ...ordered.filter((g) => g.id !== currentId)].slice(0, limit)
}

// ---------------------------------------------------------------------------
// The starting-units resolver (DM-43)
// ---------------------------------------------------------------------------

export interface StartingUnits {
  base: { units: number }
  modifier: { units: number }
  guide: GuideValue
}

/**
 * The starting base and modifier units from the picked row alone. A Contract
 * states no units (US-05.1.1); Phase 19a adds no layer here.
 */
export function resolveStartingUnits({ group }: { group: RvgGroup }): StartingUnits {
  return { base: { units: group.baseUnits }, modifier: { units: group.modifierUnits }, guide: guideOf(group) }
}

/** Where a Procedure's base units came from. */
export type BaseUnitsSource = 'overridden' | 'chosen' | 'rvgGroup' | 'none'

export interface ResolvedBaseUnits {
  units: number
  source: BaseUnitsSource
  /** The row's starting figure (0 with no row). */
  starting: number
  /** The row's guide value (absent with no row). */
  guide?: GuideValue
  /** A recorded value that differs from the starting value and lies outside the guide. */
  outsideGuide: boolean
}

/** True when `units` lies outside the guide: below or above its range, or off its figure where it has none. */
export function isOutsideGuide(units: number, guide: GuideValue): boolean {
  return guide.range !== undefined ? units < guide.range.min || units > guide.range.max : units !== guide.figure
}

/**
 * A Procedure's base units: the typed override, else the chosen value on a
 * ranged row, else the row's starting figure, else (no row) 0.
 */
export function baseUnitsFor({
  procedure,
  group,
}: {
  procedure: Pick<Procedure, 'baseUnitsCaptured' | 'baseUnitsSelected'>
  group?: RvgGroup
}): ResolvedBaseUnits {
  const starting = group !== undefined ? resolveStartingUnits({ group }) : undefined
  const guide = starting?.guide
  const startingUnits = starting?.base.units ?? 0
  const withGuide = (units: number, source: BaseUnitsSource): ResolvedBaseUnits => ({
    units,
    source,
    starting: startingUnits,
    ...(guide !== undefined ? { guide } : {}),
    outsideGuide:
      guide !== undefined &&
      (source === 'overridden' || source === 'chosen') &&
      units !== startingUnits &&
      isOutsideGuide(units, guide),
  })
  if (procedure.baseUnitsCaptured?.source === 'overridden') {
    return withGuide(procedure.baseUnitsCaptured.units, 'overridden')
  }
  if (group === undefined) return withGuide(0, 'none')
  if (group.baseUnitsRange !== undefined && procedure.baseUnitsSelected !== undefined) {
    return withGuide(procedure.baseUnitsSelected, 'chosen')
  }
  return withGuide(startingUnits, 'rvgGroup')
}

/** "10 to 12" or "guide value 6": the guide as the warning and captions say it. */
export function guideText(guide: GuideValue): string {
  return guide.range !== undefined ? `${guide.range.min} to ${guide.range.max}` : `guide value ${guide.figure}`
}

/** The `baseUnitsOutsideGuide` warning's sentence. */
export function outsideGuideText(units: number, code: string, guide: GuideValue): string {
  return `Base units ${units} are outside the RVG guide for ${code} (${guideText(guide)}).`
}

// ---------------------------------------------------------------------------
// Saving a row (the office's add and edit)
// ---------------------------------------------------------------------------

export const BASE_UNITS_WHOLE_MESSAGE = 'Base units must be a whole number.'

/** True for a whole number of 0 or more (a recorded base-unit value; D3 sets no ceiling). */
export function isRecordableBaseUnits(units: unknown): units is number {
  return typeof units === 'number' && Number.isInteger(units) && units >= 0
}

export type RvgGroupInput = Pick<
  RvgGroup,
  'code' | 'description' | 'anatomy' | 'baseUnits' | 'baseUnitsRange' | 'modifierUnits'
>

export type RvgGroupRefusalCode =
  | 'codeRequired'
  | 'descriptionRequired'
  | 'anatomyRequired'
  | 'baseUnitsInvalid'
  | 'rangeInvalid'
  | 'rangeMissesFigure'
  | 'modifierUnitsInvalid'
  | 'duplicateGroup'
  | 'duplicateRetired'

export const RVG_GROUP_REFUSAL_MESSAGES: Record<RvgGroupRefusalCode, string> = {
  codeRequired: 'Enter the RVG code.',
  descriptionRequired: 'Enter a description.',
  anatomyRequired: 'Choose or enter the anatomy heading.',
  baseUnitsInvalid: 'Base units must be a whole number above 0.',
  rangeInvalid: 'The range needs whole numbers above 0, the lower one first.',
  rangeMissesFigure: 'The range must hold the base units.',
  modifierUnitsInvalid: 'Modifier units must be a whole number, 0 or more.',
  duplicateGroup: 'This RVG group already exists with the same code, description and base units.',
  duplicateRetired: 'A retired RVG group has the same code, description and base units. Restore it instead.',
}

/** Trim the text fields of an input (what the store saves). */
export function cleanRvgGroupInput(input: RvgGroupInput): RvgGroupInput {
  return {
    code: input.code.trim(),
    description: input.description.trim(),
    anatomy: input.anatomy.trim(),
    baseUnits: input.baseUnits,
    ...(input.baseUnitsRange !== undefined ? { baseUnitsRange: { ...input.baseUnitsRange } } : {}),
    modifierUnits: input.modifierUnits,
  }
}

/**
 * Why a row cannot be saved, or null. Duplicate codes are allowed (the same
 * code may sit on several rows); only an exact duplicate (same code,
 * description and base units) is refused. `selfId` is the row being edited.
 */
export function rvgGroupRefusal(
  input: RvgGroupInput,
  groups: Readonly<Record<RvgGroupId, RvgGroup>>,
  selfId?: RvgGroupId,
): { code: RvgGroupRefusalCode; message: string } | null {
  const refuse = (code: RvgGroupRefusalCode) => ({ code, message: RVG_GROUP_REFUSAL_MESSAGES[code] })
  const clean = cleanRvgGroupInput(input)
  if (clean.code === '') return refuse('codeRequired')
  if (clean.description === '') return refuse('descriptionRequired')
  if (clean.anatomy === '') return refuse('anatomyRequired')
  if (!Number.isInteger(clean.baseUnits) || clean.baseUnits <= 0) return refuse('baseUnitsInvalid')
  const r = clean.baseUnitsRange
  if (r !== undefined) {
    if (!Number.isInteger(r.min) || !Number.isInteger(r.max) || r.min <= 0 || r.max < r.min) return refuse('rangeInvalid')
    if (clean.baseUnits < r.min || clean.baseUnits > r.max) return refuse('rangeMissesFigure')
  }
  if (!Number.isInteger(clean.modifierUnits) || clean.modifierUnits < 0) return refuse('modifierUnitsInvalid')
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ')
  const duplicate = Object.values(groups).find(
    (g) =>
      g.id !== selfId &&
      norm(g.code) === norm(clean.code) &&
      norm(g.description) === norm(clean.description) &&
      g.baseUnits === clean.baseUnits,
  )
  if (duplicate !== undefined) return refuse(duplicate.retired ? 'duplicateRetired' : 'duplicateGroup')
  return null
}

// ---------------------------------------------------------------------------
// Picking a row for a Procedure
// ---------------------------------------------------------------------------

/**
 * Why a row cannot be picked for a Procedure, or null. Clearing (`null` or
 * undefined) is always allowed: the RVG code is optional. A retired row is
 * hidden from the picker and refused as a new pick, but a Procedure already on
 * it keeps it (`currentId`).
 */
export function rvgGroupPickRefusal(
  groups: Readonly<Record<RvgGroupId, RvgGroup>>,
  nextId: RvgGroupId | null | undefined,
  currentId: RvgGroupId | undefined,
): { code: 'rvgGroupNotFound' | 'rvgGroupRetired'; message: string } | null {
  if (nextId === null || nextId === undefined) return null
  const group = groups[nextId]
  if (group === undefined) return { code: 'rvgGroupNotFound', message: 'That RVG code is not in the RVG groups.' }
  if (group.retired && nextId !== currentId) {
    return { code: 'rvgGroupRetired', message: `${group.code} · ${group.description} is retired. Choose another RVG code.` }
  }
  return null
}
