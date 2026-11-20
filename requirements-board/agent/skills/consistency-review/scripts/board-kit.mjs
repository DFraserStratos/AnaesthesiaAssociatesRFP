// The board's own rules, as the review scripts use them: one home, so no script keeps its own copy.
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * The board's note-cite rule (accepted decision 18): `shared/sources.ts` and `server/sourceIndex.ts`, imported
 * from the board that sits one folder above the catalogue `REQ` (absolute). `resolveNoteCite(sourceIndex, cite)`
 * gives the note the board opens for a cite, or null; `noteWords` splits a cite's words from its spot.
 */
export async function boardNoteRules(REQ) {
  const load = (p) => import(pathToFileURL(path.join(REQ, '..', p)).href)
  const { resolveNoteCite, noteWords } = await load('shared/sources.ts')
  const { loadSourceIndex } = await load('server/sourceIndex.ts')
  return { resolveNoteCite, noteWords, sourceIndex: loadSourceIndex(REQ) }
}

/** A retired artifact (status Retired, or replaced by another) is a record: never reviewed, never edited. */
export const isRetiredArtifact = (fm) => /^retired$/i.test(String(fm?.status ?? '').trim()) || !!fm?.superseded_by

/** An artifact `file:` as the board reads it: a path starting "/" is from the repository, any other from the catalogue folder. */
export const artifactFilePath = (repo, req, file) => (String(file).startsWith('/') ? path.join(path.resolve(repo), String(file).slice(1)) : path.join(path.resolve(repo), req, String(file)))

/** The same file, relative to the repository root. */
export const artifactFileRel = (req, file) => (String(file).startsWith('/') ? String(file).slice(1) : `${req}/${file}`)
