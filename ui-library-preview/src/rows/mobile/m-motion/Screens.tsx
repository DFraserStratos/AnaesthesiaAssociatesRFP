import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { animate, motion, useDragControls, useMotionValue, useReducedMotion, useScroll, useTransform, type PanInfo } from 'motion/react'
import { ChevronLeft } from 'lucide-react'
import { clockISO, useAppStore } from '@proto/store'
import { isoTimeLabel, minutesBetweenIso, shiftIsoMinutes } from '@proto/shared/capture/timeIso'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Bleed, EASE_CARD, Missing, T, useMobilePersona, useSeedPicks } from './shared'

/** The capture card (CaptureSection) on Card: micro-caps h3 label, flat, 16px padding, 12px gap. */
export function CaptureCard({ label, children }: { label: string; children: ReactNode }) {
  const id = useId()
  return (
    <Card role="group" aria-labelledby={id} className="tw:flex-none tw:gap-3 tw:py-4 tw:shadow-none tw:[--card-spacing:--spacing(4)]">
      <CardHeader>
        <h3 id={id} className="tw:m-0 tw:text-[11px] tw:leading-[14px] tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase">
          {label}
        </h3>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

/** The teal back action ("< Lists"): 44px tall, 15/600. */
function BackButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <Button variant="link" onClick={onClick} className="tw:min-h-11 tw:flex-none tw:gap-1 tw:self-start tw:text-[15px] tw:font-semibold">
      <ChevronLeft className="tw:size-[18px]" strokeWidth={2.4} aria-hidden />
      {label}
    </Button>
  )
}

// ===========================================================================
// SlideStack on Motion
// ===========================================================================

export interface StackLayer {
  key: string
  node: ReactNode
}

const EDGE_ZONE_PX = 28
const COMMIT_FRACTION = 0.35
const COMMIT_VELOCITY = 500 // px per second (today: 0.5 px/ms)

/**
 * The iOS-style stack: every layer stays mounted; the active one at x 0, the one behind at -24%
 * dimmed 8%, those ahead parked off right. Motion animates x on the card-advance curve (260ms). The
 * active layer answers an edge drag from its left 28px (Motion drag via drag controls, x only,
 * bounded 0 to its width); release past 35% or flung faster than 500px/s pops, otherwise it springs
 * back. Parked layers are `inert` (a real boolean in React 19) and aria-hidden; focus moves to the
 * new layer's heading on push and pop.
 */
