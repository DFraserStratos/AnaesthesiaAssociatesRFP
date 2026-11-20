/**
 * Where a catalogue's change journal lives, and the lock a running board keeps there.
 *
 * The journal folder: HISTORY_DIR (a relative value is relative to the board folder), else `.history/` beside this app for the real requirements
 * folder, else a temp folder per catalogue (a fixture never mixes into the real one's history).
 * The dev server and `statuses:recode` both ask here, so a recode rewrites the journal of the board
 * that serves the same catalogue.
 *
 * While a board runs it keeps `board-<pid>.lock` in that folder. A recode refuses to run beside one:
 * the board would journal the files the recode rewrites as status moves, and the recode's journal
 * pass would then rewrite those entries too (FINDINGS A-2). A lock whose process has gone is stale
 * and ignored.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { envPath } from './boardPaths.ts'
import { REQUIREMENTS_DIR } from './catalogueFs.ts'

export function historyDirFor(root: string): string {
  const fromEnv = envPath('HISTORY_DIR')
  if (fromEnv) return fromEnv
  if (resolve(root) === resolve(REQUIREMENTS_DIR) && !process.env.REQUIREMENTS_DIR) return join(dirname(fileURLToPath(import.meta.url)), '..', '.history')
  return join(tmpdir(), 'requirements-board-history', resolve(root).replace(/[^A-Za-z0-9]+/g, '_').slice(-80))
}

const LOCK = /^board-(\d+)\.lock$/

/** Mark a board as running beside this journal; the returned function takes the mark away. */
export function holdBoardLock(dir: string, pid = process.pid): () => void {
  const file = join(dir, `board-${pid}.lock`)
  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(file, JSON.stringify({ pid }) + '\n', 'utf8')
  } catch {
    // A journal that can't be written never stops the board (see historyJournal.ts).
  }
  return () => rmSync(file, { force: true })
}

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'EPERM'
  }
}

/** The process IDs of boards running beside this journal now (stale locks left by a crash are skipped). */
export function boardsRunning(dir: string): number[] {
  let names: string[]
  try {
    names = readdirSync(dir)
  } catch {
    return []
  }
  return names.flatMap((name) => {
    const m = LOCK.exec(name)
    if (!m) return []
    let pid = Number(m[1])
    try {
      pid = Number((JSON.parse(readFileSync(join(dir, name), 'utf8')) as { pid?: unknown }).pid ?? pid)
    } catch {
      // the name says enough
    }
    return Number.isInteger(pid) && pid > 0 && alive(pid) ? [pid] : []
  })
}
