/**
 * Install the board's skills and workflows into `.claude/` at the repo root (the board folder's
 * parent), merging with any skills the repo already has. It keeps the mode already in use: copies
 * (real files, which work everywhere) or symlinks (for a repo where the board's skills are edited);
 * a repo with neither gets copies. `--link` or `--copy` chooses. Afterwards `.claude/` holds exactly
 * the board's current skills: one the board no longer has is removed, and junk (`.DS_Store`,
 * `__pycache__`) is never installed. Safe to run again at any time: after editing a skill in the
 * board, after an upgrade, or after copying the kit with a tool that dropped hidden folders.
 *   npm --prefix requirements-board run install-skills [-- --link | -- --copy]
 */
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { linkSkills, type InstallMode } from '../server/skillInstall.ts'

const boardDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repo = dirname(boardDir)
const argv = process.argv.slice(2)
if (argv.includes('--link') && argv.includes('--copy')) {
  console.error('Pass --link or --copy, not both.')
  process.exit(1)
}
const mode: InstallMode | undefined = argv.includes('--link') ? 'link' : argv.includes('--copy') ? 'copy' : undefined
const { mode: used, linked, removed, skipped } = linkSkills(repo, basename(boardDir), mode)
console.log(`In ${repo} (${used === 'link' ? 'symlinks' : 'copies'}${mode ? '' : ', the mode in use'}):`)
for (const l of linked) console.log(`  ${used === 'link' ? 'linked ' : 'copied '}  ${l}`)
for (const r of removed) console.log(`  removed  ${r} (the board no longer has it)`)
for (const s of skipped) console.log(`  skipped  ${s}`)
console.log('Restart Claude Code (or start a new session) to pick up new skills.')
