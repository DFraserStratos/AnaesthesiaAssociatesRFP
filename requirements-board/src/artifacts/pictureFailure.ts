/**
 * Why a version of a picture is not shown, said truthfully (FINDINGS R-103, and the card timeline's
 * screenshots): nothing on that side, a version git never kept (the server's 404), one that was read
 * but could not be drawn, or one that could not be read at all. History compare and the card
 * timeline share the words.
 */
export type PictureFailure =
  /** No version on this side: before it was added, or after it was removed (an empty mermaid source too). */
  | { kind: 'none' }
  /** The server says the blob is not kept: a version that was never committed. */
  | { kind: 'gone' }
  /** Read, but it does not draw: a mermaid source that does not parse, a damaged PDF or image. */
  | { kind: 'drawn'; why: string }
  /** Not read: another server answer, or no answer. */
  | { kind: 'read'; why: string }

export function failureLabel(f: PictureFailure, side: 'Before' | 'After'): string {
  switch (f.kind) {
    case 'none':
      return side === 'Before' ? 'Not there yet' : 'Removed'
    case 'gone':
      return 'Not kept: this version was never committed'
    case 'drawn':
      return `Could not be drawn: ${f.why}`
    case 'read':
      return `Could not be read: ${f.why}`
  }
}

export const NOT_AN_IMAGE = 'not an image the browser can show'
const NO_ANSWER = 'the server did not answer'
const answered = (status: number) => `the server answered ${status}`

/** What the server says about a URL: kept (null), not kept, or unreadable. */
export async function askServer(url: string): Promise<PictureFailure | null> {
  let res: Response
  try {
    res = await fetch(url, { method: 'HEAD' })
  } catch {
    return { kind: 'read', why: NO_ANSWER }
  }
  if (res.status === 404) return { kind: 'gone' }
  return res.ok ? null : { kind: 'read', why: answered(res.status) }
}

/** An image URL that would not show: why, from the server, else it is not a picture the browser can draw. */
export async function whyNotShown(url: string): Promise<PictureFailure> {
  return (await askServer(url)) ?? { kind: 'drawn', why: NOT_AN_IMAGE }
}

/** Does the browser draw this image? */
export function decodes(url: string): Promise<boolean> {
  const img = new Image()
  img.src = url
  return img.decode().then(
    () => true,
    () => false,
  )
}

/** A pdf.js failure: its HTTP status when it has one (404 is not kept), else the PDF did not parse. */
export function pdfFailure(e: unknown): PictureFailure {
  const status = (e as { status?: unknown })?.status
  if (status === 404) return { kind: 'gone' }
  if (typeof status === 'number') return { kind: 'read', why: status ? answered(status) : NO_ANSWER }
  return { kind: 'drawn', why: (e as Error)?.message || 'the PDF did not open' }
}
