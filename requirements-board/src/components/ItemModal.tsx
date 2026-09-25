import { Archive, ChevronLeft, ChevronRight, ImageIcon, Map as MapIcon, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { COMPONENTS, IMAGE_APPS, ITEM_STATUSES, isOpenQuestion, type ImageRef, type Item, type ItemType, type Question, type Rev } from '../../shared/types.ts'
import { ApiError, assetUrl } from '../api.ts'
import { setLeaveGuard, useOpen } from '../nav.ts'
import { ancestorsOf, useCatalogue, useIndex, type Index } from '../store.ts'
import { TYPE_LABEL, statusClass } from '../vocab.ts'
import { Glyph, ItemName, Lineage, Prose, StatusLabel, TypeIcon } from './bits.tsx'
import { ParentPicker } from './ItemPicker.tsx'
import { Sheet, type SheetConfirm } from './Sheet.tsx'
import { useEditableRecord } from './useEditableRecord.ts'

/** An item's sheet: a modal over Outline and Outstanding items, the docked side panel on the board. */
export function ItemModal({ id, docked = false }: { id: string; docked?: boolean }) {
  const rec = useCatalogue((s) => s.items[id])
  const saveItem = useCatalogue((s) => s.saveItem)
  const adoptItem = useCatalogue((s) => s.adoptItem)
  const index = useIndex()
  const open = useOpen()
  const ed = useEditableRecord<Item>({
    key: `item:${id}`,
    rec,
    save: saveItem,
    adopt: adoptItem,
    normalise,
    startEditing: open.params.get('edit') === '1',
  })

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

  const confirm: SheetConfirm | null = ed.discardAsk
    ? {
        title: 'Discard your changes?',
        body: `Your unsaved edits to ${rec.data.title} will be lost.`,
        cancelLabel: 'Keep editing',
        confirmLabel: 'Discard changes',
        onCancel: ed.discardAsk.cancel,
        onConfirm: ed.discardAsk.confirm,
      }
    : askRetire
      ? {
          title: 'Retire this item?',
          body: 'It stays in the catalogue, marked Retired, so its ID is never reused.',
          cancelLabel: 'Keep it',
          confirmLabel: 'Retire item',
          onCancel: () => setAskRetire(false),
          onConfirm: () => void retire(),
        }
      : null

  return (
    <Sheet onClose={() => ed.leave(open.close)} onKey={ed.onKey} label={`${item.id} ${item.title}`} statusClass={statusClass(item.status)} confirm={confirm} docked={docked}>
      <SheetHead item={rec.data} index={index} leave={ed.leave} />
      {ed.restored && ed.editing && !ed.conflict && (
        <div className="banner" role="status">
          <span>Restored the unsaved edits you left here.</span>
        </div>
      )}
      {ed.conflict && (
        <div className="banner" role="alert">
          <span>This item changed on disk while you were editing.</span>
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
        {ed.editing ? <EditForm draft={ed.draft} set={set} index={index} /> : <ReadView item={item} index={index} />}
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
            <button className="btn primary" onClick={() => void ed.save()} disabled={!ed.dirty || ed.saving}>
              {ed.saving ? 'Saving…' : 'Save'}
            </button>
          </>
        ) : (
          <>
            <button className="btn" onClick={() => open.showOnBoard(item.id)}>
              <MapIcon size={15} /> {docked ? 'Find on board' : 'Show on board'}
            </button>
            {item.status !== 'Retired' && (
              <button className="btn ghost danger" onClick={() => setAskRetire(true)}>
                <Archive size={15} /> Retire
              </button>
            )}
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

function normalise(it: Item): Item {
  return {
    ...it,
    title: it.title.trim(),
    sources: it.sources.map((s) => s.trim()).filter(Boolean),
    images: it.images.filter((i) => i.src.trim()),
    description: it.description.trim(),
    notes: it.notes.trim(),
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

function ReadView({ item, index }: { item: Item; index: Index }) {
  const open = useOpen()
  const children = index.children.get(item.id) ?? []
  const linked = useMemo(() => linkedQuestions(index, item), [index, item])

  return (
    <>
      <h2>{item.title}</h2>
      {item.description ? <Prose text={item.description} /> : <p className="prose small">No description yet.</p>}

      {item.notes && (
        <section className="section">
          <h3 className="section-head">Notes</h3>
          <div className="notes">
            <Prose text={item.notes} small />
          </div>
        </section>
      )}

      {linked.length > 0 && (
        <section className="section">
          <h3 className="section-head">
            Open questions <span className="count">{linked.filter((l) => isOpenQuestion(l.q)).length}</span>
          </h3>
          {linked.map(({ q, via }) => (
            <button key={q.id} className={`oq-card${isOpenQuestion(q) ? '' : ' answered'}`} onClick={() => open.question(q.id)}>
              <div className="oq-top">
                <span className="mono">{q.id}</span>
                <strong>{q.title}</strong>
                <StatusLabel status={q.status} />
              </div>
              <p>{q.question}</p>
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

      <Gallery item={item} />

      {/* Sources on the left, the item's ID quietly on the right: there when you need to cite it. */}
      <section className="section sheet-tail">
        <div className="facts">
          <div>
            <h3 className="section-head">Status</h3>
            <StatusLabel status={item.status} />
          </div>
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
        <span className="item-id" title={`${TYPE_LABEL[item.type]} ID`}>
          <TypeIcon type={item.type} size={12} /> {item.id}
        </span>
      </section>
    </>
  )
}

/** Questions on this item first, then ones inherited from its feature and epic. */
function linkedQuestions(index: Index, item: Item): { q: Question; via?: Item }[] {
  const out: { q: Question; via?: Item }[] = []
  const seen = new Set<string>()
  const add = (id: string, via?: Item) => {
    for (const q of index.questionsFor.get(id) ?? []) {
      if (seen.has(q.id)) continue
      seen.add(q.id)
      out.push({ q, via })
    }
  }
  add(item.id)
  for (const a of ancestorsOf(index, item.id).reverse()) add(a.id, a)
  return out.sort((a, b) => Number(!isOpenQuestion(a.q)) - Number(!isOpenQuestion(b.q)))
}

function Children({ item, children }: { item: Item; children: Item[] }) {
  const open = useOpen()
  const createItem = useCatalogue((s) => s.createItem)
  const [adding, setAdding] = useState<ItemType | null>(null)
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const add = async () => {
    if (!adding || !title.trim()) return
    try {
      const rec = await createItem({ type: adding, parent: item.id, title: title.trim(), status: 'Proposed' })
      open.item(rec.data.id, { edit: true })
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const label = item.type === 'epic' ? 'Features and stories' : 'Stories'

  return (
    <section className="section">
      <h3 className="section-head">
        {label} <span className="count">{children.length}</span>
        {item.type === 'epic' && (
          <button className="btn sm ghost" onClick={() => setAdding('feature')}>
            <Plus size={14} /> Feature
          </button>
        )}
        <button className="btn sm ghost" style={item.type === 'epic' ? { marginLeft: 0 } : undefined} onClick={() => setAdding('story')}>
          <Plus size={14} /> Story
        </button>
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
          <button className="btn primary" type="submit" disabled={!title.trim()}>
            Add {adding}
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

/** Gallery tabs: one per app, in IMAGE_APPS order; images with no app fall back to their viewport. */
const GALLERY_TABS = [...IMAGE_APPS, 'desktop'] as const
type GalleryTab = (typeof GALLERY_TABS)[number]
const TAB_LABEL: Record<GalleryTab, string> = { admin: 'Admin', web: 'Web', mobile: 'Mobile', simulator: 'Simulator', desktop: 'Desktop' }
const tabOf = (img: ImageRef): GalleryTab => img.app ?? (img.viewport === 'mobile' ? 'mobile' : 'desktop')

function Gallery({ item }: { item: Item }) {
  const tabs = GALLERY_TABS.filter((t) => item.images.some((i) => tabOf(i) === t))
  const [picked, setTab] = useState<GalleryTab | null>(null)
  const tab = picked && tabs.includes(picked) ? picked : (tabs[0] ?? 'desktop')
  // The lightbox steps through every screenshot, tab by tab in gallery order, whatever tab it opened from.
  const ordered = tabs.flatMap((t) => item.images.filter((i) => tabOf(i) === t))
  const [zoomedAt, setZoomedAt] = useState<number | null>(null)
  const zoomed = zoomedAt !== null ? ordered[zoomedAt] : undefined
  const step = (dir: 1 | -1) => {
    if (zoomedAt === null || !ordered.length) return
    const n = (zoomedAt + dir + ordered.length) % ordered.length
    setZoomedAt(n)
    setTab(tabOf(ordered[n]!)) // closing lands on the tab of the last screenshot seen
  }
  const shown = item.images.filter((i) => tabOf(i) === tab)
  const count = (t: GalleryTab) => item.images.filter((i) => tabOf(i) === t).length
  const layout = shown.every((i) => i.viewport === 'mobile') ? 'mobile' : 'desktop'

  return (
    <section className="section">
      <h3 className="section-head">
        <ImageIcon size={14} /> Screenshots <span className="count">{item.images.length}</span>
      </h3>
      {item.images.length === 0 ? (
        <div className="empty-shots">
          No screenshots yet. Save them to <code>catalogue/assets/{item.id}/</code> and list each under <code>images</code> in{' '}
          <code>requirements/{item.id}.md</code> with its <code>viewport</code> (desktop or mobile) and <code>app</code>, or add them here in Edit.
        </div>
      ) : (
        <>
          <div className="gallery-tabs" role="group" aria-label="App">
            {tabs.map((t) => (
              <button key={t} aria-pressed={tab === t} className="btn sm" onClick={() => setTab(t)}>
                {TAB_LABEL[t]} <span className="mono">{count(t)}</span>
              </button>
            ))}
          </div>
          <div className={`gallery ${layout}`}>
            {shown.map((img) => (
              <figure key={img.src} style={{ margin: 0 }}>
                <button className="shot" onClick={() => setZoomedAt(ordered.indexOf(img))} aria-label={`Enlarge ${img.caption ?? img.src}`}>
                  <img src={assetUrl(img.src)} alt={img.caption ?? ''} loading="lazy" />
                  <figcaption>{img.caption ?? img.src.split('/').pop()}</figcaption>
                </button>
              </figure>
            ))}
          </div>
        </>
      )}
      {zoomed && <Lightbox image={zoomed} at={zoomedAt!} total={ordered.length} label={TAB_LABEL[tabOf(zoomed)]} onStep={step} onClose={() => setZoomedAt(null)} />}
    </section>
  )
}

/** A screenshot enlarged. Left and right arrows step through all of the item's screenshots, wrapping at the ends. */
function Lightbox({ image, at, total, label, onStep, onClose }: { image: ImageRef; at: number; total: number; label: string; onStep: (dir: 1 | -1) => void; onClose: () => void }) {
  const handlers = useRef({ onStep, onClose })
  handlers.current = { onStep, onClose }
  useEffect(() => {
    // Capture phase, so the board's arrow-key tree walk and the sheet's Esc never see these keys.
    const onKey = (e: KeyboardEvent) => {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
      if (e.key !== 'Escape' && !dir) return
      e.preventDefault()
      e.stopImmediatePropagation()
      if (dir) handlers.current.onStep(dir)
      else handlers.current.onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-label="Screenshot">
      <div>
        <img src={assetUrl(image.src)} alt={image.caption ?? ''} />
        <p>
          {image.caption ?? image.src}
          {total > 1 && (
            <span className="lightbox-count">
              {label} · {at + 1} of {total}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ edit */

function EditForm({ draft, set, index }: { draft: Item; set: (p: Partial<Item>) => void; index: Index }) {
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
        <textarea className="textarea" rows={5} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
      </label>
      <label className="field">
        <span>Notes</span>
        <textarea className="textarea" rows={3} value={draft.notes} onChange={(e) => set({ notes: e.target.value })} />
      </label>
      <label className="field">
        <span>Sources · one per line</span>
        <textarea className="textarea" rows={3} value={draft.sources.join('\n')} onChange={(e) => set({ sources: e.target.value.split('\n') })} />
      </label>
      <ImagesEditor draft={draft} set={set} />
    </>
  )
}

function ImagesEditor({ draft, set }: { draft: Item; set: (p: Partial<Item>) => void }) {
  const update = (i: number, patch: Partial<ImageRef>) => set({ images: draft.images.map((img, n) => (n === i ? { ...img, ...patch } : img)) })
  return (
    <div className="field">
      <span>Screenshots · paths relative to the catalogue folder</span>
      {draft.images.map((img, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 1fr 32px', gap: 8 }}>
          <input className="input mono" style={{ fontSize: 12 }} value={img.src} placeholder={`assets/${draft.id}/screen.png`} onChange={(e) => update(i, { src: e.target.value })} />
          <select className="select" value={img.viewport} onChange={(e) => update(i, { viewport: e.target.value as ImageRef['viewport'] })}>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
          </select>
          <select className="select" aria-label="App" value={img.app ?? ''} onChange={(e) => update(i, { app: (e.target.value || undefined) as ImageRef['app'] })}>
            <option value="">No app</option>
            {IMAGE_APPS.map((a) => (
              <option key={a} value={a}>
                {TAB_LABEL[a]}
              </option>
            ))}
          </select>
          <input className="input" value={img.caption ?? ''} placeholder="Caption" onChange={(e) => update(i, { caption: e.target.value || undefined })} />
          <button type="button" className="btn icon ghost" aria-label="Remove screenshot" onClick={() => set({ images: draft.images.filter((_, n) => n !== i) })}>
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <div>
        <button type="button" className="btn sm" onClick={() => set({ images: [...draft.images, { src: `assets/${draft.id}/`, viewport: 'desktop' }] })}>
          <Plus size={14} /> Add screenshot
        </button>
      </div>
    </div>
  )
}
