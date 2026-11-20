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

/**
 * Fill unset variables from `.lane.env`. Returns the file read, or null. Every key is taken on purpose
 * (ports today, any of the board's environment values if a worktree names one), so a line such as
 * `REQUIREMENTS_DIR=` there redirects every command in that worktree.
 */
export function loadLaneEnv(env: NodeJS.ProcessEnv = process.env, board = BOARD_DIR): string | null {
  const file = laneEnvFile(board)
  if (!file) return null
  for (const [, k, raw] of readFileSync(file, 'utf8').matchAll(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/gm)) {
    const v = raw!.replace(/^(["'])(.*)\1$/, '$2') // KEY="value" as a shell would read it
    if (k && env[k] === undefined) env[k] = v
  }
  return file
}

/**
 * The board's dev-server port: `BOARD_PORT` (after `.lane.env`), else 5180. A value that is not a port
 * stops with a message, never a quiet fall back to another worktree's board.
 */
export const boardPort = (env: NodeJS.ProcessEnv = process.env) => {
  if (env.BOARD_PORT === undefined || env.BOARD_PORT === '') return 5180
  const port = Number(env.BOARD_PORT)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`BOARD_PORT is "${env.BOARD_PORT}", not a port number (check the environment and .lane.env)`)
  return port
}
