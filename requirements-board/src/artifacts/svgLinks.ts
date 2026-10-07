/**
 * Record IDs drawn in a diagram, made clickable when it is shown. The file stays plain: the board
 * finds every bare ID in the drawing's text (the same rule Markdown uses, `idMentions`) and wraps
 * each one it knows in an SVG `<a>` inside the same `<text>`. Nothing is moved or restyled, the
 * text reads exactly as before (so `text=` anchors and find still match), and an ID the catalogue
 * doesn't have stays plain text.
 */
import { idMentions, isArtifactId, isQuestionId } from '../../shared/links.ts'
import type { ArtifactRec, Item, Question } from '../../shared/types.ts'

const SVG_NS = 'http://www.w3.org/2000/svg'
/** Elements whose own text is drawn as text. */
const TEXT_PARENTS = new Set(['text', 'tspan', 'textpath'])
/** The class every linked ID carries, for styling and for the click handler to find it. */
export const RECORD_LINK_CLASS = 'record-id'

export interface DiagramLink {
  /** Where a modified click (a new tab) goes. */
  href: string
  /** The record's name, for the tooltip and the accessible name. */
  title: string
  /** The hover tooltip: the record's name and status, as a link in Markdown shows. */
  tip?: string
  /** A retired card or a superseded artifact: still a link, but muted. */
  retired?: boolean
}

/** The link for a record ID, or null when the catalogue has no such record (it stays plain text). */
export type ResolveLink = (id: string) => DiagramLink | null

/**
 * The links a drawing gets from the loaded catalogue: an item or question opens its sheet over the
 * page (the hrefs are where a new tab goes, as in Markdown), another artifact its own page. The
 * drawing's own ID is left plain.
 */
export function catalogueResolver(index: { byId: Map<string, Item>; questions: Question[] }, artifacts: Record<string, ArtifactRec>, selfId?: string): ResolveLink {
  const questions = new Map(index.questions.map((q) => [q.id, q]))
  return (id) => {
    if (id === selfId) return null
    if (isArtifactId(id)) {
      const a = artifacts[id]?.data
      return a ? { href: `#/artifacts/${encodeURIComponent(id)}`, title: a.title, tip: `${a.title} · ${a.status}`, retired: a.status === 'Superseded' } : null
    }
    const rec = isQuestionId(id) ? questions.get(id) : index.byId.get(id)
    if (!rec) return null
    return { href: `#/board?${isQuestionId(id) ? 'question' : 'item'}=${encodeURIComponent(id)}`, title: rec.title, tip: `${rec.title} · ${rec.status}`, retired: rec.status === 'Retired' }
  }
}

/** Wrap every known record ID in the drawing's text in a link. Returns how many were linked. */
export function linkRecordIds(svg: Element, resolve: ResolveLink): number {
  const doc = svg.ownerDocument
  const nodes: Text[] = []
  const walker = doc.createTreeWalker(svg, 4 /* NodeFilter.SHOW_TEXT */)
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const parent = n.parentElement
    if (!parent || !TEXT_PARENTS.has(parent.localName.toLowerCase())) continue
    // A link the drawing already has (to one of its own spots) is left as it is.
    if (parent.closest('a')) continue
    nodes.push(n)
  }
  let linked = 0
  for (const node of nodes) {
    const value = node.data
    const parts: Node[] = []
    let at = 0
    const re = idMentions()
    for (let m = re.exec(value); m; m = re.exec(value)) {
      const link = resolve(m[0])
      if (!link) continue
      if (m.index > at) parts.push(doc.createTextNode(value.slice(at, m.index)))
      parts.push(linkElement(doc, m[0], link))
      at = m.index + m[0].length
      linked++
    }
    if (!parts.length) continue
    if (at < value.length) parts.push(doc.createTextNode(value.slice(at)))
    node.replaceWith(...parts)
  }
  return linked
}

function linkElement(doc: Document, id: string, link: DiagramLink): Element {
  const a = doc.createElementNS(SVG_NS, 'a')
  a.setAttribute('href', link.href)
  a.setAttribute('class', link.retired ? `${RECORD_LINK_CLASS} retired` : RECORD_LINK_CLASS)
  a.setAttribute('data-record', id)
  // The ID stays as drawn; its name is the link's accessible name (a <title> would add to the text).
  a.setAttribute('aria-label', `${link.title} (${id})`)
  a.setAttribute('data-tip', link.tip ?? link.title)
  a.appendChild(doc.createTextNode(id))
  return a
}

/** The linked ID an event came from, if any (the drawing sits in a shadow root, so this reads the path). */
export function linkFromEvent(e: Event): Element | null {
  for (const t of e.composedPath()) {
    if (t instanceof Element && t.localName === 'a' && t.classList.contains(RECORD_LINK_CLASS)) return t
  }
  return null
}
