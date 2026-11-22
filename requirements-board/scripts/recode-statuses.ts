/**
 * Rewrite the status codes stored in the catalogue's files: old value to new code, for items and
 * for questions. Only each file's `status:` frontmatter line changes, so a diff shows nothing but
 * the recode. The board's change journal is rewritten the same way, the config's status lists take
 * the new codes, and the run is recorded in `status-recodes.json`, so history and the build plan's
 * change check read a relabel as no change.
 *
 *   npm run statuses:recode -- --items Proposed=1,Confirmed=4 --questions Answered=4 [--note "why"] [--dry-run]
 *
 * Refuses, and writes nothing:
 * - while a board runs beside the same catalogue (stop it first: it would journal the rewrites as
 *   status moves);
 * - if a file holds a status that is neither mapped nor already one of the new codes, or a live code
 *   the map leaves out while it renumbers others (a silent merge);
 * - if a target is a code this recode or an earlier one moves away, a code used before, or a live
 *   code not named as itself (`4=4`, an explicit merge), so following every recode in order reads
 *   every version right (see `recodeProblems` in shared/statuses.ts);
 * - while board.config.json is damaged or unreadable.
 *
 * The run records itself first, then rewrites the files, the journal and the config, each file
 * written whole (temp file, then rename). If anything fails, it says which file and step; run the
 * same command again and it finishes the recorded recode without recording it twice.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { REQUIREMENTS_DIR, configPath, formatJson, writeAtomic } from '../server/catalogueFs.ts'
import { boardsRunning, historyDirFor } from '../server/historyDir.ts'
import { shown } from './userPath.ts'
import { stripBom } from '../shared/bom.ts'
import { CONFIG_FILE, DEFAULT_CONFIG, parseConfig, type BoardConfig } from '../shared/config.ts'
import { RECODES_FILE, STATUS_CODE, STATUS_FIELDS, highestCode, parseRecodes, recodedCodes, recodeProblems, statusesOf, type Recode, type StatusKind } from '../shared/statuses.ts'

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

/**
 * What a recode would change in one folder of Markdown files, the values it can't place, and every
 * value found. A value already at a target is taken as recoded and left alone, unless it is a live
 * code (`live`) while the map renumbers live codes: then leaving it out would merge it silently, so it
 * is unmapped. `resume` (finishing a recorded recode) skips every value at a target.
 */
export function planFolder(dir: string, map: StatusMap, opts: { live?: ReadonlySet<string>; resume?: boolean } = {}): { changes: FilePlan[]; unknown: Map<string, string[]>; values: Set<string> } {
  const live = opts.live ?? new Set<string>()
  const targets = new Set(Object.values(map))
  const renumbersLive = Object.entries(map).some(([from, to]) => from !== to && live.has(from))
  const changes: FilePlan[] = []
  const unknown = new Map<string, string[]>()
  const values = new Set<string>()
  if (!existsSync(dir)) return { changes, unknown, values }
  for (const name of readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const file = join(dir, name)
    const from = statusOf(readFileSync(file, 'utf8'))
    if (from === null) continue
    values.add(from)
    if (Object.hasOwn(map, from)) {
      if (map[from] !== from) changes.push({ file, from, to: map[from]! })
    } else if (!(targets.has(from) && (opts.resume || !(renumbersLive && live.has(from))))) unknown.set(from, [...(unknown.get(from) ?? []), name])
  }
  return { changes, unknown, values }
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

/** One piece of JSON with its statuses mapped, or as it was (byte for byte) when nothing changes or it can't be read. */
function recodeText(text: string, map: StatusMap): { text: string; unreadable: boolean } {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return { text, unreadable: true }
  }
  const next = recodeJournal(value, map)
  return { text: JSON.stringify(next) === JSON.stringify(value) ? text : JSON.stringify(next), unreadable: false }
}

/** A journal file with its statuses mapped. A line that can't be read (cut short by a crash) is kept as it was and counted. */
export function recodeJournalText(file: string, text: string, map: StatusMap): { text: string; unreadable: number } {
  if (!file.endsWith('.jsonl')) {
    const r = recodeText(text, map)
    return { text: r.text, unreadable: r.unreadable ? 1 : 0 }
  }
  let unreadable = 0
  const lines = text.split('\n').map((line) => {
    if (!line.trim()) return line
    const r = recodeText(line, map)
    if (r.unreadable) unreadable++
    return r.text
  })
  return { text: lines.join('\n'), unreadable }
}

