/**
 * Rewrite the status codes stored in the catalogue's files: old value to new code, for items and
 * for questions. Only each file's `status:` frontmatter line changes, so a diff shows nothing but
 * the recode. The board's change journal (`.history/`) is rewritten the same way, and the run is
 * recorded in `status-recodes.json`, so history and the build plan's change check read a relabel
 * as no change. Update `statuses` / `questionStatuses` in board.config.json to the new codes too.
 *
 *   npm run statuses:recode -- --items Proposed=1,Confirmed=4 --questions Answered=4 [--note "why"] [--dry-run]
 *
 * Refuses (and writes nothing) if any file holds a status that is neither mapped nor already one
 * of the new codes.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { REQUIREMENTS_DIR } from '../server/catalogueFs.ts'
import { RECODES_FILE, STATUS_CODE, parseRecodes, type Recode } from '../shared/statuses.ts'

export type StatusMap = Record<string, string>

const STATUS_LINE = /^status:[ \t]*(.*?)[ \t]*$/m

/** `A=b,C=d` as a map. Every target must be a valid code. */
export function parseMap(arg: string | undefined): StatusMap {
  const out: StatusMap = {}
  for (const pair of (arg ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
    const [from, to] = pair.split('=').map((s) => s?.trim() ?? '')
    if (!from || !to) throw new Error(`"${pair}" is not old=new`)
    if (!STATUS_CODE.test(to)) throw new Error(`"${to}" is not a code (a whole number from 1)`)
    out[from] = to
  }
  return out
}

/** The frontmatter's status value, unquoted, or null when there is none. */
export function statusOf(text: string): string | null {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  const m = fm ? STATUS_LINE.exec(fm[1]!) : null
  return m ? m[1]!.replace(/^(['"])(.*)\1$/, '$2') : null
}

/** The file with its frontmatter status line set to `to`; every other byte as it was. */
export function withStatus(text: string, to: string): string {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!fm) return text
  const start = fm.index + fm[0].indexOf(fm[1]!)
  const body = fm[1]!.replace(STATUS_LINE, `status: ${to}`)
  return text.slice(0, start) + body + text.slice(start + fm[1]!.length)
}

export interface FilePlan {
  file: string
  from: string
  to: string
}

/** What a recode would change in one folder of Markdown files, and the values it can't place. */
export function planFolder(dir: string, map: StatusMap): { changes: FilePlan[]; unknown: Map<string, string[]> } {
  const targets = new Set(Object.values(map))
  const changes: FilePlan[] = []
  const unknown = new Map<string, string[]>()
  if (!existsSync(dir)) return { changes, unknown }
  for (const name of readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const file = join(dir, name)
    const from = statusOf(readFileSync(file, 'utf8'))
    if (from === null) continue
    if (Object.hasOwn(map, from)) {
      if (map[from] !== from) changes.push({ file, from, to: map[from]! })
    } else if (!targets.has(from)) unknown.set(from, [...(unknown.get(from) ?? []), name])
  }
  return { changes, unknown }
}

/** A journal line or snapshot with its status values mapped (item journals only). */
export function recodeJournal(value: unknown, map: StatusMap): unknown {
  const swap = (v: unknown) => (typeof v === 'string' && Object.hasOwn(map, v) ? map[v] : v)
  if (!value || typeof value !== 'object') return value
  const o = value as Record<string, unknown>
  const out: Record<string, unknown> = { ...o }
  if (Array.isArray(o.changes)) out.changes = o.changes.map((c) => (c && typeof c === 'object' && (c as { field?: string }).field === 'status' ? { ...c, from: swap((c as { from: unknown }).from), to: swap((c as { to: unknown }).to) } : c))
  if (o.data && typeof o.data === 'object' && 'status' in o.data) out.data = { ...o.data, status: swap((o.data as { status: unknown }).status) }
  return out
}

function journalFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? journalFiles(join(dir, d.name)) : /\.(jsonl|last\.json)$/.test(d.name) ? [join(dir, d.name)] : []))
}

function rewriteJournal(file: string, map: StatusMap): boolean {
  const text = readFileSync(file, 'utf8')
  const next = file.endsWith('.jsonl')
    ? text
        .split('\n')
        .map((line) => (line.trim() ? JSON.stringify(recodeJournal(JSON.parse(line), map)) : line))
        .join('\n')
    : JSON.stringify(recodeJournal(JSON.parse(text), map))
  if (next === text) return false
  writeFileSync(file, next, 'utf8')
  return true
}

function main() {
  const args = process.argv.slice(2)
  const opt = (name: string) => {
    const i = args.indexOf(`--${name}`)
    return i >= 0 ? args[i + 1] : undefined
  }
  const dryRun = args.includes('--dry-run')
  const items = parseMap(opt('items'))
  const questions = parseMap(opt('questions'))
  if (!Object.keys(items).length && !Object.keys(questions).length) {
    console.error('Nothing to recode: pass --items old=new,... and/or --questions old=new,...')
    process.exit(1)
  }
  const root = REQUIREMENTS_DIR
  const plans = [
    { kind: 'items', map: items, ...planFolder(join(root, 'stories'), items) },
    { kind: 'questions', map: questions, ...planFolder(join(root, 'questions'), questions) },
  ]

  let refused = false
  for (const p of plans) {
    if (!Object.keys(p.map).length) continue
    for (const [value, files] of p.unknown) {
      refused = true
      console.error(`${p.kind}: "${value}" is not mapped (${files.length} file${files.length === 1 ? '' : 's'}, e.g. ${files.slice(0, 3).join(', ')})`)
    }
  }
  if (refused) {
    console.error('Nothing written: map every value above to its new code (old=new).')
    process.exit(1)
  }

  for (const p of plans) {
    const counts = new Map<string, number>()
    for (const c of p.changes) counts.set(`${c.from} to ${c.to}`, (counts.get(`${c.from} to ${c.to}`) ?? 0) + 1)
    console.log(`${p.kind}: ${p.changes.length} file${p.changes.length === 1 ? '' : 's'}${[...counts].map(([k, n]) => `\n  ${k}: ${n}`).join('')}`)
  }
  if (dryRun) return console.log('Dry run: nothing written.')

  for (const p of plans) for (const c of p.changes) writeFileSync(c.file, withStatus(readFileSync(c.file, 'utf8'), c.to), 'utf8')

  const historyDir = process.env.HISTORY_DIR ? resolve(process.env.HISTORY_DIR) : join(dirname(fileURLToPath(import.meta.url)), '..', '.history')
  const journals = Object.keys(items).length && !process.env.REQUIREMENTS_DIR ? journalFiles(historyDir).filter((f) => rewriteJournal(f, items)).length : 0
  if (journals) console.log(`journal: ${journals} file${journals === 1 ? '' : 's'} in ${relative(process.cwd(), historyDir) || '.'}`)

  const recodesPath = join(root, RECODES_FILE)
  const recodes: Recode[] = parseRecodes(existsSync(recodesPath) ? readFileSync(recodesPath, 'utf8') : null)
  const note = opt('note')
  recodes.push({ date: new Date().toISOString().slice(0, 10), ...(note ? { note } : {}), items, questions })
  writeFileSync(recodesPath, JSON.stringify(recodes, null, 2) + '\n', 'utf8')
  console.log(`Recorded in ${relative(process.cwd(), recodesPath)}. Now set the new codes in board.config.json and run the check.`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
