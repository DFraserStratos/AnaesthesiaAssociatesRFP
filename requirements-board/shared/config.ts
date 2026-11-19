/**
 * The project's own vocabulary, read from `board.config.json` in the requirements folder: its
 * name, the component list, which apps screenshots come from, its item and question statuses
 * (see `statuses.ts`), and how screenshots are captured. Everything here is optional; with no
 * file the board runs on neutral defaults and accepts any component or screenshot app. Item types
 * and question kinds are behaviour, not vocabulary, so a project can reword a kind but not add one.
 */
import { stripBom } from './bom.ts'
import { revOf } from './files.ts'
import {
  DEFAULT_ITEM_STATUSES,
  DEFAULT_QUESTION_STATUSES,
  RECODES_FILE,
  STATUS_FIELDS,
  highestCode,
  parseRemoved,
  parseStatusList,
  recodedCodes,
  recodeHistoryProblems,
  type Recode,
  type RemovedStatus,
  type StatusDef,
  type StatusField,
  type StatusListState,
} from './statuses.ts'
import { QUESTION_KINDS, VIEWPORTS, type QuestionKind, type Viewport } from './types.ts'

export const CONFIG_FILE = 'board.config.json'

export interface ComponentDef {
  name: string
  /** The short mono code on a card's component glyph. Unset: the name's first three letters. */
  code?: string
}

/** An app screenshots are taken from. `key` is stored in item frontmatter and file names, so keep it stable. */
export interface ScreenshotApp {
  key: string
  label: string
  viewport: Viewport
}

export interface Wording {
  /** Shown instead of the stored value. */
  label?: string
  /** A line on what it means, beside the status menu and on hover. */
  help?: string
}

/** One app the capture runner opens. */
export interface CaptureApp {
  /** Base URL of its dev server, e.g. `http://localhost:5173`. */
  url: string
  /** Where a shot with setup steps loads first, before its `start` route. */
  setupRoute: string
  /** CSS that hides demo-only chrome from every shot. A plugin step can lift it for a moment. */
  hideCss: string  /** An environment variable that, when set, replaces the url's port (a second worktree on its own ports). */
  portEnv?: string
}

export interface CaptureConfig {
  /** Folders and files, relative to the requirements folder. */
  recipes: string
  report: string
  /** A module of project-specific steps (`export default { stepName(page, value, ctx) {} }`). */
  steps?: string
  locale?: string
  timezone?: string
  /** Keyed by screenshot app. */
  apps: Record<string, CaptureApp>
  /** What to tell the user when an app's dev server is not running. */
  startHint?: string
}

/**
 * A voice rule: a project-defined pattern that, found in an item's description, makes the check warn.
 * The catalogue's voice keeps decision history and provenance out of descriptions; these are its backstop.
 */
export interface VoiceRule {
  /** A JavaScript regular expression source, e.g. `\bour reading\b` (`"\\bour reading\\b"` in the JSON file). */
  pattern: string
  /** Regular expression flags. Unset in the file: `i`. */
  flags: string
  /** A short noun phrase naming what was found, e.g. `an "our reading" marker`. */
  message: string
}

export interface VoiceConfig {
  /** Checked against the description of every live epic, feature and story. */
  descriptionWarnings: VoiceRule[]
}

export interface BoardConfig {
  project: {
    /** Shown beside the board's name and in the browser tab. */
    name: string
    /** A `#rrggbb` colour for the board's mark and the tab icon, so boards for different projects tell apart at a glance. */
    accent?: string
  }
  /** Empty: any component is accepted. */
  components: ComponentDef[]
  /** Empty: any app is accepted, and screenshots group by viewport. */
  screenshotApps: ScreenshotApp[]
  /** Item statuses in menu order: code, label, help, tone, role. */
  statuses: StatusDef[]
  /** Question statuses in group order. */
  questionStatuses: StatusDef[]
  /** Statuses taken off each list: their codes are spent and never handed out again. */
  removedStatuses: Record<StatusField, RemovedStatus[]>
  /**
   * Each section Settings writes, as a revision of what the file holds for it (derived, never written).
   * A config write sends the revisions it started from (`bases`), so a section changed on disk since is
   * a conflict rather than overwritten (B05, accepted decision 20; FINDINGS R-45).
   */
  revs: Record<ConfigSection, string>
  /** How each status list read (healthy, degraded, damaged), with its problems and high-water mark. Derived, never written. */
  statusState: Record<StatusField, StatusListState>
  /**
   * How the `project` and `components` sections read. Any problem reading one is `damaged` (an entry was
   * dropped or a value ignored), so Settings shows it and saves nothing over it until the file is fixed
   * (accepted decision 22). Derived, never written.
   */
  sectionState: Record<CheckedSection, SectionState>
  questionKinds: Partial<Record<QuestionKind, Wording>>
  capture: CaptureConfig | null
  /** Patterns the check warns on in descriptions. Edited by hand in the file. */
  voice: VoiceConfig
}

