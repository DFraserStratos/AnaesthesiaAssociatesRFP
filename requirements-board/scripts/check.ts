/**
 * Validate the catalogue: IDs, parents, types, links, vocabulary, image files.
 *   npm run check        exits 1 on any error; warnings are listed but pass.
 */
import { loadCatalogue, CATALOGUE_DIR } from '../server/catalogueFs.ts'

const { items, questions, issues } = loadCatalogue()
const count = (t: string) => Object.values(items).filter((r) => r.data.type === t).length
console.log(`${CATALOGUE_DIR}`)
console.log(`${count('epic')} epics, ${count('feature')} features, ${count('story')} stories, ${Object.keys(questions).length} questions`)
for (const i of issues) console.log(`${i.severity === 'error' ? 'ERROR' : 'warn '}  ${i.id.padEnd(10)} ${i.message}`)
const errors = issues.filter((i) => i.severity === 'error').length
console.log(errors ? `${errors} error(s)` : 'OK, no errors')
process.exit(errors ? 1 : 0)
