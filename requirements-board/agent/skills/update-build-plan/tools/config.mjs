// The build plan's folder and its plan.config.json, shared by every tool. Run the tools from the repo root.
//
// Which plan: `--plan <dir>` on any tool, else the BUILD_PLAN environment variable, else the one
// plan.config.json in the repo (tracked or not), else docs/build-plan. Every config key is optional;
// a missing file means all defaults (a new plan). The keys are documented in the skill's SKILL.md
// ("The plan's config").
//
// CLI: node <tools>/config.mjs [--plan <dir>] [--json]
//   prints the resolved config (defaults filled in, statuses read from the board's config): the
//   `config` argument every workflow takes.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const TOOLS = path.dirname(fileURLToPath(import.meta.url))
export const DEFAULT_PLAN = 'docs/build-plan'
const CONFIG_FILE = 'plan.config.json'

/** The plan folder, repo-relative, from argv / BUILD_PLAN / the repo's only plan.config.json / the default. */
export function planDirOf(argv = process.argv.slice(2), root = process.cwd()) {
  const i = argv.indexOf('--plan')
  if (i >= 0 && argv[i + 1]) return path.relative(root, path.resolve(root, argv[i + 1])) || '.'
  if (process.env.BUILD_PLAN) return path.relative(root, path.resolve(root, process.env.BUILD_PLAN)) || '.'
  const found = discover(root)
  if (found.length > 1) {
    console.error(`More than one ${CONFIG_FILE} in the repo (${found.join(', ')}): pass --plan <dir>.`)
    process.exit(2)
  }
  return found.length ? path.dirname(found[0]) : DEFAULT_PLAN
}

/** Every plan.config.json in the repo, tracked or not (git-ignored ones aside). */
function discover(root) {
  try {
    return execFileSync('git', ['ls-files', '-co', '--exclude-standard', '--', `:(glob)**/${CONFIG_FILE}`], { cwd: root, encoding: 'utf8' })
      .split('\n').filter(f => f && fs.existsSync(path.join(root, f)))
  } catch {
    return []
  }
}

/** argv without `--plan <dir>`, so each tool's own argument parsing never sees it. */
export function stripPlanArg(argv = process.argv.slice(2)) {
  const i = argv.indexOf('--plan')
  return i < 0 ? argv : [...argv.slice(0, i), ...argv.slice(i + 2)]
}

const titleCase = s => s.charAt(0).toUpperCase() + s.slice(1)

/** The plan's config with every default filled in. */
export function loadConfig({ argv = process.argv.slice(2), root = process.cwd() } = {}) {
  const plan = planDirOf(argv, root)
  const file = path.join(root, plan, CONFIG_FILE)
  let raw = {}
  if (fs.existsSync(file)) raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  const board = raw.board ?? 'requirements-board'
  const requirements = raw.requirements ?? `${board}/requirements`
  const app = raw.app ?? null
  const appNoun = raw.appNoun ?? 'app'
  const name = raw.name ?? 'build plan'
  // A tool finds this plan by itself when it is the repo's only plan.config.json (or, with none, the
  // default folder); otherwise commands need `--plan <dir>`. `planFlag` is that flag or nothing.
  const found = discover(root)
  const findable = found.length ? found.length === 1 && path.dirname(found[0]) === plan : plan === DEFAULT_PLAN
  const c = {
    plan,
    tools: path.relative(root, TOOLS).split(path.sep).join('/'),
    planFlag: findable ? '' : ` --plan "${plan}"`,
    configFile: path.relative(root, file),
    configExists: fs.existsSync(file),
    name,
    title: raw.title ?? titleCase(name),
    subject: raw.subject ?? `the ${appNoun}`,
    appNoun,
    app,
    appCode: raw.appCode ?? (app ? [app] : []),
    appSummary: raw.appSummary ?? (app ? `The ${appNoun} lives in ${app}/.` : `The ${appNoun}'s code is in this repo.`),
    board,
    requirements,
    boardUrl: raw.boardUrl ?? 'http://localhost:5180',
    progress: raw.progress ?? null,
    firstPhase: String(raw.firstPhase ?? '01'),
    outOfScopeLanes: raw.outOfScopeLanes ?? [],
    olderCatalogues: raw.olderCatalogues ?? [],
    capture: raw.capture ?? null,
    standingRules: raw.standingRules ?? null,
    projectRules: raw.projectRules ?? null,
    greenCommands: raw.greenCommands ?? null,
    gapAnalysis: raw.gapAnalysis ?? {},
    planning: raw.planning ?? {},
    phaseDoc: raw.phaseDoc ?? {},
    index: raw.index ?? {},
  }
  // Screenshot capture: on when the plan says so, or (unset) when the board has a capture section.
  const boardConfig = readBoardConfig(root, requirements)
  if (c.capture === null) c.capture = !!boardConfig.capture
  if (c.capture) {
    const cap = boardConfig.capture || {}
    c.captureRecipes = `${requirements}/${cap.recipes ?? 'capture/recipes'}`
    c.captureReport = `${requirements}/${cap.report ?? 'capture/REPORT.md'}`
    c.captureAtlas = `${requirements}/${typeof c.capture === 'object' && c.capture.atlas ? c.capture.atlas : 'capture/ATLAS.md'}`
  }
  c.statuses = statusesOf(boardConfig, raw.settledStatuses, raw.unsettledStatuses)
  c.lanesText = c.outOfScopeLanes.length ? `the ${c.outOfScopeLanes.join(' and ')} lane${c.outOfScopeLanes.length > 1 ? 's' : ''}` : ''
  return c
}

