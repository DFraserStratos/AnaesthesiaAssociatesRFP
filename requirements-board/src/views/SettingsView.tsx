import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  ITEM_ROLES,
  QUESTION_ROLES,
  ROLE_HELP,
  STATUS_CODE,
  nextStatusCode,
  TONES,
  statusListProblems,
  statusesOf,
  type StatusDef,
  type StatusKind,
  type StatusRole,
} from '../../shared/statuses.ts'
import { useCatalogue, useConfig, useIndex } from '../store.ts'

/**
 * The project's settings that live in `board.config.json` and are safe to edit here: the item and
 * question statuses. Files store a status's code, so renaming, rewording, recolouring or
 * reordering a status touches no file; only the config is rewritten.
 */
export function SettingsView() {
  return (
    <div className="page">
      <div className="page-inner settings">
        <div className="page-head">
          <div>
            <h1>Settings</h1>
            <p>What each status is called, what it means and how it looks. Cards store only the number, so renaming a status here changes no card.</p>
          </div>
        </div>
        <StatusSection kind="item" title="Item statuses" />
        <StatusSection kind="question" title="Question statuses" />
      </div>
    </div>
  )
}

/** A row being edited: `fresh` until saved. Its code (the next free number) is fixed from the start. */
type Row = StatusDef & { fresh?: boolean }

const REQUIRED: Record<StatusKind, readonly StatusRole[]> = { item: ['default', 'retired'], question: ['default', 'answered'] }
const ROLE_LABEL: Record<StatusRole, string> = { default: 'Default', waiting: 'Waiting', retired: 'Retired', answered: 'Answered' }

/** The row as the config holds it: no empty fields, no `fresh`. */
function stored({ fresh: _f, ...d }: Row): StatusDef {
  const out: StatusDef = { code: d.code, label: d.label.trim(), help: d.help.trim(), tone: d.tone }
  if (d.heading?.trim()) out.heading = d.heading.trim()
  if (d.role) out.role = d.role
  if (d.settle) out.settle = true
  return out
}

