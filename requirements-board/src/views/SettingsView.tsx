import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import { Link } from 'react-router-dom'
import { ApiError, api, type Voice } from '../api.ts'
import { MarkdownTextarea } from '../components/MarkdownTextarea.tsx'
import { componentCodeIn, type ComponentDef, type ConfigPatch } from '../../shared/config.ts'
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
 * The project's settings that live in `board.config.json` and are safe to edit here: the board's
 * and project's names, the components, and the item and question statuses. Files store a status's
 * code, so renaming, rewording, recolouring or reordering a status touches no file; only the
 * config is rewritten.
 */
export function SettingsView() {
  return (
    <div className="page">
      <div className="page-inner settings">
        <div className="page-head">
          <div>
            <h1>Settings</h1>
            <p>What this board is called, the areas of the system, and what each status is called, means and looks like. Cards store only a status's number, so renaming a status here changes no card.</p>
          </div>
        </div>
        <BoardSection />
        <VoiceSection />
        <ComponentSection />
        <StatusSection kind="item" title="Item statuses" />
        <StatusSection kind="question" title="Question statuses" />
        <p className="settings-version">
          Requirements board <span className="mono">v{__BOARD_VERSION__}</span> · <Link to="/about">How to use this board</Link>
        </p>
      </div>
    </div>
  )
}

