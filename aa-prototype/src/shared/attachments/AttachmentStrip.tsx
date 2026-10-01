import { useState } from 'react'
import { X } from 'lucide-react'
import { elevation, neutral, radius, semantic } from '../../theme/tokens'
import type { Attachment } from '../../domain/types'
import { useSurface } from '../surface'

interface AttachmentStripProps {
  attachments: readonly Attachment[]
  /** Shows the remove control on each thumbnail. */
  canRemove: boolean
  /** Removes one attachment; a refusal's message shows under the strip. */
  onRemove?: (attachmentId: string) => { ok: boolean; message?: string }
  /** The empty line, worded for the thing being read ("No attachments."). */
  emptyText: string
}

/**
 * The attachment thumbnails shared by a Booking and a whole List (US-03.1.3;
 * extracted from the Booking detail in catch-up Phase 15). A photo or a PDF
 * renders as its image; a PDF carries a small "PDF" chip so it never reads as a
 * photo. The remove control sits on the thumbnail itself, not in a row of
 * links: the target is what it deletes. On the desktop it fades in on hover
 * and stays MOUNTED while hidden, so focus reveals it and it stays reachable by
 * keyboard. A phone has no hover, so there it is always shown, with a 44px
 * touch target around the 24px mark.
 */
export function AttachmentStrip({ attachments, canRemove, onRemove, emptyText }: AttachmentStripProps) {
  const { variant } = useSurface()
  const touch = variant === 'mobile'
  const [hovered, setHovered] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  if (attachments.length === 0) return <div style={{ fontSize: 13, color: neutral.mist }}>{emptyText}</div>

  function remove(id: string) {
    const outcome = onRemove?.(id)
    setError(outcome !== undefined && !outcome.ok ? (outcome.message ?? 'That attachment could not be removed.') : null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {attachments.map((a) => (
          <div
            key={a.id}
            onMouseEnter={() => setHovered(a.id)}
            onMouseLeave={() => setHovered((current) => (current === a.id ? null : current))}
            style={{ width: 72, display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}
          >
            {a.dataUrl !== undefined ? (
              <img src={a.dataUrl} alt={a.name} style={{ width: 72, height: 92, objectFit: 'cover', borderRadius: 8, border: `1px solid ${neutral.line}`, background: neutral.surface }} />
            ) : (
              <div style={{ width: 72, height: 92, borderRadius: 8, background: neutral.sunken, display: 'flex', alignItems: 'center', justifyContent: 'center', color: neutral.mist, fontSize: 11 }}>{a.kind}</div>
            )}
            {a.kind === 'pdf' && (
              <span
                aria-hidden
                style={{ position: 'absolute', left: 4, top: 70, fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', color: neutral.slate, background: neutral.surface, border: `1px solid ${neutral.line}`, borderRadius: 4, padding: '1px 4px' }}
              >
                PDF
              </span>
            )}
            {canRemove && onRemove !== undefined && (
              <button
                type="button"
                aria-label={`Remove ${a.name}`}
                title={`Remove ${a.name}`}
                onClick={() => remove(a.id)}
                onFocus={() => setHovered(a.id)}
                onBlur={() => setHovered((current) => (current === a.id ? null : current))}
                style={{ position: 'absolute', top: -16, right: -16, width: 44, height: 44, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, opacity: touch || hovered === a.id ? 1 : 0, transition: 'opacity 120ms ease-out' }}
              >
                <span style={{ width: 24, height: 24, borderRadius: 999, border: `1px solid ${neutral.line}`, background: neutral.surface, color: semantic.error.onTint, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: elevation.e1 }}>
                  <X size={13} strokeWidth={2.6} aria-hidden />
                </span>
              </button>
            )}
            <span style={{ fontSize: 10, color: neutral.mist, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
          </div>
        ))}
      </div>
      {error !== null && (
        <div role="alert" style={{ background: semantic.error.tint, color: semantic.error.onTint, borderRadius: radius.ctl, padding: '8px 10px', fontSize: 12 }}>
          {error}
        </div>
      )}
    </div>
  )
}
