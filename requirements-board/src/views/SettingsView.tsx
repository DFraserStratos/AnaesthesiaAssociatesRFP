import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import { Link } from 'react-router-dom'
import { ApiError, api, type Voice } from '../api.ts'
import { BrandMark } from '../components/BrandMark.tsx'
import { MarkdownTextarea } from '../components/MarkdownTextarea.tsx'
import { IssueList } from '../components/ProblemPill.tsx'
import { componentCodeIn, type BoardConfig, type ComponentDef, type ConfigSection } from '../../shared/config.ts'
import { sameValue } from '../../shared/patch.ts'
import { mergeFields, mergeRows, mergeStatusLists } from '../../shared/settingsMerge.ts'
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
 * The project's settings that live in `board.config.json` and are safe to edit here: the project's
 * name and accent colour, the components, and the item and question statuses. Files store a status's
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
            <p>The project this board is for, how requirements are written, the areas of the system, and what each status is called, means and looks like. Cards store only a status's number, so renaming a status here changes no card.</p>
          </div>
        </div>
        <ProjectSection />
        <VoiceSection />
        <ComponentSection />
        <StatusSection kind="item" title="Item statuses" />
        <StatusSection kind="question" title="Question statuses" />
        <ChecksSection />
        <p className="settings-version">
          Requirements board <span className="mono">v{__BOARD_VERSION__}</span> · <Link to="/about">How to use this board</Link>
        </p>
      </div>
    </div>
  )
}

/**
 * What the catalogue checks found. Errors also raise the masthead's problem pill; notes never do,
 * so this is where they are read in full.
 */
function ChecksSection() {
  const issues = useCatalogue((s) => s.issues)
  const errors = issues.filter((i) => i.severity === 'error').length
  const notes = issues.length - errors
  return (
    <section className="settings-section" aria-label="Checks">
      <h2 className="group-head">Checks</h2>
      <p className="settings-intro">
        {issues.length === 0
          ? 'Every ID, parent, link and value checks out.'
          : `${errors ? `${errors} error${errors > 1 ? 's' : ''}` : 'No errors'}${notes ? `, ${notes} note${notes > 1 ? 's' : ''}` : ''}. Errors also show in the masthead; notes, such as a file not named after its ID, show only here.`}{' '}
        The same checks run in <code>npm run check</code>.
      </p>
      {issues.length > 0 && <IssueList issues={issues} />}
    </section>
  )
}

/**
 * One Settings section's edit: the form, and the version of the file's section the edits started from
 * (`start`: its value and `config.revs` rev). A save sends that rev as its base, so a section changed on
 * disk meanwhile is caught rather than overwritten (R-45). While the form is clean it follows the file.
 * `norm` is the value as the file would hold it: the section is dirty only when saving would change the
 * file, whatever form the values take on disk (R-124, R-125).
 */
