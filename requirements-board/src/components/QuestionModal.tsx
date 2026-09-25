import { CheckCircle2, Map as MapIcon, MessageSquareReply, Pencil, X } from 'lucide-react'
import { useMemo, useRef, useState, type RefObject } from 'react'
import { tidyText } from '../../shared/files.ts'
import { QUESTION_KINDS, QUESTION_STATUSES, type Item, type Question } from '../../shared/types.ts'
import { useEditOnOpen, useOpen } from '../nav.ts'
import { useCatalogue, useIndex, type Index } from '../store.ts'
import { KIND_HELP, KIND_LABEL, statusClass } from '../vocab.ts'
import { ItemName, Prose, StatusLabel } from './bits.tsx'
import { EditActions, EditBanners, OrphanedDraft, discardConfirm } from './EditChrome.tsx'
import { AffectsPicker } from './ItemPicker.tsx'
import { Sheet } from './Sheet.tsx'
import { useEditableRecord } from './useEditableRecord.ts'

/** Markdown fields go through `tidyText`, like a file read, so a leading code-block indent survives a save. */
const normalise = (q: Question): Question => ({
  ...q,
  title: q.title.trim(),
  question: tidyText(q.question),
  answer: tidyText(q.answer),
  sources: q.sources.map((s) => s.trim()).filter(Boolean),
})

export function QuestionModal({ id }: { id: string }) {
  const rec = useCatalogue((s) => s.questions[id])
  const saveQuestion = useCatalogue((s) => s.saveQuestion)
  const adoptQuestion = useCatalogue((s) => s.adoptQuestion)
  const index = useIndex()
  const open = useOpen()
  /** Items to offer flipping Open to Confirmed after the question is answered. */
  const [flipOffer, setFlipOffer] = useState<Item[] | null>(null)
  const ed = useEditableRecord<Question>({
    key: `question:${id}`,
    rec,
    save: saveQuestion,
    adopt: adoptQuestion,
    normalise,
    startEditing: useEditOnOpen(id),
    // However the save came (button or Cmd+S), answering it offers to settle the items it affects.
    onSaved: (next, before) => {
      if (before.data.status === 'Answered' || next.data.status !== 'Answered') return
      const openItems = next.data.affects.map((a) => index.byId.get(a)).filter((it): it is Item => !!it && it.status === 'Open')
      if (openItems.length) setFlipOffer(openItems)
    },
  })
  const answerRef = useRef<HTMLTextAreaElement>(null)

  const startEdit = (answering = false) => {
    ed.startEdit(answering ? (d) => ({ ...d, status: 'Answered' }) : undefined)
    if (answering) setTimeout(() => answerRef.current?.focus(), 30)
  }

  if (ed.orphaned && ed.draft) {
    const d = ed.draft
    return (
      <OrphanedDraft
        ed={ed}
        id={id}
        noun="Question"
        onClose={open.close}
        fields={[
          { label: 'Title', text: d.title },
          { label: 'Question', text: d.question },
          { label: 'Answer', text: d.answer },
          { label: 'Sources', text: d.sources.join('\n') },
        ]}
      />
    )
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

  return (
    <Sheet onClose={() => ed.leave(open.close)} onKey={ed.onKey} label={`${q.id} ${q.title}`} statusClass={statusClass(q.status)} confirm={discardConfirm(ed, rec.data.title)}>
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
      <EditBanners ed={ed} noun="question" />
      <div className="sheet-body">
        {ed.editing ? <EditForm draft={ed.draft} set={set} index={index} answerRef={answerRef} /> : <ReadView q={q} index={index} />}
        {flipOffer && !ed.editing && <FlipOffer items={flipOffer} question={q} onDone={() => setFlipOffer(null)} />}
      </div>
      <footer className="sheet-foot">
        {ed.editing ? (
          <EditActions ed={ed} />
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
        <CheckCircle2 size={15} style={{ verticalAlign: -2, color: 'var(--st-confirmed)' }} /> {question.title} is answered
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
          <ItemName item={it} />
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