/** The Settings sections besides the status lists whose reading is judged (`sectionState`). */
export type CheckedSection = 'project' | 'components'
export interface SectionState {
  state: 'healthy' | 'damaged'
  /** What could not be read, naming the section and entry. */
  problems: string[]
}
const HEALTHY: SectionState = { state: 'healthy', problems: [] }
const sectionStateOf = (problems: string[]): SectionState => (problems.length ? { state: 'damaged', problems } : HEALTHY)

/** The sections of `board.config.json` that Settings writes, each with its own revision. */
export const CONFIG_SECTIONS = ['project', 'components', 'statuses', 'questionStatuses'] as const
export type ConfigSection = (typeof CONFIG_SECTIONS)[number]

/** A section's revision: of its JSON as the file holds it (a missing section is `null`). */
export function configRevs(raw: Record<string, unknown> | null): Record<ConfigSection, string> {
  const out = {} as Record<ConfigSection, string>
  for (const k of CONFIG_SECTIONS) out[k] = revOf(JSON.stringify(raw && Object.hasOwn(raw, k) ? raw[k] : null))
  return out
}

/** A Settings write: the sections sent replace those in the file; `bases` are the revisions each was edited from. */
export type ConfigPatch = Partial<Pick<BoardConfig, 'project' | 'components' | 'statuses' | 'questionStatuses'>> & { bases?: Partial<Record<ConfigSection, string>> }

/** The board's own name, in the masthead and the browser tab. Fixed: the project's name is what varies. */
export const BOARD_NAME = 'Requirements board'
/** A project accent: six-digit hex. */
export const ACCENT_PATTERN = /^#[0-9a-f]{6}$/i
/** The starter catalogue's placeholder project name: while it stands, the masthead points at the guide. */
export const STARTER_PROJECT_NAME = 'Your project'

export const DEFAULT_CONFIG: BoardConfig = {
  project: { name: '' },
  components: [],
  screenshotApps: [],
  statuses: DEFAULT_ITEM_STATUSES,
  questionStatuses: DEFAULT_QUESTION_STATUSES,
  removedStatuses: { statuses: [], questionStatuses: [] },
  revs: configRevs({}),
  statusState: {
    statuses: { state: 'healthy', problems: [], highWater: highestCode(DEFAULT_ITEM_STATUSES.map((d) => d.code)) },
    questionStatuses: { state: 'healthy', problems: [], highWater: highestCode(DEFAULT_QUESTION_STATUSES.map((d) => d.code)) },
  },
  sectionState: { project: HEALTHY, components: HEALTHY },
  questionKinds: {},
  capture: null,
  voice: { descriptionWarnings: [] },
}

/** A config file that can't be read: neutral defaults, except that the status lists are damaged and empty, never the built-in ones. */
function unreadable(problem: string): BoardConfig {
  const damaged = { state: 'damaged' as const, problems: [problem], highWater: 0 }
  const section = sectionStateOf([problem])
  return { ...DEFAULT_CONFIG, statuses: [], questionStatuses: [], statusState: { statuses: damaged, questionStatuses: damaged }, sectionState: { project: section, components: section }, revs: configRevs(null) }
}

export const DEFAULT_KIND_HELP: Record<QuestionKind, string> = {
  question: 'A decision or fact that blocks or shapes requirements',
  'missing-source': 'A requirement with no known origin: add its source (a document page, a note in notes/, or Q&A) to the item',
}

export const kindHelpIn = (c: BoardConfig, k: QuestionKind) => c.questionKinds[k]?.help ?? DEFAULT_KIND_HELP[k]
export const componentCodeIn = (c: BoardConfig, name: string) => c.components.find((d) => d.name === name)?.code ?? name.slice(0, 3).toUpperCase()
export const componentNames = (c: BoardConfig) => c.components.map((d) => d.name)
export const appKeys = (c: BoardConfig) => c.screenshotApps.map((a) => a.key)

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
const SLUG = /^[a-z0-9][a-z0-9-]*$/

/**
 * Read a config file's JSON. Anything malformed is reported and left at its default, so one bad
 * entry never hides the rest. Unknown keys are ignored. The status lists are never replaced by the
 * built-in ones (see `statuses.ts`); `recodes` (status-recodes.json) feed each list's high-water mark.
 */
