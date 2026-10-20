import { CheckCircle2, ChevronLeft, ChevronRight, Map as MapIcon, MessageSquareReply, Pencil, Trash2, X } from 'lucide-react'
import { useMemo, useRef, useState, type RefObject } from 'react'
import { useLocation } from 'react-router-dom'
import { kindHelpIn } from '../../shared/config.ts'
import { tidyText } from '../../shared/files.ts'
import { isAnswered, isRetired, roleCode, settleTargets, statusClasses, statusHelp, statusLabel, waitingStatus } from '../../shared/statuses.ts'
import { QUESTION_KINDS, type Item, type ItemStatus, type Question, type QuestionStatus, type Rev } from '../../shared/types.ts'
import { ApiError } from '../api.ts'
import { questionWalk, useQuestionFilters } from '../questionWalk.ts'
import { sourceRow, useSourceIndex } from '../sourceRows.ts'
import { useEditOnOpen, useOpen } from '../nav.ts'
import { useCatalogue, useConfig, useIndex, type Index } from '../store.ts'
import { KIND_LABEL } from '../vocab.ts'
import { ArtifactRowsSection } from './ArtifactRows.tsx'
import { CopyLink, ItemName, StatusLabel } from './bits.tsx'
import { EditActions, EditBanners, OrphanedDraft, discardConfirm } from './EditChrome.tsx'
import { ItemsPicker } from './ItemPicker.tsx'
import { MarkdownTextarea } from './MarkdownTextarea.tsx'
import { Prose } from './Prose.tsx'
import { Sheet, type SheetConfirm } from './Sheet.tsx'
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
  const deleteQuestion = useCatalogue((s) => s.deleteQuestion)
  const index = useIndex()
  const config = useConfig()
  const open = useOpen()
  /** Where this question sat in the list when it was opened: answering it doesn't move it for stepping. */
  const [anchorStatus] = useState(() => rec?.data.status)
  /** The items to offer a new status (one of the settle statuses) after the question is answered. */
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
      if (isAnswered(config, before.data) || !isAnswered(config, next.data)) return
      const live = next.data.affects.map((a) => index.byId.get(a)).filter((it): it is Item => !!it && !isRetired(config, it))
      if (live.length) setFlipOffer(live)
    },
  })
  const answerRef = useRef<HTMLTextAreaElement>(null)
  const [askDelete, setAskDelete] = useState(false)
  const remove = async () => {
    if (!rec) return
    setAskDelete(false)
    try {
      await deleteQuestion(id, rec.rev)
      open.close()
    } catch (e) {
      if (e instanceof ApiError && e.current) adoptQuestion(e.current as Rev<Question>)
      ed.setError((e as Error).message)
    }
  }

  const startEdit = (answering = false) => {
    ed.startEdit(answering ? (d) => ({ ...d, status: roleCode(config, 'question', 'answered')! }) : undefined)
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

  const confirm: SheetConfirm | null =
    discardConfirm(ed, rec.data.title) ??
    (askDelete
      ? {
          title: 'Delete this question?',
          body: 'Its file is removed and it drops off every item it affects. Only git can bring it back.',
          cancelLabel: 'Keep it',
          confirmLabel: 'Delete question',
          onCancel: () => setAskDelete(false),
          onConfirm: () => void remove(),
        }
      : null)

  return (
    <Sheet onClose={() => ed.leave(open.close)} onKey={ed.onKey} label={`${q.id} ${q.title}`} statusClass={statusClasses(config, 'question', q.status)} confirm={confirm}>
      <div className="sheet-head">
        <nav className="crumbs">
          <button className="crumb" onClick={() => ed.leave(open.close)}>
            Outstanding items
          </button>
        </nav>
        <span className="spacer" />
        {anchorStatus && <QuestionStepper id={id} anchorStatus={anchorStatus} leave={ed.leave} />}
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
            <button className="btn ghost danger" onClick={() => setAskDelete(true)}>
              <Trash2 size={15} /> Delete
            </button>
            <span className="spacer" />
            <button className="btn" onClick={() => startEdit()}>
              <Pencil size={15} /> Edit
            </button>
            {!isAnswered(config, q) && (
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

/**
 * Previous and next through the Outstanding items list as it is filtered on screen, so answering
 * one leads straight to the next. Only over that list: opened from the board there is no list.
 */
function QuestionStepper({ id, anchorStatus, leave }: { id: string; anchorStatus: QuestionStatus; leave: (go: () => void) => void }) {
  const open = useOpen()
  const index = useIndex()
  const config = useConfig()
  const filters = useQuestionFilters()
  const onList = useLocation().pathname === '/questions'
  const walk = useMemo(() => questionWalk(config, index.questions, filters, { id, status: anchorStatus }), [config, index, filters, id, anchorStatus])
  const at = walk.findIndex((q) => q.id === id)
  if (!onList || at < 0) return null
  const prev = at > 0 ? walk[at - 1] : undefined
  const next = walk[at + 1]
  return (
    <>
      <button className="btn icon ghost" disabled={!prev} onClick={() => prev && leave(() => open.question(prev.id))} title={prev ? `Previous: ${prev.title}` : undefined} aria-label="Previous question">
        <ChevronLeft size={17} />
      </button>
      <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
        {at + 1} of {walk.length}
      </span>
      <button className="btn icon ghost" disabled={!next} onClick={() => next && leave(() => open.question(next.id))} title={next ? `Next: ${next.title}` : undefined} aria-label="Next question">
        <ChevronRight size={17} />
      </button>
    </>
  )
}

function ReadView({ q, index }: { q: Question; index: Index }) {
  const config = useConfig()
  const open = useOpen()
  return (
    <>
      <div className="sheet-id">
        <CopyLink id={q.id} className="mono">
          {q.id}
        </CopyLink>
        <span title={kindHelpIn(config, q.kind)}>{KIND_LABEL[q.kind]}</span>
      </div>
      <h2>{q.title}</h2>
      <div className="meta-row">
        <StatusLabel kind="question" status={q.status} />
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
                {it && <StatusLabel kind="item" status={it.status} />}
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
      <QuestionSources sources={q.sources} />
    </>
  )
}

/** The question's sources, each opening the artifact spot it cites. */
function QuestionSources({ sources }: { sources: string[] }) {
  const index = useSourceIndex()
  const rows = useMemo(() => sources.map((s) => sourceRow(index, s)), [sources, index])
  return <ArtifactRowsSection title="Sources" rows={rows} className="sources-section" />
}

/** Where an answer can take an item: the project's settle statuses (`settle` in board.config.json). The item's own status is the other choice. */
const choicesFor = (targets: ItemStatus[], it: Item): ItemStatus[] => (targets.includes(it.status) ? targets : [it.status, ...targets])

/** "A", "A or B", "A, B or C". */
const orList = (words: string[]) => (words.length < 2 ? (words[0] ?? '') : `${words.slice(0, -1).join(', ')} or ${words.at(-1)}`)

function FlipOffer({ items, question, onDone }: { items: Item[]; question: Question; onDone: () => void }) {
  const config = useConfig()
  const saveItem = useCatalogue((s) => s.saveItem)
  const records = useCatalogue((s) => s.items)
  const targets = settleTargets(config)
  // An item waiting on this answer moves on, but an answer rarely settles a whole item, so it starts at
  // the first settle status (the least final). Any other item keeps its status unless picked.
  const [choice, setChoice] = useState<Record<string, ItemStatus>>(() => Object.fromEntries(items.map((i) => [i.id, i.status === waitingStatus(config) ? targets[0]! : i.status])))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const moving = items.flatMap((it) => {
    const to = choice[it.id] ?? it.status
    return to === it.status ? [] : [{ id: it.id, from: it.status, to }]
  })
  const apply = async () => {
    setBusy(true)
    try {
      for (const { id, from, to } of moving) {
        const rec = records[id]
        // Skip an item whose status changed elsewhere since the offer opened.
        if (rec && rec.data.status === from) await saveItem({ ...rec.data, status: to }, rec.rev)
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
        <CheckCircle2 size={15} style={{ verticalAlign: -2, color: 'var(--tone-green)' }} /> {question.title} is answered
      </h4>
      <p>Where does the answer leave the items it affects? Pick {orList(targets.map((s) => statusLabel(config, 'item', s)))} for each (hover for what each means), or keep its status.</p>
      {items.map((it) => (
        <div key={it.id} className="settle-row">
          <ItemName item={it} />
          <div className="settle-choices" role="group" aria-label={`Status for ${it.title}`}>
            {choicesFor(targets, it).map((s) => (
              <button
                key={s}
                type="button"
                className="status-toggle"
                aria-pressed={choice[it.id] === s}
                title={s === it.status ? `Keep as ${statusLabel(config, 'item', s)}` : statusHelp(config, 'item', s)}
                onClick={() => setChoice((c) => ({ ...c, [it.id]: s }))}
              >
                <StatusLabel kind="item" status={s} />
              </button>
            ))}
          </div>
        </div>
      ))}
      {error && <div className="banner error" style={{ margin: '8px 0' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="btn primary" onClick={() => void apply()} disabled={busy || moving.length === 0}>
          Update {moving.length} {moving.length === 1 ? 'item' : 'items'}
        </button>
        <button className="btn ghost" onClick={onDone}>
          Leave them as they are
        </button>
      </div>
    </div>
  )
}

function EditForm({ draft, set, index, answerRef }: { draft: Question; set: (p: Partial<Question>) => void; index: Index; answerRef: RefObject<HTMLTextAreaElement> }) {
  const owners = useMemo(() => [...new Set(index.questions.map((q) => q.owner).filter(Boolean))].sort(), [index])
  const config = useConfig()
  return (
    <>
      <div className="sheet-id">
        <span className="mono">{draft.id}</span>
        <span>{KIND_LABEL[draft.kind]}</span>
      </div>
      <label className="field" style={{ marginTop: 8 }}>
        <span>Title</span>
        <input className="input title-input" value={draft.title} onChange={(e) => set({ title: e.target.value })} autoFocus={!isAnswered(config, draft)} />
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
            {config.questionStatuses.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
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
        <MarkdownTextarea className="textarea" rows={4} value={draft.question} onChange={(e) => set({ question: e.target.value })} />
      </label>
      <label className="field">
        <span>Answer</span>
        <MarkdownTextarea ref={answerRef} className="textarea" rows={4} value={draft.answer} placeholder="What was decided, by whom, when" onChange={(e) => set({ answer: e.target.value })} />
      </label>
      <div className="field">
        <span>Affects</span>
        <ItemsPicker value={draft.affects} index={index} onChange={(affects) => set({ affects })} />
      </div>
      <label className="field">
        <span>Sources · one per line</span>
        <textarea className="textarea" rows={2} value={draft.sources.join('\n')} onChange={(e) => set({ sources: e.target.value.split('\n') })} />
      </label>
    </>
  )
}
