/**
 * Paths the user types: every board script resolves its file and folder arguments against the folder
 * the command was run from, and prints paths as they read from there.
 *
 * npm runs a package script in the package's folder, so under `npm --prefix requirements-board run ...`
 * the working folder is the board, and the caller's folder reaches the script only as `INIT_CWD`. A
 * nested call (a repo-root script that runs `npm --prefix ...`) gets the outer script's folder, the repo
 * root. `INIT_CWD` is trusted only when npm's current script line names the script that is running, so a
 * script started some other way inside an npm script (a test spawning `node scripts/x.ts`) keeps its own
 * working folder. Run directly with `node scripts/x.ts`, a script reads paths from where it was started,
 * as before.
 */
import { basename, isAbsolute, relative, resolve, sep } from 'node:path'

/** The folder the user ran the command from. `script` defaults to the running script (`process.argv[1]`). */
export function callerDir(env: NodeJS.ProcessEnv = process.env, script = process.argv[1] ?? '', cwd = process.cwd()): string {
  const init = env.INIT_CWD
  const line = env.npm_lifecycle_script
  if (!init || !line || !script) return cwd
  const name = basename(script)
  return line.split(/\s+/).some((word) => basename(word.replace(/^["']|["']$/g, '')) === name) ? init : cwd
}

/** A path the user typed, made absolute against the folder they ran the command from. */
export const userPath = (p: string, from = callerDir()) => (isAbsolute(p) ? p : resolve(from, p))

/** A path as the user would type it: relative when it is under their folder, else absolute. */
export function shown(abs: string, from = callerDir()): string {
  const rel = relative(from, abs)
  if (!rel) return '.'
  return rel.startsWith('..') || isAbsolute(rel) ? abs : rel.split(sep).join('/')
}
