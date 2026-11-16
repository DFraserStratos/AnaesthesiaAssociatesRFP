// Reading the plan's own Markdown, shared by the build-plan tools (phase-briefs.mjs, apply-plan-update.mjs)
// and the phase runner's tools (../../run-build-phase/tools/phase-context.mjs). Pure: text in, text out.
//
// Owner decision rows: ROADMAP.md table rows that start `| D<n> |`, with the phases they gate in the third
// cell ("28 to 32", "15b, 28 to 32", "all"). Baseline lines: the lines of a phase doc that name its
// drift-check baseline commit, the ones apply-plan-update.mjs moves on a plan update. Kick-off prompts: whether one
// loads the phase runner skill or runs the capture step (recipe-status.mjs --check), and stale repo roots in one.

/** Every owner decision row of a ROADMAP.md text, verbatim. */
export const decisionRows = text => text.split('\n').filter(l => /^\| D\d+ \|/.test(l))

/** "28 to 32", "15b, 28 to 32", "all": does a decision's Gates cell name this phase? */
export const gates = (cell, num) => cell.split(',').map(s => s.trim()).some(t => {
  if (t === num || t === 'all') return true
  const r = t.match(/^(\d+)[a-z]?\s+to\s+(\d+)[a-z]?$/)
  return r ? parseInt(num, 10) >= +r[1] && parseInt(num, 10) <= +r[2] : false
})

/** The decision rows of a ROADMAP.md text that gate phase `num`, verbatim. */
export const decisionsGating = (text, num) => decisionRows(text).filter(r => gates(r.split('|')[3] || '', num))

/** A line about the drift check or the plan's baseline: the only lines whose commit moves on a plan update. */
export const BASELINE_LINE = /drift|baseline|plan-state\.mjs|planned (?:below )?against|against catalogue commit/i

const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Does a kick-off prompt load the phase runner skill (config `runner.skill`)? A name inside a longer one does not count. */
export const loadsRunner = (prompt, runnerSkill) =>
  !!runnerSkill && new RegExp(`(?<![\\w-])${escRe(runnerSkill)}(?![\\w-])`).test(prompt)

/**
 * Does a kick-off prompt run the catalogue screenshot step? Either it runs the capture itself (`npm run capture`)
 * or it loads the runner skill, whose close-out captures the phase's recipes and then runs one full capture.
 */
export const runsCaptureStep = (prompt, runnerSkill) => /npm run capture/.test(prompt) || loadsRunner(prompt, runnerSkill)

/**
 * Absolute home-folder paths (`/Users/...`, `/home/...`) in a prompt that do not start with the repo root `root`:
 * a checkout that has since moved. A sibling worktree named `<root>-<suffix>` counts as the root. Returns each
 * offending path's first 60 characters, once.
 */
export const staleRoots = (prompt, root) => {
  const out = new Set()
  for (const m of prompt.matchAll(/\/(?:Users|home)\//g)) {
    const rest = prompt.slice(m.index)
    if (rest.startsWith(root) && /^(?:$|[^\w.])/.test(rest.slice(root.length))) continue
    out.add(rest.split('\n')[0].slice(0, 60))
  }
  return [...out]
}
