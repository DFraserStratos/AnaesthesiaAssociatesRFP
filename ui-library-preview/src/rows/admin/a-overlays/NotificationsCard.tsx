import { useEffect, useMemo, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { CheckIcon } from 'lucide-react'
import { activeNotificationCount, latestNotifications, useAppStore } from '@proto/store'
import { usePoolState } from '@proto/apps/admin/components/NotificationsCard'
import { motion } from '@proto/theme/motion'
import { drSurname } from '@proto/shared/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Echo } from './parts'
import { TickAction } from './WarningsToDo'

const RAIL_ROWS = 3

interface Row {
  notification: { id: string; kind: string; message?: string }
  text: string
  atISO: string
  by: string
  target: { kind: string }
}

/** Two local sample notices (the fresh seed has none), named from the seed's first anaesthetists. */
function useSampleRows(): Row[] {
  const anaesthetists: Record<string, { name: string }> = useAppStore((s: { masters: { anaesthetists: Record<string, { name: string }> } }) => s.masters.anaesthetists)
  return useMemo(() => {
    const [a, b] = Object.values(anaesthetists).sort((x, y) => x.name.localeCompare(y.name))
    const first = a !== undefined ? drSurname(a.name) : 'An anaesthetist'
    const second = b !== undefined ? drSurname(b.name) : 'A colleague'
    return [
      { notification: { id: 'sample-1', kind: 'listMoved' }, text: `${first} moved the Tue 21 Jul AM List to ${second}.`, atISO: '2026-07-21T08:12:00', by: first, target: { kind: 'list' } },
      {
        notification: { id: 'sample-2', kind: 'officeAlert', message: 'Theatre 3 is running late, please call the surgeon.' },
        text: `${second} alerted the office about Wed 22 Jul PM.`,
        atISO: '2026-07-21T09:40:00',
        by: second,
        target: { kind: 'list' },
      },
    ]
  }, [anaesthetists])
}

function NoticeText({ row }: { row: Row }) {
  const alert = row.notification.kind === 'officeAlert'
  return (
    <span className="tw:flex tw:min-w-0 tw:flex-col tw:gap-[3px] tw:text-left">
      <span className="tw:text-[12.5px] tw:leading-[17px] tw:font-semibold tw:whitespace-normal tw:text-ink">{row.text}</span>
      {row.notification.message !== undefined && (
        <span className="tw:text-xs tw:leading-[17px] tw:font-normal tw:whitespace-normal tw:text-slate">
          {alert ? 'Note: ' : ''}"{row.notification.message}"
        </span>
      )}
      <span className="tw:text-[11px] tw:font-normal tw:text-mist">
        {format(parseISO(row.atISO), 'EEE d MMM, HH:mm')} · {row.by}
      </span>
    </span>
  )
}

/**
 * The rail's notification pool on shadcn Card + Button: the heading with its
 * active count, up to three notices (the text is a button that opens it),
 * Resolve as the tick action, and See all / Show resolved as link buttons in
 * the footer. Reads the live pool; the fresh seed has none, so "Use sample
 * notices" fills it locally. Resolve is local (the store is untouched).
 */
export function NotificationsCardReplacement() {
  const pool = usePoolState()
  const live = useMemo(() => latestNotifications(pool, RAIL_ROWS) as Row[], [pool])
  const liveCount = useMemo(() => activeNotificationCount(pool) as number, [pool])
  const samples = useSampleRows()
  const [useSamples, setUseSamples] = useState(false)
  const [resolved, setResolved] = useState<ReadonlySet<string>>(new Set())
  const [ticking, setTicking] = useState<ReadonlySet<string>>(new Set())
  const [last, setLast] = useState('')
  const heading = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const source = useSamples ? samples : live
  const rows = source.filter((r) => !resolved.has(r.notification.id)).slice(0, RAIL_ROWS)
  const count = useSamples ? rows.length : liveCount

  function resolve(id: string) {
    setTicking((s) => new Set(s).add(id))
    const t = window.setTimeout(() => {
      setResolved((s) => new Set(s).add(id))
      setTicking((s) => {
        const next = new Set(s)
        next.delete(id)
        return next
      })
      setLast('Resolved locally.')
      heading.current?.focus()
    }, motion.completeTick.pulseDuration as number)
    timers.current.push(t)
  }

  return (
    <div>
      <Card size="sm" className="tw:gap-2.5 tw:shadow-none">
        <CardHeader>
          <CardTitle ref={heading} tabIndex={-1} role="heading" aria-level={2} className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold tw:outline-none">
            Notifications
            <Badge className={count > 0 ? 'tw:min-w-[22px] tw:font-mono tw:font-bold tw:text-ink tw:tabular-nums' : 'tw:min-w-[22px] tw:font-mono tw:font-bold tw:tabular-nums'}>
              {count}
              <span className="tw:sr-only"> active</span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="tw:flex tw:flex-col tw:gap-2">
          {rows.length === 0 && (
            <div className="tw:text-[12.5px] tw:leading-[18px] tw:text-mist">Nothing waiting. When an anaesthetist moves a List or alerts the office, it shows here until someone ticks it.</div>
          )}
          {rows.length > 0 && (
            <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0">
              {rows.map((r) => {
                const tick = ticking.has(r.notification.id)
                return (
                  <li key={r.notification.id} className={tick ? 'tw:flex tw:items-start tw:gap-2 tw:rounded-ctl tw:bg-background tw:px-3 tw:py-2.5 tw:opacity-55' : 'tw:flex tw:items-start tw:gap-2 tw:rounded-ctl tw:bg-background tw:px-3 tw:py-2.5'}>
                    {r.target.kind === 'gone' ? (
                      <span className="tw:min-w-0 tw:flex-1">
                        <NoticeText row={r} />
                      </span>
                    ) : (
                      <Button variant="ghost" onClick={() => setLast(`Open ${r.notification.kind} (stubbed).`)} className="tw:h-auto tw:min-w-0 tw:flex-1 tw:justify-start tw:p-0 tw:hover:bg-transparent">
                        <NoticeText row={r} />
                      </Button>
                    )}
                    {tick ? (
                      <span aria-hidden className="tw:flex tw:size-[30px] tw:flex-none tw:items-center tw:justify-center tw:rounded-full tw:bg-success-tint tw:text-success-on-tint">
                        <CheckIcon className="tw:size-4" strokeWidth={2.2} />
                      </span>
                    ) : (
                      <TickAction label={`Resolve notice: ${r.text}`} onClick={() => resolve(r.notification.id)}>
                        Resolve
                      </TickAction>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
        <CardFooter className="tw:gap-4 tw:border-t-0 tw:bg-transparent tw:pt-0 tw:pb-4">
          <Button variant="link" onClick={() => setLast('See all (stubbed).')}>
            See all notifications
          </Button>
          <Button variant="link" onClick={() => setLast('Show resolved (stubbed).')}>
            Show resolved
          </Button>
        </CardFooter>
      </Card>
      <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2">
        <Button
          variant="pill"
          size="sm"
          onClick={() => {
            setUseSamples((v) => !v)
            setResolved(new Set())
          }}
        >
          {useSamples ? 'Back to the live pool' : 'Use sample notices'}
        </Button>
      </div>
      <Echo>{last}</Echo>
    </div>
  )
}
