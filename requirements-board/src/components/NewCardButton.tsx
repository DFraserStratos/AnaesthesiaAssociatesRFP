import { MessageCircleQuestion, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ITEM_TYPES, QUESTION_KINDS, type Item, type ItemType, type QuestionKind } from '../../shared/types.ts'
import { guarded, useOpen } from '../nav.ts'
import { ancestorsOf, useCatalogue, useIndex, type Index } from '../store.ts'
import { KIND_HELP, KIND_LABEL, TYPE_LABEL, typeClass } from '../vocab.ts'
import { TypeIcon } from './bits.tsx'
import { AffectsPicker, PARENT_TYPES, ParentPicker } from './ItemPicker.tsx'

type CardKind = ItemType | 'question'
const KINDS: readonly CardKind[] = [...ITEM_TYPES, 'question']
const KIND_NAME: Record<CardKind, string> = { ...TYPE_LABEL, question: 'Outstanding item' }

interface Draft {
  kind: CardKind
  title: string
  parent: string | null
  questionKind: QuestionKind
  affects: string[]
}

/** A parent that suits `kind`, keeping the one picked where it fits, else the nearest ancestor that does. */
function fitParent(index: Index, kind: CardKind, parent: string | null): string | null {
  if (kind === 'epic' || kind === 'question' || !parent) return null
  const allowed = PARENT_TYPES[kind]
  const it = index.byId.get(parent)
  if (!it) return null
  if (allowed.includes(it.type)) return it.id
  return [...ancestorsOf(index, it.id)].reverse().find((a) => allowed.includes(a.type))?.id ?? null
}

/** Start from where the person is: the open card's natural child, or an outstanding item on that page. */
function startingDraft(index: Index, openId: string | null, onQuestions: boolean): Draft {
  const open: Item | undefined = openId ? index.byId.get(openId) : undefined
  const base = { title: '', questionKind: 'question' as const, affects: open ? [open.id] : [] }
  if (onQuestions) return { ...base, kind: 'question', parent: null }
  if (!open) return { ...base, kind: 'story', parent: null }
  if (open.type === 'epic') return { ...base, kind: 'feature', parent: open.id }
  if (open.type === 'feature') return { ...base, kind: 'story', parent: open.id }
  return { ...base, kind: 'story', parent: open.parent }
}

/**
 * The one way to make any card: a round plus, bottom right. It asks only for
 * what the file needs to exist (type, title, where it sits), writes it, then
 * opens the new card in its edit form for everything else.
 */
export function NewCardButton() {
  const index = useIndex()
  const open = useOpen()
  const onBoard = useLocation().pathname === '/board'
  const onQuestions = useLocation().pathname === '/questions'
  const [draft, setDraft] = useState<Draft | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const start = () => setDraft(startingDraft(index, open.params.get('item'), onQuestions))
  const startRef = useRef(start)
  startRef.current = start

  // `n` opens it, the same way `/` finds: never while typing, or with a modal sheet or screenshot on top.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'n' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target instanceof HTMLElement ? e.target : null
      if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return
      if (document.querySelector('.scrim, .lightbox, .new-card-pop')) return
      e.preventDefault()
      startRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // A click elsewhere puts it away, unless a title has been typed.
  useEffect(() => {
    if (!draft) return
    const onDown = (e: PointerEvent) => {
      if (!draft.title.trim() && e.target instanceof Node && !rootRef.current?.contains(e.target)) setDraft(null)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [draft])

  // Not over a modal sheet: the scrim covers the page and the sheet owns the keyboard.
  const modalOpen = open.params.has('question') || (!onBoard && open.params.has('item'))

  return (
    <div className="new-card" ref={rootRef} hidden={modalOpen && !draft}>
      {draft && <NewCardPop draft={draft} setDraft={setDraft} onClose={() => setDraft(null)} index={index} />}
      <button className="btn primary fab" aria-label="New card" title="New card · N" aria-expanded={!!draft} onClick={() => (draft ? setDraft(null) : start())}>
        <Plus size={22} strokeWidth={2.25} />
      </button>
    </div>
  )
}

function NewCardPop({ draft, setDraft, onClose, index }: { draft: Draft; setDraft: (d: Draft) => void; onClose: () => void; index: Index }) {
  const open = useOpen()
  const createItem = useCatalogue((s) => s.createItem)
  const createQuestion = useCatalogue((s) => s.createQuestion)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (patch: Partial<Draft>) => {
    setDraft({ ...draft, ...patch })
    setError(null)
  }
  const needsParent = draft.kind === 'feature' || draft.kind === 'story'
  const ready = !!draft.title.trim() && (!needsParent || !!draft.parent) && !busy

  const create = async () => {
    setBusy(true)
    try {
      const title = draft.title.trim()
      if (draft.kind === 'question') {
        const rec = await createQuestion({ kind: draft.questionKind, title, status: 'Open', affects: draft.affects })
        onClose()
        open.question(rec.data.id, { edit: true })
      } else {
        const rec = await createItem({ type: draft.kind, parent: needsParent ? draft.parent : null, title, status: 'Proposed' })
        onClose()
        open.item(rec.data.id, { edit: true })
      }
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }
  // An item replaces the card docked on the board, so its unsaved edits get their say first. Nothing is written until they do.
  const submit = () => {
    if (!ready) return
    if (draft.kind === 'question') void create()
    else guarded(() => void create())
  }

  return (
    <form
      className="popover new-card-pop"
      role="dialog"
      aria-label="New card"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          onClose()
        }
      }}
    >
      <h4>New card</h4>
      <div className="type-switch" role="radiogroup" aria-label="Type">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={draft.kind === k}
            className={k === 'question' ? 'ty-question' : typeClass(k)}
            onClick={() => set({ kind: k, parent: fitParent(index, k, draft.parent) })}
          >
            {k === 'question' ? <MessageCircleQuestion size={14} /> : <TypeIcon type={k} />}
            {KIND_NAME[k]}
          </button>
        ))}
      </div>
      <label className="field">
        <span>Title</span>
        <input className="input" autoFocus value={draft.title} placeholder={draft.kind === 'question' ? 'What needs settling' : `${KIND_NAME[draft.kind]} title`} onChange={(e) => set({ title: e.target.value })} />
      </label>
      {needsParent && (
        <div className="field">
          <span>{draft.kind === 'feature' ? 'Epic' : 'Feature or epic'}</span>
          <ParentPicker key={draft.kind} type={draft.kind as ItemType} value={draft.parent} index={index} onPick={(parent) => set({ parent })} />
        </div>
      )}
      {draft.kind === 'question' && (
        <>
          <div className="field">
            <span>Kind</span>
            <div className="chip-row">
              {QUESTION_KINDS.map((k) => (
                <button key={k} type="button" className="chip toggle" aria-pressed={draft.questionKind === k} title={KIND_HELP[k]} onClick={() => set({ questionKind: k })}>
                  {KIND_LABEL[k]}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span>Affects · optional</span>
            <AffectsPicker value={draft.affects} index={index} onChange={(affects) => set({ affects })} />
          </div>
        </>
      )}
      {error && <div className="banner error">{error}</div>}
      <div className="ask-actions">
        <button className="btn primary" type="submit" disabled={!ready}>
          {busy ? 'Creating…' : `Create ${draft.kind === 'question' ? 'outstanding item' : KIND_NAME[draft.kind].toLowerCase()}`}
        </button>
        <button className="btn ghost" type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  )
}