function useSection<V>(section: ConfigSection, saved: V, norm: (v: V) => unknown, fromDisk: (data: unknown) => V) {
  const config = useConfig()
  const saveConfig = useCatalogue((s) => s.saveConfig)
  const rev = config.revs[section]
  const [form, setForm] = useState(saved)
  const [start, setStart] = useState({ value: saved, rev })
  /** The file's section as a refused save reported it (409), until the store catches up. */
  const [refused, setRefused] = useState<{ value: V; rev: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** What Keep mine did beyond the obvious (a clash kept as yours, a renumbered row), until the next save or discard. */
  const [notice, setNotice] = useState<string | null>(null)
  const dirty = !sameValue(norm(form), norm(start.value))
  // The form as it is now, read when a save comes back: anything typed meanwhile is kept.
  const formRef = useRef(form)
  formRef.current = form

  // A change to the file on disk shows straight away, unless there are edits here to keep (checked again
  // when a save ends, in case the file moved on while it was saving).
  useEffect(() => {
    if (dirty || busy || rev === start.rev) return
    setForm(saved)
    setStart({ value: saved, rev })
    setRefused(null)
    setNotice(null)
  }, [rev, busy])

  /** The file's section as it is now, when it moved on since the edits started. */
  const disk = rev !== start.rev ? { value: saved, rev } : refused
  const conflict = dirty && !!disk && !busy

  const save = async (value: unknown) => {
    setBusy(true)
    setError(null)
    const sent = form
    try {
      const next = await saveConfig({ [section]: value, bases: { [section]: start.rev } })
      const now = fromDisk(next[section])
      const latest = formRef.current
      setForm(sameValue(norm(latest), norm(sent)) ? now : latest)
      setStart({ value: now, rev: next.revs[section] })
      setRefused(null)
      setNotice(null)
    } catch (e) {
      const current = e instanceof ApiError && e.status === 409 && e.section === section ? (e.current as { data: unknown; rev: string } | undefined) : undefined
      if (current) setRefused({ value: fromDisk(current.data), rev: current.rev })
      else setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const take = (value: V, from: { value: V; rev: string }, note: string | null = null) => {
    setForm(value)
    setStart(from)
    setRefused(null)
    setError(null)
    setNotice(note)
  }
  return {
    form,
    setForm,
    dirty,
    busy,
    error,
    notice,
    conflict,
    save,
    discard: () => take(saved, { value: saved, rev }),
    loadTheirs: () => disk && take(disk.value, disk),
    /** The user's changes laid over the file as it is now (`merge(base, mine, theirs)`); then Save. */
    keepMine: (merge: (base: V, mine: V, theirs: V) => { value: V; note?: string }) => {
      if (!disk) return
      const m = merge(start.value, form, disk.value)
      take(m.value, disk, m.note ?? null)
    },
  }
}

/** `repair`: Save is offered with nothing changed, as writing the section as shown fixes what did not read cleanly. */
function SaveBar({ dirty, repair, blocked, busy, onDiscard, onSave, children }: { dirty: boolean; repair?: boolean; blocked?: boolean; busy: boolean; onDiscard: () => void; onSave: () => void; children?: ReactNode }) {
  return (
    <div className="settings-actions">
      {children}
      <span className="spacer" />
      {dirty && (
        <button type="button" className="btn ghost" disabled={busy} onClick={onDiscard}>
          Discard changes
        </button>
      )}
      <button type="button" className="btn primary" disabled={!(dirty || repair) || blocked || busy} onClick={onSave}>
        {busy ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

/** The section changed on disk while it was being edited: take the file's, or keep these edits over it. */
function ConflictBanner({ what, note, onLoadTheirs, onKeepMine }: { what: string; note?: string; onLoadTheirs: () => void; onKeepMine: () => void }) {
  return (
    <div className="banner error voice-conflict" role="alert">
      <span>
        {what} changed in board.config.json since you started editing, perhaps by an agent.{note ? ` ${note}` : ''}
      </span>
      <button type="button" className="btn ghost sm" onClick={onLoadTheirs} title="Drop your changes and show the file as it is now">
        Load theirs
      </button>
      <button type="button" className="btn ghost sm" onClick={onKeepMine} title="Keep your changes; take everything else as the file has it now">
        Keep mine
      </button>
    </div>
  )
}

/** What Keep mine did beyond laying the edits over the file: fields both sides changed (yours kept), rows the file removed. */
function mergeNote(clashes: string[], removedOnDisk: string[], more: string[] = []): string | undefined {
  const parts = [
    ...(clashes.length ? [`your version of ${clashes.join(', ')} kept where the file changed it too`] : []),
    ...(removedOnDisk.length ? [`${removedOnDisk.join(', ')} removed in the file, so your edits to it are gone`] : []),
    ...more,
  ]
  return parts.length ? `Kept your changes: ${parts.join('; ')}. Check, then Save.` : undefined
}

/** Keep mine's note, until the section is saved or discarded. */
function Notice({ text }: { text: string | null }) {
  return text ? (
    <div className="banner" role="status">
      <span>{text}</span>
    </div>
  ) : null
}

/** A section that does not read cleanly: nothing is offered for editing, so nothing is saved over what could not be read. */
function LockedBanner({ what, problems }: { what: string; problems: string[] }) {
  return (
    <div className="banner error settings-locked" role="status">
      <span>
        {what} can't be edited here until board.config.json is fixed: the board could not read all of it, and a save would drop what it could not read. This comes back as soon as the file reads cleanly.
      </span>
      <ul className="settings-problems">
        {problems.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  )
}

/** Accent presets: clear of one another, and of the action teal, so a glance at a tab tells the projects apart. */
const ACCENTS: [name: string, hex: string][] = [
  ['Red', '#c0392b'],
  ['Orange', '#d35400'],
  ['Gold', '#b7791f'],
  ['Green', '#2f855a'],
  ['Blue', '#2b6cb0'],
  ['Indigo', '#5a4fcf'],
  ['Purple', '#8e44ad'],
  ['Pink', '#c2417a'],
  ['Slate', '#4a5568'],
]

type ProjectForm = { project: string; accent: string }
const projectNorm = (f: ProjectForm) => ({ project: f.project.trim(), accent: f.accent })
const projectFrom = (data: unknown): ProjectForm => {
  const p = (data ?? {}) as BoardConfig['project']
  return { project: p.name ?? '', accent: p.accent ?? '' }
}

/** The project the board is for: its name beside the board's, and an accent colour for the mark and the tab icon. */
function ProjectSection() {
  const config = useConfig()
  const saved: ProjectForm = { project: config.project.name, accent: config.project.accent ?? '' }
  const s = useSection('project', saved, projectNorm, projectFrom)
  const form = s.form
  const set = (patch: Partial<ProjectForm>) => s.setForm((f) => ({ ...f, ...patch }))
  const custom = !!form.accent && !ACCENTS.some(([, hex]) => hex === form.accent)
  const state = config.sectionState?.project
  if (state?.state === 'damaged') {
    return (
      <section className="settings-section" aria-label="Project">
        <h2 className="group-head">Project</h2>
        <LockedBanner what="The project" problems={state.problems} />
      </section>
    )
  }
  return (
    <section className="settings-section" aria-label="Project">
      <h2 className="group-head">Project</h2>
      <div className="settings-fields">
        <label>
          <span>Project name</span>
          <input className="input status-name" value={form.project} placeholder="Project name" onChange={(e) => set({ project: e.target.value })} />
          <small>Shown beside the board's name and in the browser tab.</small>
        </label>
        <div className="accent-field">
          <span id="accent-label">Accent colour</span>
          <div className="accent-swatches" role="radiogroup" aria-labelledby="accent-label">
            <button type="button" role="radio" aria-checked={!form.accent} className="accent-swatch none" title="None" aria-label="None" onClick={() => set({ accent: '' })} />
            {ACCENTS.map(([name, hex]) => (
              <button key={hex} type="button" role="radio" aria-checked={form.accent === hex} className="accent-swatch" style={{ '--accent': hex } as CSSProperties} title={name} aria-label={name} onClick={() => set({ accent: hex })} />
            ))}
            <label className={custom ? 'accent-swatch custom' : 'accent-swatch custom unset'} style={custom ? ({ '--accent': form.accent } as CSSProperties) : undefined} title="Another colour">
              <input type="color" aria-label="Another colour" value={form.accent || '#2b6cb0'} onChange={(e) => set({ accent: e.target.value.toLowerCase() })} />
            </label>
            <span className={form.accent ? 'accent-preview accented' : 'accent-preview'} style={form.accent ? ({ '--accent': form.accent } as CSSProperties) : undefined} aria-hidden>
              <BrandMark accent={form.accent || undefined} />
              <span className="accent-preview-name">{form.project.trim() || 'Project name'}</span>
            </span>
          </div>
          <small>Fills the board's mark and the tab icon, so boards for different projects open side by side tell apart at a glance.</small>
        </div>
      </div>
      {s.conflict && <ConflictBanner what="The project" onLoadTheirs={s.loadTheirs} onKeepMine={() => s.keepMine((b, m, t) => {
            const r = mergeFields(projectNorm(b), projectNorm(m), projectNorm(t))
            return { value: r.merged, note: mergeNote(r.clashes.map((f) => (f === 'project' ? 'the name' : 'the accent')), []) }
          })} />}
      <Notice text={s.notice} />
      {s.error && <div className="banner error" role="alert">{s.error}</div>}
      <SaveBar dirty={s.dirty} blocked={s.conflict} busy={s.busy} onDiscard={s.discard} onSave={() => void s.save({ name: form.project.trim(), ...(form.accent ? { accent: form.accent } : {}) })} />
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
      {error && <div className="banner error" role="alert">{error}</div>}
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


/** A component row being edited; `from` is its name in the file, for a row that came from there. */
type ComponentRow = ComponentDef & { from?: string }
const componentRows = (list: ComponentDef[]): ComponentRow[] => list.map((c) => ({ ...c, from: c.name }))
/** The list as the file would hold it: names and codes trimmed, no empty code, no `from`. */
const componentList = (rows: ComponentRow[]): ComponentDef[] => rows.map((r) => (r.code?.trim() ? { name: r.name.trim(), code: r.code.trim() } : { name: r.name.trim() }))

/** How many cards and artifacts name each component: what the server counts before it lets one go (R-124). */
function useComponentUsage() {
  const index = useIndex()
  const artifacts = useCatalogue((s) => s.artifacts)
  return useMemo(() => {
    const n = new Map<string, number>()
    for (const it of [...index.items, ...Object.values(artifacts).map((r) => r.data)]) for (const c of it.components) n.set(c, (n.get(c) ?? 0) + 1)
    return n
  }, [index, artifacts])
}

const uses = (n: number) => `${n} card${n === 1 ? '' : 's'} or artifact${n === 1 ? '' : 's'}`

/**
 * The system's areas: what a card's component glyph shows. Empty accepts any component; once the list
 * names one, it must name every component a card or artifact uses (R-123, accepted decision 22).
 */
function ComponentSection() {
  const config = useConfig()
  const usage = useComponentUsage()
  const s = useSection('components', componentRows(config.components), componentList, (data) => componentRows((data ?? []) as ComponentDef[]))
  const rows = s.form
  const list = componentList(rows)
  const names = list.map((r) => r.name)
  // In use but not listed: a saved list that leaves them out would turn every one into a check error.
  const unlisted = names.length ? [...usage].filter(([name]) => !names.includes(name)) : []
  const problems = [
    ...(names.some((n) => !n) ? ['Every component needs a name'] : []),
    ...names.filter((n, i) => n && names.indexOf(n) !== i).map((n) => `"${n}" is listed twice`),
  ]
  const set = (i: number, patch: Partial<ComponentRow>) => s.setForm((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const state = config.sectionState?.components
  if (state?.state === 'damaged') {
    return (
      <section className="settings-section" aria-label="Components">
        <h2 className="group-head">Components</h2>
        <LockedBanner what="The components" problems={state.problems} />
      </section>
    )
  }
  return (
    <section className="settings-section" aria-label="Components">
      <h2 className="group-head">
        Components <span className="mono">{rows.length}</span>
      </h2>
      <p className="settings-intro">The areas of the system a requirement belongs to. Leave the list empty to accept any component; once it names one, it must name every component in use. One still on a card or artifact can't be removed or renamed.</p>
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
            const used = usage.get(r.name.trim()) ?? 0
            // Only a row from the file is held to its uses: a new row is never locked because of what it is called.
            const held = r.from !== undefined ? (usage.get(r.from) ?? 0) : 0
            return (
              <div key={i} className="status-tr" role="row">
                <span role="cell">
                  <input className="input mono" value={r.code ?? ''} maxLength={3} placeholder={r.name ? componentCodeIn({ ...config, components: [] }, r.name) : 'ABC'} aria-label={`Code of ${r.name || 'new component'}`} onChange={(e) => set(i, { code: e.target.value.toUpperCase() })} />
                </span>
                <span role="cell">
                  <input className="input status-name" value={r.name} placeholder="Name" aria-label={`Name of ${r.name || 'new component'}`} autoFocus={!r.name && r.from === undefined} disabled={held > 0} title={held > 0 ? 'Used by cards or artifacts: rename it in their files first' : undefined} onChange={(e) => set(i, { name: e.target.value })} />
                </span>
                <span role="cell" className="status-used">
                  {used ? uses(used) : 'None'}
                </span>
                <span role="cell" className="status-tools">
                  <button type="button" className="btn icon ghost sm danger" disabled={held > 0} title={held ? `Used by ${uses(held)}` : 'Remove this component'} onClick={() => s.setForm((rs) => rs.filter((_, j) => j !== i))} aria-label="Remove">
                    <Trash2 size={14} />
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      )}
      {unlisted.length > 0 && (
        <div className="banner settings-unlisted" role="group" aria-label="In use, not listed">
          <span>
            In use but not listed, so saving this list would mark them as errors: {unlisted.map(([name, n]) => `${name} (${uses(n)})`).join(', ')}.
          </span>
          <span className="spacer" />
          <button type="button" className="btn sm" onClick={() => s.setForm((rs) => [...rs, ...unlisted.map(([name]) => ({ name }))])}>
            Add them
          </button>
        </div>
      )}
      {s.dirty && problems.length > 0 && (
        <ul className="banner error settings-problems">
          {[...new Set(problems)].map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {s.conflict && (
        <ConflictBanner
          what="The components"
          onLoadTheirs={s.loadTheirs}
          onKeepMine={() =>
            s.keepMine((b, m, t) => {
              const theirs = componentList(t)
              const r = mergeRows(componentList(b), componentList(m), theirs, (c) => c.name)
              const value = componentRows(r.rows).map((c) => (theirs.some((x) => x.name === c.name) ? c : { ...c, from: undefined }))
              return { value, note: mergeNote(r.clashes, r.removedOnDisk) }
            })
          }
        />
      )}
      <Notice text={s.notice} />
      {s.error && <div className="banner error" role="alert">{s.error}</div>}
      <SaveBar dirty={s.dirty} blocked={problems.length > 0 || unlisted.length > 0 || s.conflict} busy={s.busy} onDiscard={s.discard} onSave={() => void s.save(list)}>
        <button type="button" className="btn ghost" onClick={() => s.setForm((rs) => [...rs, { name: '' }])}>
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
const storedList = (rows: Row[]) => rows.map(stored)

/** Keep mine for a status list (`mergeStatusLists`): rows the file does not hold yet stay new (teal) until saved. */
function keepMineStatuses(base: Row[], mine: Row[], theirs: Row[], spent: Iterable<string>): { value: Row[]; note?: string } {
  const m = mergeStatusLists(storedList(base), storedList(mine), storedList(theirs), spent)
  const onDisk = new Set(theirs.map((d) => d.code))
  const value = m.rows.map((d) => (onDisk.has(d.code) ? d : { ...d, fresh: true }))
  return { value, note: mergeNote(m.clashes, m.removedOnDisk, Object.entries(m.renumbered).map(([a, b]) => `your new status ${a} is now ${b}, since the file took ${a}`)) }
}

function StatusSection({ kind, title }: { kind: StatusKind; title: string }) {
  const config = useConfig()
  const index = useIndex()
  const field = kind === 'item' ? 'statuses' : 'questionStatuses'
  const saved = statusesOf(config, kind)
  const s = useSection<Row[]>(field, saved, storedList, (data) => (data ?? []) as Row[])
  const rows = s.form
  const list = storedList(rows)

  const usage = useMemo(() => {
    const n = new Map<string, number>()
    for (const r of kind === 'item' ? index.items : index.questions) n.set(r.status, (n.get(r.status) ?? 0) + 1)
    return n
  }, [index, kind])

  const problems = [
    ...rows.flatMap((r) => (!r.label.trim() ? ['Every status needs a label'] : !STATUS_CODE.test(r.code) ? [`"${r.label}" needs a code: a whole number from 1`] : [])),
    ...statusListProblems(list, kind, field).map((p) => p.replace(`${field}: `, '')),
  ]
  const noun = kind === 'item' ? 'card' : 'question'

  const set = (i: number, patch: Partial<Row>) =>
    s.setForm((rs) => {
      let next = rs.map((r, j) => (j === i ? { ...r, ...patch } : r))
      // A role belongs to one status: giving it to this one takes it from the other.
      if (patch.role) next = next.map((r, j) => (j !== i && r.role === patch.role ? { ...r, role: undefined } : r))
      return next
    })
  const move = (i: number, by: number) =>
    s.setForm((rs) => {
      const next = [...rs]
      const [r] = next.splice(i, 1)
      next.splice(i + by, 0, r!)
      return next
    })
  // A number is never handed out again: past the saved list, every row, every code the list has ever used (removed or recoded) and every code a card holds.
  const state = config.statusState?.[field]
  const highWater = String(state?.highWater ?? 0)
  const add = () => s.setForm((rs) => [...rs, { code: nextStatusCode([...saved, ...rs].map((d) => d.code), [highWater], usage.keys()), label: '', help: '', tone: 'neutral', fresh: true }])

  const question = kind === 'question'
  const roles = question ? QUESTION_ROLES : ITEM_ROLES
  // B02 (decision 16): a damaged list is never edited or saved over, and no default list stands in for it.
  if (state?.state === 'damaged') {
    return (
      <section className="settings-section" aria-label={title}>
        <h2 className="group-head">{title}</h2>
        <LockedBanner what={`The ${title.toLowerCase()}`} problems={state.problems} />
      </section>
    )
  }
  return (
    <section className="settings-section" aria-label={title}>
      <h2 className="group-head">
        {title} <span className="mono">{rows.length}</span>
      </h2>
      {state?.state === 'degraded' && (
        <div className="banner settings-degraded" role="status">
          <span>Some of this list does not read cleanly; each problem shows its default until fixed. Saving the list writes it as shown, which repairs them.</span>
          <ul className="settings-problems">
            {state.problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
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
                <button type="button" className="btn icon ghost sm danger" disabled={!!keep} title={keep ?? 'Remove this status'} onClick={() => s.setForm((rs) => rs.filter((_, j) => j !== i))} aria-label="Remove">
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
      {s.dirty && problems.length > 0 && (
        <ul className="banner error settings-problems">
          {[...new Set(problems)].map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {s.conflict && (
        <ConflictBanner
          what={`The ${title.toLowerCase()}`}
          note="Keep mine keeps every status you added or changed and every one added there."
          onLoadTheirs={s.loadTheirs}
          onKeepMine={() => s.keepMine((b, m, t) => keepMineStatuses(b, m, t, [String(useCatalogue.getState().config.statusState?.[field].highWater ?? 0), ...usage.keys()]))}
        />
      )}
      <Notice text={s.notice} />
      {s.error && <div className="banner error" role="alert">{s.error}</div>}
      <SaveBar dirty={s.dirty} repair={state?.state === 'degraded'} blocked={problems.length > 0 || s.conflict} busy={s.busy} onDiscard={s.discard} onSave={() => void s.save(list)}>
        <button type="button" className="btn ghost" onClick={add}>
          <Plus size={15} /> Add status
        </button>
      </SaveBar>
    </section>
  )
}
