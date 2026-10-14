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
