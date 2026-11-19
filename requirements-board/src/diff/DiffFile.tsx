/**
 * An artifact's file in the Diff review, by what it is: a drawing or image as the two pictures,
 * each opening full size; a Markdown document (a transcript, a note) typeset and paired by
 * paragraph like a card's text; a PDF as its first page each side, "File replaced". A mermaid
 * diagram is drawn from its source on each side (its source's own diff is a field above).
 */
import { artifactFormat, type ArtifactFormat } from '../../shared/types.ts'
import type { ArtifactDiff } from '../../shared/diff.ts'
import { artifactBlobUrl } from '../api.ts'
import { fetchText } from '../artifacts/ArtifactViewer.tsx'
import { useLoaded } from '../artifacts/content.ts'
import { MermaidPicture, PdfThumb } from '../artifacts/Thumb.tsx'
import { Empty, type Side } from './DiffFields.tsx'
import { Pair, TextBlocks, TextRows } from './DiffProse.tsx'

/** Past this many characters a one-sided document shows its opening only. */
const OPENING = 12_000

/** The file a side names: its sidecar's, or for a sidecar that does not parse, the one the server found for it. */
const fileOf = (rec: ArtifactDiff, side: Side) => rec[side]?.file ?? (side === 'before' ? rec.fileNameBefore : rec.fileNameAfter) ?? null
const hasSide = (rec: ArtifactDiff, side: Side) => !!rec[side] || fileOf(rec, side) != null

const urlOf = (rec: ArtifactDiff, side: Side) => {
  const sha = side === 'before' ? rec.fileBefore : rec.fileAfter
  return sha ? artifactBlobUrl(rec.id, sha, fileOf(rec, side) ?? undefined) : null
}

/** A side's file format; a side with nothing to go on takes the other side's. */
function formatOf(rec: ArtifactDiff, side?: Side): ArtifactFormat | null {
  const order: Side[] = side === 'before' ? ['before', 'after'] : ['after', 'before']
  const s = order.find((x) => hasSide(rec, x))
  return s ? artifactFormat({ file: fileOf(rec, s), source: rec[s]?.source ?? '' }) : null
}

function Picture({ rec, side, format }: { rec: ArtifactDiff; side: Side; format: ArtifactFormat | null }) {
  const a = rec[side]
  if (format === 'mermaid') return a?.source ? <div className="diff-picture">{<MermaidPicture id={rec.id} source={a.source} />}</div> : <Empty>No diagram</Empty>
  const url = urlOf(rec, side)
  if (!url) return <Empty>No file</Empty>
  if (format === 'pdf')
    return (
      <a className="diff-picture page" href={url} target="_blank" rel="noreferrer" title="Open the PDF">
        <PdfThumb url={url} />
      </a>
    )
  return (
    <a className="diff-picture" href={url} target="_blank" rel="noreferrer" title="Open full size">
      <img src={url} alt={side === 'before' ? 'Before' : 'After'} loading="lazy" />
    </a>
  )
}

/** Both sides of a Markdown file, read from git (or the disk), as text rows. */
function DocumentRows({ rec, tag }: { rec: ArtifactDiff; tag: string }) {
  const b = urlOf(rec, 'before')
  const a = urlOf(rec, 'after')
  const loaded = useLoaded(`${b}|${a}`, () => Promise.all([b ? fetchText(b) : '', a ? fetchText(a) : '']))
  if (loaded.status === 'loading') return <Pair op="same" tag={tag} before={<Empty>Reading the file</Empty>} after={<Empty>Reading the file</Empty>} />
  if (loaded.status === 'error') return <Pair op="same" tag={tag} before={<Empty>The file could not be read: {loaded.error}</Empty>} after={null} />
  return <TextRows before={loaded.value[0]} after={loaded.value[1]} expanded={false} tag={tag} />
}

/**
 * The file rows of an edited artifact, its name on the seam: the pictures, or the document's changed
 * paragraphs. A mermaid diagram's two drawings say whether the drawing changed. A file that changed
 * format shows each side as what it is: a Markdown side typeset (its opening), the other its picture.
 */
export function FileRows({ rec, changed }: { rec: ArtifactDiff; changed: boolean }) {
  const format = formatOf(rec)
  const before = formatOf(rec, 'before')
  const after = formatOf(rec, 'after')
  const tag = format === 'mermaid' ? (changed ? 'Drawing changed' : 'Drawing, unchanged') : format === 'pdf' && changed ? 'File replaced' : changed ? 'File' : 'File, unchanged'
  const markdown = before === 'markdown' && after === 'markdown'
  if (markdown && changed) return <DocumentRows rec={rec} tag={tag} />
  if (markdown || (format === 'pdf' && !changed)) return <Pair op="same" tag={tag} before={<Empty>Unchanged</Empty>} after={<Empty>Unchanged</Empty>} />
  const side = (s: Side, f: ArtifactFormat | null) => (f === 'markdown' ? <OneDocument rec={rec} side={s} /> : <Picture rec={rec} side={s} format={f} />)
  return <Pair op={changed ? 'edited' : 'same'} tag={tag} before={side('before', before)} after={side('after', after)} />
}

/** One side's file, for an added or removed artifact. */
export function FileSide({ rec, side }: { rec: ArtifactDiff; side: Side }) {
  const format = formatOf(rec, side)
  if (format !== 'markdown') return <Picture rec={rec} side={side} format={format} />
  return <OneDocument rec={rec} side={side} />
}

function OneDocument({ rec, side }: { rec: ArtifactDiff; side: Side }) {
  const url = urlOf(rec, side)
  const loaded = useLoaded(url, () => (url ? fetchText(url) : Promise.resolve('')))
  if (!url) return <Empty>No file</Empty>
  if (loaded.status !== 'ready') return <Empty>{loaded.status === 'error' ? `The file could not be read: ${loaded.error}` : 'Reading the file'}</Empty>
  const text = loaded.value
  const cut = text.length > OPENING ? text.slice(0, text.lastIndexOf('\n\n', OPENING) > 0 ? text.lastIndexOf('\n\n', OPENING) : OPENING) : text
  return (
    <>
      <TextBlocks text={cut} tag={side === 'after' ? 'ins' : 'del'} />
      {cut.length < text.length && <p className="diff-empty">The opening only. Open the artifact to read the rest.</p>}
    </>
  )
}
