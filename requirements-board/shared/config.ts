/**
 * The project's own vocabulary, read from `board.config.json` in the requirements folder: its
 * name, the component list, which apps screenshots come from, its item and question statuses
 * (see `statuses.ts`), and how screenshots are captured. Everything here is optional; with no
 * file the board runs on neutral defaults and accepts any component or screenshot app. Item types
 * and question kinds are behaviour, not vocabulary, so a project can reword a kind but not add one.
 */
import { DEFAULT_ITEM_STATUSES, DEFAULT_QUESTION_STATUSES, parseStatusList, type StatusDef } from './statuses.ts'
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
  hideCss: string
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

export interface BoardConfig {
  board: {
    /** The board's own name, in the masthead and the browser tab. */
    name: string
  }
  project: {
    /** Shown under the board's name and in the browser tab. */
    name: string
    /** For dates and times; unset uses the browser's. */
    locale?: string
  }
  /** Empty: any component is accepted. */
  components: ComponentDef[]
  /** Empty: any app is accepted, and screenshots group by viewport. */
  screenshotApps: ScreenshotApp[]
  /** Item statuses in menu order: code, label, help, tone, role. */
  statuses: StatusDef[]
  /** Question statuses in group order. */
  questionStatuses: StatusDef[]
  questionKinds: Partial<Record<QuestionKind, Wording>>
  capture: CaptureConfig | null
}

/** What the Settings page may change: each field sent replaces that field, the rest of the file stays as written. */
export type ConfigPatch = Partial<Pick<BoardConfig, 'board' | 'project' | 'components' | 'statuses' | 'questionStatuses'>>

export const DEFAULT_BOARD_NAME = 'Requirements board'
/** The starter catalogue's placeholder project name: while it stands, the masthead points at the guide. */
export const STARTER_PROJECT_NAME = 'Your project'

export const DEFAULT_CONFIG: BoardConfig = {
  board: { name: DEFAULT_BOARD_NAME },
  project: { name: '' },
  components: [],
  screenshotApps: [],
  statuses: DEFAULT_ITEM_STATUSES,
  questionStatuses: DEFAULT_QUESTION_STATUSES,
  questionKinds: {},
  capture: null,
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
 * entry never hides the rest. Unknown keys are ignored.
 */
export function parseConfig(text: string): { config: BoardConfig; problems: string[] } {
  const problems: string[] = []
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (e) {
    return { config: DEFAULT_CONFIG, problems: [`${CONFIG_FILE} is not valid JSON (${(e as Error).message})`] }
  }
  if (!isObj(raw)) return { config: DEFAULT_CONFIG, problems: [`${CONFIG_FILE} must hold an object`] }
  const config: BoardConfig = { ...DEFAULT_CONFIG, board: { name: DEFAULT_BOARD_NAME }, project: { name: '' }, components: [], screenshotApps: [], questionKinds: {} }

  if (isObj(raw.board)) config.board.name = str(raw.board.name) ?? DEFAULT_BOARD_NAME
  else if (raw.board !== undefined) problems.push('board must be an object')

  if (isObj(raw.project)) {
    config.project.name = str(raw.project.name) ?? ''
    const locale = str(raw.project.locale)
    if (locale) config.project.locale = locale
  } else if (raw.project !== undefined) problems.push('project must be an object')

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

  config.statuses = parseStatusList(raw.statuses, 'item', 'statuses', problems)
  config.questionStatuses = parseStatusList(raw.questionStatuses, 'question', 'questionStatuses', problems)
  config.questionKinds = wordings(raw.questionKinds, QUESTION_KINDS, 'questionKinds', problems)
  config.capture = raw.capture === undefined ? null : capture(raw.capture, config.screenshotApps, problems)
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
      else out.apps[key] = { url: str(v.url)!.replace(/\/$/, ''), setupRoute: str(v.setupRoute) ?? '/', hideCss: typeof v.hideCss === 'string' ? v.hideCss : '' }
    }
  }
  return out
}