export function SlideStack({ layers, depth, onPop, mouseCanDrag }: { layers: StackLayer[]; depth: number; onPop?: () => void; mouseCanDrag: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(390)
  useLayoutEffect(() => {
    const el = rootRef.current
    if (el === null) return undefined
    const measure = () => setWidth(el.offsetWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={rootRef} className="tw:absolute tw:inset-0 tw:overflow-hidden">
      {layers.map((layer, i) => (
        <Layer key={layer.key} index={i} depth={depth} width={width} onPop={depth > 0 ? onPop : undefined} mouseCanDrag={mouseCanDrag}>
          {layer.node}
        </Layer>
      ))}
    </div>
  )
}

function Layer({ index, depth, width, onPop, mouseCanDrag, children }: { index: number; depth: number; width: number; onPop?: () => void; mouseCanDrag: boolean; children: ReactNode }) {
  const reduced = useReducedMotion() === true
  const active = index === depth
  const behind = index < depth
  const target = active ? 0 : behind ? -0.24 * width : width
  const x = useMotionValue(target)
  const lastWidth = useRef(width)
  const controls = useDragControls()
  const ref = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)

  useEffect(() => {
    if (lastWidth.current !== width) {
      lastWidth.current = width
      x.jump(target)
      return undefined
    }
    const c = animate(x, target, { duration: reduced ? T.reduced : active ? T.cardIn : T.cardReturn, ease: EASE_CARD })
    return () => c.stop()
  }, [target, width, active, reduced, x])

  // Focus the heading of the layer that just became active (not on first mount).
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    if (active) ref.current?.querySelector<HTMLElement>('[data-stack-focus]')?.focus({ preventScroll: true })
  }, [active])

  const draggable = active && onPop !== undefined
  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > width * COMMIT_FRACTION || info.velocity.x > COMMIT_VELOCITY) onPop?.()
    else animate(x, 0, { duration: reduced ? T.reduced : T.cardReturn, ease: EASE_CARD })
  }

  return (
    <motion.div
      ref={ref}
      data-testid={`slide-${index}`}
      aria-hidden={!active}
      inert={!active}
      drag={draggable ? 'x' : false}
      dragListener={false}
      dragControls={controls}
      dragConstraints={{ left: 0, right: width }}
      dragElastic={0}
      dragMomentum={false}
      onDragEnd={onDragEnd}
      style={{ x }}
      className={cn(
        'tw:absolute tw:inset-0 tw:bg-[var(--aa-bg)]',
        active && index > 0 && 'tw:shadow-[-16px_0_32px_color-mix(in_srgb,var(--aa-ink)_12%,transparent)]',
        active ? 'tw:pointer-events-auto' : 'tw:pointer-events-none',
      )}
    >
      {children}
      {draggable && (
        // The 28px edge zone that starts the drag; touch only unless the option lets the mouse in.
        <div
          aria-hidden
          className="tw:absolute tw:inset-y-0 tw:left-0 tw:z-10 tw:touch-pan-y"
          style={{ width: EDGE_ZONE_PX }}
          onPointerDown={(e) => {
            if (e.pointerType === 'mouse' && !mouseCanDrag) return
            if (ref.current?.querySelector('[role="dialog"][aria-modal]') != null) return
            controls.start(e)
          }}
        />
      )}
      <motion.div
        aria-hidden
        className="tw:pointer-events-none tw:absolute tw:inset-0 tw:bg-ink"
        initial={false}
        animate={{ opacity: behind ? 0.08 : 0 }}
        transition={{ duration: reduced ? T.reduced : T.cardIn, ease: EASE_CARD }}
      />
    </motion.div>
  )
}

function MiniLayer({ title, back, onBack, children }: { title: string; back?: string; onBack?: () => void; children: ReactNode }) {
  return (
    <div className="tw:box-border tw:flex tw:h-full tw:flex-col tw:gap-3 tw:px-5 tw:py-3.5">
      {back !== undefined && onBack !== undefined && <BackButton label={back} onClick={onBack} />}
      <h2 data-stack-focus tabIndex={-1} className="tw:m-0 tw:text-2xl tw:leading-[30px] tw:font-bold tw:outline-none">
        {title}
      </h2>
      {children}
    </div>
  )
}

export function SlideStackReplacement({ mouseCanDrag }: { mouseCanDrag: boolean }) {
  const [depth, setDepth] = useState(0)
  const pop = () => setDepth((d) => Math.max(0, d - 1))
  const push = () => setDepth((d) => Math.min(2, d + 1))
  const layers: StackLayer[] = [
    {
      key: 'home',
      node: (
        <MiniLayer title="Lists">
          <Button size="cta" className="tw:w-full" onClick={push}>Open a List</Button>
        </MiniLayer>
      ),
    },
    {
      key: 'list',
      node: (
        <MiniLayer title="List" back="Lists" onBack={pop}>
          <Button size="cta" className="tw:w-full" onClick={push}>Open a Booking</Button>
        </MiniLayer>
      ),
    },
    {
      key: 'booking',
      node: (
        <MiniLayer title="Booking" back="List" onBack={pop}>
          <div className="tw:text-sm tw:text-slate">{mouseCanDrag ? 'Drag from the left edge (touch or mouse) or tap back.' : 'Swipe from the left edge (touch only) or tap back.'}</div>
        </MiniLayer>
      ),
    },
  ]
  return (
    <Bleed>
      <div className="tw:relative tw:flex-1">
        <SlideStack layers={layers} depth={depth} onPop={pop} mouseCanDrag={mouseCanDrag} />
      </div>
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:border-t tw:border-line tw:bg-surface tw:px-3.5 tw:py-2.5">
        <Button variant="pill" className="tw:h-11" onClick={pop} disabled={depth === 0}>Pop</Button>
        <Button variant="pill" className="tw:h-11" onClick={push} disabled={depth === 2}>Push</Button>
        <span className="tw:text-[12.5px] tw:text-mist">Depth {depth}</span>
      </div>
    </Bleed>
  )
}

