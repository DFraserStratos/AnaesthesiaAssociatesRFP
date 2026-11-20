/**
 * A worktree's ports. A git-ignored `.lane.env` (KEY=value lines) at the repository's top (or, outside
 * git, beside the board folder) fills in environment variables that are not already set, so the board's
 * dev server, capture, `artifact:steps` and the Playwright boards of a second worktree all use that
 * worktree's ports. A variable set in the environment always wins.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BOARD_DIR } from './boardPaths.ts'

/** The `.lane.env` this board reads, or null when there is none. */
export function laneEnvFile(board = BOARD_DIR): string | null {
  let top = join(board, '..')
  try {
    top = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: board, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } }).trim()
  } catch {
    // not in git: beside the board folder
  }
  const file = join(top, '.lane.env')
  return existsSync(file) ? file : null
}

/** Fill unset variables from `.lane.env`. Returns the file read, or null. */
export function loadLaneEnv(env: NodeJS.ProcessEnv = process.env, board = BOARD_DIR): string | null {
  const file = laneEnvFile(board)
  if (!file) return null
  for (const [, k, v] of readFileSync(file, 'utf8').matchAll(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/gm)) if (k && env[k] === undefined) env[k] = v
  return file
}

/** The board's dev-server port: `BOARD_PORT` (after `.lane.env`), else 5180. */
export const boardPort = (env: NodeJS.ProcessEnv = process.env) => Number(env.BOARD_PORT) || 5180
