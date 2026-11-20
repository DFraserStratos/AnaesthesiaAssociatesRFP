/**
 * Expose the board's agent skills and workflows to Claude Code, in `<repo>/.claude/skills/` (a
 * folder per skill) and `<repo>/.claude/workflows/`, in one of two ways:
 *   - `copy` (what a fresh repo and a shared kit get): real files, which survive Windows, zips and
 *     cloud drives. Each copied SKILL.md says where its source is; `.claude/requirements-board.json`
 *     lists what was installed, so a later run refreshes exactly those;
 *   - `link`: a real folder per skill holding a relative symlink per top-level entry (file or folder;
 *     a symlinked skill folder still loads, but is left out of the `/` menu), so edits in the board
 *     show at once. A link run keeps no list: its links say where they point.
 * With no mode given, an install keeps the mode already in use (the list means copy, links into the
 * board mean link), and a repo with neither gets copies.
 *
 * After a run, `.claude/` holds exactly the board's current skills and workflows: one the board no
 * longer has, which an earlier run installed (listed, or a link into the board's `agent/`, dangling or
 * not), is removed. Skills a repo already has are left alone: only what the list names, or what links
 * into the board, is ever replaced or removed, so the board's skills merge with any others. Junk
 * (`server/junk.ts`: dotfiles such as `.DS_Store`, `__pycache__`) is never installed and never
 * decides who owns a folder.
 */
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { hasJunk, isJunk } from './junk.ts'

export type InstallMode = 'copy' | 'link'

export interface LinkReport {
  mode: InstallMode
  linked: string[]
  removed: string[]
  skipped: string[]
}

const MANIFEST = join('.claude', 'requirements-board.json')

/** The mode `.claude/` is in for this board: copy (a list), link (links into the board), or null. */
export function installMode(repo: string, board: string): InstallMode | null {
  if (readManifest(repo).length) return 'copy'
  const skillsDir = join(repo, '.claude', 'skills')
  const workflowsDir = join(repo, '.claude', 'workflows')
  const entries = [...list(skillsDir).map((n) => join(skillsDir, n)), ...list(workflowsDir).map((n) => join(workflowsDir, n))]
  return entries.some((abs) => linksIntoBoard(abs, board) || isBoardLinkFolder(abs, board)) ? 'link' : null
}

/** `board` is the board's folder name inside `repo` (e.g. `requirements-board`). */
export function linkSkills(repo: string, board: string, mode?: InstallMode): LinkReport {
  const use: InstallMode = mode ?? installMode(repo, board) ?? 'copy'
  const report: LinkReport = { mode: use, linked: [], removed: [], skipped: [] }
  const agent = join(repo, board, 'agent')
  const skillsDir = join(repo, '.claude', 'skills')
  const workflowsDir = join(repo, '.claude', 'workflows')
  mkdirSync(skillsDir, { recursive: true })
  mkdirSync(workflowsDir, { recursive: true })
  const installed = new Set(readManifest(repo))
  const next: string[] = []
  /** Ours to replace or remove: installed by an earlier run, or a link (or folder of links) into the board. */
  const ours = (rel: string, abs: string) => installed.has(rel) || linksIntoBoard(abs, board) || isBoardLinkFolder(abs, board)
  const clear = (rel: string, abs: string) => {
    if (!existsSync(abs) && !isLink(abs)) return true
    if (!ours(rel, abs)) {
      report.skipped.push(`${rel} (already there and not the board's)`)
      return false
    }
    rmSync(abs, { recursive: true, force: true })
    return true
  }

  const skills = list(join(agent, 'skills')).filter((s) => isDir(join(agent, 'skills', s)))
  for (const skill of skills) {
    const rel = `.claude/skills/${skill}`
    const into = join(skillsDir, skill)
    if (!clear(rel, into)) continue
    const from = join(agent, 'skills', skill)
    if (use === 'link') {
      mkdirSync(into)
      for (const f of list(from)) symlinkSync(`../../../${board}/agent/skills/${skill}/${f}`, join(into, f))
    } else {
      cpSync(from, into, { recursive: true, filter: (src) => !hasJunk(relative(from, src)) })
      const md = join(into, 'SKILL.md')
      if (existsSync(md)) writeFileSync(md, withCopyNote(readFileSync(md, 'utf8'), skill, board))
      next.push(rel)
    }
    report.linked.push(rel)
  }

  const workflows = list(join(agent, 'workflows')).filter((f) => f.endsWith('.js'))
  for (const wf of workflows) {
    const rel = `.claude/workflows/${wf}`
    const at = join(workflowsDir, wf)
    if (!clear(rel, at)) continue
    if (use === 'link') symlinkSync(`../../${board}/agent/workflows/${wf}`, at)
    else {
      cpSync(join(agent, 'workflows', wf), at)
      next.push(rel)
    }
    report.linked.push(rel)
  }

  // What an earlier run installed for a skill or workflow the board no longer has.
  const current = new Set(report.linked.concat(report.skipped.map((s) => s.split(' ')[0]!)))
  for (const [dir, prefix] of [[skillsDir, '.claude/skills/'], [workflowsDir, '.claude/workflows/']] as const) {
    for (const name of readdirSync(dir)) {
      const rel = prefix + name
      const abs = join(dir, name)
      if (current.has(rel) || isJunk(name) || !ours(rel, abs)) continue
      rmSync(abs, { recursive: true, force: true })
      report.removed.push(rel)
    }
  }

  // Remember what a copy run installed; a link run needs no list (its links say where they point).
  if (next.length) writeFileSync(join(repo, MANIFEST), JSON.stringify({ board, note: `Installed by \`npm --prefix ${board} run install-skills\`. Edit the skills in ${board}/agent/, then run it again.`, installed: next }, null, 2) + '\n')
  else rmSync(join(repo, MANIFEST), { force: true })
  return report
}

function readManifest(repo: string): string[] {
  try {
    return (JSON.parse(readFileSync(join(repo, MANIFEST), 'utf8')) as { installed?: string[] }).installed ?? []
  } catch {
    return []
  }
}

/** A line under the frontmatter, so nobody edits the copy and loses it on the next install. */
function withCopyNote(text: string, skill: string, board: string) {
  const end = text.startsWith('---') ? text.indexOf('\n---', 3) : -1
  const at = end < 0 ? 0 : text.indexOf('\n', end + 1) + 1
  const note = `\n> Installed copy. Edit \`${board}/agent/skills/${skill}/SKILL.md\`, then run \`npm --prefix ${board} run install-skills\`; changes made here are overwritten.\n`
  return text.slice(0, at) + note + text.slice(at)
}

/** The names in `dir` that are not junk; none when it does not exist. */
function list(dir: string): string[] {
  try {
    return readdirSync(dir).filter((f) => !isJunk(f))
  } catch {
    return []
  }
}

/** A symlink whose target is in the board's `agent/` folder (whether or not the target still exists). */
function linksIntoBoard(abs: string, board: string) {
  return isLink(abs) && readlinkSync(abs).split('\\').join('/').includes(`${board}/agent/`)
}

/** A real folder whose entries, junk aside, are all links into the board (a link-mode skill). */
function isBoardLinkFolder(abs: string, board: string) {
  if (!isDir(abs)) return false
  const entries = list(abs)
  return entries.length > 0 && entries.every((f) => linksIntoBoard(join(abs, f), board))
}

function isLink(p: string) {
  try {
    return lstatSync(p).isSymbolicLink()
  } catch {
    return false
  }
}

function isDir(p: string) {
  try {
    return lstatSync(p).isDirectory()
  } catch {
    return false
  }
}
