/**
 * A remark plugin for the Diff review: the sentinels `markPair` puts round changed words become
 * `del` (the before side) or `ins` (the after side) elements. The state runs on across nodes, so a
 * change round a link, a bold run or a record's bare ID marks the whole of it.
 */
import { ELLIPSIS, MARK_ANY, MARK_CLOSE, MARK_OPEN } from '../../shared/proseDiff.ts'

interface MdNode {
  type: string
  value?: string
  url?: string
  children?: MdNode[]
  data?: Record<string, unknown>
}

const PHRASING = new Set(['text', 'link', 'linkReference', 'emphasis', 'strong', 'delete', 'inlineCode', 'image', 'imageReference', 'break', 'html'])
const SPLIT = new RegExp(`([${MARK_OPEN}${MARK_CLOSE}${ELLIPSIS}])`)
const STRIP = new RegExp(`[${MARK_OPEN}${MARK_CLOSE}${ELLIPSIS}]`, 'g')
const ELLIPSIS_ANY = new RegExp(ELLIPSIS, 'g')
/** Left-out sentences: a small button that opens the whole block (`DiffProse` listens for it). */
const ellipsis = (): MdNode => ({ type: 'emphasis', data: { hName: 'button', hProperties: { className: ['diff-ell'], type: 'button', title: 'Show the whole paragraph' } }, children: [{ type: 'text', value: '…' }] })

const hasMark = (n: MdNode): boolean => (n.value !== undefined && /[\uE000-\uE002]/.test(n.value)) || (n.children ?? []).some(hasMark)

export function remarkDiffMarks(tag: 'del' | 'ins') {
  const mark = (children: MdNode[]): MdNode => ({ type: 'emphasis', data: { hName: tag, hProperties: { className: ['dm'] } }, children })
  return () => (tree: MdNode) => {
    let on = false
    const walk = (node: MdNode) => {
      if (!node.children) return
      node.children = node.children.flatMap((child): MdNode[] => {
        // No sentinel ever stays in an address, whatever the node holds.
        if (child.url !== undefined) child.url = child.url.replace(STRIP, '')
        if (child.type === 'text') {
          const out: MdNode[] = []
          for (const piece of (child.value ?? '').split(SPLIT)) {
            if (piece === MARK_OPEN) on = true
            else if (piece === MARK_CLOSE) on = false
            else if (piece === ELLIPSIS) out.push(ellipsis())
            else if (piece) out.push(on ? mark([{ type: 'text', value: piece }]) : { type: 'text', value: piece })
          }
          return out
        }
        if (child.children) {
          // Sentinels inside, or a block that a mark can't wrap: go in, the state running on.
          if (hasMark(child) || (on && !PHRASING.has(child.type))) {
            walk(child)
            return [child]
          }
          return on ? [mark([child])] : [child]
        }
        // Code, an image, a break: no sentinels kept in them; marked whole while a change is open.
        if (child.value !== undefined) child.value = child.value.replace(MARK_ANY, '').replace(ELLIPSIS_ANY, '…')
        return on && PHRASING.has(child.type) ? [mark([child])] : [child]
      })
    }
    walk(tree)
  }
}
