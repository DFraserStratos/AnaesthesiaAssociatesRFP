/**
 * Responding from a snapshot's sheets: the reader's own responses about the record, the form that writes
 * one (an answer, a comment, or a suggested edit to a card's text) and the buttons that open it. Each
 * sheet holds which form is open (`useRespond`) and shows `RespondSection` in its body and
 * `RespondButtons` in its foot. A response is kept the moment it is saved; nothing reaches the catalogue.
 */
import { MessageSquarePlus, MessageSquareReply, PencilLine, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { MarkdownTextarea } from '../components/MarkdownTextarea.tsx'
import { Prose } from '../components/Prose.tsx'
import { dateTimeLabel } from '../dates.ts'
import { EDIT_FIELD_LABELS, EDIT_FIELDS, changedFields, kindLabel, type EditField, type ReaderResponse, type ResponseKind, type ResponseTarget } from './model.ts'
import { newResponseId, useResponses, useResponsesFor } from './store.ts'

/** The form open on a sheet: a new response of a kind, or one of the reader's own to change. */
export type Responding = { kind: ResponseKind; existing?: ReaderResponse } | null

export function useRespond() {
  return useState<Responding>(null)
}

/** A card's text as a suggested edit starts from. */
export type CardText = Record<EditField, string>

export function RespondSection({ target, responding, setResponding, card }: { target: ResponseTarget; responding: Responding; setResponding: (r: Responding) => void; card?: CardText }) {
  const mine = useResponsesFor(target.type, target.id)
  const remove = useResponses((s) => s.remove)
  if (!mine.length && !responding) return null
  return (
    <section className="section respond-section" aria-label="Your responses">
      {mine.length > 0 && (
        <>
          <h3 className="section-head">
            Your responses <span className="count">{mine.length}</span>
          </h3>
          <div className="respond-list">
            {mine.map((r) =>
              responding?.existing?.id === r.id ? null : (
                <div key={r.id} className="respond-item">
                  <div className="respond-item-head">
                    <strong>{kindLabel(r.kind)}</strong>
                    {r.target.spot && <span>· {r.target.spotName || r.target.spot}</span>}
                    <span className="respond-when">{dateTimeLabel(r.at)}</span>
                    <span className="spacer" />
                    <button className="btn sm ghost" onClick={() => setResponding({ kind: r.kind, existing: r })}>
                      Change
                    </button>
                    <button className="btn sm ghost danger" onClick={() => remove(r.id)} aria-label="Remove this response" title="Remove this response">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {r.text.trim() && <Prose text={r.text} />}
                  {r.edits.map((e) => (
                    <div key={e.field} className="respond-edit">
                      <span className="respond-edit-label">{EDIT_FIELD_LABELS[e.field]}</span>
                      <Prose text={e.after || '_(empty)_'} />
                    </div>
                  ))}
                </div>
              ),
            )}
          </div>
        </>
      )}
      {responding && <RespondForm key={responding.existing?.id ?? responding.kind} target={target} responding={responding} card={card} onDone={() => setResponding(null)} />}
    </section>
  )
}

const PROMPT: Record<ResponseKind, { title: string; help: string; placeholder: string }> = {
  answer: { title: 'Your answer', help: 'What you would decide, and why. It is kept in this browser until you download your responses.', placeholder: 'Your answer' },
  comment: { title: 'Your comment', help: 'A question, a correction or anything this misses. It is kept in this browser until you download your responses.', placeholder: 'Your comment' },
  edit: { title: 'Suggest an edit', help: 'Change the text as you would have it. Only what you change is sent, beside the text as it is now.', placeholder: 'Why (optional)' },
}

function RespondForm({ target, responding, card, onDone }: { target: ResponseTarget; responding: NonNullable<Responding>; card?: CardText; onDone: () => void }) {
  const put = useResponses((s) => s.put)
  const { kind, existing } = responding
  const [text, setText] = useState(existing?.text ?? '')
  const start: CardText = card ?? { title: '', description: '', acceptance: '' }
  const [draft, setDraft] = useState<CardText>(() => {
    const d = { ...start }
    for (const e of existing?.edits ?? []) d[e.field] = e.after
    return d
  })
  const first = useRef<HTMLTextAreaElement & HTMLInputElement>(null)
  useEffect(() => {
    first.current?.focus({ preventScroll: false })
  }, [])
  const edits = kind === 'edit' ? changedFields(start, draft) : []
  const empty = !text.trim() && !edits.length
  const save = () => {
    if (empty) return
    put({ id: existing?.id ?? newResponseId(), kind, target, text, edits })
    onDone()
  }
  // The form's own keys stay in it: Esc closes the form (not the sheet), Cmd+Enter saves.
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      e.preventDefault()
      onDone()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      save()
    }
  }
  const p = PROMPT[kind]
  return (
    <div className="respond-box" onKeyDown={onKeyDown}>
      <h4>
        {p.title}
        {target.spot && <span className="respond-spot"> · {target.spotName || target.spot}</span>}
      </h4>
      <p>{p.help}</p>
      {kind === 'edit' &&
        EDIT_FIELDS.map((f, i) => (
          <label key={f} className="field">
            <span>
              {EDIT_FIELD_LABELS[f]}
              {draft[f] !== start[f] && <em className="respond-changed"> · changed</em>}
            </span>
            {f === 'title' ? (
              <input ref={i === 0 ? first : undefined} className="input" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
            ) : (
              <MarkdownTextarea className="textarea" rows={f === 'description' ? 5 : 4} value={draft[f]} onChange={(e) => setDraft((d) => ({ ...d, [f]: e.target.value }))} />
            )}
          </label>
        ))}
      <label className="field">
        {kind === 'edit' && <span>Why (optional)</span>}
        <MarkdownTextarea ref={kind === 'edit' ? undefined : first} className="textarea" rows={kind === 'edit' ? 2 : 4} value={text} placeholder={p.placeholder} aria-label={p.title} onChange={(e) => setText(e.target.value)} />
      </label>
      <div className="respond-actions">
        <button className="btn ghost" onClick={onDone}>
          Cancel
        </button>
        <button className="btn primary" onClick={save} disabled={empty} title={empty ? (kind === 'edit' ? 'Change some text first' : 'Write something first') : 'Keep this response (Cmd+Enter)'}>
          {existing ? 'Save changes' : 'Keep response'}
        </button>
      </div>
    </div>
  )
}

/**
 * The foot's buttons for a snapshot reader. An outstanding item takes one answer (changed in place once
 * written); one already answered takes comments. Cards take comments and suggested edits; artifacts comments.
 */
export function RespondButtons({ target, answered = false, setResponding }: { target: ResponseTarget; answered?: boolean; setResponding: (r: Responding) => void }) {
  const mine = useResponsesFor(target.type, target.id)
  if (target.type === 'question' && !answered) {
    const answer = mine.find((r) => r.kind === 'answer')
    return (
      <button className="btn primary" onClick={() => setResponding({ kind: 'answer', existing: answer })}>
        <MessageSquareReply size={15} /> {answer ? 'Change your answer' : 'Answer'}
      </button>
    )
  }
  return (
    <>
      {target.type === 'item' && (
        <button className="btn" onClick={() => setResponding({ kind: 'edit' })}>
          <PencilLine size={15} /> Suggest an edit
        </button>
      )}
      <button className="btn primary" onClick={() => setResponding({ kind: 'comment' })}>
        <MessageSquarePlus size={15} /> Comment
      </button>
    </>
  )
}
