/**
 * How a capture run limited to some IDs (`--only`) keeps the screenshot report true. Kept apart from the
 * Playwright runner (`capture.ts`) so it can be tested.
 *
 * Every row of the report but a failure follows from files on disk (the recipes, the catalogue), so a
 * partial run can rewrite the whole report as a full run would. The one thing it cannot know is whether a
 * recipe outside its run would fail: those failures are carried over from the report already on disk.
 * The run's own IDs take this run's result: a recipe that failed before and passes now leaves the
 * "Failed recipes" list, and its totals move with it.
 */

const LINE = /^- \*\*([^*\s]+)\*\* ?(.*)$/

/** How the report marks a recipe that could not be read (its problems follow); never carried over. */
export const INVALID_RECIPE = 'invalid recipe: '

/**
 * The runtime failures recorded in an existing report ("## Failed recipes" bullets): id -> the error text.
 * Lines for unreadable recipes (marked INVALID_RECIPE) are left out: the run lists those itself, from the
 * recipe files as they are now, so a recipe fixed since is not carried over as failed.
 * `titleOf` gives an item's title, so the text after it can be told apart. Null when the text is not a
 * report this runner wrote (no "## Failed recipes" section), so the caller leaves it alone.
 */
export function priorFailures(text: string | null, titleOf: (id: string) => string): Map<string, string> | null {
  if (!text) return null
  const lines = text.split('\n')
  const at = lines.findIndex((l) => /^## Failed recipes \(\d+\)\s*$/.test(l))
  if (at < 0) return null
  const out = new Map<string, string>()
  for (let i = at + 1; i < lines.length && !/^## /.test(lines[i] ?? ''); i++) {
    const m = lines[i]?.match(LINE)
    if (!m) continue
    const id = m[1] ?? ''
    const rest = m[2] ?? ''
    const title = titleOf(id)
    const after = title && rest.startsWith(title) ? rest.slice(title.length) : rest
    const error = after.replace(/^ · /, '')
    if (!error.startsWith(INVALID_RECIPE)) out.set(id, error)
  }
  return out
}

/**
 * The failures a partial run reports: this run's own (`failedNow`) for the IDs it ran (`scope`), and the
 * earlier report's for every other ID, except IDs whose recipe is now unreadable (`broken`, which the
 * report lists itself) or no longer exists (`known` false).
 */
export function mergeFailures(
  prior: Map<string, string>,
  scope: ReadonlySet<string>,
  failedNow: ReadonlyMap<string, string>,
  broken: ReadonlyMap<string, unknown>,
  known: (id: string) => boolean,
): Map<string, string> {
  const out = new Map<string, string>()
  for (const [id, e] of prior) if (!scope.has(id) && !broken.has(id) && known(id)) out.set(id, e)
  for (const [id, e] of failedNow) out.set(id, e)
  return out
}