function readBoardConfig(root, requirements) {
  try { return JSON.parse(fs.readFileSync(path.join(root, requirements, 'board.config.json'), 'utf8')) } catch { return {} }
}

// The board's defaults (BOARD/shared/statuses.ts) when its config has no lists.
const STATUS_DEFAULTS = {
  statuses: [{ code: 1, label: 'Proposed', role: 'default' }, { code: 2, label: 'Open', role: 'waiting' }, { code: 3, label: 'Verify' }, { code: 4, label: 'Confirmed' }, { code: 5, label: 'Retired', role: 'retired' }],
  questionStatuses: [{ code: 1, label: 'Open', role: 'default' }, { code: 2, label: 'Confirm' }, { code: 3, label: 'Proposed' }, { code: 4, label: 'Answered', role: 'answered' }],
}
export function statusListsOf(boardConfig) {
  const list = kind => (Array.isArray(boardConfig[kind]) ? boardConfig[kind] : STATUS_DEFAULTS[kind])
  return { statuses: list('statuses'), questionStatuses: list('questionStatuses') }
}

/**
 * Status words for agent prompts: every live status, the settled ones (config `settledStatuses`, codes;
 * default those the board marks `settle`) and the unsettled ones (`unsettledStatuses`; default the rest
 * but the default status).
 */
function statusesOf(boardConfig, settledCodes, unsettledCodes) {
  const { statuses } = statusListsOf(boardConfig)
  const live = statuses.filter(s => s.role !== 'retired')
  const retired = statuses.find(s => s.role === 'retired')
  const fmt = s => `${s.label} (${s.code})`
  return {
    list: live.map(s => `${s.code} ${s.label}`).join(', '),
    retired: retired ? fmt(retired) : 'Retired',
    settled: live.filter(s => (settledCodes ? settledCodes.map(String).includes(String(s.code)) : s.settle)).map(fmt),
    unsettled: live.filter(s => (unsettledCodes ? unsettledCodes.map(String).includes(String(s.code)) : !s.settle && s.role !== 'default')).map(fmt),
  }
}

// ---- phase status: the progress file, else status.json ----
// A progress file (config `progress`) records phases in a status table, rows
// `| NN | <title> | DONE | <date> | ...` or `| NN | ... | IN PROGRESS | ...`, and one `### [<word>] Phase NN`
// entry per built phase. Without one, status.json in the plan folder may list `done` and `in_progress`.
// Only phases numbered from config `firstPhase` count.
const ROW = st => new RegExp(`^\\|\\s*(\\d{2}[a-z]?)\\s*\\|[^|\\n]*\\|\\s*(?:${st})\\s*\\|`, 'gim')
export function phaseStatus(c, root = process.cwd()) {
  const text = c.progress && fs.existsSync(path.join(root, c.progress)) ? fs.readFileSync(path.join(root, c.progress), 'utf8') : ''
  let status = {}
  try { status = JSON.parse(fs.readFileSync(path.join(root, c.plan, 'status.json'), 'utf8')) } catch {}
  // status.json's done and in_progress lists stand in only when there is no progress file.
  const listed = k => (text ? [] : (status[k] ?? []).map(String))
  const first = parseInt(c.firstPhase, 10)
  const ours = n => parseInt(n, 10) >= first
  const rows = st => [...text.matchAll(ROW(st))].map(m => m[1])
  const doneDate = new Map([...text.matchAll(/^\|\s*(\d{2}[a-z]?)\s*\|[^|\n]*\|\s*DONE\s*\|\s*([^|\n]*?)\s*\|/gim)].map(m => [m[1], m[2]]))
  for (const n of listed('done')) if (!doneDate.has(n)) doneDate.set(n, '')
  const done = [...new Set([...rows('DONE'), ...listed('done')])]
  const entries = [...text.matchAll(/^###\s+(?:\S+\s+)?Phase\s+(\d{2}[a-z]?)\b/gim)].map(m => m[1])
  const inProgress = [...new Set([...rows('IN PROGRESS'), ...listed('in_progress')])]
  return {
    text,
    status,
    doneDate,
    /** DONE rows (any number), for display. */
    doneRows: done,
    /** IN PROGRESS rows (any number). */
    inProgressRows: inProgress,
    /** Built: DONE rows or a Phase entry, ours only. */
    built: [...new Set([...done, ...entries].filter(ours))],
    /** Built by entry only (a "### Phase NN" heading). */
    builtByEntry: [...new Set([...entries, ...listed('done')].filter(ours))],
    inProgress: inProgress.filter(ours),
    /** Phases whose docs keep their own drift baseline: DONE or IN PROGRESS, ours only. */
    keepBaseline: [...new Set([...done, ...inProgress].filter(ours))],
  }
}

/** Repo-relative path `to`, as a link from folder `fromDir` (both repo-relative). */
export const linkFrom = (fromDir, to) => path.relative(fromDir, to).split(path.sep).join('/')

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const c = loadConfig()
  console.log(JSON.stringify(c, null, process.argv.includes('--json') ? 0 : 1))
}
