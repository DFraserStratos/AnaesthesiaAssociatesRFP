/**
 * The dev server's per-card change journal: every change it sees to a card (its own saves and
 * edits made on disk by anyone else) appended to `<dir>/<ID>.jsonl`, with the last version it saw
 * in `<ID>.last.json` to diff the next one against. Kept outside the requirements folder and out of
 * git, so it is per machine and never shows up in the catalogue's diffs. Writing it never fails a
 * save: a journal that cannot be written just logs and moves on.
 *
 * Screenshots: `<ID>.shots.json` holds each image under `assets/<ID>/` by git blob hash, in the
 * repository's own width, SHA-1 or SHA-256 (with its size and mtime, so an unchanged file is never
 * re-read; a hash kept in the other width is taken afresh without logging a change). A file rewritten in place, as
 * `npm run capture` does, logs a `screenshot` change; added and removed images show through the
 * card's own `images` field instead. The same hashes are the asset versions the board sends its tabs
 * (D-10): a scan returns them, and a re-sync scans only the folders that changed.
 */
import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { objectFormatSync } from './gitCore.ts'
import { diffItems, type FieldChange, type HistorySource, type JournalEntry } from '../shared/history.ts'
import type { Item, Rev } from '../shared/types.ts'

type Position = { x: number; y: number } | null

export interface Journal {
  /**
   * Note a card's new version. A rev the journal has already seen is ignored, so an echo never logs twice.
   * `reappeared`: the card's file was missing and is back. Read as the record last seen, it is a restore
   * and its history carries on; read as a different record, it is a new card reusing the ID, so a new
   * life starts (a `created` entry; the earlier lines stay in the file, and the timeline starts after them).
   */
  item: (rec: Rev<Item>, source: HistorySource, opts?: { offline?: boolean; reappeared?: boolean }) => void
  /** Note a Freeform drag (null: put back in its story-map place). */
  position: (id: string, from: Position, to: Position, source: HistorySource) => void
  /**
   * At start: log what changed on disk while the board was off, and baseline cards seen for the first
   * time, with a `seen` line saying when (the timeline's detail starts there).
   */
  baseline: (items: Record<string, Rev<Item>>) => void
  /**
   * Look for screenshots rewritten in place under `assetsDir` (the catalogue's `assets/`), in every
   * folder or only `ids`'s, and give each image's version (its git blob hash; D-10).
   */
  screenshots: (assetsDir: string, opts?: { offline?: boolean; ids?: Iterable<string> }) => ShotVersions
  read: (id: string) => JournalEntry[]
  /**
   * Set the card's journal aside (into `deleted/`), so a new card given the same ID starts clean: when the
   * board deletes a card, and when it creates one at an ID an earlier card's journal still holds.
   */
  forget: (id: string) => void
}

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'])

/**
 * Screenshot versions (D-10): `assets/<ID>/<name>` to its git blob hash, for the folders a scan
 * looked at. A folder that is gone gives nothing, so its files read as removed.
 */
export type ShotVersions = Record<string, string>

type ShotState = Record<string, { sha: string; size: number; mtimeMs: number }>

/** IDs are file names already; refuse anything that could step outside the folder. */
const safe = (id: string) => /^[A-Za-z0-9._-]+$/.test(id) && !id.includes('..')

/**
 * A screenshot scan over `assets/<id>/` folders: each image's hash, re-read only when its size or mtime
 * changed since `read` last kept it. `ids` limits the scan to those folders (a re-sync looks only at the
 * folders that changed); without it every folder is scanned. Never throws: an entry that can't be stat-ed
 * (a dangling link, a folder removed mid-scan) is skipped, and an image that can't be read keeps its last
 * record without abandoning the rest of its folder. A rewrite in place (a hash that changed) is `log`ged.
 */
