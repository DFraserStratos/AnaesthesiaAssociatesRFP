/**
 * Install the board's skills and workflows into `.claude/` at the repo root (the board folder's
 * parent), merging with any skills the repo already has. Copies by default (real files work
 * everywhere); `--link` makes symlinks instead, for a repo where the board's skills are edited.
 * Safe to run again at any time: after editing a skill in the board, after an upgrade, or after
 * copying the kit with a tool that dropped hidden folders.
 *   npm --prefix requirements-board run install-skills [-- --link]
 */
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { linkSkills } from '../server/skillInstall.ts'

const boardDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repo = dirname(boardDir)
const mode = process.argv.includes('--link') ? 'link' : 'copy'
const { linked, skipped } = linkSkills(repo, basename(boardDir), mode)
console.log(`In ${repo}:`)
for (const l of linked) console.log(`  ${mode === 'link' ? 'linked ' : 'copied '}  ${l}`)
for (const s of skipped) console.log(`  skipped  ${s}`)
console.log('Restart Claude Code (or start a new session) to pick up new skills.')