function StatusSection({ kind, title }: { kind: StatusKind; title: string }) {
  const config = useConfig()
  const index = useIndex()
  const saveStatuses = useCatalogue((s) => s.saveStatuses)
  const saved = statusesOf(config, kind)
  const [rows, setRows] = useState<Row[]>(saved)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const list = rows.map(stored)
  const dirty = JSON.stringify(list) !== JSON.stringify(saved)

  // A change to the file on disk shows straight away, unless there are edits here to keep.
  useEffect(() => {
    if (!dirty) setRows(saved)
  }, [saved])

  const usage = useMemo(() => {
    const n = new Map<string, number>()
    for (const r of kind === 'item' ? index.items : index.questions) n.set(r.status, (n.get(r.status) ?? 0) + 1)
    return n
  }, [index, kind])

  const field = kind === 'item' ? 'statuses' : 'questionStatuses'
  const problems = [
    ...rows.flatMap((r) => (!r.label.trim() ? ['Every status needs a label'] : !STATUS_CODE.test(r.code) ? [`"${r.label}" needs a code: a whole number from 1`] : [])),
    ...statusListProblems(list, kind, field).map((p) => p.replace(`${field}: `, '')),
  ]
  const noun = kind === 'item' ? 'card' : 'question'

  const set = (i: number, patch: Partial<Row>) =>
    setRows((rs) => {
      let next = rs.map((r, j) => (j === i ? { ...r, ...patch } : r))
      // A role belongs to one status: giving it to this one takes it from the other.
      if (patch.role) next = next.map((r, j) => (j !== i && r.role === patch.role ? { ...r, role: undefined } : r))
      return next
    })
  const move = (i: number, by: number) =>
    setRows((rs) => {
      const next = [...rs]
      const [r] = next.splice(i, 1)
      next.splice(i + by, 0, r!)
      return next
    })
  // A removed number is never handed out again while this page is open: past the saved list and every row.
  const add = () => setRows((rs) => [...rs, { code: nextStatusCode([...saved, ...rs]), label: '', help: '', tone: 'neutral', fresh: true }])

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await saveStatuses({ [field]: list })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const question = kind === 'question'
  const roles = question ? QUESTION_ROLES : ITEM_ROLES
  return (
    <section className="settings-section" aria-label={title}>
      <h2 className="group-head">
        {title} <span className="mono">{rows.length}</span>
      </h2>
      <div className={`status-table ${kind}`} role="table" aria-label={title}>
        <div className="status-tr status-th" role="row">
          <span role="columnheader" title="The number cards store. It never changes.">No.</span>
          <span role="columnheader">Shows as</span>
          <span role="columnheader">Name</span>
          {question && <span role="columnheader">Group heading</span>}
          <span role="columnheader">What it means</span>
          <span role="columnheader">Colour</span>
          <span role="columnheader">Role</span>
          {!question && (
            <span role="columnheader" className="center" title="Offered for the cards a question affects, once the question is answered">
              After an answer
            </span>
          )}
          <span role="columnheader" className="sr-only">
            Order and remove
          </span>
        </div>
        {rows.map((r, i) => {
          const used = usage.get(r.code) ?? 0
          const holds = r.role && REQUIRED[kind].includes(r.role)
          const keep = used ? `Used by ${used} ${noun}${used === 1 ? '' : 's'}` : holds ? `Holds the ${ROLE_LABEL[r.role!]} role: give it to another status first` : null
          const name = r.label.trim() || 'New status'
          return (
            <div key={i} className={`status-tr${r.fresh ? ' fresh' : ''}`} role="row">
              <span role="cell" className="status-no mono" title={r.fresh ? 'The number this status will be stored as' : 'The number cards store'}>
                {r.code}
              </span>
              <span role="cell" className="status-shows">
                <span className={`status tone-${r.tone}`}>{name}</span>
                {used > 0 && (
                  <span className="status-used">
                    {used} {noun}
                    {used === 1 ? '' : 's'}
                  </span>
                )}
              </span>
              <span role="cell">
                <input className="input status-name" value={r.label} placeholder="Name" aria-label={`Name of ${name}`} autoFocus={r.fresh && !r.label} onChange={(e) => set(i, { label: e.target.value })} />
              </span>
              {question && (
                <span role="cell">
                  <input className="input status-help" value={r.heading ?? ''} placeholder={r.label || 'Same as the name'} aria-label={`Group heading of ${name}`} onChange={(e) => set(i, { heading: e.target.value })} />
                </span>
              )}
              <span role="cell">
                <input className="input status-help" value={r.help} placeholder="What it means" aria-label={`What ${name} means`} onChange={(e) => set(i, { help: e.target.value })} />
              </span>
              <span role="cell">
                <span className="tone-swatches" role="radiogroup" aria-label={`Colour of ${name}`}>
                  {TONES.map((t) => (
                    <button key={t} type="button" role="radio" aria-checked={r.tone === t} aria-label={t} title={t} className={`tone-swatch tone-${t}`} onClick={() => set(i, { tone: t })} />
                  ))}
                </span>
              </span>
              <span role="cell">
                <select className="select" value={r.role ?? ''} aria-label={`Role of ${name}`} title={r.role ? ROLE_HELP[r.role] : 'No special behaviour'} onChange={(e) => set(i, { role: (e.target.value || undefined) as StatusRole | undefined })}>
                  <option value="">None</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABEL[role]}
                    </option>
                  ))}
                </select>
              </span>
              {!question && (
                <span role="cell" className="center">
                  <input type="checkbox" className="status-settle" checked={!!r.settle} aria-label={`Offer ${name} after an answer`} onChange={(e) => set(i, { settle: e.target.checked })} />
                </span>
              )}
              <span role="cell" className="status-tools">
                <button type="button" className="btn icon ghost sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" title="Move up">
                  <ArrowUp size={14} />
                </button>
                <button type="button" className="btn icon ghost sm" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move down" title="Move down">
                  <ArrowDown size={14} />
                </button>
                <button type="button" className="btn icon ghost sm danger" disabled={!!keep} title={keep ?? 'Remove this status'} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label="Remove">
                  <Trash2 size={14} />
                </button>
              </span>
            </div>
          )
        })}
      </div>
      <dl className="settings-legend">
        {roles.map((role) => (
          <div key={role}>
            <dt>{ROLE_LABEL[role]}</dt>
            <dd>{question && role === 'default' ? 'New questions start here' : ROLE_HELP[role]}</dd>
          </div>
        ))}
        {!question && (
          <div>
            <dt>After an answer</dt>
            <dd>Offered for the cards a question affects, once it is answered</dd>
          </div>
        )}
      </dl>
      {dirty && problems.length > 0 && (
        <ul className="banner error settings-problems">
          {[...new Set(problems)].map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {error && <div className="banner error">{error}</div>}
      <div className="settings-actions">
        <button type="button" className="btn ghost" onClick={add}>
          <Plus size={15} /> Add status
        </button>
        <span className="spacer" />
        {dirty && (
          <button type="button" className="btn ghost" disabled={busy} onClick={() => (setRows(saved), setError(null))}>
            Discard changes
          </button>
        )}
        <button type="button" className="btn primary" disabled={!dirty || problems.length > 0 || busy} onClick={() => void save()}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </section>
  )
}
