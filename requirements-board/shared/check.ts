/**
 * Catalogue integrity rules. Run by `npm run check`, by the dev server before
 * every write, and shown live in the app. Mirrors (and extends) the checks the
 * old build_requirements.py generator ran.
 */
import {
  ARTIFACT_EXTENSIONS,
  ARTIFACT_KINDS,
  ARTIFACT_STATUSES,
  COMPONENTS,
  IMAGE_APPS,
  ITEM_STATUSES,
  PARENT_TYPES,
  ITEM_TYPES,
  QUESTION_KINDS,
  QUESTION_STATUSES,
  VIEWPORTS,
  artifactFormat,
  linesOfRegionId,
  pageOfRegionId,
  parseArtifactRef,
  type Artifact,
  type ArtifactFormat,
  type Heading,
  type Issue,
  type Item,
  type Question,
  type Rect,
} from './types.ts'
import { isArtifactId, isQuestionId, itemTexts, mentions } from './links.ts'
import { ANCHOR_FORMATS, boxRect, isRegionId, looseText, matchSimpleSelector, normText, parseAnchor, rectWithin, type SvgElement } from './artifacts.ts'

export const ID_PATTERNS = {
  epic: /^EP-\d{2}$/,
  feature: /^FT-\d{2}\.\d+$/,
  story: /^US-\d{2}\.\d+\.\d+$/,
  question: /^OQ-\d{2,}$/,
  artifact: /^AR-\d{2,}$/,
} as const

/**
 * What the server read from an artifact's file (or mermaid source), for checking its regions.
 * Null from `artifactFacts` means "not read", so the file-dependent rules are skipped (the browser).
 */
export interface ArtifactFacts {
  format: ArtifactFormat | null
  /** The file is there and readable as its format. False with `error` when not. */
  ok: boolean
  error?: string
  bounds: Rect | null
  svg?: { texts: string[]; elements: SvgElement[] }
  /** Mermaid flowchart node IDs; null for diagram types whose IDs are not read. */
  nodeIds?: Set<string> | null
  markdown?: { headings: Heading[]; loose: string; lines: number }
  pdf?: { pages: { w: number; h: number; loose: string }[] }
}

export interface CheckInput {
  items: Item[]
  questions: Question[]
  /** Returns whether a catalogue-relative path exists. Omit to skip image checks (browser). */
  fileExists?: (relPath: string) => boolean
  /** The board's named swim lanes (`board-layout.json`). Omit to skip the lane check. */
  lanes?: string[]
  artifacts?: Artifact[]
  /** What each artifact's file holds. Omit (or return null) to skip the file and region checks. */
  artifactFacts?: (a: Artifact) => ArtifactFacts | null
}