function shotScanner(store: { read: (id: string) => ShotState | null; write: (id: string, next: ShotState) => void; log?: (id: string, changes: FieldChange[], offline: boolean) => void }) {
  return function screenshots(assetsDir: string, opts: { offline?: boolean; ids?: Iterable<string> } = {}): ShotVersions {
    const out: ShotVersions = {}
    let ids: string[]
    if (opts.ids) ids = [...opts.ids]
    else {
      try {
        ids = readdirSync(assetsDir)
      } catch {
        return out // no assets folder, or it can't be listed
      }
    }
    // Hashes in the repository's own width, so git can serve each version (B08-Q3: a hash kept in the
    // other width is taken afresh, logging no change).
    const format = ids.length ? objectFormatSync(assetsDir) : 'sha1'
    const width = format === 'sha256' ? 64 : 40
    for (const id of ids) {
      try {
        const folder = join(assetsDir, id)
        let names: string[]
        try {
          if (!safe(id) || !statSync(folder).isDirectory()) continue
          names = readdirSync(folder).sort()
        } catch {
          continue // gone, or not a folder: no screenshots here
        }
        const known = store.read(id)
        const next: ShotState = {}
        const changes: FieldChange[] = []
        for (const name of names) {
          if (!IMAGE_EXT.has(extname(name).toLowerCase())) continue
          const kept = known?.[name]
          const was = kept && kept.sha.length === width ? kept : undefined
          const src = `assets/${id}/${name}`
          let st, sha: string
          try {
            st = statSync(join(folder, name))
            if (!st.isFile()) continue
            const same = was && was.size === st.size && was.mtimeMs === st.mtimeMs
            sha = same ? was.sha : gitBlobSha(readFileSync(join(folder, name)), format)
          } catch (e) {
            console.warn(`[history] could not read screenshot ${id}/${name}: ${(e as Error).message}`)
            if (was) {
              next[name] = was // try again next time; the rest of the folder is still recorded
              out[src] = was.sha
            }
            continue
          }
          next[name] = { sha, size: st.size, mtimeMs: st.mtimeMs }
          out[src] = sha
          if (was && was.sha !== sha) changes.push({ field: 'screenshot', from: { src, sha: was.sha }, to: { src, sha } })
        }
        if (changes.length) store.log?.(id, changes, !!opts.offline)
        if (JSON.stringify(next) !== JSON.stringify(known)) store.write(id, next)
      } catch (e) {
        console.warn(`[history] could not record screenshots of ${id}: ${(e as Error).message}`)
      }
    }
    return out
  }
}

/**
 * A journal that keeps nothing on disk: for callers (tests, scripts) that pass no folder. Its screenshot
 * scan still gives every file's version, remembered for this journal (one server) only.
 */
export function memoryJournal(): Journal {
  const shots = new Map<string, ShotState>()
  const scan = shotScanner({ read: (id) => shots.get(id) ?? null, write: (id, next) => void shots.set(id, next) })
  return { item() {}, position() {}, baseline() {}, screenshots: scan, read: () => [], forget() {} }
}

/**
 * The hash git gives a file's raw bytes, in a SHA-1 repository or (`sha256`) a SHA-256 one, so a
 * version that was committed can be read back with `git cat-file`.
 */
export const gitBlobSha = (buf: Buffer, format: 'sha1' | 'sha256' = 'sha1') => createHash(format).update(`blob ${buf.length}\0`).update(buf).digest('hex')

