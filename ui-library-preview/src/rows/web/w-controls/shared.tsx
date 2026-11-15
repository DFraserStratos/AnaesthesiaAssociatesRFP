import type { ComponentProps, ReactNode } from 'react'
import { useWebFixtures as useProtoWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'

/**
 * Catalogue chrome reused as-is from the prototype catalogue (not product UI):
 * the dashed Knobs that switch a live example between states, KnobButton and
 * StageHint. Using the same chrome on both sides keeps the comparison about
 * the component, not the knobs.
 */
export { Knobs, KnobButton } from '@proto/apps/demo/catalogue/web/sandbox'
export { StageHint } from '@proto/apps/demo/catalogue/CatalogueKit.tsx'

/** The fields of the web catalogue fixtures this slice reads (the proto module is typed any). */
export interface WebFixtures {
  anaesthetistId: string
  personaName: string
  initials: string
  todayISO: string
  detailListId: string | undefined
  pastDayISO: string | undefined
}

export function useWebFixtures(): WebFixtures {
  return useProtoWebFixtures() as WebFixtures
}

/** The catalogue's quiet "what the last click did" line, in theme utilities. */
export function Echo({ children }: { children: ReactNode }) {
  // Screen-reader only while empty, as the left's Said renders nothing then: no reserved gap.
  const empty = children === null || children === undefined || children === false || children === ''
  return (
    <div role="status" className={empty ? 'tw:sr-only' : 'tw:mt-2 tw:text-[12.5px] tw:text-slate'}>
      {children}
    </div>
  )
}

/** Swallows a link's navigation: replacements never route. */
export function stop(e: { preventDefault: () => void }) {
  e.preventDefault()
}

/**
 * Render for a single-select ToggleGroupItem given role="radio": Base UI's Toggle
 * always sets aria-pressed, which is not allowed on a radio, so it is dropped here
 * and aria-checked carries the state (data-pressed still drives the styles).
 */
export function radioItemRender(props: ComponentProps<'button'>) {
  const { 'aria-pressed': _pressed, ...rest } = props
  return <button {...rest} />
}