/** Save one patch with the busy and error state every section shares. */
function useSave() {
  const saveConfig = useCatalogue((s) => s.saveConfig)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const save = async (patch: ConfigPatch) => {
    setBusy(true)
    setError(null)
    try {
      await saveConfig(patch)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, setError, save }
}

function SaveBar({ dirty, blocked, busy, onDiscard, onSave, children }: { dirty: boolean; blocked?: boolean; busy: boolean; onDiscard: () => void; onSave: () => void; children?: ReactNode }) {
  return (
    <div className="settings-actions">
      {children}
      <span className="spacer" />
      {dirty && (
        <button type="button" className="btn ghost" disabled={busy} onClick={onDiscard}>
          Discard changes
        </button>
      )}
      <button type="button" className="btn primary" disabled={!dirty || blocked || busy} onClick={onSave}>
        {busy ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

/** The board's own name (masthead and browser tab) and the project it is for. */
function BoardSection() {
  const config = useConfig()
  const saved = { board: config.board.name, project: config.project.name, locale: config.project.locale ?? '' }
  const [form, setForm] = useState(saved)
  const { busy, error, setError, save } = useSave()
  const dirty = JSON.stringify(form) !== JSON.stringify(saved)
  useEffect(() => {
    if (!dirty) setForm(saved)
  }, [config.board, config.project])
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))
  return (
    <section className="settings-section" aria-label="Board">
      <h2 className="group-head">Board</h2>
      <div className="settings-fields">
        <label>
          <span>Board name</span>
          <input className="input status-name" value={form.board} placeholder="Requirements board" onChange={(e) => set({ board: e.target.value })} />
          <small>In the masthead and the browser tab.</small>
        </label>
        <label>
          <span>Project</span>
          <input className="input status-name" value={form.project} placeholder="Project name" onChange={(e) => set({ project: e.target.value })} />
          <small>Shown beside the board's name.</small>
        </label>
        <label>
          <span>Locale</span>
          <input className="input status-help" value={form.locale} placeholder="Browser's own" onChange={(e) => set({ locale: e.target.value })} />
          <small>For dates, e.g. en-GB or en-US.</small>
        </label>
      </div>
      {error && <div className="banner error">{error}</div>}
      <SaveBar
        dirty={dirty}
        blocked={!form.board.trim()}
        busy={busy}
        onDiscard={() => (setForm(saved), setError(null))}
        onSave={() => void save({ board: { name: form.board.trim() }, project: { name: form.project.trim(), ...(form.locale.trim() ? { locale: form.locale.trim() } : {}) } })}
      />
    </section>
  )
}

/**
 * How requirements are written: `VOICE.md` in the requirements folder. The skills read it whenever
 * they write or reword an item, so this is where a team tells the AI how to write. Shown as the file
 * reads, and edited here or as the file. A save goes over the version that was shown only: if an
 * agent rewrote the file meanwhile, the editor offers theirs or keeps yours.
 */
function VoiceSection() {
  const [voice, setVoice] = useState<Voice | null>(null)
  const [draft, setDraft] = useState<string | null>(null)
  const [theirs, setTheirs] = useState<Voice | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    api.voice().then(setVoice, (e: Error) => setError(e.message))
  }, [])
  const editing = draft !== null
  const dirty = editing && draft !== (voice?.text ?? '')

  const save = async (baseRev: string | null) => {
    setBusy(true)
    setError(null)
    try {
      const saved = await api.putVoice(draft ?? '', baseRev)
      setVoice(saved)
      setDraft(null)
      setTheirs(null)
    } catch (e) {
      const current = e instanceof ApiError && e.status === 409 ? e.current : undefined
      if (current) setTheirs({ text: (current.data as string | null) ?? null, rev: current.rev })
      else setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const loadTheirs = () => {
    if (!theirs) return
    setVoice(theirs)
    setDraft(theirs.text ?? '')
    setTheirs(null)
  }

  return (
    <section className="settings-section" aria-label="Writing voice">
      <h2 className="group-head">Writing voice</h2>
      <p className="settings-intro">
        How requirements are written. Claude Code's skills read it whenever they write or reword a card, question or note, so write it the way your team writes. It is the file <code>requirements/VOICE.md</code>.
      </p>
      {voice && !editing && (
        <div className="voice-doc">
          {voice.text === null ? (
            <p className="empty">No VOICE.md yet. Write one to say how requirements should be written.</p>
          ) : (
            <div className="prose">
              <Markdown>{voice.text.replace(/^# .*\n+/, '')}</Markdown>
            </div>
          )}
        </div>
      )}
      {editing && (
        <div className="voice-edit">
          <MarkdownTextarea className="input voice-text" value={draft} aria-label="VOICE.md" spellCheck autoFocus onChange={(e) => setDraft(e.target.value)} />
          <div className="voice-doc voice-preview" aria-label="Preview">
            <div className="prose">
              <Markdown>{draft.replace(/^# .*\n+/, '')}</Markdown>
            </div>
          </div>
        </div>
      )}
      {theirs && (
        <div className="banner error voice-conflict" role="alert">
          <span>VOICE.md changed on disk since you opened it, perhaps by an agent.</span>
          <button type="button" className="btn ghost sm" onClick={loadTheirs}>
            Load theirs
          </button>
          <button type="button" className="btn ghost sm" disabled={busy} onClick={() => void save(theirs.rev)}>
            Keep mine
          </button>
        </div>
      )}
      {error && <div className="banner error">{error}</div>}
      {voice && (
        <div className="settings-actions">
          <span className="spacer" />
          {editing ? (
            <>
              <button type="button" className="btn ghost" disabled={busy} onClick={() => (setDraft(null), setTheirs(null), setError(null))}>
                {dirty ? 'Discard changes' : 'Cancel'}
              </button>
              <button type="button" className="btn primary" disabled={!dirty || busy || !!theirs} onClick={() => void save(voice.rev)}>
                {busy ? 'Saving…' : 'Save'}
              </button>
            </>
          ) : (
            <button type="button" className="btn ghost" onClick={() => setDraft(voice.text ?? '# How requirements are written\n\n')}>
              <Pencil size={14} /> {voice.text === null ? 'Write it' : 'Edit'}
            </button>
          )}
        </div>
      )}
    </section>
  )
}

/** The system's areas: what a card's component glyph shows. Empty accepts any component. */
function ComponentSection() {
  const config = useConfig()
  const index = useIndex()
  const saved = config.components
  const [rows, setRows] = useState<ComponentDef[]>(saved)
  const { busy, error, setError, save } = useSave()
  const list = rows.map((r) => (r.code?.trim() ? { name: r.name.trim(), code: r.code.trim().toUpperCase() } : { name: r.name.trim() }))
  const dirty = JSON.stringify(list) !== JSON.stringify(saved)
  useEffect(() => {
    if (!dirty) setRows(saved)
  }, [saved])
  const usage = useMemo(() => {
    const n = new Map<string, number>()
    for (const it of index.items) for (const c of it.components) n.set(c, (n.get(c) ?? 0) + 1)
    return n
  }, [index])
  const names = list.map((r) => r.name)
  const problems = [...(names.some((n) => !n) ? ['Every component needs a name'] : []), ...names.filter((n, i) => n && names.indexOf(n) !== i).map((n) => `"${n}" is listed twice`)]
  const set = (i: number, patch: Partial<ComponentDef>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  return (
    <section className="settings-section" aria-label="Components">
      <h2 className="group-head">
        Components <span className="mono">{rows.length}</span>
      </h2>
      <p className="settings-intro">The areas of the system a requirement belongs to. Leave the list empty to accept any component. One still on a card can't be removed.</p>
      {rows.length > 0 && (
        <div className="status-table component-table" role="table" aria-label="Components">
          <div className="status-tr status-th" role="row">
            <span role="columnheader">Code</span>
            <span role="columnheader">Name</span>
            <span role="columnheader">Used by</span>
            <span role="columnheader" className="sr-only">
              Remove
            </span>
          </div>
          {rows.map((r, i) => {
            const was = saved.find((c) => c.name === r.name)
            const used = was ? usage.get(r.name) ?? 0 : 0
            return (
              <div key={i} className="status-tr" role="row">
                <span role="cell">
                  <input className="input mono" value={r.code ?? ''} maxLength={3} placeholder={r.name ? componentCodeIn({ ...config, components: [] }, r.name) : 'ABC'} aria-label={`Code of ${r.name || 'new component'}`} onChange={(e) => set(i, { code: e.target.value })} />
                </span>
                <span role="cell">
                  <input className="input status-name" value={r.name} placeholder="Name" aria-label={`Name of ${r.name || 'new component'}`} autoFocus={!r.name} disabled={used > 0} title={used > 0 ? 'Used by cards: rename it in their files first' : undefined} onChange={(e) => set(i, { name: e.target.value })} />
                </span>
                <span role="cell" className="status-used">
                  {used ? `${used} card${used === 1 ? '' : 's'}` : 'None'}
                </span>
                <span role="cell" className="status-tools">
                  <button type="button" className="btn icon ghost sm danger" disabled={used > 0} title={used ? `Used by ${used} card${used === 1 ? '' : 's'}` : 'Remove this component'} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label="Remove">
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      )}
      {dirty && problems.length > 0 && (
        <ul className="banner error settings-problems">
          {[...new Set(problems)].map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {error && <div className="banner error">{error}</div>}
      <SaveBar dirty={dirty} blocked={problems.length > 0} busy={busy} onDiscard={() => (setRows(saved), setError(null))} onSave={() => void save({ components: list })}>
        <button type="button" className="btn ghost" onClick={() => setRows((rs) => [...rs, { name: '' }])}>
          <Plus size={15} /> Add component
        </button>
      </SaveBar>
    </section>
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
  const saveConfig = useCatalogue((s) => s.saveConfig)
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
      await saveConfig({ [field]: list })
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
