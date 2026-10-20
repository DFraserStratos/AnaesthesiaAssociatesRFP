/**
 * Expose the board's agent skills and workflows to Claude Code, in `<repo>/.claude/skills/` (a
 * folder per skill) and `<repo>/.claude/workflows/`, in one of two ways:
 *   - `copy` (the default, and what a shared kit uses): real files, which survive Windows, zips and
 *     cloud drives. Each copied SKILL.md says where its source is; `.claude/requirements-board.json`
 *     lists what was installed, so a later run refreshes exactly those;
 *   - `link`: a real folder per skill holding a relative symlink per file (a symlinked skill folder
 *     still loads, but is left out of the `/` menu), so edits in the board show at once.
 * Skills a repo already has are left alone: only what the manifest lists, or links into the board,
 * are ever replaced, so the board's skills merge with any others.
 */
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export type InstallMode = 'copy' | 'link'

export interface LinkReport {
  linked: string[]
  skipped: string[]
}

const MANIFEST = join('.claude', 'requirements-board.json')

/** `board` is the board's folder name inside `repo` (e.g. `requirements-board`). */
export function linkSkills(repo: string, board: string, mode: InstallMode = 'copy'): LinkReport {
  const report: LinkReport = { linked: [], skipped: [] }
  const agent = join(repo, board, 'agent')
  const skillsDir = join(repo, '.claude', 'skills')
  const workflowsDir = join(repo, '.claude', 'workflows')
  mkdirSync(skillsDir, { recursive: true })
  mkdirSync(workflowsDir, { recursive: true })
  const installed = new Set(readManifest(repo))
  const next: string[] = []
  /** Ours to replace: installed by an earlier run, or a link into the board. */
  const ours = (rel: string, abs: string) =>
    installed.has(rel) ||
    (isLink(abs) && readlinkSync(abs).includes(`${board}/agent/`)) ||
    (isDir(abs) && readdirSync(abs).length > 0 && readdirSync(abs).every((f) => isLink(join(abs, f)) && readlinkSync(join(abs, f)).includes(`${board}/agent/`)))
  const clear = (rel: string, abs: string) => {
    if (!existsSync(abs) && !isLink(abs)) return true
    if (!ours(rel, abs)) {
      report.skipped.push(`${rel} (already there and not the board's)`)
      return false
    }
    rmSync(abs, { recursive: true, force: true })
    return true
  }

  for (const skill of readdirSync(join(agent, 'skills')).filter((s) => !s.startsWith('.'))) {
    const rel = `.claude/skills/${skill}`
    const into = join(skillsDir, skill)
    if (!clear(rel, into)) continue
    const from = join(agent, 'skills', skill)
    if (mode === 'link') {
      mkdirSync(into)
      for (const f of readdirSync(from).filter((f) => !f.startsWith('.'))) symlinkSync(`../../../${board}/agent/skills/${skill}/${f}`, join(into, f))
    } else {
      cpSync(from, into, { recursive: true, filter: (src) => !src.endsWith('.DS_Store') })
      const md = join(into, 'SKILL.md')
      if (existsSync(md)) writeFileSync(md, withCopyNote(readFileSync(md, 'utf8'), skill, board))
      next.push(rel)
    }
    report.linked.push(rel)
  }

  for (const wf of readdirSync(join(agent, 'workflows')).filter((f) => f.endsWith('.js'))) {
    const rel = `.claude/workflows/${wf}`
    const at = join(workflowsDir, wf)
    if (!clear(rel, at)) continue
    if (mode === 'link') symlinkSync(`../../${board}/agent/workflows/${wf}`, at)
    else {
      cpSync(join(agent, 'workflows', wf), at)
      next.push(rel)
    }
    report.linked.push(rel)
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

/**
 * How each of the board's skills and workflows stands in `<repo>/.claude/`: `current` (linked, or a
 * copy that matches the source), `outdated` (an older copy), `missing`, or `foreign` (a skill of the
 * same name that the board did not install, which an install leaves alone).
 */
export type InstallState = 'current' | 'outdated' | 'missing' | 'foreign'

export interface InstallStatus {
  mode: InstallMode | null
  skills: { name: string; state: InstallState }[]
  workflows: { name: string; state: InstallState }[]
}

export function installStatus(repo: string, board: string): InstallStatus {
  const agent = join(repo, board, 'agent')
  const installed = new Set(readManifest(repo))
  let mode: InstallMode | null = null
  const stateOf = (rel: string, abs: string, source: string, expect: (f: string, text: Buffer) => Buffer | string) => {
    if (!existsSync(abs) && !isLink(abs)) return 'missing'
    const linked = isLink(abs) ? readlinkSync(abs).includes(`${board}/agent/`) : isDir(abs) && readdirSync(abs).length > 0 && readdirSync(abs).every((f) => isLink(join(abs, f)) && readlinkSync(join(abs, f)).includes(`${board}/agent/`))
    if (linked) {
      mode = 'link'
      return 'current'
    }
    if (!installed.has(rel)) return 'foreign'
    mode = 'copy'
    for (const f of filesUnder(source)) {
      const copy = join(abs, f)
      if (!existsSync(copy)) return 'outdated'
      const want = expect(f, readFileSync(join(source, f)))
      if (!readFileSync(copy).equals(Buffer.isBuffer(want) ? want : Buffer.from(want))) return 'outdated'
    }
    return 'current'
  }
  const skills = readdirSync(join(agent, 'skills'))
    .filter((s) => !s.startsWith('.'))
    .map((name) => ({
      name,
      state: stateOf(`.claude/skills/${name}`, join(repo, '.claude', 'skills', name), join(agent, 'skills', name), (f, b) => (f === 'SKILL.md' ? withCopyNote(b.toString('utf8'), name, board) : b)) as InstallState,
    }))
  const workflows = readdirSync(join(agent, 'workflows'))
    .filter((f) => f.endsWith('.js'))
    .map((name) => {
      const abs = join(repo, '.claude', 'workflows', name)
      const src = join(agent, 'workflows', name)
      let state: InstallState
      if (!existsSync(abs) && !isLink(abs)) state = 'missing'
      else if (isLink(abs)) state = readlinkSync(abs).includes(`${board}/agent/`) ? 'current' : 'foreign'
      else if (!installed.has(`.claude/workflows/${name}`)) state = 'foreign'
      else state = readFileSync(abs).equals(readFileSync(src)) ? 'current' : 'outdated'
      return { name, state }
    })
  return { mode, skills, workflows }
}

/** Every file under `dir`, relative, skipping dotfiles. */
function filesUnder(dir: string, base = ''): string[] {
  return readdirSync(join(dir, base), { withFileTypes: true })
    .filter((d) => !d.name.startsWith('.'))
    .flatMap((d) => (d.isDirectory() ? filesUnder(dir, join(base, d.name)) : d.isFile() ? [join(base, d.name)] : []))
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
