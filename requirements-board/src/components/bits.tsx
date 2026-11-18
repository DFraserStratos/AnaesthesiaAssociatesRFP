import { Camera, FileText, MessageCircleQuestion, MessagesSquare, Monitor, NotebookPen, PanelsTopLeft, Workflow } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { componentCodeIn } from '../../shared/config.ts'
import { statusClasses, statusLabel, type StatusKind } from '../../shared/statuses.ts'
import { stepOf } from '../../shared/steps.ts'
import { typeLabel, parseArtifactRef, type Artifact, type ArtifactKind, type ArtifactStatus, type Item, type ItemType, type Question } from '../../shared/types.ts'
import { spotName } from '../artifactIndex.ts'
import { recordUrl } from '../nav.ts'
import { useCatalogue, useConfig } from '../store.ts'
import { ARTIFACT_KIND_LABEL, artifactStatusClass, typeClass } from '../vocab.ts'

/** The work-item type mark (after Azure DevOps' backlog icon), in the type's colour. */
export function TypeIcon({ type, size = 14 }: { type: ItemType; size?: number }) {
  return (
    <svg className={`type-icon ${typeClass(type)}`} width={size} height={size} viewBox="0 0 14 14" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4">
      {[1.5, 5.5, 9.5].map((y) => (
        <g key={y}>
          <rect x="1.5" y={y} width="4.5" height="3" rx="0.8" />
          <rect x="8" y={y} width="4.5" height="3" rx="0.8" />
        </g>
      ))}
    </svg>
  )
}

/** A title with its type icon: how an item is named everywhere outside its own sheet. */
export function ItemName({ item }: { item: Item }) {
  return (
    <span className={typeClass(item.type)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 0 }} title={item.id}>
      <TypeIcon type={item.type} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
    </span>
  )
}

/** An outstanding item named as everywhere outside its own sheet: the question mark in its amber, then its title. */
export function QuestionName({ question, title }: { question: Question; title?: string }) {
  return (
    <span className="ty-question" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 0 }} title={title ?? question.id}>
      <MessageCircleQuestion size={14} aria-hidden className="q-mark" />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{question.title}</span>
    </span>
  )
}

/** A card or outstanding item by name (as found by the caller); the bare ID only once it is gone. */
export function RecordName({ id, item, question }: { id: string; item?: Item; question?: Question }) {
  if (item) return <ItemName item={item} />
  if (question) return <QuestionName question={question} />
  return (
    <span className="mono" title="Not in the catalogue now">
      {id}
    </span>
  )
}

/** What a record's mark is drawn from: an item's type, an outstanding item, an artifact's kind. */
export type MarkOf = { kind: 'item'; type: ItemType } | { kind: 'question' } | { kind: 'artifact'; artifactKind: ArtifactKind }

/** The class that sets a record's type colour (`--ty`, `--ty-ink`, `--ty-tint`). */
export const markClass = (m: MarkOf) => (m.kind === 'item' ? typeClass(m.type) : `ty-${m.kind}`)

/** A record's mark: the type icon, the question mark or the artifact's kind icon, each in its colour. */
export function RecordMark({ mark, size = 14 }: { mark: MarkOf; size?: number }) {
  if (mark.kind === 'item') return <TypeIcon type={mark.type} size={size} />
  if (mark.kind === 'question') return <MessageCircleQuestion size={size} aria-hidden className="q-mark" />
  return <ArtifactIcon kind={mark.artifactKind} size={size} />
}

/** The lineage as arrow pills that slot into each other, each in its type colour. Pills are clickable when `onPick` is given. */
export function Lineage({ chain, onPick }: { chain: Item[]; onPick?: (id: string) => void }) {
  return (
    <nav className="lineage" aria-label="Lineage">
      {chain.map((it) => {
        const body = (
          <>
            <TypeIcon type={it.type} size={13} />
            <span>{it.title}</span>
          </>
        )
        return !onPick ? (
          <span key={it.id} className={`seg ${typeClass(it.type)}`} title={`${typeLabel(it.type)} · ${it.title}`}>
            {body}
          </span>
        ) : (
          <button key={it.id} type="button" className={`seg ${typeClass(it.type)}`} title={`${typeLabel(it.type)} · ${it.title}`} onClick={() => onPick(it.id)}>
            {body}
          </button>
        )
      })}
    </nav>
  )
}