export function createJournal(dir: string, now: () => Date = () => new Date()): Journal {
  const log = (id: string) => join(dir, `${id}.jsonl`)
  const last = (id: string) => join(dir, `${id}.last.json`)
  const quietly = (what: string, fn: () => void) => {
    try {
      fn()
    } catch (e) {
      console.warn(`[history] could not ${what}: ${(e as Error).message}`)
    }
  }
  const readLast = (id: string): Rev<Item> | null => {
    try {
      return existsSync(last(id)) ? (JSON.parse(readFileSync(last(id), 'utf8')) as Rev<Item>) : null
    } catch {
      return null
    }
  }
  const writeLast = (rec: Rev<Item>) => {
    mkdirSync(dir, { recursive: true })
    const tmp = `${last(rec.data.id)}.${process.pid}.tmp`
    writeFileSync(tmp, JSON.stringify(rec))
    renameSync(tmp, last(rec.data.id))
  }
  const append = (id: string, e: JournalEntry) => {
    mkdirSync(dir, { recursive: true })
    appendFileSync(log(id), `${JSON.stringify(e)}\n`)
  }

  function item(rec: Rev<Item>, source: HistorySource, opts: { offline?: boolean; reappeared?: boolean } = {}) {
    const id = rec.data.id
    if (!safe(id)) return
    quietly(`record ${id}`, () => {
      const prev = readLast(id)
      if (prev?.rev === rec.rev) return
      const changes = prev ? diffItems(prev.data, rec.data) : []
      // Back as a different record: a new card under a reused ID, not an edit of the old one (FINDINGS R-54).
      const reused = !!prev && !!opts.reappeared && (prev.data.type !== rec.data.type || changes.length > 0)
      const offline = opts.offline ? { offline: true as const } : {}
      // A `created` entry carries the record, so the timeline can tell a new life from a restore.
      if (!prev || reused) append(id, { at: now().toISOString(), source, kind: 'created', rev: rec.rev, changes: [], item: rec.data, ...offline })
      else if (changes.length) append(id, { at: now().toISOString(), source, kind: 'changed', rev: rec.rev, changes, ...offline })
      writeLast(rec)
    })
  }

  const shotsFile = (id: string) => join(dir, `${id}.shots.json`)

  /**
   * A card's screenshot record (`<id>.shots.json`), or null when there is none or it cannot be read
   * (half-written, hand-edited): the scan then starts afresh and rewrites it, rather than failing on
   * every sync.
   */
  const readShots = (id: string): ShotState | null => {
    try {
      const raw: unknown = JSON.parse(readFileSync(shotsFile(id), 'utf8'))
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
      const out: ShotState = {}
      for (const [name, v] of Object.entries(raw as Record<string, unknown>)) {
        const e = v as { sha?: unknown; size?: unknown; mtimeMs?: unknown } | null
        if (e && typeof e.sha === 'string' && typeof e.size === 'number' && typeof e.mtimeMs === 'number') out[name] = { sha: e.sha, size: e.size, mtimeMs: e.mtimeMs }
      }
      return out
    } catch {
      return null
    }
  }

  const screenshots = shotScanner({
    read: readShots,
    write(id, next) {
      mkdirSync(dir, { recursive: true })
      writeFileSync(shotsFile(id), JSON.stringify(next))
    },
    log: (id, changes, offline) => append(id, { at: now().toISOString(), source: 'disk', kind: 'changed', changes, ...(offline ? { offline: true as const } : {}) }),
  })

  return {
    item,
    screenshots,
    position(id, from, to, source) {
      if (!safe(id) || JSON.stringify(from) === JSON.stringify(to)) return
      quietly(`record a move of ${id}`, () => append(id, { at: now().toISOString(), source, kind: 'position', changes: [{ field: 'position', from, to }] }))
    },
    baseline(items) {
      for (const rec of Object.values(items)) {
        if (!safe(rec.data.id)) continue
        quietly(`baseline ${rec.data.id}`, () => {
          const prev = readLast(rec.data.id)
          if (!prev) {
            // First sight: history before now comes from git, and the journal has the detail from now on.
            append(rec.data.id, { at: now().toISOString(), source: 'disk', kind: 'seen', rev: rec.rev, changes: [] })
            writeLast(rec)
          } else if (prev.rev !== rec.rev) item(rec, 'disk', { offline: true })
        })
      }
    },
    forget(id) {
      if (!safe(id)) return
      quietly(`set aside the history of ${id}`, () => {
        const stamp = now().toISOString().replace(/[:.]/g, '-')
        const aside = join(dir, 'deleted')
        for (const f of [log(id), last(id), shotsFile(id)]) {
          if (!existsSync(f)) continue
          mkdirSync(aside, { recursive: true })
          renameSync(f, join(aside, `${stamp}-${f.slice(dir.length + 1)}`))
        }
      })
    },
    read(id) {
      if (!safe(id) || !existsSync(log(id))) return []
      return readFileSync(log(id), 'utf8')
        .split('\n')
        .flatMap((line) => {
          if (!line.trim()) return []
          try {
            return [JSON.parse(line) as JournalEntry]
          } catch {
            return [] // a line cut short by a crash
          }
        })
    },
  }
}
