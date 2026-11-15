import { useMemo, useState } from 'react'
import { Repeat } from 'lucide-react'
import { useAppStore } from '@proto/store'
import { anaesthetistChoices, defaultSlotStatus } from '@proto/domain/slotStatus'
import { seriesLine } from '@proto/domain/availabilitySeries'
import { useActiveSeries } from '@proto/shared/availability'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Hint, useReturnFocus, type WebFixtures } from './shared'

interface SeriesRow {
  id: string
  line: string
}
interface SlotStatus {
  key: string
  longLabel: string
  isDefault?: boolean
}

/**
 * "Your series" as a list of shadcn Cards, each rule in words with Delete.
 * `confirm` picks the are-you-sure step: `inline` keeps today's in-card
 * group (Delete the series / Keep it), `dialog` moves it to an AlertDialog
 * (focus trapped, starts on Keep it, Escape keeps). Deleting is local.
 *
 * Her live series come from the store; the seed has none, so two sample
 * series are worded by the prototype's own `seriesLine` over the real status
 * master, as a local preview.
 */
export function SeriesListReplacement({ confirm }: { confirm: 'inline' | 'dialog' }) {
  const f = useWebFixtures() as WebFixtures
  const live = useActiveSeries(f.anaesthetistId) as SeriesRow[]
  const records = useAppStore((s: { masters: { slotStatuses: Record<string, SlotStatus> } }) => s.masters.slotStatuses)
  const defaultLabel = (defaultSlotStatus(records) as SlotStatus).longLabel

  const samples: SeriesRow[] = useMemo(() => {
    const away = (anaesthetistChoices(records) as SlotStatus[]).find((s) => s.isDefault !== true)
    if (away === undefined) return []
    return [
      { id: 'sample-1', line: seriesLine({ weekdays: [5], everyWeeks: 1, sessions: 'both', statusKey: away.key }, records) as string },
      { id: 'sample-2', line: seriesLine({ weekdays: [1, 3], everyWeeks: 2, sessions: 'PM', statusKey: away.key }, records) as string },
    ]
  }, [records])

  const usingSamples = live.length === 0
  const [deleted, setDeleted] = useState<string[]>([])
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [line, setLine] = useState<string | null>(null)
  const { finalFocus, remember } = useReturnFocus()
  const series = (usingSamples ? samples : live).filter((s) => !deleted.includes(s.id))
  const confirming = series.find((s) => s.id === confirmId)

  function remove(id: string) {
    setDeleted((d) => [...d, id])
    setConfirmId(null)
    setLine(`Series deleted (local only). Its sessions from today on would return to ${defaultLabel}.`)
  }

  const consequence = `Its sessions from today on return to ${defaultLabel}. Days you changed on their own keep their status.`

  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      {series.length === 0 && <div className="tw:text-[13px] tw:text-mist">No repeating days off. Choose Repeat in the form to set one.</div>}
      <ul aria-label="Your series" className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0">
        {series.map((s) => (
          <li key={s.id}>
            <Card className="tw:gap-2 tw:px-3 tw:py-2.5 tw:shadow-none">
              <div className="tw:flex tw:items-center tw:gap-2">
                <Repeat aria-hidden className="tw:size-3.5 tw:flex-none tw:text-slate" />
                <span className="tw:flex-1 tw:text-[13px] tw:leading-5 tw:text-ink">{s.line}</span>
                {!(confirm === 'inline' && confirmId === s.id) && (
                  <Button variant="link" className="tw:px-1! tw:py-1.5! tw:text-[13px]" aria-label={`Delete ${s.line}`} onClick={(e) => {
                      remember(e)
                      setConfirmId(s.id)
                    }}>
                    Delete
                  </Button>
                )}
              </div>
              {confirm === 'inline' && confirmId === s.id && (
                <div role="group" aria-label="Delete the series" className="tw:flex tw:flex-col tw:gap-2">
                  <span className="tw:text-[12.5px] tw:text-slate">{consequence}</span>
                  <div className="tw:flex tw:gap-2">
                    <Button className="tw:h-9 tw:rounded-pill! tw:px-3.5 tw:text-[13px]" onClick={() => remove(s.id)}>
                      Delete the series
                    </Button>
                    <Button variant="outline" className="tw:h-9 tw:rounded-pill! tw:border-line-strong tw:px-3.5 tw:text-[13px] tw:text-teal-pressed" onClick={() => setConfirmId(null)}>
                      Keep it
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
      {line !== null && (
        <div role="status" className="tw:text-[12.5px] tw:text-teal-pressed">
          {line}
        </div>
      )}
      {usingSamples && <Hint>She has no series in the current data: these two are a local preview, worded by the prototype's seriesLine.</Hint>}

      {confirm === 'dialog' && (
        <AlertDialog open={confirming !== undefined} onOpenChange={(o) => !o && setConfirmId(null)}>
          <AlertDialogContent finalFocus={finalFocus}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete the series?</AlertDialogTitle>
              <AlertDialogDescription>
                {confirming?.line}. {consequence}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel autoFocus>Keep it</AlertDialogCancel>
              <Button onClick={() => confirming !== undefined && remove(confirming.id)}>Delete the series</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