// ===========================================================================
// Collapsing masthead
// ===========================================================================

const COLLAPSE_AT = 24
const EXPAND_AT = 6
const NAME = 'Patient name'

/** Threshold fold (as today): two thresholds with hysteresis, the fold animated on Motion (240ms card return). */
function useThresholdFold(scrollRef: RefObject<HTMLDivElement | null>) {
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    const el = scrollRef.current
    if (el === null) return undefined
    const onScroll = () => setCollapsed((was) => (was ? el.scrollTop > EXPAND_AT : el.scrollTop > COLLAPSE_AT))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollRef])
  return collapsed
}

function ThresholdHeader({ scrollRef }: { scrollRef: RefObject<HTMLDivElement | null> }) {
  const collapsed = useThresholdFold(scrollRef)
  const reduced = useReducedMotion() === true
  const fold = { duration: reduced ? T.reduced : T.cardReturn, ease: EASE_CARD }
  return (
    <div className="tw:flex-none tw:border-b tw:border-line tw:bg-surface tw:px-5 tw:pt-1.5 tw:pb-3.5">
      <div className="tw:flex tw:min-h-11 tw:items-center tw:gap-2.5">
        <BackButton label="List" />
        <motion.span
          aria-hidden={!collapsed}
          className="tw:flex tw:min-w-0 tw:items-center tw:gap-2 tw:overflow-hidden"
          initial={false}
          animate={{ opacity: collapsed ? 1 : 0, maxWidth: collapsed ? '100%' : '0%' }}
          transition={{ ...fold, opacity: { duration: reduced ? T.reduced : 0.2, ease: 'easeOut' } }}
        >
          <span className="tw:truncate tw:text-[17px] tw:leading-6 tw:font-semibold">{NAME}</span>
          <Badge variant="private" className="tw:flex-none tw:px-2 tw:py-[3px]">Private</Badge>
        </motion.span>
      </div>
      <motion.div
        className="tw:overflow-hidden"
        initial={false}
        animate={{ height: collapsed ? 0 : 'auto', opacity: collapsed ? 0 : 1 }}
        transition={{ ...fold, opacity: { duration: reduced ? T.reduced : 0.18, ease: 'easeOut' } }}
        aria-hidden={collapsed}
      >
        <h2 className="tw:m-0 tw:text-2xl tw:leading-[30px] tw:font-bold tw:tracking-[-0.01em]">{NAME}</h2>
        <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-1">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
            <Badge variant="private">Private</Badge>
            <Button variant="pill" className="tw:h-11" tabIndex={collapsed ? -1 : undefined}>History</Button>
          </div>
          <span className="tw:text-xs tw:text-mist">Operation · Hospital</span>
        </div>
      </motion.div>
    </div>
  )
}

