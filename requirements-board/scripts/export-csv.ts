/**
 * Regenerate requirements.csv and open-questions.csv in the old generator's
 * column shape, for Miro or a spreadsheet.
 *   npm run export:csv [-- --out <dir>] [-- --allow-errors]
 * Default output: the Updated Requirements folder. Refuses while `check` has
 * errors, since the CSV would then be missing or misplacing rows.
 */
import { writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { questionsCsv, requirementsCsv } from '../shared/csv.ts'
import { REQUIREMENTS_DIR, loadCatalogue } from '../server/catalogueFs.ts'

const outFlag = process.argv.indexOf('--out')
const out = outFlag > 0 ? resolve(process.argv[outFlag + 1]!) : REQUIREMENTS_DIR
const { items, questions, issues } = loadCatalogue()
const errors = issues.filter((i) => i.severity === 'error')
if (errors.length && !process.argv.includes('--allow-errors')) {
  for (const e of errors) console.error(`ERROR  ${e.id.padEnd(10)} ${e.message}`)
  console.error(`${errors.length} check error(s); fix them (npm run check) or pass --allow-errors.`)
  process.exit(1)
}
writeFileSync(join(out, 'requirements.csv'), requirementsCsv(Object.values(items).map((r) => r.data)))
writeFileSync(join(out, 'open-questions.csv'), questionsCsv(Object.values(questions).map((r) => r.data)))
console.log(`Wrote requirements.csv and open-questions.csv to ${out}`)
