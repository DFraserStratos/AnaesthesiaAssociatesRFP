import { Archive, ArrowLeft, ChevronLeft, ChevronRight, History, Map as MapIcon, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { tidyText } from '../../shared/files.ts'
import { plainText } from '../../shared/links.ts'
import { planDelete, type DeletePlan } from '../../shared/remove.ts'
import { COMPONENTS, ITEM_STATUSES, TYPE_LABEL, firstLaneName, type Item, type ItemStatus, type ItemType, type Question, type Rev } from '../../shared/types.ts'
import { ApiError } from '../api.ts'
import { setLeaveGuard, useEditOnOpen, useOpen } from '../nav.ts'
import { ancestorsOf, openQuestionsFor, relatedFor, useCatalogue, useIndex, useShownIndex, useView, type Index } from '../store.ts'
import { statusClass } from '../vocab.ts'
import { CopyLink, Glyph, ItemName, Lineage, StatusLabel, TypeIcon } from './bits.tsx'
import { EditActions, EditBanners, OrphanedDraft, discardConfirm } from './EditChrome.tsx'
import { HistoryView } from './HistoryView.tsx'
import { ItemsPicker, ParentPicker } from './ItemPicker.tsx'
import { MarkdownTextarea } from './MarkdownTextarea.tsx'
import { Prose } from './Prose.tsx'
import { Gallery, ImagesEditor } from './Screenshots.tsx'
import { Sheet, type SheetConfirm } from './Sheet.tsx'
import { StatusPicker } from './StatusPicker.tsx'
import { useEditableRecord } from './useEditableRecord.ts'

/** An item's sheet: a modal over Outline and Outstanding items, the docked side panel on the board. */
export function ItemModal({ id, docked = false }: { id: string; docked?: boolean }) {
  const rec = useCatalogue((s) => s.items[id])
  const saveItem = useCatalogue((s) => s.saveItem)
  const adoptItem = useCatalogue((s) => s.adoptItem)
  const index = useIndex()
  // Siblings and children as shown: retired cards drop out unless the Retired toggle is on (this card always stays).
  const shown = useShownIndex(id)
  const open = useOpen()
  const deleteItem = useCatalogue((s) => s.deleteItem)
  // A card the board has just made opens in Edit (`?edit=`). Left without a save while still blank, it was never wanted: drop it.
  const fresh = useEditOnOpen(id)
  const saved = useRef(false)
  const [dropped, setDropped] = useState(false)
  const ed = useEditableRecord<Item>({
    key: `item:${id}`,
    rec,
    save: saveItem,
    adopt: adoptItem,
    normalise,
    startEditing: fresh,
    onSaved: () => void (saved.current = true),
    onAbandon: () => {
      if (!fresh || saved.current || !rec || !isBlank(rec.data) || index.children.get(id)?.length) return
      setDropped(true)
      deleteItem(id, rec.rev, [id]).catch(() => setDropped(false)) // refused (changed on disk meanwhile): it stays
    },
  })
  // Cancel leaves the sheet on the card; once it is gone, close.
  useEffect(() => {
    if (dropped && !rec) open.close()
  }, [dropped, rec])

  // Docked beside the board, the board switches cards through this guard so a draft is never dropped silently.
  const leaveRef = useRef(ed.leave)
  leaveRef.current = ed.leave
  useEffect(() => {
    if (!docked) return
    const guard = (go: () => void) => void leaveRef.current(go)
    setLeaveGuard(guard)
    return () => setLeaveGuard(null)
  }, [docked])

  const [askRetire, setAskRetire] = useState(false)
  /** What deleting would take with it, worked out when the question is asked and sent back so the server can hold us to it. */
  const [askDelete, setAskDelete] = useState<DeletePlan | null>(null)
  const askToDelete = () => {
    const s = useCatalogue.getState()
    setAskDelete(planDelete(Object.values(s.items).map((r) => r.data), Object.values(s.questions).map((r) => r.data), id))
  }
  const remove = async (plan: DeletePlan) => {
    if (!rec) return
    setAskDelete(null)
    try {
      await deleteItem(id, rec.rev, plan.doomed.map((i) => i.id))
      open.close()
    } catch (e) {
      if (e instanceof ApiError && e.current) adoptItem(e.current as Rev<Item>)
      ed.setError((e as Error).message)
    }
  }
  /** The body shows the card, or its history timeline (read mode only; a new card opens on the card). */
  const [view, setView] = useState<'card' | 'history'>('card')
  const retire = async () => {
    if (!rec) return
    setAskRetire(false)
    try {
      await saveItem({ ...rec.data, status: 'Retired' }, rec.rev)
    } catch (e) {
      if (e instanceof ApiError && e.current) adoptItem(e.current as Rev<Item>)
      ed.setError((e as Error).message)
    }
  }
  /** The status menu saves straight away, no Edit needed. Retired still asks first, as the Retire button does. */
  const [statusBusy, setStatusBusy] = useState(false)
  const changeStatus = async (status: ItemStatus) => {
    if (!rec) return
    if (status === 'Retired') return setAskRetire(true)
    setStatusBusy(true)
    ed.setError(null)
    try {
      await saveItem({ ...rec.data, status }, rec.rev)
    } catch (e) {
      if (e instanceof ApiError && e.current) adoptItem(e.current as Rev<Item>)
      ed.setError((e as Error).message)
    } finally {
      setStatusBusy(false)
    }
  }

  if (ed.orphaned && ed.draft) {
    const d = ed.draft
    return (
      <OrphanedDraft
        ed={ed}
        id={id}
        noun="Item"
        docked={docked}
        onClose={open.close}
        fields={[
          { label: 'Title', text: d.title },
          { label: 'Description', text: d.description },
          { label: 'Acceptance criteria', text: d.acceptance },
          { label: 'Technical discussion', text: d.technical },
          { label: 'Notes', text: d.notes },
          { label: 'Sources', text: d.sources.join('\n') },
        ]}
      />
    )
  }

  if (dropped && !rec) return null
  if (!rec || !ed.draft) {
    return (
      <Sheet onClose={open.close} label="Item not found" docked={docked}>
        <div className="sheet-body">
          <h2>{id} is not in the catalogue</h2>
          <p>It may have been renamed or removed on disk.</p>
        </div>
      </Sheet>
    )
  }

  const item = ed.editing ? ed.draft : rec.data
  const set = (patch: Partial<Item>) => ed.setDraft((d) => (d ? { ...d, ...patch } : d))

  const confirm: SheetConfirm | null =
    discardConfirm(ed, rec.data.title) ??
    (askRetire
      ? {
          title: 'Retire this item?',
          body: 'It stays in the catalogue, marked Retired, so its ID is never reused.',
          cancelLabel: 'Keep it',
          confirmLabel: 'Retire item',
          onCancel: () => setAskRetire(false),
          onConfirm: () => void retire(),
        }
      : askDelete
        ? deleteConfirm(rec.data, askDelete, () => setAskDelete(null), () => void remove(askDelete))
        : null)

  return (
    <Sheet onClose={() => ed.leave(open.close)} onKey={ed.onKey} label={`${item.id} ${item.title}`} statusClass={statusClass(item.status)} confirm={confirm} docked={docked}>
      <SheetHead item={rec.data} index={shown} leave={ed.leave} />
      <EditBanners ed={ed} noun="item" />
      <div className="sheet-body">
        {ed.editing ? <EditForm draft={ed.draft} set={set} index={index} /> : view === 'history' ? <HistoryView item={item} index={index} /> : <ReadView item={item} index={shown} onStatus={(s) => void changeStatus(s)} statusBusy={statusBusy} />}
      </div>
      <footer className="sheet-foot">
        {ed.editing ? (
          <EditActions ed={ed} />
        ) : view === 'history' ? (
          <button className="btn" onClick={() => setView('card')}>
            <ArrowLeft size={15} /> Back to card
          </button>
        ) : (
          <>
            <button className="btn" onClick={() => open.showOnBoard(item.id)}>
              <MapIcon size={15} /> {docked ? 'Find on board' : 'Show on board'}
            </button>
            <button className="btn ghost" onClick={() => setView('history')}>
              <History size={15} /> History
            </button>
            {item.status !== 'Retired' && (
              <button className="btn ghost danger" onClick={() => setAskRetire(true)}>
                <Archive size={15} /> Retire
              </button>
            )}
            <button className="btn ghost danger" onClick={askToDelete}>
              <Trash2 size={15} /> Delete
            </button>
            <span className="spacer" />
            <button className="btn primary" onClick={() => ed.startEdit()}>
              <Pencil size={15} /> Edit
            </button>
          </>
        )}
      </footer>
    </Sheet>
  )
}

/** Still as the board made it: no title of its own and nothing written. */
const isBlank = (it: Item) =>
  (!it.title.trim() || it.title.trim() === 'Untitled') && ![it.description, it.acceptance, it.technical, it.notes].some((t) => t.trim()) && !it.images.length && !it.related.length

const count = (n: number, one: string) => `${n} ${n === 1 ? one : one === 'story' ? 'stories' : `${one}s`}`

/** The delete question names everything that goes and everything that changes, and points at Retire for keeping a record. */
function deleteConfirm(item: Item, plan: DeletePlan, onCancel: () => void, onConfirm: () => void): SheetConfirm {
  const noun = TYPE_LABEL[item.type].toLowerCase()
  const under = plan.doomed.filter((i) => i.id !== item.id)
  const features = under.filter((i) => i.type === 'feature').length
  const stories = under.filter((i) => i.type === 'story').length
  const kids = [features && count(features, 'feature'), stories && count(stories, 'story')].filter(Boolean).join(' and ')
  const refs = [plan.items.length && count(plan.items.length, 'other item'), plan.questions.length && count(plan.questions.length, 'outstanding item')].filter(Boolean).join(' and ')
  const body = [
    under.length ? `Its ${kids} are deleted with it.` : '',
    refs ? `Links to ${under.length ? 'them' : 'it'} are removed from ${refs}.` : '',
    'The files are gone for good: only git can bring them back, and a new card may reuse the ID. To keep a record, retire it instead.',
  ]
  return {
    title: `Delete this ${noun}?`,
    body: body.filter(Boolean).join(' '),
    cancelLabel: 'Keep it',
    confirmLabel: under.length ? `Delete ${count(under.length + 1, 'item')}` : `Delete ${noun}`,
    onCancel,
    onConfirm,
  }
}

/** Markdown fields go through `tidyText`, like a file read, so a leading code-block indent survives a save. */
function normalise(it: Item): Item {
  return {
    ...it,
    title: it.title.trim(),
    swimlane: it.swimlane?.trim() || null,
    sources: it.sources.map((s) => s.trim()).filter(Boolean),
    related: [...new Set(it.related.map((r) => r.trim()).filter((r) => r && r !== it.id))],
    images: it.images.filter((i) => i.src.trim()),
    description: tidyText(it.description),
    acceptance: tidyText(it.acceptance),
    technical: tidyText(it.technical),
    notes: tidyText(it.notes),
  }
}

function siblingsOf(index: Index, item: Item): Item[] {
  return item.parent ? (index.children.get(item.parent) ?? []) : index.epics
}

function SheetHead({ item, index, leave }: { item: Item; index: Index; leave: (go: () => void) => void }) {
  const open = useOpen()
  const lineage = ancestorsOf(index, item.id)
  const sibs = siblingsOf(index, item)
  const at = sibs.findIndex((s) => s.id === item.id)
  const prev = at > 0 ? sibs[at - 1] : undefined
  const next = at >= 0 ? sibs[at + 1] : undefined
  return (
    <div className="sheet-head">
      {lineage.length > 0 ? <Lineage chain={lineage} onPick={(id) => leave(() => open.item(id))} /> : <span className="lineage" />}
      <button className="btn icon ghost" disabled={!prev} onClick={() => prev && leave(() => open.item(prev.id))} title={prev ? `Previous: ${prev.title}` : undefined} aria-label="Previous sibling">
        <ChevronLeft size={17} />
      </button>
      <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
        {at + 1} of {sibs.length}
      </span>
      <button className="btn icon ghost" disabled={!next} onClick={() => next && leave(() => open.item(next.id))} title={next ? `Next: ${next.title}` : undefined} aria-label="Next sibling">
        <ChevronRight size={17} />
      </button>
      <button className="btn icon ghost" onClick={() => leave(open.close)} aria-label="Close">
        <X size={18} />
      </button>
    </div>
  )
}

function ReadView({ item, index, onStatus, statusBusy }: { item: Item; index: Index; onStatus: (s: ItemStatus) => void; statusBusy: boolean }) {
  const open = useOpen()
  const lanes = useCatalogue((s) => s.layout.lanes)
  const children = index.children.get(item.id) ?? []
  const linked = useMemo(() => linkedQuestions(index, item), [index, item])

  return (
    <div className="read-view">
      <div className="read-main">
        <h2>{item.title}</h2>
        {item.description ? <Prose text={item.description} /> : <p className="prose small">No description yet.</p>}

        {item.acceptance && (
          <section className="section">
            <h3 className="section-head">Acceptance criteria</h3>
            <Prose text={item.acceptance} />
          </section>
        )}

        {item.technical && (
          <section className="section">
            <h3 className="section-head">Technical discussion</h3>
            <Prose text={item.technical} />
          </section>
        )}

        {item.notes && <NotesSection key={item.id} text={item.notes} />}

        {linked.length > 0 && (
          <section className="section">
            <h3 className="section-head">
              Open questions <span className="count">{linked.length}</span>
            </h3>
            {linked.map(({ q, via }) => (
              <button key={q.id} className="oq-card" title={q.id} onClick={() => open.question(q.id)}>
                <div className="oq-top">
                  <strong>{q.title}</strong>
                  <StatusLabel status={q.status} />
                </div>
                <p>{plainText(q.question)}</p>
                {via && (
                  <p className="via">
                    via <ItemName item={via} />
                  </p>
                )}
              </button>
            ))}
          </section>
        )}

        {item.type !== 'story' && <Children item={item} children={children} />}
      </div>

      {/* Screenshots and the facts sit at the foot of a docked panel while the content is short. */}
      <div className="read-anchor">
        <Gallery item={item} />

        <Related item={item} index={index} />

        {/* Sources on the left, the item's ID quietly on the right: there when you need to cite it. */}
        <section className="section sheet-tail">
          <div className="facts">
            <div>
              <h3 className="section-head">Status</h3>
              <StatusPicker status={item.status} onPick={onStatus} busy={statusBusy} />
            </div>
            {/* Only a story in a named lane: the first lane is the baseline, left unmarked (so no lanes, no row). */}
            {item.type === 'story' && item.swimlane && (
              <div>
                <h3 className="section-head">Swimlane</h3>
                <span className="chip" title={lanes.includes(item.swimlane) ? undefined : 'No lane on the board is called this'}>
                  {item.swimlane}
                </span>
              </div>
            )}
            {item.components.length > 0 && (
              <div>
                <h3 className="section-head">Area</h3>
                <div className="sources">
                  {item.components.map((c) => (
                    <span key={c} className="chip">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {item.sources.length > 0 && (
              <div>
                <h3 className="section-head">Sources</h3>
                <div className="sources">
                  {item.sources.map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <CopyLink id={item.id} className="item-id">
            <TypeIcon type={item.type} size={12} /> {item.id}
          </CopyLink>
        </section>
      </div>
    </div>
  )
}

/** Open questions on this item first, then ones inherited from its feature and epic. Answered ones live in Outstanding items. */
/** Notes are secondary reading: folded away until asked for. */
function NotesSection({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="section">
      <h3 className="section-head">
        <button className="section-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <ChevronRight size={14} className="chev" aria-hidden />
          Notes
        </button>
      </h3>
      {open && (
        <div className="notes">
          <Prose text={text} small />
        </div>
      )}
    </section>
  )
}

function linkedQuestions(index: Index, item: Item): { q: Question; via?: Item }[] {
  const out: { q: Question; via?: Item }[] = []
  const seen = new Set<string>()
  const add = (id: string, via?: Item) => {
    for (const q of openQuestionsFor(index, id)) {
      if (seen.has(q.id)) continue
      seen.add(q.id)
      out.push({ q, via })
    }
  }
  add(item.id)
  for (const a of ancestorsOf(index, item.id).reverse()) add(a.id, a)
  return out
}

/** Items related to this one (stored on either card), then the items whose text mentions it. */
function Related({ item, index }: { item: Item; index: Index }) {
  const open = useOpen()
  const showRetired = useView((s) => s.showRetired)
  const { related, mentionedIn } = useMemo(() => {
    const all = relatedFor(index, item)
    const shown = (r: Item) => showRetired || r.status !== 'Retired'
    return { related: all.related.filter(shown), mentionedIn: all.mentionedIn.filter(shown) }
  }, [index, item, showRetired])
  if (!related.length && !mentionedIn.length) return null
  const row = (r: Item) => (
    <button key={r.id} className={`link-row ${statusClass(r.status)}`} onClick={() => open.item(r.id)}>
      <span style={r.status === 'Retired' ? { color: 'var(--ink-3)', textDecoration: 'line-through' } : undefined}>
        <ItemName item={r} />
      </span>
      <StatusLabel status={r.status} />
    </button>
  )
  return (
    <section className="section related">
      <h3 className="section-head">
        Related <span className="count">{related.length + mentionedIn.length}</span>
      </h3>
      {related.length > 0 && <div className="link-list">{related.map(row)}</div>}
      {mentionedIn.length > 0 && (
        <>
          <h4 className="related-sub">Mentioned in</h4>
          <div className="link-list">{mentionedIn.map(row)}</div>
        </>
      )}
    </section>
  )
}

function Children({ item, children }: { item: Item; children: Item[] }) {
  const open = useOpen()
  const createItem = useCatalogue((s) => s.createItem)
  const [adding, setAdding] = useState<ItemType | null>(null)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const add = async () => {
    if (busy || !adding || !title.trim()) return
    setBusy(true)
    setError(null)
    try {
      const rec = await createItem({ type: adding, parent: item.id, title: title.trim(), status: 'Proposed' })
      open.item(rec.data.id, { edit: true })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const label = item.type === 'epic' ? 'Features and stories' : 'Stories'
  // Nothing new goes under a retired card.
  const retired = item.status === 'Retired'
  if (retired && children.length === 0) return null

  return (
    <section className="section">
      <h3 className="section-head">
        {label} <span className="count">{children.length}</span>
        {!retired && item.type === 'epic' && (
          <button className="btn sm ghost" onClick={() => setAdding('feature')}>
            <Plus size={14} /> Feature
          </button>
        )}
        {!retired && (
          <button className="btn sm ghost" style={item.type === 'epic' ? { marginLeft: 0 } : undefined} onClick={() => setAdding('story')}>
            <Plus size={14} /> Story
          </button>
        )}
      </h3>
      {adding && (
        <form
          className="field"
          onSubmit={(e) => {
            e.preventDefault()
            void add()
          }}
          style={{ flexDirection: 'row', gap: 8 }}
        >
          <input
            className="input"
            autoFocus
            placeholder={`New ${adding} title`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation()
                setAdding(null)
              }
            }}
          />
          <button className="btn primary" type="submit" disabled={!title.trim() || busy}>
            {busy ? 'Adding…' : `Add ${adding}`}
          </button>
          <button className="btn ghost" type="button" onClick={() => setAdding(null)}>
            Cancel
          </button>
        </form>
      )}
      {error && <div className="banner error" style={{ margin: '0 0 8px' }}>{error}</div>}
      {children.length > 0 && (
        <div className="link-list">
          {children.map((c) => (
            <button key={c.id} className={`link-row ${statusClass(c.status)}`} onClick={() => open.item(c.id)}>
              <span style={c.status === 'Retired' ? { color: 'var(--ink-3)', textDecoration: 'line-through' } : undefined}>
                <ItemName item={c} />
              </span>
              <StatusLabel status={c.status} />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ edit */

function EditForm({ draft, set, index }: { draft: Item; set: (p: Partial<Item>) => void; index: Index }) {
  const lanes = useCatalogue((s) => s.layout.lanes)
  const firstLane = useCatalogue((s) => firstLaneName(s.layout))
  // A name no lane has (a hand edit) stays selectable, so opening Edit never silently drops it.
  const laneChoices = draft.swimlane && !lanes.includes(draft.swimlane) ? [...lanes, draft.swimlane] : lanes
  return (
    <>
      <label className="field" style={{ marginTop: 8 }}>
        <span>Title</span>
        <input className="input title-input" value={draft.title} onChange={(e) => set({ title: e.target.value })} autoFocus />
      </label>
      <div className="field-grid">
        <label className="field">
          <span>Status</span>
          <select className="select" value={draft.status} onChange={(e) => set({ status: e.target.value as Item['status'] })}>
            {ITEM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {draft.type !== 'epic' && (
          <div className="field">
            <span>Parent</span>
            <ParentPicker type={draft.type} value={draft.parent} excludeId={draft.id} index={index} onPick={(parent) => set({ parent })} />
          </div>
        )}
        {draft.type === 'story' && laneChoices.length > 0 && (
          <label className="field">
            <span>Swimlane</span>
            <select className="select" value={draft.swimlane ?? ''} onChange={(e) => set({ swimlane: e.target.value || null })}>
              <option value="">{firstLane}</option>
              {laneChoices.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="field">
        <span>Components</span>
        <div className="chip-row">
          {COMPONENTS.map((c) => {
            const on = draft.components.includes(c)
            return (
              <button
                key={c}
                type="button"
                className="chip toggle"
                aria-pressed={on}
                onClick={() => set({ components: on ? draft.components.filter((x) => x !== c) : [...draft.components, c] })}
              >
                <Glyph component={c} /> {c}
              </button>
            )
          })}
        </div>
      </div>
      <label className="field">
        <span>Description · Markdown{draft.type === 'story' ? ' · "As a …, I …, so that …"' : ''}</span>
        <MarkdownTextarea className="textarea" rows={5} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
      </label>
      <label className="field">
        <span>Acceptance criteria · Markdown · one per line or Given/When/Then</span>
        <MarkdownTextarea className="textarea" rows={4} value={draft.acceptance} onChange={(e) => set({ acceptance: e.target.value })} />
      </label>
      <label className="field">
        <span>Technical discussion · Markdown</span>
        <MarkdownTextarea className="textarea" rows={4} value={draft.technical} onChange={(e) => set({ technical: e.target.value })} />
      </label>
      <label className="field">
        <span>Notes</span>
        <MarkdownTextarea className="textarea" rows={3} value={draft.notes} onChange={(e) => set({ notes: e.target.value })} />
      </label>
      <label className="field">
        <span>Sources · one per line</span>
        <textarea className="textarea" rows={3} value={draft.sources.join('\n')} onChange={(e) => set({ sources: e.target.value.split('\n') })} />
      </label>
      <div className="field">
        <span>Related · shown on both cards</span>
        <ItemsPicker value={draft.related} index={index} exclude={selfOnly(draft.id)} onChange={(related) => set({ related })} />
        <RelatedFrom id={draft.id} index={index} />
      </div>
      <ImagesEditor draft={draft} set={set} />
    </>
  )
}

const selfCache = new Map<string, string[]>()
/** A stable one-ID exclusion list, so the picker's search isn't recomputed on every keystroke elsewhere. */
function selfOnly(id: string): string[] {
  if (!selfCache.has(id)) selfCache.set(id, [id])
  return selfCache.get(id)!
}

/** The relations other cards store: shown here, edited there. */
function RelatedFrom({ id, index }: { id: string; index: Index }) {
  const from = (index.relatedFrom.get(id) ?? []).map((r) => index.byId.get(r)).filter((it): it is Item => !!it)
  if (!from.length) return null
  return (
    <p className="field-note">
      Also related from{' '}
      {from.map((it, i) => (
        <span key={it.id}>
          {i > 0 && ', '}
          <ItemName item={it} />
        </span>
      ))}
      , stored on {from.length === 1 ? 'that card' : 'those cards'}.
    </p>
  )
}
