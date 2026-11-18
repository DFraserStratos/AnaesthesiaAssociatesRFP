/**
 * Person-name short forms the domain needs (catch-up Phase 32: the pool's
 * sentence and the store's refusals). Pure. The apps read them through
 * `shared/format.ts`, which re-exports this one, so every surface agrees.
 */

/**
 * Keep the leading title and the surname: "Ms A. Reid" -> "Ms Reid",
 * "Dr Priya Sharma" -> "Dr Sharma". Surgeons carry Mr / Ms titles, so the
 * Dr-only short form would mislabel them (Phase 17 pairing group headings).
 * A name with no title stays whole ("Jane Smith"): no title is invented.
 */
/**
 * A leading personal title ("Dr ", "Ms. "), the one pattern the name helpers share
 * (here and `nameWithoutTitle` in `shared/format.ts`, UI unification U1).
 * Not global, so `exec` and `replace` carry no state between calls.
 */
export const TITLE_PREFIX = /^(Dr|Mr|Ms|Mrs|Miss|Prof)\.?\s+/i

/** Drop a leading title (Dr, Mr, Ms, Mrs, Miss, Prof: `TITLE_PREFIX`): "Dr Melanie Souter" -> "Melanie Souter". Re-exported by `shared/format.ts`. */
export function nameWithoutTitle(name: string): string {
  return name.trim().replace(TITLE_PREFIX, '').trim()
}

export function titledSurname(name: string): string {
  const match = TITLE_PREFIX.exec(name.trim())
  if (match === null) return name.trim()
  const parts = name.trim().slice(match[0].length).split(/\s+/).filter((p) => p !== '')
  const surname = parts[parts.length - 1]
  return surname === undefined ? name : `${match[1]} ${surname}`
}

/**
 * The one name filter behind the shared type-ahead box (catch-up Phase 32a;
 * US-01.4.7, US-01.4.2): the names narrow as each letter is typed. Matches,
 * case-insensitively, anywhere in the name without its title ("hug" and "rawiri
 * h" both find "Dr Rawiri Hughes"). An empty or blank query matches everyone.
 */
export function matchesNameQuery(name: string, query: string): boolean {
  const bare = (text: string) => text.trim().replace(/\s+/g, ' ').replace(TITLE_PREFIX, '').toLowerCase()
  const q = bare(query)
  // Nothing typed, or a title alone ("Dr", "Dr "): everyone here has one, so it narrows nothing.
  if (q === '' || /^(dr|mr|ms|mrs|miss|prof)\.?$/i.test(q)) return true
  return bare(name).includes(q)
}

/** A patient as the office reads them in a one-line notice: "Annette Riley" -> "Riley, A.". */
export function surnameCommaInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => p !== '')
  if (parts.length < 2) return name.trim()
  const surname = parts[parts.length - 1]!
  return `${surname}, ${parts[0]!.charAt(0).toUpperCase()}.`
}
