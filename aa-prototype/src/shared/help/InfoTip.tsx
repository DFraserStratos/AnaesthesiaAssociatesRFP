/**
 * The one point-of-need help affordance (catch-up Phase 43a; US-15.0.1): a small
 * info glyph beside a section label that opens a short explanation from
 * `HELP_TOPICS`. A bottom sheet on the phone (`useSurface().Overlay`, never a
 * centred modal), an anchored popover on desktop (`usePopover` and
 * `PopoverPanel`'s `fixed` placement, so a scrolling table never clips it).
 *
 * Inside a sheet on the phone (the RVG code picker, the Billing sheet) a second
 * sheet would trap the first, so the tip there expands an inline note instead:
 * the sheet places `useInfoTip`'s `trigger` beside its title and its `panel`
 * under it. Everywhere else `<InfoTip topic=... />` is the whole thing.
 *
 * Native `title` tooltips elsewhere stay as hover extras; this is the help.
 * Imports nothing from apps or shell (PWA closure).
 */

import { Info } from 'lucide-react'
import { useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { accent, neutral, radius, type as typeScale } from '../../theme/tokens'
import { SurfaceCtx } from '../surface/context'
import { useOverlayTitleSeam } from '../surface/overlayTitle'
import { OverlayHeader } from '../surface/OverlayHeader'
import { usePopover } from '../ui/usePopover'
import { PopoverPanel } from '../ui/PopoverPanel'
import { Button } from '../ui/Button'
import { Pill } from '../ui/Pill'
import { HELP_TOPICS, type HelpTopic, type HelpTopicId } from './helpTopics'

/** The trigger's hook, kebab-case: `info-tip-capture-stack` for `capture.stack`, `info-tip-day-draft-lists` for `day.draftLists`. */
export function infoTipShot(topic: HelpTopicId): string {
  return `info-tip-${topic.replace(/\./g, '-').replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`
}

const GLYPH = 16
/** The phone's 44px hit area (convention: touch targets) and the desktop's 28px, around a 16px glyph. */
const HIT = { mobile: 44, web: 28 } as const
const POPOVER_WIDTH = 320
/** The one open desktop popover's closer: opening another closes it, whether by click or keyboard. */
let closeOpenTip: (() => void) | null = null
const EDGE = 8

function triggerStyle(variant: 'mobile' | 'web', active: boolean): CSSProperties {
  const hit = HIT[variant]
  // The balancing negative margin keeps the label row its own height.
  const pad = (hit - GLYPH) / 2
  return {
    flex: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: hit,
    height: hit,
    margin: -pad,
    padding: 0,
    border: 'none',
    borderRadius: radius.ctl,
    background: 'transparent',
    color: active ? accent.base : neutral.mist,
    cursor: 'pointer',
    verticalAlign: 'middle',
    // Above the siblings its hit area reaches over (a flex item paints under later ones otherwise).
    position: 'relative',
    zIndex: 1,
  }
}

function TopicBody({ topic, titleId, compact }: { topic: HelpTopic; titleId?: string; compact?: boolean }) {
  return (
    <>
      {titleId !== undefined && (
        <div id={titleId} style={{ fontSize: compact === true ? 14 : typeScale.sheetTitle.size, lineHeight: compact === true ? '20px' : `${typeScale.sheetTitle.line}px`, fontWeight: 700, color: neutral.ink }}>
          {topic.title}
        </div>
      )}
      {topic.body.map((p) => (
        <p key={p} style={{ margin: 0, fontSize: compact === true ? 13.5 : 14, lineHeight: compact === true ? '20px' : '21px', color: neutral.slate }}>
          {p}
        </p>
      ))}
      {topic.provisional !== undefined && (
        <span>
          <Pill size="sm" title={topic.provisional.oq !== undefined ? `Provisional: ${topic.provisional.oq}` : 'Provisional'}>
            Provisional
          </Pill>{' '}
          <span style={{ fontSize: 12.5, color: neutral.slate }}>{topic.provisional.note}</span>
        </span>
      )}
    </>
  )
}

export interface InfoTipParts {
  /** The glyph button (with the desktop popover inside its root). */
  trigger: ReactNode
  /** The phone's sheet, or the inline note inside a sheet; null on desktop. */
  panel: ReactNode
}

/**
 * The tip in two parts, for a site that places the note apart from the glyph
 * (a sheet's title row). Most sites use `<InfoTip />`.
 */
export function useInfoTip(topicId: HelpTopicId): InfoTipParts {
  // Outside a SurfaceProvider (a desktop page with no shared flow) the tip is a popover.
  const surface = useContext(SurfaceCtx)
  const variant = surface?.variant ?? 'web'
  const inSheet = useOverlayTitleSeam() !== null
  const topic = HELP_TOPICS[topicId]
  const shot = infoTipShot(topicId)
  const label = `About ${topic.title}`
  const [sheetOpen, setSheetOpen] = useState(false)
  const noteId = useId()
  const popover = usePopover()
  const [at, setAt] = useState<{ top: number; left: number } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // Desktop: place the popover under the glyph, flipping above (or left) at the viewport's edges.
  const place = useCallback(() => {
    const trigger = popover.triggerRef.current
    if (trigger === null) return
    const r = trigger.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = Math.min(POPOVER_WIDTH, vw - EDGE * 2)
    const height = panelRef.current?.firstElementChild?.getBoundingClientRect().height ?? 0
    const left = Math.max(EDGE, Math.min(r.left - 12, vw - width - EDGE))
    const below = r.bottom + 6
    const top = below + height > vh - EDGE && r.top - 6 - height >= EDGE ? r.top - 6 - height : below
    setAt((prev) => (prev !== null && prev.top === top && prev.left === left ? prev : { top, left }))
  }, [popover.triggerRef])

  // One popover open at a time (an outside pointerdown already closes it; a keyboard open does not).
  const { open: popoverOpen, setOpen: setPopoverOpen } = popover
  useEffect(() => {
    if (!popoverOpen) return undefined
    const close = () => setPopoverOpen(false)
    closeOpenTip?.()
    closeOpenTip = close
    return () => {
      if (closeOpenTip === close) closeOpenTip = null
    }
  }, [popoverOpen, setPopoverOpen])

  useLayoutEffect(() => {
    if (!popover.open) {
      setAt(null)
      return undefined
    }
    place()
    // A second pass once the panel has its height, so the flip sees it.
    const frame = window.requestAnimationFrame(place)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [popover.open, place])

  if (variant === 'web') {
    const active = popover.open
    return {
      trigger: (
        <span ref={popover.rootRef} style={{ display: 'inline-flex', flex: 'none' }}>
          <button
            type="button"
            {...popover.triggerProps}
            aria-label={label}
            data-shot={shot}
            className="aa-ctl"
            onClick={popover.toggle}
            style={triggerStyle('web', active)}
          >
            <Info size={GLYPH} strokeWidth={2} aria-hidden />
          </button>
          {popover.open && (
            <div ref={panelRef} style={{ display: 'contents' }}>
              <PopoverPanel
                id={popover.panelId}
                placement="fixed"
                at={at ?? { top: -9999, left: -9999 }}
                role="dialog"
                labelledBy={titleId}
                width={`min(${POPOVER_WIDTH}px, calc(100vw - ${EDGE * 2}px))`}
                padding={16}
                shot={`${shot}-popover`}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', textTransform: 'none', letterSpacing: 0, fontWeight: 400, whiteSpace: 'normal' }}>
                  <TopicBody topic={topic} titleId={titleId} compact />
                </div>
              </PopoverPanel>
            </div>
          )}
        </span>
      ),
      panel: null,
    }
  }

  // The phone, inside a sheet: an inline note the sheet places under its title.
  if (inSheet) {
    return {
      trigger: (
        <button
          type="button"
          aria-label={label}
          aria-expanded={sheetOpen}
          aria-controls={noteId}
          data-shot={shot}
          className="aa-ctl"
          onClick={() => setSheetOpen((v) => !v)}
          style={triggerStyle('mobile', sheetOpen)}
        >
          <Info size={GLYPH} strokeWidth={2} aria-hidden />
        </button>
      ),
      panel: sheetOpen ? (
        <div
          id={noteId}
          role="note"
          data-shot={`${shot}-note`}
          style={{ display: 'flex', flexDirection: 'column', gap: 8, background: neutral.bg, borderRadius: radius.ctl, padding: '12px 14px' }}
        >
          <TopicBody topic={topic} compact />
          <span>
            <Button variant="secondary" onClick={() => setSheetOpen(false)} style={{ minHeight: 44 }}>
              Got it
            </Button>
          </span>
        </div>
      ) : null,
    }
  }

  // The phone: a bottom sheet.
  const Overlay = surface!.Overlay
  return {
    trigger: (
      <button
        type="button"
        aria-label={label}
        aria-expanded={sheetOpen}
        data-shot={shot}
        className="aa-ctl"
        onClick={() => setSheetOpen(true)}
        style={triggerStyle('mobile', sheetOpen)}
      >
        <Info size={GLYPH} strokeWidth={2} aria-hidden />
      </button>
    ),
    panel: (
      <Overlay open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div data-shot={`${shot}-sheet`} style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
          <OverlayHeader title={topic.title} />
          <TopicBody topic={topic} />
          <Button variant="secondary" onClick={() => setSheetOpen(false)} style={{ width: '100%', marginTop: 4 }}>
            Got it
          </Button>
        </div>
      </Overlay>
    ),
  }
}

/** The glyph and its explanation, beside a section label. */
export function InfoTip({ topic }: { topic: HelpTopicId }) {
  const { trigger, panel } = useInfoTip(topic)
  return (
    <>
      {trigger}
      {panel}
    </>
  )
}

/**
 * A sheet or dialog title with its tip (the RVG code picker, the phone's Billing
 * sheet). Render it inside the Overlay: on the phone the tip then opens an
 * inline note under the title, never a second sheet over the first.
 */
export function InfoTipHeader({ title, topic, style }: { title: string; topic: HelpTopicId; style?: { marginBottom?: number } }) {
  const tip = useInfoTip(topic)
  return (
    <>
      <OverlayHeader title={title} {...(style !== undefined ? { style } : {})} trailing={tip.trigger} />
      {tip.panel !== null && <div style={{ marginBottom: style?.marginBottom ?? 0 }}>{tip.panel}</div>}
    </>
  )
}

