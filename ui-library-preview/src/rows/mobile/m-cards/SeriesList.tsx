import { useMemo, useState } from 'react'
import { Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { Item, ItemActions, ItemContent, ItemFooter, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { useAnaesthetistStatusChoices } from '@proto/shared'
import { useActiveSeries } from '@proto/shared/availability'
import { seriesLine } from '@proto/domain/availabilitySeries'
import { defaultSlotStatus } from '@proto/domain/slotStatus'
import { useAppStore } from '@proto/store'
import { Col, Hint, useMobilePersona } from './shared'

export type ConfirmStyle = 'inline' | 'dialog' | 'sheet'

interface Series {
  id: string
  line: string
}

/** Two sample repeating days off in the status master's own words, for a persona with none. Local only. */
function useSampleSeries(): Series[] {
  const statuses = useAppStore((s: any) => s.masters.slotStatuses)
  const choices = useAnaesthetistStatusChoices() as { key: string; open?: boolean; isDefault?: boolean }[]
  const defaultKey = (defaultSlotStatus(statuses) as { key: string }).key
  return useMemo(() => {
    const closed = choices.find((c) => c.key !== defaultKey) ?? choices[0]
    if (closed === undefined) return []
    return [
      { id: 'sample-fri', line: seriesLine({ weekdays: [5], everyWeeks: 1, sessions: 'both', statusKey: closed.key }, statuses) as string },
      { id: 'sample-mon', line: seriesLine({ weekdays: [1], everyWeeks: 2, sessions: 'PM', statusKey: closed.key }, statuses) as string },
    ]
  }, [choices, defaultKey, statuses])
}

const CONFIRM_TITLE = 'Delete the series?'

/**
 * Her repeating days off as a shadcn Item list, each with Delete. The confirm is one of three
 * (the prop): inline in the card as today, a shadcn AlertDialog, or a bottom sheet on Drawer.
 * Reads the store's series; confirming only hides the row here (the preview never writes).
 */
export function SeriesListReplacement({ confirm }: { confirm: ConfirmStyle }) {
  const { anaesthetistId } = useMobilePersona()
  const real = useActiveSeries(anaesthetistId) as Series[]
  const sample = useSampleSeries()
  const defaultLabel = useAppStore((s: any) => (defaultSlotStatus(s.masters.slotStatuses) as { longLabel: string }).longLabel)
  const [useSample, setUseSample] = useState(false)
  const [removed, setRemoved] = useState<string[]>([])
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [line, setLine] = useState<string | null>(null)

  const all = real.length > 0 ? real : useSample ? sample : []
  const series = all.filter((s) => !removed.includes(s.id))
  const pending = all.find((s) => s.id === confirmId)
  const why = `Its sessions from today on return to ${defaultLabel}. Days you changed on their own keep their status.`

  function remove(id: string) {
    setRemoved((r) => [...r, id])
    setConfirmId(null)
    setLine(`Series deleted. Its sessions from today on are back to ${defaultLabel} (preview only, nothing saved).`)
  }

  return (
    <Col className="tw:gap-2">
      {series.length === 0 && <Hint>No repeating days off. Choose Repeat in Add days off to set one.</Hint>}
      {real.length === 0 && (
        <div>
          <Button
            variant="pill"
            onClick={() => {
              setUseSample((s) => !s)
              setRemoved([])
              setLine(null)
            }}
          >
            {useSample ? 'Hide the sample' : 'Show a sample (local only)'}
          </Button>
        </div>
      )}
      {series.length > 0 && (
        <ItemGroup className="tw:gap-2">
          {series.map((s) => {
            const open = confirm === 'inline' && confirmId === s.id
            return (
              <div role="listitem" key={s.id}>
                <Item variant="outline" className="tw:gap-2 tw:rounded-card tw:px-3 tw:py-2.5">
                  <ItemMedia className="tw:translate-y-0! tw:self-center! tw:text-slate">
                    <Repeat size={14} aria-hidden />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="tw:line-clamp-none tw:w-auto tw:text-[13px] tw:font-normal">{s.line}</ItemTitle>
                  </ItemContent>
                  {!open && (
                    <ItemActions>
                      <Button variant="link" className="tw:px-1! tw:py-1.5! tw:text-[13px]!" aria-label={`Delete ${s.line}`} onClick={() => setConfirmId(s.id)}>
                        Delete
                      </Button>
                    </ItemActions>
                  )}
                  {open && (
                    <ItemFooter role="group" aria-label="Delete the series" className="tw:mt-1 tw:flex-col tw:items-stretch tw:gap-2">
                      <span className="tw:text-[12.5px] tw:leading-[18px] tw:text-slate">{why}</span>
                      <div className="tw:flex tw:gap-2">
                        <Button className="tw:h-9 tw:rounded-pill! tw:px-3.5 tw:text-[13px]" onClick={() => remove(s.id)}>
                          Delete the series
                        </Button>
                        <Button variant="outline" className="tw:h-9 tw:rounded-pill! tw:border-line-strong tw:px-3.5 tw:text-[13px] tw:text-teal-pressed" onClick={() => setConfirmId(null)}>
                          Keep it
                        </Button>
                      </div>
                    </ItemFooter>
                  )}
                </Item>
              </div>
            )
          })}
        </ItemGroup>
      )}
      {line !== null && (
        <div role="status" className="tw:text-[12.5px] tw:leading-[18px] tw:text-teal-pressed">
          {line}
        </div>
      )}

      {confirm === 'dialog' && (
        <AlertDialog open={pending !== undefined} onOpenChange={(o) => !o && setConfirmId(null)}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>{CONFIRM_TITLE}</AlertDialogTitle>
              <AlertDialogDescription>
                {pending?.line}. {why}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction onClick={() => pending !== undefined && remove(pending.id)}>Delete the series</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {confirm === 'sheet' && (
        <Drawer open={pending !== undefined} onOpenChange={(o) => !o && setConfirmId(null)}>
          <DrawerContent>
            <div className="tw:flex tw:flex-col tw:gap-2.5 tw:px-5 tw:pb-[max(calc(var(--aa-inset-bottom,34px)+2px),20px)]">
              <DrawerTitle className="tw:text-[17px]">{CONFIRM_TITLE}</DrawerTitle>
              <DrawerDescription className="tw:text-sm tw:text-slate">
                {pending?.line}. {why}
              </DrawerDescription>
              <div className="tw:grid tw:grid-cols-2 tw:gap-2.5">
                <DrawerClose render={<Button variant="outline" size="lg" className="tw:w-full" />}>Keep it</DrawerClose>
                <Button size="lg" className="tw:w-full" onClick={() => pending !== undefined && remove(pending.id)}>
                  Delete the series
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </Col>
  )
}