export function parseConfig(text: string, recodes: readonly Recode[] = []): { config: BoardConfig; problems: string[] } {
  const problems: string[] = []
  let raw: unknown
  try {
    raw = JSON.parse(stripBom(text))
  } catch (e) {
    const problem = `${CONFIG_FILE} is not valid JSON (${(e as Error).message})`
    return { config: unreadable(problem), problems: [problem] }
  }
  if (!isObj(raw)) {
    const problem = `${CONFIG_FILE} must hold an object`
    return { config: unreadable(problem), problems: [problem] }
  }
  const config: BoardConfig = { ...DEFAULT_CONFIG, project: { name: '' }, components: [], screenshotApps: [], questionKinds: {}, revs: configRevs(raw) }

  const projectFrom = problems.length
  if (isObj(raw.project)) {
    config.project.name = str(raw.project.name) ?? ''
    const accent = str(raw.project.accent)
    if (accent && ACCENT_PATTERN.test(accent)) config.project.accent = accent.toLowerCase()
    else if (accent) problems.push(`project.accent must be a colour like #2f5dbe, not ${accent}`)
  } else if (raw.project !== undefined) problems.push('project must be an object')
  const componentsFrom = problems.length

  if (Array.isArray(raw.components)) {
    const seen = new Set<string>()
    for (const c of raw.components) {
      const name = typeof c === 'string' ? str(c) : isObj(c) ? str(c.name) : undefined
      if (!name) problems.push(`components: ${JSON.stringify(c)} has no name`)
      else if (seen.has(name)) problems.push(`components: "${name}" is listed twice`)
      else {
        seen.add(name)
        const code = isObj(c) ? str(c.code) : undefined
        config.components.push(code ? { name, code } : { name })
      }
    }
  } else if (raw.components !== undefined) problems.push('components must be a list')
  config.sectionState = { project: sectionStateOf(problems.slice(projectFrom, componentsFrom)), components: sectionStateOf(problems.slice(componentsFrom)) }

  if (Array.isArray(raw.screenshotApps)) {
    const seen = new Set<string>()
    for (const a of raw.screenshotApps) {
      const key = isObj(a) ? str(a.key) : undefined
      if (!key || !SLUG.test(key)) problems.push(`screenshotApps: ${JSON.stringify(a)} needs a key in lower-case letters, digits and hyphens`)
      else if (seen.has(key)) problems.push(`screenshotApps: "${key}" is listed twice`)
      else {
        seen.add(key)
        const o = a as Record<string, unknown>
        const viewport = (VIEWPORTS as readonly unknown[]).includes(o.viewport) ? (o.viewport as Viewport) : 'desktop'
        if (o.viewport !== undefined && viewport !== o.viewport) problems.push(`screenshotApps: "${key}" viewport must be ${VIEWPORTS.join(' or ')}`)
        config.screenshotApps.push({ key, label: str(o.label) ?? key, viewport })
      }
    }
  } else if (raw.screenshotApps !== undefined) problems.push('screenshotApps must be a list')

  const removedRaw = raw.removedStatuses
  if (removedRaw !== undefined && !isObj(removedRaw)) problems.push('removedStatuses must be an object of { statuses, questionStatuses } lists')
  config.removedStatuses = { statuses: [], questionStatuses: [] }
  config.statusState = { ...DEFAULT_CONFIG.statusState }
  for (const kind of ['item', 'question'] as const) {
    const field = STATUS_FIELDS[kind]
    const read = parseStatusList(raw[field], kind, field, problems)
    const removed = isObj(removedRaw) ? parseRemoved(removedRaw[field], field, problems) : []
    const own = [...read.problems]
    // A code moved away by a recode is spent too: old versions storing it read as its new code.
    const recodedAway = new Set(recodes.flatMap((r) => Object.entries(kind === 'item' ? r.items : r.questions).filter(([from, to]) => from !== to).map(([from]) => from)))
    for (const d of read.list) {
      const gone = removed.find((r) => r.code === d.code)
      const p = gone
        ? `${field}: "${d.code}" was removed (${gone.label}) and cannot be used again: give "${d.label}" a fresh code, or take it off removedStatuses if the removal was a mistake`
        : recodedAway.has(d.code)
          ? `${field}: "${d.code}" was recoded away (${RECODES_FILE}), so old versions storing it read as another status: give "${d.label}" a fresh code`
          : null
      if (!p) continue
      problems.push(p)
      own.push(p)
    }
    config[field] = read.list
    config.removedStatuses[field] = removed
    const state = read.state === 'healthy' && own.length ? 'degraded' : read.state
    config.statusState[field] = { state, problems: own, highWater: highestCode(read.list.map((d) => d.code), removed.map((d) => d.code), recodedCodes(recodes, kind)) }
  }
  problems.push(...recodeHistoryProblems(recodes))
  config.questionKinds = wordings(raw.questionKinds, QUESTION_KINDS, 'questionKinds', problems)
  config.capture = raw.capture === undefined ? null : capture(raw.capture, config.screenshotApps, problems)
  config.voice = voice(raw.voice, problems)
  return { config, problems }
}

