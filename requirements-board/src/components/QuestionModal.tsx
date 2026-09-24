import { CheckCircle2, Map as MapIcon, MessageSquareReply, Pencil, X } from 'lucide-react'
import { useId, useMemo, useRef, useState, type RefObject } from 'react'
import { compareIds } from '../../shared/ids.ts'
import { QUESTION_KINDS, QUESTION_STATUSES, type Item, type Question } from '../../shared/types.ts'
import { useOpen } from '../nav.ts'
import { useCatalogue, useIndex, type Index } from '../store.ts'
import { KIND_HELP, KIND_LABEL, statusClass, typeClass } from '../vocab.ts'
import { ItemName, Prose, StatusLabel, TypeIcon } from './bits.tsx'
import { Sheet, type SheetConfirm } from './Sheet.tsx'
import { useEditableRecord } from './useEditableRecord.ts'

const normalise = (q: Question): Question => ({
  ...q,
  title: q.title.trim(),
  question: q.question.trim(),
  answer: q.answer.trim(),
  sources: q.sources.map((s) => s.trim()).filter(Boolean),
})

export function QuestionModal({ id }: { id: string }) {
  const rec = useCatalogue((s) => s.questions[id])
  const saveQuestion = useCatalogue((s) => s.saveQuestion)
  const adoptQuestion = useCatalogue((s) => s.adoptQuestion)
  const index = useIndex()
  const open = useOpen()
  const ed = useEditableRecord<Question>({
    key: `question:${id}`,
    rec,
    save: saveQuestion,
    adopt: adoptQuestion,
    normalise,
    startEditing: open.params.get('edit') === '1',
  })
  /** Items to offer flipping Open to Confirmed after the question is answered. */
  const [flipOffer, setFlipOffer] = useState<Item[] | null>(null)
  const answerRef = useRef<HTMLTextAreaElement>(null)

  const startEdit = (answering = false) => {
    ed.startEdit(answering ? (d) => ({ ...d, status: 'Answered' }) : undefined)
    if (answering) setTimeout(() => answerRef.current?.focus(), 30)
  }
  const save = async () => {
    const wasAnswered = ed.base?.data.status === 'Answered'
    const next = await ed.save()
    if (next && !wasAnswered && next.data.status === 'Answered') {
      const openItems = next.data.affects.map((a) => index.byId.get(a)).filter((it): it is Item => !!it && it.status === 'Open')
      if (openItems.length) setFlipOffer(openItems)
    }
  }
  const saveRef = useRef(save)
  saveRef.current = save
  const onKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      if (ed.editing) void saveRef.current()
      return true
    }
    return ed.onKey(e)
  }

  if (!rec || !ed.draft) {
    return (
      <Sheet onClose={open.close} label="Question not found">
        <div className="sheet-body">
          <h2>{id} is not in the catalogue</h2>
        </div>
      </Sheet>
    )
  }
  const q = ed.editing ? ed.draft : rec.data
  const set = (patch: Partial<Question>) => ed.setDraft((d) => (d ? { ...d, ...patch } : d))

  const confirm: SheetConfirm | null = ed.discardAsk
    ? {
        title: 'Discard your changes?',
        body: `Your unsaved edits to ${rec.data.title} will be lost.`,
        cancelLabel: 'Keep editing',
        confirmLabel: 'Discard changes',
        onCancel: ed.discardAsk.cancel,
        onConfirm: ed.discardAsk.confirm,
      }
    : null

  return (
    <Sheet onClose={() => ed.leave(open.close)} onKey={onKey} label={`${q.id} ${q.title}`} statusClass={statusClass(q.status)} confirm={confirm}>
      <div className="sheet-head">
        <nav className="crumbs">
          <button className="crumb" onClick={() => ed.leave(open.close)}>
            Outstanding items
          </button>
        </nav>
        <span className="spacer" />
        <button className="btn icon ghost" onClick={() => ed.leave(open.close)} aria-label="Close">
          <X size={18} />
        </button>
      </div>
      {ed.restored && ed.editing && !ed.conflict && (
        <div className="banner" role="status">
          <span>Restored the unsaved edits you left here.</span>
        </div>
      )}
      {ed.conflict && (
        <div className="banner" role="alert">
          <span>This question changed on disk while you were editing.</span>
          <span className="spacer" />
          <button className="btn sm" onClick={ed.keepMine}>
            Keep mine
          </button>
          <button className="btn sm" onClick={ed.loadTheirs}>
            Load theirs
          </button>
        </div>
      )}
      {ed.error && <div className="banner error">{ed.error}</div>}
      <div className="sheet-body">
        {ed.editing ? <EditForm draft={ed.draft} set={set} index={index} answerRef={answerRef} /> : <ReadView q={q} index={index} />}
        {flipOffer && !ed.editing && <FlipOffer items={flipOffer} question={q} onDone={() => setFlipOffer(null)} />}
      </div>
      <footer className="sheet-foot">
        {ed.editing ? (
          <>
            <span className="hint">
              <kbd>⌘</kbd>
              <kbd>S</kbd> save · <kbd>Esc</kbd> cancel
            </span>
            <span className="spacer" />
            <button className="btn ghost" onClick={ed.cancelEdit}>
              Cancel
            </button>
            <button className="btn primary" onClick={() => void save()} disabled={!ed.dirty || ed.saving}>
              {ed.saving ? 'Saving…' : 'Save'}
            </button>
          </>
        ) : (
          <>
            <span className="spacer" />
            <button className="btn" onClick={() => startEdit()}>
              <Pencil size={15} /> Edit
            </button>
            {q.status !== 'Answered' && (
              <button className="btn primary" onClick={() => startEdit(true)}>
                <MessageSquareReply size={15} /> Answer
              </button>
            )}
          </>
        )}
      </footer>
    </Sheet>
  )
}

