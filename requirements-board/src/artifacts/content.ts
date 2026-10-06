/**
 * Loading what a canvas artifact draws: an SVG file (fetched as text, then sanitised), a raster
 * image (wrapped in an SVG of its size), or a mermaid diagram (drawn from its source). The same
 * loader reads an old version for a history comparison.
 */
import { useEffect, useState } from 'react'
import type { ArtifactFormat, Rect } from '../../shared/types.ts'
import { renderMermaid } from './mermaid.ts'
import { rasterSvg, sanitiseSvg, type CleanSvg } from './sanitise.ts'

export interface CanvasSource {
  format: ArtifactFormat
  /** Where the file is (svg, raster). */
  url?: string
  /** The mermaid source. */
  source?: string
  /** Seeds mermaid's IDs, so the same diagram always draws the same way. */
  seed: string
  /** A raster's size, when the server already knows it. */
  bounds?: Rect | null
}

export interface CanvasContent extends CleanSvg {
  /** An image of the drawing (never live DOM), for the minimap and thumbnails. */
  imageUrl: string
}

const imageSize = (url: string) =>
  new Promise<{ w: number; h: number }>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => reject(new Error('the image could not be loaded'))
    img.src = url
  })

export async function loadCanvas(src: CanvasSource): Promise<CanvasContent> {
  if (src.format === 'raster') {
    const size = src.bounds ? { w: src.bounds.w, h: src.bounds.h } : await imageSize(src.url!)
    return { ...rasterSvg(src.url!, size.w, size.h), imageUrl: src.url! }
  }
  if (src.format === 'mermaid') {
    const text = await renderMermaid(src.seed, src.source ?? '')
    const clean = sanitiseSvg(text)
    return { ...clean, imageUrl: URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clean.svg)], { type: 'image/svg+xml' })) }
  }
  const res = await fetch(src.url!)
  if (!res.ok) throw new Error(res.status === 404 ? 'the file is missing' : `the file could not be read (${res.status})`)
  return { ...sanitiseSvg(await res.text()), imageUrl: src.url! }
}

export type Loaded<T> = { status: 'loading' } | { status: 'error'; error: string } | { status: 'ready'; value: T }

/** Load once per key; a new key (a changed file) loads afresh. */
export function useLoaded<T>(key: string | null, load: () => Promise<T>): Loaded<T> {
  const [state, setState] = useState<{ key: string | null; loaded: Loaded<T> }>({ key: null, loaded: { status: 'loading' } })
  useEffect(() => {
    if (key === null) return
    let live = true
    setState({ key, loaded: { status: 'loading' } })
    load().then(
      (value) => live && setState({ key, loaded: { status: 'ready', value } }),
      (e: Error) => live && setState({ key, loaded: { status: 'error', error: e.message } }),
    )
    return () => {
      live = false
    }
  }, [key])
  return state.key === key ? state.loaded : { status: 'loading' }
}