/** A status pill. Item and question statuses take their label and tone from the project's config (`board.config.json`); artifact statuses are fixed. */
export function StatusLabel({ status, kind, className = '', children }: { status: string; kind: StatusKind | 'artifact'; className?: string; children?: ReactNode }) {
  const config = useConfig()
  const artifact = kind === 'artifact'
  return (
    <span className={`status ${artifact ? artifactStatusClass(status as ArtifactStatus) : statusClasses(config, kind, status)} ${className}`}>
      {artifact ? status : statusLabel(config, kind, status)}
      {children}
    </span>
  )
}

export function Glyph({ component }: { component: string }) {
  const config = useConfig()
  return (
    <span className="glyph" title={component}>
      {componentCodeIn(config, component)}
    </span>
  )
}

/**
 * A record's ID that copies a link to the record when clicked. Pasted over selected text in any
 * Markdown field, the link turns the selection into a link to the record.
 */
export function CopyLink({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])
  const copy = () => void navigator.clipboard?.writeText(recordUrl(id)).then(() => setCopied(true), () => {})
  return (
    <button type="button" className={`copy-link${className ? ` ${className}` : ''}`} onClick={copy} title="Copy a link to this card, to paste over text in a description or note">
      {copied ? 'Link copied' : children}
    </button>
  )
}

/** Highlight every search word in `text`. */
export function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const words = query.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return text
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))
}

const ARTIFACT_ICON: Record<ArtifactKind, typeof Workflow> = {
  diagram: Workflow,
  mockup: PanelsTopLeft,
  screenshot: Monitor,
  photo: Camera,
  transcript: MessagesSquare,
  note: NotebookPen,
  document: FileText,
}

/** An artifact's kind mark, in the artifact colour (set `ty-artifact` on an ancestor, or it inherits). Decorative: the kind is said in words nearby. */
export function ArtifactIcon({ kind, size = 14 }: { kind: ArtifactKind; size?: number }) {
  const Icon = ARTIFACT_ICON[kind] ?? FileText
  return (
    <Icon className="artifact-icon" size={size} aria-hidden strokeWidth={1.8}>
      <title>{ARTIFACT_KIND_LABEL[kind] ?? kind}</title>
    </Icon>
  )
}

/** An artifact named as everywhere outside its own page: its kind mark and title, then the spot in it. */
export function ArtifactName({ artifact, spot }: { artifact: Artifact; spot?: string | null }) {
  return (
    <span className="ty-artifact artifact-name" title={artifact.id}>
      <ArtifactIcon kind={artifact.kind} />
      <span className="artifact-name-title">{artifact.title}</span>
      {spot && <span className="artifact-name-spot">{spot}</span>}
    </span>
  )
}

/**
 * An artifact link (`AR-nn`, or `AR-nn#region` for a spot in it) named as everywhere else: its
 * mark, its title and the spot; the bare ref once it is gone. `at` names it as it stood at another
 * time (a side of the Diff review), the spot still read from the file as it is now when it can be.
 */
export function ArtifactRefName({ refText, at }: { refText: string; at?: Artifact }) {
  const { id, region } = parseArtifactRef(refText)
  const rec = useCatalogue((s) => s.artifacts[id])
  const data = at ?? rec?.data
  if (!data) return <span className="mono">{refText}</span>
  const spot = region ? ((rec ? spotName({ ...rec, data }, region) : null) ?? data.regions.find((r) => r.id === region)?.name ?? stepOf(data, region)?.name ?? region) : null
  return <ArtifactName artifact={data} spot={spot} />
}
