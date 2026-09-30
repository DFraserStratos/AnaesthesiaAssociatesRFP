/**
 * The dev server's per-card change journal: every change it sees to a card (its own saves and
 * edits made on disk by anyone else) appended to `<dir>/<ID>.jsonl`, with the last version it saw
 * in `<ID>.last.json` to diff the next one against. Kept outside the catalogue folder and out of
 * git, so it is per machine and never shows up in the catalogue's diffs. Writing it never fails a
 * save: a journal that cannot be written just logs and moves on.
 *
 * Screenshots: `<ID>.shots.json` holds each image under `assets/<ID>/` by git blob hash (with its
 * size and mtime, so an unchanged file is never re-read). A file rewritten in place, as
 * `npm run capture` does, logs a `screenshot` change; added and removed images show through the
 * card's own `images` field instead.
 */
import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { diffItems, type FieldChange, type HistorySource, type JournalEntry } from '../shared/history.ts'
import type { Item, Rev } from '../shared/types.ts'

type Position = { x: number; y: number } | null

export interface Journal {
  /** Note a card's new version. A rev the journal has already seen is ignored, so an echo never logs twice. */
  item: (rec: Rev<Item>, source: HistorySource, opts?: { offline?: boolean }) => void
  /** Note a Freeform drag (null: put back in its story-map place). */
  position: (id: string, from: Position, to: Position, source: HistorySource) => void
  /** At start: log what changed on disk while the board was off, and baseline cards seen for the first time. */
  baseline: (items: Record<string, Rev<Item>>) => void
  /** Look for screenshots rewritten in place under `assetsDir` (the catalogue's `assets/`). */
  screenshots: (assetsDir: string, opts?: { offline?: boolean }) => void
  read: (id: string) => JournalEntry[]
  /** The card was deleted from the board: set its journal aside, so a new card given the same ID starts clean. */
  forget: (id: string) => void
}

/** A journal that keeps nothing: for callers (tests, scripts) that pass no folder. */
export const NO_JOURNAL: Journal = { item() {}, position() {}, baseline() {}, screenshots() {}, read: () => [], forget() {} }

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'])

/** The hash git gives a file's content, so a version that was committed can be read back with `git cat-file`. */
export const gitBlobSha = (buf: Buffer) => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex')

type ShotState = Record<string, { sha: string; size: number; mtimeMs: number }>

/** IDs are file names already; refuse anything that could step outside the folder. */
const safe = (id: string) => /^[A-Za-z0-9._-]+$/.test(id) && !id.includes('..')

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

  function item(rec: Rev<Item>, source: HistorySource, opts: { offline?: boolean } = {}) {
    const id = rec.data.id
    if (!safe(id)) return
    quietly(`record ${id}`, () => {
      const prev = readLast(id)
      if (prev?.rev === rec.rev) return
      const changes = prev ? diffItems(prev.data, rec.data) : []
      if (!prev || changes.length) {
        append(id, { at: now().toISOString(), source, kind: prev ? 'changed' : 'created', rev: rec.rev, changes, ...(opts.offline ? { offline: true as const } : {}) })
      }
      writeLast(rec)
    })
  }

  const shotsFile = (id: string) => join(dir, `${id}.shots.json`)

  function screenshots(assetsDir: string, opts: { offline?: boolean } = {}) {
    if (!existsSync(assetsDir)) return
    for (const id of readdirSync(assetsDir)) {
      const folder = join(assetsDir, id)
      if (!safe(id) || !statSync(folder).isDirectory()) continue
      quietly(`record screenshots of ${id}`, () => {
        const known = existsSync(shotsFile(id)) ? (JSON.parse(readFileSync(shotsFile(id), 'utf8')) as ShotState) : null
        const next: ShotState = {}
        const changes: FieldChange[] = []
        for (const name of readdirSync(folder).sort()) {
          if (!IMAGE_EXT.has(extname(name).toLowerCase())) continue
          const st = statSync(join(folder, name))
          if (!st.isFile()) continue
          const was = known?.[name]
          const same = was && was.size === st.size && was.mtimeMs === st.mtimeMs
          const sha = same ? was.sha : gitBlobSha(readFileSync(join(folder, name)))
          next[name] = { sha, size: st.size, mtimeMs: st.mtimeMs }
          const src = `assets/${id}/${name}`
          if (was && was.sha !== sha) changes.push({ field: 'screenshot', from: { src, sha: was.sha }, to: { src, sha } })
        }
        if (changes.length) append(id, { at: now().toISOString(), source: 'disk', kind: 'changed', changes, ...(opts.offline ? { offline: true as const } : {}) })
        if (JSON.stringify(next) !== JSON.stringify(known)) {
          mkdirSync(dir, { recursive: true })
          writeFileSync(shotsFile(id), JSON.stringify(next))
        }
      })
    }
  }

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
          if (!prev) writeLast(rec) // first sight: history before now comes from git
          else if (prev.rev !== rec.rev) item(rec, 'disk', { offline: true })
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