function wordings<K extends string>(raw: unknown, keys: readonly K[], field: string, problems: string[]): Partial<Record<K, Wording>> {
  const out: Partial<Record<K, Wording>> = {}
  if (raw === undefined) return out
  if (!isObj(raw)) {
    problems.push(`${field} must be an object keyed by ${keys.join(', ')}`)
    return out
  }
  for (const [k, v] of Object.entries(raw)) {
    if (!(keys as readonly string[]).includes(k)) {
      problems.push(`${field}: "${k}" is not one of ${keys.join(', ')}`)
      continue
    }
    if (!isObj(v)) {
      problems.push(`${field}.${k} must be an object with label and/or help`)
      continue
    }
    const w: Wording = {}
    if (str(v.label)) w.label = str(v.label)
    if (str(v.help)) w.help = str(v.help)
    out[k as K] = w
  }
  return out
}

/** The default flags of a voice rule. */
export const VOICE_FLAGS = 'i'

/** Compile a voice rule, or say why it does not compile. */
export function voiceRegex(rule: Pick<VoiceRule, 'pattern' | 'flags'>): RegExp | string {
  try {
    return new RegExp(rule.pattern, rule.flags)
  } catch (e) {
    return (e as Error).message
  }
}

function voice(raw: unknown, problems: string[]): VoiceConfig {
  const out: VoiceConfig = { descriptionWarnings: [] }
  if (raw === undefined) return out
  if (!isObj(raw)) {
    problems.push('voice must be an object')
    return out
  }
  if (raw.descriptionWarnings === undefined) return out
  if (!Array.isArray(raw.descriptionWarnings)) {
    problems.push('voice.descriptionWarnings must be a list of { pattern, flags, message }')
    return out
  }
  for (const r of raw.descriptionWarnings) {
    const pattern = isObj(r) && typeof r.pattern === 'string' && r.pattern.trim() ? r.pattern : undefined
    const message = isObj(r) ? str(r.message) : undefined
    if (!pattern || !message) {
      problems.push(`voice.descriptionWarnings: ${JSON.stringify(r)} needs a pattern and a message`)
      continue
    }
    const o = r as Record<string, unknown>
    if (o.flags !== undefined && typeof o.flags !== 'string') {
      problems.push(`voice.descriptionWarnings: "${message}" flags must be a string, such as "i"`)
      continue
    }
    const flags = typeof o.flags === 'string' ? o.flags : VOICE_FLAGS
    const re = voiceRegex({ pattern, flags })
    if (typeof re === 'string') {
      problems.push(`voice.descriptionWarnings: "${message}" is not a valid regular expression (${re}); it is not checked`)
      continue
    }
    out.descriptionWarnings.push({ pattern, flags, message })
  }
  return out
}

function capture(raw: unknown, apps: ScreenshotApp[], problems: string[]): CaptureConfig | null {
  if (!isObj(raw)) {
    problems.push('capture must be an object')
    return null
  }
  const out: CaptureConfig = { recipes: str(raw.recipes) ?? 'capture/recipes', report: str(raw.report) ?? 'capture/REPORT.md', apps: {} }
  for (const k of ['steps', 'locale', 'timezone', 'startHint'] as const) {
    const v = str(raw[k])
    if (v) out[k] = v
  }
  if (!isObj(raw.apps)) problems.push('capture.apps must be an object keyed by screenshot app')
  else {
    const known = new Set(apps.map((a) => a.key))
    for (const [key, v] of Object.entries(raw.apps)) {
      if (!known.has(key)) problems.push(`capture.apps: "${key}" is not one of the screenshotApps`)
      else if (!isObj(v) || !str(v.url)) problems.push(`capture.apps.${key} needs a url`)
      else {
        out.apps[key] = { url: str(v.url)!.replace(/\/$/, ''), setupRoute: str(v.setupRoute) ?? '/', hideCss: typeof v.hideCss === 'string' ? v.hideCss : '' }
        if (str(v.portEnv)) out.apps[key].portEnv = str(v.portEnv)
      }
    }
  }
  return out
}