/** The config's status lists with each recoded code moved to its target; an entry merged into a live status goes. */
export function recodeConfigList(raw: unknown, map: StatusMap): unknown {
  if (!Array.isArray(raw)) return raw
  const live = new Set(raw.map((d) => String((d as { code?: unknown })?.code)))
  return raw.flatMap((d) => {
    const code = String((d as { code?: unknown })?.code)
    if (!Object.hasOwn(map, code) || map[code] === code) return [d]
    const to = map[code]!
    return live.has(to) ? [] : [{ ...(d as object), code: Number(to) }]
  })
}

const sameMap = (a: StatusMap, b: StatusMap) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort())
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function main(): number {
  const args = process.argv.slice(2)
  const opt = (name: string) => {
    const i = args.indexOf(`--${name}`)
    return i >= 0 ? args[i + 1] : undefined
  }
  const dryRun = args.includes('--dry-run')
  let maps: Record<StatusKind, StatusMap>
  try {
    maps = { item: parseMap(opt('items')), question: parseMap(opt('questions')) }
  } catch (e) {
    console.error((e as Error).message)
    return 1
  }
  if (!Object.keys(maps.item).length && !Object.keys(maps.question).length) {
    console.error('Nothing to recode: pass --items old=new,... and/or --questions old=new,...')
    return 1
  }
  const root = REQUIREMENTS_DIR
  const historyDir = historyDirFor(root)
  const recodesPath = join(root, RECODES_FILE)
  // Read strictly, unlike the board's tolerant reader: the run appends to this file, and a file it
  // can't read would otherwise be replaced, losing the history every reader depends on.
  let recordedRaw: unknown[] = []
  if (existsSync(recodesPath)) {
    try {
      const raw: unknown = JSON.parse(stripBom(readFileSync(recodesPath, 'utf8')))
      if (!Array.isArray(raw) || !raw.every((r) => r && typeof r === 'object' && !Array.isArray(r))) throw new Error('it must be a list of { date, items, questions }')
      recordedRaw = raw
    } catch (e) {
      console.error(`${RECODES_FILE} can't be read (${(e as Error).message}): fix it first. Nothing written.`)
      return 1
    }
  }
  const recodes = parseRecodes(JSON.stringify(recordedRaw))
  const last = recodes.at(-1)
  // The same command again after a failure: finish the recode it recorded, never record it twice.
  const resume = !!last && sameMap(last.items, maps.item) && sameMap(last.questions, maps.question)
  const earlier = resume ? recodes.slice(0, -1) : recodes

  const configFile = configPath(root)
  const configText = existsSync(configFile) ? readFileSync(configFile, 'utf8') : null
  const config: BoardConfig = configText === null ? DEFAULT_CONFIG : parseConfig(configText, earlier).config
  const folders: Record<StatusKind, string> = { item: join(root, 'stories'), question: join(root, 'questions') }

  const refusals: string[] = []
  const plans = (['item', 'question'] as const).map((kind) => {
    const map = maps[kind]
    const field = STATUS_FIELDS[kind]
    const live = statusesOf(config, kind)
    const plan = planFolder(folders[kind], map, { live: new Set(live.map((d) => d.code)), resume })
    if (!Object.keys(map).length) return { kind, map, ...plan }
    if (config.statusState[field].state === 'damaged') refusals.push(`${CONFIG_FILE}: ${field} is damaged; fix it first:\n  ${config.statusState[field].problems.join('\n  ')}`)
    for (const [value, files] of plan.unknown)
      refusals.push(`${kind === 'item' ? 'items' : 'questions'}: "${value}" is not mapped (${plural(files.length, 'file')}, e.g. ${files.slice(0, 3).join(', ')})`)
    if (!resume) {
      const highWater = highestCode([String(config.statusState[field].highWater)], recodedCodes(earlier, kind), plan.values)
      refusals.push(...recodeProblems(map, kind, { live, earlier, highWater }))
    }
    return { kind, map, ...plan }
  })
  if (refusals.length) {
    for (const r of refusals) console.error(r)
    console.error('Nothing written: fix the above and run the recode again.')
    return 1
  }

  for (const p of plans) {
    if (!Object.keys(p.map).length) continue
    const counts = new Map<string, number>()
    for (const c of p.changes) counts.set(`${c.from} to ${c.to}`, (counts.get(`${c.from} to ${c.to}`) ?? 0) + 1)
    const live = new Set(statusesOf(config, p.kind).map((d) => d.code))
    const merges = Object.entries(p.map).filter(([from, to]) => from !== to && STATUS_CODE.test(from) && live.has(to))
    console.log(`${p.kind === 'item' ? 'items' : 'questions'}: ${plural(p.changes.length, 'file')}${[...counts].map(([k, n]) => `\n  ${k}: ${n}`).join('')}${merges.map(([from, to]) => `\n  merge: ${from} into ${to}`).join('')}`)
  }

  const running = boardsRunning(historyDir)
  if (running.length) {
    const msg = `A board is running beside this catalogue (process ${running.join(', ')}): stop the board first, then run the recode again. It would journal the rewritten files as status changes. (If no board is running, delete ${running.map((pid) => join(historyDir, `board-${pid}.lock`)).join(', ')}.)`
    if (!dryRun) {
      console.error(`${msg}\nNothing written.`)
      return 1
    }
    console.log(`Note: ${msg}`)
  }
  if (dryRun) {
    console.log('Dry run: nothing written.')
    return 0
  }

  const failures: string[] = []
  if (resume) console.log(`Finishing the recode recorded on ${last!.date} in ${RECODES_FILE}.`)
  else {
    const note = opt('note')
    const entry: Recode = { date: new Date().toISOString().slice(0, 10), ...(note ? { note } : {}), items: maps.item, questions: maps.question }
    try {
      writeAtomic(recodesPath, JSON.stringify([...recordedRaw, entry], null, 2) + '\n')
    } catch (e) {
      console.error(`${RECODES_FILE}: could not record the recode (${(e as Error).message}). Nothing else written.`)
      return 1
    }
  }

  for (const p of plans)
    for (const c of p.changes) {
      try {
        writeAtomic(c.file, withStatus(readFileSync(c.file, 'utf8'), c.to))
      } catch (e) {
        failures.push(`${relative(root, c.file)}: could not rewrite (files): ${(e as Error).message}`)
      }
    }

  let journals = 0
  let unreadable = 0
  if (Object.keys(maps.item).length)
    for (const file of journalFiles(historyDir)) {
      try {
        const text = readFileSync(file, 'utf8')
        const next = recodeJournalText(file, text, maps.item)
        unreadable += next.unreadable
        if (next.text === text) continue
        writeAtomic(file, next.text)
        journals++
      } catch (e) {
        failures.push(`${file}: could not rewrite (journal): ${(e as Error).message}`)
      }
    }
  if (journals) console.log(`journal: ${plural(journals, 'file')} in ${shown(historyDir) || '.'}`)
  if (unreadable) console.log(`journal: ${plural(unreadable, 'unreadable journal line')} kept as it was`)

  if (configText !== null) {
    try {
      const raw = JSON.parse(stripBom(readFileSync(configFile, 'utf8'))) as Record<string, unknown>
      const next = { ...raw }
      for (const kind of ['item', 'question'] as const) {
        const field = STATUS_FIELDS[kind]
        if (raw[field] !== undefined) next[field] = recodeConfigList(raw[field], maps[kind])
        else if (Object.keys(maps[kind]).length) console.log(`${CONFIG_FILE} has no ${field}: the built-in list stays as it is; give the project its own ${field} with the new codes.`)
      }
      if (JSON.stringify(next) !== JSON.stringify(raw)) {
        writeAtomic(configFile, formatJson(next))
        console.log(`${CONFIG_FILE}: the status lists take the new codes.`)
      }
    } catch (e) {
      failures.push(`${CONFIG_FILE}: could not update (config): ${(e as Error).message}`)
    }
  } else console.log(`No ${CONFIG_FILE}: the built-in status lists stay as they are; give the project its own lists with the new codes.`)

  if (failures.length) {
    for (const f of failures) console.error(f)
    console.error(`The recode is recorded in ${RECODES_FILE}. Fix the above, then run the same command again to finish it.`)
    return 1
  }
  console.log(`Recorded in ${shown(recodesPath)}. Run the check.`)
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main()