function ReadView({ q, index }: { q: Question; index: Index }) {
  const open = useOpen()
  return (
    <>
      <div className="sheet-id">
        <span className="mono">{q.id}</span>
        <span title={KIND_HELP[q.kind]}>{KIND_LABEL[q.kind]}</span>
      </div>
      <h2>{q.title}</h2>
      <div className="meta-row">
        <StatusLabel status={q.status} />
        {q.owner && <span className="chip">Owner · {q.owner}</span>}
      </div>
      <Prose text={q.question} />
      {q.answer && (
        <section className="section">
          <h3 className="section-head">Answer</h3>
          <div className="notes">
            <Prose text={q.answer} />
          </div>
        </section>
      )}
      <section className="section">
        <h3 className="section-head">
          Affects <span className="count">{q.affects.length}</span>
        </h3>
        <div className="link-list">
          {q.affects.map((a) => {
            const it = index.byId.get(a)
            return (
              <div key={a} className="link-row" style={{ gridTemplateColumns: '1fr auto auto' }}>
                <button className="btn ghost" style={{ justifyContent: 'flex-start', height: 'auto', padding: '2px 4px', whiteSpace: 'normal', textAlign: 'left', minWidth: 0 }} onClick={() => open.item(a)} disabled={!it}>
                  {it ? <ItemName item={it} /> : `Missing item ${a}`}
                </button>
                {it && <StatusLabel status={it.status} />}
                {it && (
                  <button className="btn sm ghost" onClick={() => open.showOnBoard(a)} title="Show on board">
                    <MapIcon size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>
      {q.sources.length > 0 && (
        <section className="section">
          <h3 className="section-head">Sources</h3>
          <div className="sources">
            {q.sources.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function FlipOffer({ items, question, onDone }: { items: Item[]; question: Question; onDone: () => void }) {
  const saveItem = useCatalogue((s) => s.saveItem)
  const records = useCatalogue((s) => s.items)
  const [picked, setPicked] = useState(() => new Set(items.map((i) => i.id)))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const apply = async () => {
    setBusy(true)
    try {
      for (const id of picked) {
        const rec = records[id]
        if (rec && rec.data.status === 'Open') await saveItem({ ...rec.data, status: 'Confirmed' }, rec.rev)
      }
      onDone()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="answer-flow" role="region" aria-label="Update affected items">
      <h4>
        <CheckCircle2 size={15} style={{ verticalAlign: -2, color: 'var(--st-confirmed)' }} /> {question.id} is answered
      </h4>
      <p>These affected items are still Open. Flip the ones the answer settles to Confirmed?</p>
      {items.map((it) => (
        <label key={it.id} className="check-row">
          <input
            type="checkbox"
            checked={picked.has(it.id)}
            onChange={(e) => {
              const next = new Set(picked)
              if (e.target.checked) next.add(it.id)
              else next.delete(it.id)
              setPicked(next)
            }}
          />
          <span className="mono">{it.id}</span>
          <span>{it.title}</span>
        </label>
      ))}
      {error && <div className="banner error" style={{ margin: '8px 0' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="btn primary" onClick={() => void apply()} disabled={busy || picked.size === 0}>
          Flip {picked.size} to Confirmed
        </button>
        <button className="btn ghost" onClick={onDone}>
          Leave them Open
        </button>
      </div>
    </div>
  )
}

function EditForm({ draft, set, index, answerRef }: { draft: Question; set: (p: Partial<Question>) => void; index: Index; answerRef: RefObject<HTMLTextAreaElement> }) {
  const owners = useMemo(() => [...new Set(index.questions.map((q) => q.owner).filter(Boolean))].sort(), [index])
  return (
    <>
      <div className="sheet-id">
        <span className="mono">{draft.id}</span>
        <span>{KIND_LABEL[draft.kind]}</span>
      </div>
      <label className="field" style={{ marginTop: 8 }}>
        <span>Title</span>
        <input className="input title-input" value={draft.title} onChange={(e) => set({ title: e.target.value })} autoFocus={draft.status !== 'Answered'} />
      </label>
      <label className="field">
        <span>Kind</span>
        <select className="select" value={draft.kind} onChange={(e) => set({ kind: e.target.value as Question['kind'] })}>
          {QUESTION_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}
            </option>
          ))}
        </select>
      </label>
      <div className="field-grid">
        <label className="field">
          <span>Status</span>
          <select className="select" value={draft.status} onChange={(e) => set({ status: e.target.value as Question['status'] })}>
            {QUESTION_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Owner</span>
          <input className="input" list="owners" value={draft.owner} onChange={(e) => set({ owner: e.target.value })} />
          <datalist id="owners">
            {owners.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </label>
      </div>
      <label className="field">
        <span>Question · Markdown</span>
        <textarea className="textarea" rows={4} value={draft.question} onChange={(e) => set({ question: e.target.value })} />
      </label>
      <label className="field">
        <span>Answer</span>
        <textarea ref={answerRef} className="textarea" rows={4} value={draft.answer} placeholder="What was decided, by whom, when" onChange={(e) => set({ answer: e.target.value })} />
      </label>
      <div className="field">
        <span>Affects</span>
        <AffectsPicker value={draft.affects} index={index} onChange={(affects) => set({ affects })} />
      </div>
      <label className="field">
        <span>Sources · one per line</span>
        <textarea className="textarea" rows={2} value={draft.sources.join('\n')} onChange={(e) => set({ sources: e.target.value.split('\n') })} />
      </label>
    </>
  )
}

function AffectsPicker({ value, index, onChange }: { value: string[]; index: Index; onChange: (v: string[]) => void }) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return index.items
      .filter((it) => !value.includes(it.id) && `${it.id} ${it.title}`.toLowerCase().includes(q))
      .sort((a, b) => compareIds(a.id, b.id))
      .slice(0, 40)
  }, [query, index, value])
  const add = (id: string) => {
    onChange([...value, id])
    setQuery('')
  }
  return (
    <div className="picker">
      <div className="chip-row" style={{ marginBottom: 6 }}>
        {value.map((a) => {
          const it = index.byId.get(a)
          return (
          <span key={a} className={`chip item ${it ? typeClass(it.type) : ''}`} title={a}>
            {it ? <TypeIcon type={it.type} size={12} /> : null}
            <span>{it?.title ?? a}</span>
            <button type="button" className="x" aria-label={`Remove ${it?.title ?? a}`} onClick={() => onChange(value.filter((x) => x !== a))}>
              <X size={12} />
            </button>
          </span>
          )
        })}
      </div>
      <input
        className="input"
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={matches[active] ? `${listId}-${active}` : undefined}
        placeholder="Add an epic, feature or story by ID or title"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((a) => Math.min(a + 1, matches.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((a) => Math.max(a - 1, 0))
          } else if (e.key === 'Enter') {
            e.preventDefault()
            const m = matches[active]
            if (m) add(m.id)
          } else if (e.key === 'Escape' && query) {
            e.stopPropagation()
            setQuery('')
          }
        }}
      />
      {matches.length > 0 && (
        <div className="picker-list" role="listbox" id={listId}>
          {matches.map((m, i) => (
            <button key={m.id} id={`${listId}-${i}`} type="button" role="option" tabIndex={-1} aria-selected={i === active} className={i === active ? 'active' : ''} onClick={() => add(m.id)}>
              <ItemName item={m} />
              <span className="mono">{m.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
