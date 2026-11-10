/**
 * A stepped diagram's bar, bottom left over the drawing, level with the view bar and in its style:
 * `‹ 3 of 8 ›`, the step's name, and Whole drawing. With no step chosen: one quiet control that
 * starts at step 1. The step's caption and balances are read in the panel's Steps tab, so the bar
 * never covers the drawing. The arrow keys step too (`ArtifactViewer`). The one live region that
 * announces a step (its number, name and caption) is here, since the bar shows whatever the
 * panel's tab.
 */
import { ChevronLeft, ChevronRight, ListOrdered, RotateCcw } from 'lucide-react'
import { useLayoutEffect, useRef } from 'react'
import type { Step } from '../../shared/types.ts'

/** A caption as it would be read aloud: link targets and emphasis marks dropped. */
const spoken = (md: string) => md.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim()

/** `onReplay`: plays the step's moves again, from the step before; given only when the step has moves. */
export function StepBar({ steps, at, onGo: go, onReplay }: { steps: Step[]; at: number; onGo: (index: number) => void; onReplay?: () => void }) {
  // One element whatever it shows, so focus stays in it (and the arrow keys keep stepping) when
  // the button pressed goes away or is disabled at the first or last step.
  const root = useRef<HTMLDivElement>(null)
  const hadFocus = useRef(false)
  const onGo = (i: number) => {
    hadFocus.current = !!root.current?.contains(document.activeElement)
    go(i)
  }
  useLayoutEffect(() => {
    const el = root.current
    if (!hadFocus.current || !el) return
    hadFocus.current = false
    const now = document.activeElement
    if (!el.contains(now) || (now instanceof HTMLButtonElement && now.disabled)) el.focus({ preventScroll: true })
  }, [at])
  const step = at >= 0 ? steps[at] : undefined
  const name = step ? step.name || step.id : ''
  const said = (
    <p className="sr-only" aria-live="polite">
      {step ? `Step ${at + 1} of ${steps.length}: ${name}. ${spoken(step.caption)}` : 'Whole drawing'}
    </p>
  )
  if (!step) {
    return (
      <div ref={root} className="step-bar is-idle" role="toolbar" aria-label="Steps" tabIndex={-1}>
        {said}
        <button className="btn ghost sm step-start" onClick={() => onGo(0)} title="Step through the drawing, one step at a time (right arrow)">
          <ListOrdered size={14} />
          Step through · {steps.length} step{steps.length === 1 ? '' : 's'}
        </button>
      </div>
    )
  }
  const prev = steps[at - 1]
  const next = steps[at + 1]
  return (
    <div ref={root} className="step-bar" role="toolbar" aria-label="Steps" tabIndex={-1}>
      {said}
      <button className="btn icon ghost sm" disabled={!prev} onClick={() => onGo(at - 1)} aria-label="Previous step" title={prev ? `Previous: ${prev.name} (left arrow)` : 'This is the first step'}>
        <ChevronLeft size={17} />
      </button>
      <span className="step-count">
        {at + 1} of {steps.length}
      </span>
      <button className="btn icon ghost sm" disabled={!next} onClick={() => onGo(at + 1)} aria-label="Next step" title={next ? `Next: ${next.name} (right arrow)` : 'This is the last step'}>
        <ChevronRight size={17} />
      </button>
      <span className="view-bar-rule" aria-hidden />
      <span className="step-bar-name" title={step.group ? `${step.group} · ${name}` : name}>
        {name}
      </span>
      {onReplay && (
        <button className="btn icon ghost sm step-replay" onClick={onReplay} aria-label="Replay this step" title="Replay this step">
          <RotateCcw size={14} />
        </button>
      )}
      <button className="btn ghost sm step-whole" onClick={() => onGo(-1)} title="Show the whole drawing, every step revealed, nothing dimmed">
        Whole drawing
      </button>
    </div>
  )
}
