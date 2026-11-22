/**
 * The board's own folder, and the folder-naming environment values (`REQUIREMENTS_DIR`, `HISTORY_DIR`,
 * `REPO_ROOT`, `PDF_FACTS_DIR`). A relative value is relative to the board folder, whatever folder the
 * board or a script was started from, so it means the same under `npm --prefix`, `npx vite` and a test.
 * (Script arguments are different: they follow the folder the command was run from, `scripts/userPath.ts`.)
 */
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The board folder (`requirements-board/`). */
export const BOARD_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** A folder named by an environment value, absolute; undefined when it is unset or empty. */
export const envPath = (name: string, env: NodeJS.ProcessEnv = process.env): string | undefined => {
  const v = env[name]
  return v ? resolve(BOARD_DIR, v) : undefined
}
