import { MessageCircleQuestion } from 'lucide-react'
import { useMemo, type MouseEvent, type ReactNode } from 'react'
import Markdown, { type Components } from 'react-markdown'
import { idMentions, isIdHref, isQuestionId } from '../../shared/links.ts'
import type { Item, Question } from '../../shared/types.ts'
import { guarded, useOpen } from '../nav.ts'
import { useIndex, type Index } from '../store.ts'
import { typeClass } from '../vocab.ts'
import { TypeIcon } from './bits.tsx'

/** Markdown text, with links to other records (explicit `[text](ID)` or a bare ID) opening that record's sheet. */
export function Prose({ text, small }: { text: string; small?: boolean }) {
  const index = useIndex()
  const plugins = useMemo(() => [remarkRecordIds(index)], [index])
  const components = useMemo(() => recordLinkComponents(index), [index])
  return (
    <div className={`prose${small ? ' small' : ''}`}>
      <Markdown remarkPlugins={plugins} components={components}>
        {text}
      </Markdown>
    </div>
  )
}

/** The little of the Markdown tree (mdast) the plugin touches. */
interface MdNode {
  type: string
  value?: string
  url?: string
  children?: MdNode[]
  data?: { hProperties?: Record<string, string> }
}

/** Nodes whose text is never a bare ID: code, and a link's own words. */
const OPAQUE = new Set(['link', 'linkReference', 'definition', 'code', 'inlineCode', 'html'])

const recordOf = (index: Index, id: string): Item | Question | undefined => (isQuestionId(id) ? index.questions.find((q) => q.id === id) : index.byId.get(id))

/**
 * A remark plugin: every bare record ID in running text becomes a link to that record, marked
 * `data-bare` so it renders as the record's name. A parenthesised title right after the ID
 * ("the former US-01.3.4 (AM and PM can differ)") is the same name, so it is folded in.
 */
function remarkRecordIds(index: Index) {
  const split = (value: string): MdNode[] => {
    const out: MdNode[] = []
    let at = 0
    const re = idMentions()
    for (let m = re.exec(value); m; m = re.exec(value)) {
      const id = m[0]
      let end = m.index + id.length
      const title = recordOf(index, id)?.title.trim()
      const paren = title ? /^\s*\(([^)]*)\)/.exec(value.slice(end)) : null
      if (paren && paren[1]!.trim().toLowerCase() === title!.toLowerCase()) end += paren[0].length
      if (m.index > at) out.push({ type: 'text', value: value.slice(at, m.index) })
      out.push({ type: 'link', url: id, data: { hProperties: { 'data-bare': 'true' } }, children: [{ type: 'text', value: id }] })
      at = re.lastIndex = end
    }
    if (at < value.length) out.push({ type: 'text', value: value.slice(at) })
    return out
  }
  const walk = (node: MdNode) => {
    if (!node.children || OPAQUE.has(node.type)) return
    node.children = node.children.flatMap((c) => {
      if (c.type === 'text' && c.value) return split(c.value)
      walk(c)
      return [c]
    })
  }
  return () => (tree: MdNode) => walk(tree)
}

/** Links in Markdown: a record ID opens that record's sheet; anything else is an ordinary link, in a new tab. */
function recordLinkComponents(index: Index): Components {
  return {
    a: ({ href = '', children, node }) => {
      if (!isIdHref(href)) {
        return (
          <a href={href} target="_blank" rel="noreferrer">
            {children}
          </a>
        )
      }
      // hProperties reach the hast node as written, so the key stays `data-bare`.
      const bare = node?.properties?.['data-bare'] === 'true'
      return <RecordLink id={href.trim()} index={index} bare={bare} text={children} />
    },
  }
}

function RecordLink({ id, index, bare, text }: { id: string; index: Index; bare: boolean; text: ReactNode }) {
  const open = useOpen()
  const rec = recordOf(index, id)
  if (!rec) {
    return (
      <span className="record-link missing" title={`${id} is not in the catalogue`}>
        {text}
      </span>
    )
  }
  const question = isQuestionId(id)
  const status = rec.status
  const go = (e: MouseEvent) => {
    // A modified click opens the link in a new tab, as any link would.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    guarded(() => (question ? open.question(id) : open.item(id)))
  }
  const cls = ['record-link', bare ? 'bare' : '', bare && !question ? typeClass((rec as Item).type) : '', status === 'Retired' ? 'retired' : ''].filter(Boolean).join(' ')
  return (
    <a className={cls} href={`#/board?${question ? 'question' : 'item'}=${encodeURIComponent(id)}`} onClick={go} title={bare ? `${id} · ${status}` : `${rec.title} · ${status}`}>
      {bare ? (
        <>
          {question ? <MessageCircleQuestion size={13} className="record-link-icon" aria-hidden /> : <TypeIcon type={(rec as Item).type} size={12} />}
          {rec.title}
        </>
      ) : (
        text
      )}
    </a>
  )
}
