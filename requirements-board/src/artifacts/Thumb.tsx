/**
 * An artifact in small, for the light table: a drawing whole (never cropped), a PDF's first page,
 * a Markdown document's opening lines set like a page. Drawn only once it scrolls near view.
 */
import { useEffect, useRef, useState } from 'react'
import { markdownReadable } from '../../shared/artifacts.ts'
import type { ArtifactRec } from '../../shared/types.ts'
import { artifactFileUrl } from '../api.ts'
import { loadCanvas, releaseCanvas, useLoaded } from './content.ts'
import { withPdf } from './pdfDocs.ts'
import { fetchText } from './ArtifactViewer.tsx'

function useNear<T extends Element>() {
  const ref = useRef<T>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setNear(true), { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, near] as const
}

export function Thumb({ rec }: { rec: ArtifactRec }) {
  const [ref, near] = useNear<HTMLDivElement>()
  const format = rec.meta.format
  return (
    <div ref={ref} className={`thumb thumb-${format ?? 'none'}`} aria-hidden>
      {near && format && <ThumbBody rec={rec} />}
    </div>
  )
}

function ThumbBody({ rec }: { rec: ArtifactRec }) {
  const format = rec.meta.format!
  const url = artifactFileUrl(rec.data.id, rec.meta.fileRev, rec.data.file)
  if (format === 'svg' || format === 'raster') return <img src={url} alt="" loading="lazy" draggable={false} />
  if (format === 'mermaid') return <MermaidThumb rec={rec} />
  if (format === 'pdf') return <PdfThumb url={url} />
  return <MarkdownThumb url={url} />
}

function MermaidThumb({ rec }: { rec: ArtifactRec }) {
  return <MermaidPicture id={rec.data.id} source={rec.data.source} />
}

/** A mermaid diagram drawn as an image, from its source. */
export function MermaidPicture({ id, source }: { id: string; source: string }) {
  // Its object URL is revoked once this picture goes or its source changes.
  const loaded = useLoaded(`${id}|${source}`, () => loadCanvas({ format: 'mermaid', source, seed: id }), releaseCanvas)
  return loaded.status === 'ready' ? <img src={loaded.value.imageUrl} alt="" draggable={false} /> : null
}

/** A PDF's first page, drawn small: the document is held only while it draws. */
export function PdfThumb({ url }: { url: string }) {
  const loaded = useLoaded(url, () =>
    withPdf(url, async ({ doc }) => {
      const page = await doc.getPage(1)
      const base = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: 440 / base.width })
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      await page.render({ canvas, viewport }).promise
      return canvas.toDataURL('image/png')
    }),
  )
  return loaded.status === 'ready' ? <img className="thumb-page" src={loaded.value} alt="" draggable={false} /> : null
}

function MarkdownThumb({ url }: { url: string }) {
  const loaded = useLoaded(url, () => fetchText(url))
  if (loaded.status !== 'ready') return null
  const lines = markdownReadable(loaded.value.slice(0, 2400))
    .split('\n')
    .map((l) => l.replace(/[*_`]/g, '').trim())
    .filter(Boolean)
    .slice(0, 14)
  return (
    <div className="thumb-doc">
      {lines.map((l, i) => (
        <p key={i} className={i === 0 ? 'lead' : undefined}>
          {l}
        </p>
      ))}
    </div>
  )
}
