import { existsSync, readFileSync } from 'node:fs'

/**
 * A parallel build lane's ports (docs/build-plan/LANES.md). A lane's worktree holds a
 * git-ignored `.lane.env` at its root (`AA_PROTO_PORT=5273` and so on, one per line); this loads it
 * into `process.env` for every variable not already set, so the dev servers, Playwright and the
 * dev servers Playwright starts all use the lane's ports however the session was started. No file
 * (the main checkout), nothing changes. Imported first by the Vite and Playwright configs.
 */
const file = new URL('../.lane.env', import.meta.url)
if (existsSync(file)) {
  for (const [, key, value] of readFileSync(file, 'utf8').matchAll(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/gm)) {
    if (key && process.env[key] === undefined) process.env[key] = value
  }
}
