/**
 * Links between catalogue records inside Markdown bodies. Two forms, both read by the board:
 *
 * - an explicit link, `[prepaid set](US-06.1.1)`: standard Markdown whose href is a record ID;
 * - a bare ID in running text, `(OQ-25)`, which the board shows as the record's name.
 *
 * Neither counts inside code (a fenced block or a backtick span). Shared by the check, the
 * browser's index and the linking scripts, so all three agree on what a body links to.
 */
import type { Item } from './types.ts'

/** Any record ID: epic, feature, story, outstanding item or artifact. Not followed by more of an ID (`FT-06.2` in `FT-06.2.1`). */
const ID_SOURCE = String.raw`\b(?:US-\d{2}\.\d+\.\d+|FT-\d{2}\.\d+|EP-\d{2}|OQ-\d{2,}|AR-\d{2,})(?![\d.]*\d|\w)`
/** A fresh global regex for every bare ID in a text (global regexes carry state, so never share one). */
export const idMentions = () => new RegExp(ID_SOURCE, 'g')
const WHOLE_ID = new RegExp(`^${ID_SOURCE}$`)
export const isRecordId = (s: string) => WHOLE_ID.test(s)

/** An href that is meant as a record ID (so a malformed one is still caught as a broken link). */
export const isIdHref = (href: string) => /^(?:EP|FT|US|OQ|AR)-/.test(href.trim())
export const isQuestionId = (id: string) => id.startsWith('OQ-')
/** An artifact ID, or an artifact link with a region (`AR-01#price-rules`). */
export const isArtifactId = (id: string) => id.startsWith('AR-')
export const isArtifactHref = (href: string) => /^AR-/.test(href.trim())

/** A Markdown link or image: `[text](href)`, text in group 1, href in group 2. */
const LINK = /!?\[([^\]]*)\]\(\s*([^)\s]*)[^)]*\)/g

/** Blank out code (fenced blocks, then backtick spans) so neither form of link counts inside it. */
function withoutCode(md: string): string {
  return md.replace(/^(```|~~~)[^\n]*\n[\s\S]*?(?:^\1[^\n]*$|(?![\s\S]))/gm, ' ').replace(/(`+)[\s\S]*?\1/g, ' ')
}

export interface Mention {
  id: string
  /** True for a bare ID in the text, false for an explicit `[text](ID)` link. */
  bare: boolean
}

/** Every record a body refers to, in order of first appearance, explicit links before bare IDs of the same record. */
export function mentions(md: string): Mention[] {
  const text = withoutCode(md)
  const out: Mention[] = []
  const seen = new Set<string>()
  const add = (id: string, bare: boolean) => {
    if (seen.has(id)) return
    seen.add(id)
    out.push({ id, bare })
  }
  for (const m of text.matchAll(LINK)) if (isIdHref(m[2]!)) add(m[2]!.trim(), false)
  // A link's own text never adds a bare mention: `[see US-01.1.1](US-01.1.1)` is one link.
  for (const m of text.replace(LINK, ' ').matchAll(idMentions())) add(m[0], true)
  return out
}

/** The IDs a body refers to, once each. */
export const linkTargets = (md: string): string[] => mentions(md).map((m) => m.id)

/** An item's Markdown fields, the ones that can hold links. */
export const itemTexts = (it: Item): string[] => [it.description, it.acceptance, it.technical, it.notes]

/** Every record an item's body refers to, once each. */
export const itemLinkTargets = (it: Item): string[] => [...new Set(itemTexts(it).flatMap(linkTargets))]

/** The items, questions and artifacts a body refers to, apart: artifact refs keep their `#region`. */
export const splitTargets = (ids: string[]) => ({ records: ids.filter((id) => !isArtifactId(id)), artifacts: ids.filter(isArtifactId) })

/** Markdown links reduced to their text, for excerpts and plain-text exports. */
export const plainText = (md: string) => md.replace(LINK, '$1')

/**
 * The record a pasted string points at: a bare ID, or a board link to one
 * (`http://localhost:5180/#/board?item=US-06.1.1`). Null for anything else.
 */
export function pastedTarget(pasted: string): string | null {
  const s = pasted.trim()
  if (isRecordId(s)) return s
  if (/\s/.test(s)) return null
  const art = /^AR-\d{2,}(?:#[A-Za-z0-9-]+)?$/.exec(s) ?? /#\/artifacts\/(AR-\d{2,})(?:\?(?:[^#]*&)?region=([^&#]+))?/.exec(s)
  if (art) return art.length > 2 && art[2] ? `${art[1]}#${decodeURIComponent(art[2])}` : (art[1] ?? art[0])
  const m = /[?&](?:item|question)=([^&#]+)/.exec(s)
  if (!m) return null
  const id = decodeURIComponent(m[1]!)
  return isRecordId(id) ? id : null
}
