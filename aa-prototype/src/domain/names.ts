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
export function titledSurname(name: string): string {
  const match = /^(Dr|Mr|Ms|Mrs|Miss|Prof)\.?\s+/i.exec(name.trim())
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
  const q = query.trim().toLowerCase().replace(/\s+/g, ' ')
  if (q === '') return true
  const bare = name.trim().replace(/^(Dr|Mr|Ms|Mrs|Miss|Prof)\.?\s+/i, '').toLowerCase().replace(/\s+/g, ' ')
  return bare.includes(q)
}

/** A patient as the office reads them in a one-line notice: "Annette Riley" -> "Riley, A.". */
export function surnameCommaInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => p !== '')
  if (parts.length < 2) return name.trim()
  const surname = parts[parts.length - 1]!
  return `${surname}, ${parts[0]!.charAt(0).toUpperCase()}.`
}
