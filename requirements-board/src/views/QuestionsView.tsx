import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useOpen } from '../nav.ts'
import { useCatalogue, useIndex } from '../store.ts'
import { QUESTION_GROUP_LABEL, QUESTION_GROUP_ORDER, statusClass, typeClass } from '../vocab.ts'
import { Highlight, TypeIcon } from '../components/bits.tsx'

export function QuestionsView() {
  const index = useIndex()
  const open = useOpen()
  const createQuestion = useCatalogue((s) => s.createQuestion)
  const [owner, setOwner] = useState('')
  const [query, setQuery] = useState('')
  const [showAnswered, setShowAnswered] = useState(true)

  const owners = useMemo(() => [...new Set(index.questions.map((q) => q.owner).filter(Boolean))].sort(), [index])
  const shown = index.questions.filter((q) => {
    if (owner && q.owner !== owner) return false
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const hay = `${q.id} ${q.title} ${q.question} ${q.answer} ${q.affects.join(' ')}`.toLowerCase()
    return words.every((w) => hay.includes(w))
  })
  const groups = QUESTION_GROUP_ORDER.filter((s) => showAnswered || s !== 'Answered')
    .map((status) => ({ status, list: shown.filter((q) => q.status === status) }))
    .filter((g) => g.list.length)

  // Ask for a title first so a click never leaves a blank placeholder question on disk.
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const add = async () => {
    if (busy || !newTitle.trim()) return
    setBusy(true)
    setAddError(null)
    try {
      const rec = await createQuestion({ title: newTitle.trim(), status: 'Open' })
      setAdding(false)
      setNewTitle('')
      open.question(rec.data.id, { edit: true })
    } catch (e) {
      setAddError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-head">
          <div>
            <h1>Open questions</h1>
            <p>Questions that block or shape requirements, and the items each one touches.</p>
          </div>
          <span style={{ flex: 1 }} />
          {!adding && (
            <button className="btn primary" onClick={() => setAdding(true)}>
              <Plus size={15} /> New question
            </button>
          )}
        </div>
        {adding && (
          <form
            className="field"
            style={{ flexDirection: 'row', gap: 8 }}
            onSubmit={(e) => {
              e.preventDefault()
              void add()
            }}
          >
            <input
              className="input"
              autoFocus
              aria-label="New question title"
              placeholder="Short title for the new question"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setAdding(false)
              }}
            />
            <button className="btn primary" type="submit" disabled={!newTitle.trim() || busy}>
              {busy ? 'Adding…' : 'Add question'}
            </button>
            <button className="btn ghost" type="button" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </form>
        )}
        {addError && <div className="banner error" style={{ margin: '0 0 12px' }}>{addError}</div>}
        <div className="page-tools">
          <label className="search">
            <Search size={15} />
            <span className="sr-only">Search questions</span>
            <input className="input" placeholder="Search questions" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <select className="select" value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Owner">
            <option value="">All owners</option>
            {owners.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <button className="btn" aria-pressed={showAnswered} onClick={() => setShowAnswered((v) => !v)}>
            Show answered
          </button>
        </div>
        {groups.length === 0 && <p className="empty">No questions match.</p>}
        {groups.map(({ status, list }) => (
          <section key={status} className="group">
            <h2 className="group-head">
              {QUESTION_GROUP_LABEL[status]} <span className="mono">{list.length}</span>
            </h2>
            <div className="sheet-list">
              {list.map((q) => (
                <div
                  key={q.id}
                  role="button"
                  tabIndex={0}
                  className={`q-row ${statusClass(q.status)}`}
                  onClick={() => open.question(q.id)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return // a chip inside the row handles its own keys
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      open.question(q.id)
                    }
                  }}
                >
                  <span className="mono">{q.id}</span>
                  <span className="q-title">
                    <Highlight text={q.title} query={query} />
                  </span>
                  <span className="q-owner">{q.owner}</span>
                  <span className="q-text">
                    <Highlight text={q.question} query={query} />
                  </span>
                  <span className="q-chips">
                    {q.affects.map((a) => {
                      const it = index.byId.get(a)
                      return (
                        <button
                          key={a}
                          className={`chip item ${it ? typeClass(it.type) : ''}`}
                          title={it ? `${it.id} · ${it.title}` : `Missing item ${a}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            open.item(a)
                          }}
                        >
                          {it && <TypeIcon type={it.type} size={12} />}
                          <span>{it?.title ?? a}</span>
                        </button>
                      )
                    })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
