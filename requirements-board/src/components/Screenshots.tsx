/** An item's screenshots: the gallery and lightbox in its read view, and the list editor in its edit form. */
import { ImageIcon, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { IMAGE_APPS, type ImageRef, type Item } from '../../shared/types.ts'
import { assetUrl } from '../api.ts'

/** Gallery tabs: one per app, in IMAGE_APPS order; images with no app fall back to their viewport. */
const GALLERY_TABS = [...IMAGE_APPS, 'desktop'] as const
type GalleryTab = (typeof GALLERY_TABS)[number]
const TAB_LABEL: Record<GalleryTab, string> = { admin: 'Admin', web: 'Web', mobile: 'Mobile', simulator: 'Simulator', desktop: 'Desktop' }
const tabOf = (img: ImageRef): GalleryTab => img.app ?? (img.viewport === 'mobile' ? 'mobile' : 'desktop')

export function Gallery({ item }: { item: Item }) {
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

export function ImagesEditor({ draft, set }: { draft: Item; set: (p: Partial<Item>) => void }) {
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