/** Scroll-linked fold: the big title and its block shrink with the scroll (0 to 48px), the nav title fades in. */
function LinkedHeader({ scrollRef }: { scrollRef: RefObject<HTMLDivElement | null> }) {
  const { scrollY } = useScroll({ container: scrollRef as RefObject<HTMLElement> })
  const reduced = useReducedMotion() === true
  const end = reduced ? 1 : 48
  const blockHeight = useTransform(scrollY, [0, end], [112, 0], { clamp: true })
  const blockOpacity = useTransform(scrollY, [0, end * 0.6], [1, 0], { clamp: true })
  const navOpacity = useTransform(scrollY, [end * 0.5, end], [0, 1], { clamp: true })
  return (
    <div className="tw:flex-none tw:border-b tw:border-line tw:bg-surface tw:px-5 tw:pt-1.5 tw:pb-3.5">
      <div className="tw:flex tw:min-h-11 tw:items-center tw:gap-2.5">
        <BackButton label="List" />
        <motion.span className="tw:flex tw:min-w-0 tw:items-center tw:gap-2 tw:overflow-hidden" style={{ opacity: navOpacity }}>
          <span className="tw:truncate tw:text-[17px] tw:leading-6 tw:font-semibold">{NAME}</span>
          <Badge variant="private" className="tw:flex-none tw:px-2 tw:py-[3px]">Private</Badge>
        </motion.span>
      </div>
      <motion.div className="tw:overflow-hidden" style={{ height: blockHeight, opacity: blockOpacity }}>
        <h2 className="tw:m-0 tw:text-2xl tw:leading-[30px] tw:font-bold tw:tracking-[-0.01em]">{NAME}</h2>
        <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-1">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
            <Badge variant="private">Private</Badge>
            <Button variant="pill" className="tw:h-11">History</Button>
          </div>
          <span className="tw:text-xs tw:text-mist">Operation · Hospital</span>
        </div>
      </motion.div>
    </div>
  )
}

export function CollapsingMastheadReplacement({ mode }: { mode: 'threshold' | 'linked' }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  return (
    <Bleed className="tw:bg-[var(--aa-bg)]">
      {mode === 'threshold' ? <ThresholdHeader scrollRef={scrollRef} /> : <LinkedHeader scrollRef={scrollRef} />}
      <div ref={scrollRef} className="tw:flex tw:flex-1 tw:flex-col tw:gap-3 tw:overflow-auto tw:px-5 tw:pt-3.5">
        <div className="tw:text-[13px] tw:leading-[normal] tw:text-slate">
          {mode === 'threshold' ? 'Scroll this column: past 24px the masthead folds to a nav row.' : 'Scroll this column: the masthead folds with the scroll, over the first 48px.'}
        </div>
        {['Patient', 'ASA status', 'RVG code', 'Times', 'Units', 'Notes'].map((label) => (
          <CaptureCard key={label} label={label}>
            <div className="tw:h-12 tw:rounded-ctl tw:bg-sunken" />
          </CaptureCard>
        ))}
        <div aria-hidden className="tw:h-5 tw:flex-none" />
      </div>
    </Bleed>
  )
}

// ===========================================================================
// TimesCard
// ===========================================================================

interface Procedure {
  id: string
  anaestheticStartISO?: string
  handoverISO?: string
}

/** A nudge (-5 / +5): outline Button, 44 by 36, 15/600 slate. */
function Nudge({ label, aria, onClick }: { label: string; aria: string; onClick: () => void }) {
  return (
    <Button variant="outline" aria-label={aria} onClick={onClick} className="tw:h-9 tw:w-11 tw:px-0 tw:text-[15px] tw:text-slate">
      {label}
    </Button>
  )
}

function RecordedTime({ label, iso, onNudge }: { label: 'Start' | 'Finish'; iso: string; onNudge: (delta: number) => void }) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-1.5">
      <div className="tw:text-xs tw:font-semibold tw:text-slate">{label}</div>
      <div className="tw:font-mono tw:text-2xl tw:font-bold tw:tabular-nums">{isoTimeLabel(iso) as string}</div>
      <div className="tw:flex tw:gap-1.5">
        <Nudge label="−5" aria={`${label} 5 minutes earlier`} onClick={() => onNudge(-5)} />
        <Nudge label="+5" aria={`${label} 5 minutes later`} onClick={() => onNudge(5)} />
      </div>
    </div>
  )
}