export function checkCatalogue({ items, questions, fileExists, lanes, artifacts = [], artifactFacts }: CheckInput): Issue[] {
  const issues: Issue[] = []
  const err = (id: string, message: string) => issues.push({ severity: 'error', id, message })
  const warn = (id: string, message: string) => issues.push({ severity: 'warning', id, message })

  const byId = new Map<string, Item>()
  for (const it of items) {
    if (byId.has(it.id)) err(it.id, `duplicate ID ${it.id}`)
    byId.set(it.id, it)
  }

  for (const it of items) {
    if (!ITEM_TYPES.includes(it.type)) {
      err(it.id, `type "${it.type}" is not one of ${ITEM_TYPES.join(', ')}`)
      continue
    }
    if (!ID_PATTERNS[it.type].test(it.id)) err(it.id, `ID ${it.id} does not match the ${it.type} pattern`)
    if (!it.title.trim()) err(it.id, 'title is empty')
    if (!ITEM_STATUSES.includes(it.status)) err(it.id, `status "${it.status}" is not one of ${ITEM_STATUSES.join(', ')}`)
    for (const c of it.components) {
      if (!(COMPONENTS as readonly string[]).includes(c)) err(it.id, `component "${c}" is not in the vocabulary`)
    }
    if (it.components.length === 0) warn(it.id, 'no component')
    if (it.sources.length === 0 && it.status !== 'Retired') warn(it.id, 'no source')

    if (it.type === 'epic') {
      if (it.parent) err(it.id, 'an epic has no parent')
    } else if (!it.parent) {
      err(it.id, `a ${it.type} needs a parent`)
    } else {
      const parent = byId.get(it.parent)
      if (!parent) err(it.id, `parent ${it.parent} does not exist`)
      else if (!PARENT_TYPES[it.type].includes(parent.type)) {
        const allowed = PARENT_TYPES[it.type].join(' or ')
        err(it.id, `a ${it.type}'s parent must be ${/^[aeiou]/.test(allowed) ? 'an' : 'a'} ${allowed}, ${it.parent} is a ${parent.type}`)
      }
    }

    if (it.swimlane !== null) {
      if (it.type !== 'story') warn(it.id, `swimlane "${it.swimlane}" is set on ${it.type === 'epic' ? 'an' : 'a'} ${it.type}; only stories sit in lanes, so the board ignores it`)
      else if (lanes && !lanes.includes(it.swimlane)) warn(it.id, `swimlane "${it.swimlane}" is not a lane on the board; add it on the Mapped board or fix the name`)
    }

    for (const img of it.images) {
      if (!img.src) err(it.id, 'image with no src')
      else if (!img.src.startsWith('assets/')) err(it.id, `image ${img.src} must live under assets/ (the board only serves that folder)`)
      else if (fileExists && !fileExists(img.src)) err(it.id, `image file ${img.src} is missing`)
      if (!VIEWPORTS.includes(img.viewport)) err(it.id, `image viewport "${img.viewport}" is not desktop or mobile`)
      if (img.app !== undefined && !IMAGE_APPS.includes(img.app)) err(it.id, `image app "${img.app}" is not one of ${IMAGE_APPS.join(', ')}`)
      else if (img.app === 'mobile' && img.viewport !== 'mobile') warn(it.id, `image ${img.src} is from the mobile app but its viewport is ${img.viewport}`)
    }
  }

  const qIds = new Set<string>()
  for (const q of questions) {
    if (qIds.has(q.id)) err(q.id, `duplicate ID ${q.id}`)
    qIds.add(q.id)
  }

  // Related items: stored on one side, shown on both.
  const pairs = new Set<string>()
  for (const it of items) {
    const seen = new Set<string>()
    for (const r of it.related) {
      if (seen.has(r)) warn(it.id, `related lists ${r} twice`)
      seen.add(r)
      if (r === it.id) err(it.id, 'related lists the item itself')
      else if (isQuestionId(r)) err(it.id, `related lists ${r}, an outstanding item; list the item under its affects instead`)
      else if (!byId.has(r)) err(it.id, `related lists ${r}, which does not exist`)
      else {
        if (byId.get(r)!.status === 'Retired' && it.status !== 'Retired') warn(it.id, `related lists ${r}, which is retired`)
        if (pairs.has(`${r}|${it.id}`)) warn(it.id, `related lists ${r}, which already lists this item; keep it on one side`)
        pairs.add(`${it.id}|${r}`)
      }
    }
  }

  // Artifacts: the sidecar's own fields, its file, and every region against what the file holds.
  const artById = new Map<string, Artifact>()
  for (const a of artifacts) {
    if (artById.has(a.id)) err(a.id, `duplicate ID ${a.id}`)
    artById.set(a.id, a)
  }
  const factsOf = new Map<string, ArtifactFacts | null>()
  for (const a of artifacts) factsOf.set(a.id, artifactFacts ? artifactFacts(a) : null)
  /** Region IDs that resolve: the named ones, plus each PDF page and Markdown heading. */
  const regionExists = (a: Artifact, region: string) => {
    if (a.regions.some((r) => r.id === region)) return true
    const f = factsOf.get(a.id)
    const page = pageOfRegionId(region)
    if (page !== null) return !f || !f.pdf ? (f ? false : true) : page >= 1 && page <= f.pdf.pages.length
    const lines = linesOfRegionId(region)
    if (lines) return f?.markdown ? lines.to <= f.markdown.lines : !f
    return f?.markdown ? f.markdown.headings.some((h) => h.slug === region) : !f
  }
  const artifactRefProblem = (ref: string): string | null => {
    const { id, region } = parseArtifactRef(ref)
    const a = artById.get(id)
    if (!a) return 'that artifact does not exist'
    if (region !== null && !regionExists(a, region)) return `${a.id} has no region "${region}"`
    return null
  }

  for (const a of artifacts) {
    if (!ID_PATTERNS.artifact.test(a.id)) err(a.id, `ID ${a.id} does not match AR-nn`)
    if (!a.title.trim()) err(a.id, 'title is empty')
    if (!ARTIFACT_KINDS.includes(a.kind)) err(a.id, `kind "${a.kind}" is not one of ${ARTIFACT_KINDS.join(', ')}`)
    if (!ARTIFACT_STATUSES.includes(a.status)) err(a.id, `status "${a.status}" is not one of ${ARTIFACT_STATUSES.join(', ')}`)
    for (const c of a.components) if (!(COMPONENTS as readonly string[]).includes(c)) err(a.id, `component "${c}" is not in the vocabulary`)
    if (a.sources.length === 0 && a.status !== 'Superseded') warn(a.id, 'no source')
    if (a.date === null) warn(a.id, 'no date: when it was made (a meeting, a publication, a drawing)')
    else if (!isArtifactDate(a.date)) err(a.id, `date "${a.date}" is not YYYY-MM-DD, YYYY-MM or YYYY`)
    if (a.supersededBy !== null) {
      if (a.supersededBy === a.id) err(a.id, 'superseded_by names the artifact itself')
      else if (!artById.has(a.supersededBy)) err(a.id, `superseded_by ${a.supersededBy}, which does not exist`)
      if (a.status !== 'Superseded') warn(a.id, `superseded_by is set but the status is ${a.status}`)
    } else if (a.status === 'Superseded') warn(a.id, 'superseded, but superseded_by does not say by what')

    const format = artifactFormat(a)
    if (a.file && a.source.trim()) err(a.id, 'has both a file and a mermaid source; keep one')
    else if (!a.file && !a.source.trim()) err(a.id, 'has neither a file nor a mermaid source under ## Source')
    else if (a.file && !format) {
      const exts = Object.values(ARTIFACT_EXTENSIONS).flat().join(', ')
      err(a.id, `file ${a.file} is not a kind the board shows (${exts})`)
    }
    const f = factsOf.get(a.id)
    if (f && !f.ok) err(a.id, f.error ?? `file ${a.file} cannot be read`)

    const seen = new Set<string>()
    for (const r of a.regions) {
      const where = `region ${r.id || '(no id)'}`
      if (!isRegionId(r.id)) err(a.id, `${where}: the id must be lower-case words joined by hyphens`)
      else if (seen.has(r.id)) err(a.id, `${where} is listed twice`)
      else if (pageOfRegionId(r.id) !== null || f?.markdown?.headings.some((h) => h.slug === r.id)) err(a.id, `${where}: the id is taken by a page or heading of the document; name it differently`)
      seen.add(r.id)
      if (!r.name) err(a.id, `${where} has no name`)
      if (!r.around.length && !r.box) err(a.id, `${where} needs anchors (around) or a box`)
      if (r.pad !== null && !(r.pad >= 0)) err(a.id, `${where}: pad must be a number, 0 or more`)
      if (r.page !== null && format !== 'pdf') err(a.id, `${where}: page only applies to a PDF`)
      if (format === 'pdf' && r.page === null) err(a.id, `${where}: a PDF region needs a page`)
      if (r.page !== null && !(Number.isInteger(r.page) && r.page >= 1)) err(a.id, `${where}: page must be a whole number from 1`)
      const pdfPage = f?.pdf && r.page !== null ? f.pdf.pages[r.page - 1] : undefined
      if (f?.pdf && r.page !== null && Number.isInteger(r.page) && !pdfPage) err(a.id, `${where}: page ${r.page} is past the end (${f.pdf.pages.length} pages)`)

      if (r.box) {
        if (!r.box.every(Number.isFinite) || r.box[2] <= 0 || r.box[3] <= 0) err(a.id, `${where}: box must be four numbers, x y width height, with a width and height above 0`)
        else if (format === 'markdown') err(a.id, `${where}: a Markdown document has no coordinates; use quote= or heading=`)
        else {
          const within = format === 'pdf' ? (pdfPage ? { x: 0, y: 0, w: pdfPage.w, h: pdfPage.h } : null) : (f?.bounds ?? null)
          if (within && !rectWithin(boxRect(r.box), within)) err(a.id, `${where}: the box lies outside the ${format === 'pdf' ? 'page' : 'drawing'}`)
        }
      }

      for (const anchor of r.around) {
        const { kind, value } = parseAnchor(anchor)
        const label = `${where}: anchor "${anchor}"`
        if (!value.trim()) {
          err(a.id, `${label} is empty`)
          continue
        }
        if (format && !ANCHOR_FORMATS[kind].includes(format)) {
          err(a.id, `${label} does not apply to ${format === 'raster' ? 'an image' : `a ${format === 'markdown' ? 'Markdown document' : format.toUpperCase()}`}${format === 'raster' ? '; use a box' : ''}`)
          continue
        }
        if (!f) continue
        if (kind === 'text' && f.svg) {
          const n = f.svg.texts.filter((t) => t === normText(value)).length
          if (!n) err(a.id, `${label} matches no text in the drawing`)
          else if (n > 1) warn(a.id, `${label} matches ${n} texts, and the box spans them all`)
        } else if (kind === 'css' && f.svg) {
          const n = matchSimpleSelector(value, f.svg.elements)
          if (n === 0) err(a.id, `${label} matches nothing in the drawing`)
          else if (n === null) warn(a.id, `${label} is not checked here; the board resolves it`)
          else if (n > 1) warn(a.id, `${label} matches ${n} elements, and the box spans them all`)
        } else if (kind === 'node') {
          if (f.nodeIds === null) warn(a.id, `${label} is not checked: only flowchart node IDs are read`)
          else if (f.nodeIds && !f.nodeIds.has(value.trim())) err(a.id, `${label}: the diagram has no node ${value.trim()}`)
        } else if (kind === 'heading' && f.markdown) {
          if (!f.markdown.headings.some((h) => h.text === normText(value))) err(a.id, `${label} matches no heading in the document`)
        } else if (kind === 'quote') {
          const q = looseText(value)
          if (f.markdown && !f.markdown.loose.includes(q)) err(a.id, `${label} is not in the document`)
          if (f.pdf && pdfPage && !pdfPage.loose.includes(q)) err(a.id, `${label} is not on page ${r.page}`)
        }
      }
    }
  }

  // Items point at artifacts in their frontmatter; the board shows the link on both sides.
  for (const it of items) {
    const seen = new Set<string>()
    for (const ref of it.artifacts ?? []) {
      if (seen.has(ref)) warn(it.id, `artifacts lists ${ref} twice`)
      seen.add(ref)
      if (!/^AR-\d{2,}(#[A-Za-z0-9-]+)?$/.test(ref)) {
        err(it.id, `artifacts entry "${ref}" is not AR-nn or AR-nn#region`)
        continue
      }
      const problem = artifactRefProblem(ref)
      if (problem) err(it.id, `artifacts lists ${ref}: ${problem}`)
      else if (it.status !== 'Retired' && artById.get(parseArtifactRef(ref).id)!.status === 'Superseded') {
        const by = artById.get(parseArtifactRef(ref).id)!.supersededBy
        warn(it.id, `artifacts lists ${ref}, which is superseded${by ? ` by ${by}` : ''}`)
      }
    }
  }

  // Links in the text. A question can be deleted, so a link to a missing one warns rather than blocking the delete.
  // A bare mention of a retired item is history ("merges the former US-01.3.4"), so only a link to one warns.
  // Links in an artifact's description only warn: the board cannot rewrite an artifact, so they must never block a save or a delete.
  const linksIn = (id: string, texts: string[], live: boolean, soft = false) => {
    const fail = soft ? warn : err
    for (const m of mentions(texts.join('\n\n'))) {
      const how = m.bare ? 'mentions' : 'links to'
      if (isArtifactId(m.id)) {
        const problem = artifactRefProblem(m.id)
        if (problem) (m.bare ? warn : fail)(id, `the text ${how} ${m.id}: ${problem}`)
        else if (live && !m.bare && artById.get(parseArtifactRef(m.id).id)!.status === 'Superseded') warn(id, `the text links to ${m.id}, which is superseded`)
      } else if (isQuestionId(m.id)) {
        if (!qIds.has(m.id)) warn(id, `the text ${how} ${m.id}, which does not exist`)
      } else if (!byId.has(m.id)) {
        if (m.bare) warn(id, `the text mentions ${m.id}, which does not exist`)
        else fail(id, `the text links to ${m.id}, which does not exist`)
      } else if (live && !m.bare && byId.get(m.id)!.status === 'Retired') warn(id, `the text links to ${m.id}, which is retired`)
    }
  }
  for (const it of items) linksIn(it.id, itemTexts(it), it.status !== 'Retired')
  for (const a of artifacts) linksIn(a.id, [a.description], a.status !== 'Superseded', true)
  for (const q of questions) linksIn(q.id, [q.question, q.answer], q.status !== 'Answered')

  for (const q of questions) {
    if (!ID_PATTERNS.question.test(q.id)) err(q.id, `ID ${q.id} does not match OQ-nn`)
    if (!QUESTION_KINDS.includes(q.kind)) err(q.id, `kind "${q.kind}" is not one of ${QUESTION_KINDS.join(', ')}`)
    if (!q.title.trim()) err(q.id, 'title is empty')
    if (!QUESTION_STATUSES.includes(q.status)) err(q.id, `status "${q.status}" is not one of ${QUESTION_STATUSES.join(', ')}`)
    for (const a of q.affects) if (!byId.has(a)) err(q.id, `affects ${a}, which does not exist`)
    if (q.affects.length === 0) warn(q.id, 'affects no items')
    if (q.status === 'Answered' && !q.answer.trim()) warn(q.id, 'answered but the answer is empty')
  }

  return issues
}

/** `YYYY-MM-DD`, `YYYY-MM` or `YYYY`, and a real day. */
export function isArtifactDate(s: string): boolean {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(s)
  if (!m) return false
  const month = m[2] ? Number(m[2]) : 1
  const day = m[3] ? Number(m[3]) : 1
  const d = new Date(Date.UTC(Number(m[1]), month - 1, day))
  return month >= 1 && month <= 12 && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
}

export const hasErrors = (issues: Issue[]) => issues.some((i) => i.severity === 'error')
export const issueKey = (i: Issue) => `${i.severity}|${i.id}|${i.message}`
