/**
 * Regenerate requirements.csv and open-questions.csv in the old generator's
 * column shape, for Miro or a spreadsheet.
 *   npm run export:csv [-- --out <dir>] [-- --allow-errors]
 * Default output: requirements/exports/ (not committed); a relative --out is read from the folder the command was run from. Refuses while `check` has
 * errors, since the CSV would then be missing or misplacing rows.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { questionsCsv, requirementsCsv } from '../shared/csv.ts'
import { REQUIREMENTS_DIR, loadCatalogue } from '../server/catalogueFs.ts'
import { shown, userPath } from './userPath.ts'

const outFlag = process.argv.indexOf('--out')
const outArg = outFlag > 0 ? process.argv[outFlag + 1] : undefined
if (outFlag > 0 && (!outArg || outArg.startsWith('--'))) {
  console.error('--out needs a folder')
  process.exit(1)
}
const out = outArg ? userPath(outArg) : join(REQUIREMENTS_DIR, 'exports')
// Status labels come from the project's own list only: a damaged list is a check error, and even
// under --allow-errors a code that list does not define is written as stored, never through the defaults.
const { items, questions, issues, config } = loadCatalogue()
const errors = issues.filter((i) => i.severity === 'error')
if (errors.length && !process.argv.includes('--allow-errors')) {
  for (const e of errors) console.error(`ERROR  ${e.id.padEnd(10)} ${e.message}`)
  console.error(`${errors.length} check error(s); fix them (npm run check) or pass --allow-errors.`)
  process.exit(1)
}
mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'requirements.csv'), requirementsCsv(Object.values(items).map((r) => r.data), config))
writeFileSync(join(out, 'open-questions.csv'), questionsCsv(Object.values(questions).map((r) => r.data), config))
console.log(`Wrote requirements.csv and open-questions.csv to ${shown(out)}`)