/**
 * Start and Finish as one travelling teal action, local state only. The seeded procedure's times
 * are the starting values; Start now and Finish now stamp the demo clock (read, never written) with
 * the prototype's five-minute rules. The action is a Motion `layout` element that moves between the
 * two grid cells (260ms card advance); the stamp and its nudges fade up behind it.
 */
export function TimesCardReplacement() {
  const { anaesthetistId } = useMobilePersona()
  const picks = useSeedPicks(anaesthetistId)
  const procedure = useAppStore((s: { schedule: { procedures: Record<string, Procedure> } }) => (picks.procedureId !== null ? s.schedule.procedures[picks.procedureId] : undefined)) as Procedure | undefined
  const reduced = useReducedMotion() === true
  // The seeded times as first read: Start again returns to these, even if the current example has since written the store.
  const [initial] = useState(() => ({ start: procedure?.anaestheticStartISO, finish: procedure?.handoverISO }))
  const [start, setStart] = useState<string | undefined>(initial.start)
  const [finish, setFinish] = useState<string | undefined>(initial.finish)
  if (procedure === undefined) return <Missing what="procedure" />
  const now = () => clockISO(useAppStore.getState().clock) as string

  function stampFinish() {
    const stamped = now()
    setFinish(start !== undefined && (minutesBetweenIso(start, stamped) as number) < 5 ? (shiftIsoMinutes(start, 5) as string) : stamped)
  }
  function nudgeStart(delta: number) {
    if (start === undefined) return
    let next = shiftIsoMinutes(start, delta) as string
    if (finish !== undefined && (minutesBetweenIso(next, finish) as number) < 5) next = shiftIsoMinutes(finish, -5) as string
    setStart(next)
  }
  function nudgeFinish(delta: number) {
    if (finish === undefined) return
    let next = shiftIsoMinutes(finish, delta) as string
    if (start !== undefined && (minutesBetweenIso(start, next) as number) < 5) next = shiftIsoMinutes(start, 5) as string
    setFinish(next)
  }

  const hasStart = start !== undefined
  const reveal = { duration: reduced ? T.reduced : T.valueStep, ease: 'easeOut' as const, delay: reduced ? 0 : 0.05 }
  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      <CaptureCard label="Times">
        <div className="tw:relative tw:grid tw:min-h-24 tw:w-full tw:grid-cols-2 tw:items-start tw:gap-3">
          <motion.div aria-hidden={!hasStart} initial={false} animate={{ opacity: hasStart ? 1 : 0, y: hasStart ? 0 : 4 }} transition={reveal} className={cn('tw:min-w-0', !hasStart && 'tw:pointer-events-none')}>
            {start !== undefined && <RecordedTime label="Start" iso={start} onNudge={nudgeStart} />}
          </motion.div>
          <motion.div aria-hidden={finish === undefined} initial={false} animate={{ opacity: finish !== undefined ? 1 : 0, y: finish !== undefined ? 0 : 4 }} transition={reveal} className="tw:min-w-0">
            {finish !== undefined && <RecordedTime label="Finish" iso={finish} onNudge={nudgeFinish} />}
          </motion.div>
          {finish === undefined && (
            <motion.div
              layout
              transition={{ layout: { duration: reduced ? T.reduced : T.cardIn, ease: EASE_CARD } }}
              className="tw:absolute tw:top-0 tw:w-[calc((100%-12px)/2)]"
              style={hasStart ? { right: 0 } : { left: 0 }}
            >
              <Button className="tw:min-h-24 tw:w-full tw:rounded-[12px]! tw:text-base tw:font-bold" onClick={hasStart ? stampFinish : () => setStart(now())}>
                {hasStart ? 'Finish now' : 'Start now'}
              </Button>
            </motion.div>
          )}
        </div>
      </CaptureCard>
      <Button
        variant="pill"
        className="tw:h-11 tw:self-start"
        onClick={() => {
          setStart(initial.start)
          setFinish(initial.finish)
        }}
      >
        Start again
      </Button>
    </div>
  )
}
