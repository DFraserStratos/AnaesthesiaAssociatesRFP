import { useId, useState } from 'react'
import { useDashboardFigures } from '@proto/apps/web/useDashboardFigures'
import { formatCurrency } from '@proto/shared/format'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Knobs, useWebFixtures } from './shared'

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

/**
 * The web Panel as a shadcn Card: a labelled region whose title is a real h2,
 * the action in CardAction, padded (20) or flush for a full-bleed table.
 */
export function PanelReplacement() {
  const [padding, setPadding] = useState<'padded' | 'flush'>('padded')
  const flush = padding === 'flush'
  const titleId = useId()
  return (
    <>
      <Knobs label="Padding" value={padding} options={[{ value: 'padded', label: 'Padded' }, { value: 'flush', label: 'Flush' }]} onChange={setPadding} />
      <Card role="region" aria-labelledby={titleId} className={cn('tw:gap-3.5', flush && 'tw:pb-0')}>
        <CardHeader className="tw:items-baseline">
          <CardTitle>
            <h2 id={titleId} className="tw:m-0 tw:text-[17px] tw:leading-6 tw:font-semibold">
              Leave
            </h2>
          </CardTitle>
          <CardAction className="tw:self-baseline">
            <span className="tw:font-mono tw:text-sm tw:font-semibold">2 booked</span>
          </CardAction>
        </CardHeader>
        <CardContent className={cn('tw:text-[13px] tw:text-slate', flush && 'tw:px-0')}>Any content: a list, a table or a chart.</CardContent>
      </Card>
    </>
  )
}

// ---------------------------------------------------------------------------
// StatTile
// ---------------------------------------------------------------------------

interface Productivity {
  units: number
  unitsChangePct: number
  lists: number
  avgUnitsPerList: number
  feesInvoiced: number
}

function Tile({ label, value, pill }: { label: string; value: string; pill?: string }) {
  return (
    <Card size="sm" className="tw:gap-1 tw:rounded-ctl! tw:border-0 tw:bg-background tw:px-3.5 tw:py-3 tw:shadow-none">
      <dt className="tw:text-[11px] tw:leading-4 tw:font-semibold tw:tracking-[0.06em] tw:text-mist">{label}</dt>
      <dd className="tw:m-0 tw:flex tw:items-baseline tw:gap-2">
        <span className="tw:font-mono tw:text-2xl tw:leading-9 tw:font-bold tw:tabular-nums">{value}</span>
        {pill !== undefined && (
          <Badge variant="success" className="tw:text-[11px]">
            {pill}
          </Badge>
        )}
      </dd>
    </Card>
  )
}

/** The dashboard figures as small Cards in a description list; the change is a success Badge. */
export function StatTileReplacement() {
  const f = useWebFixtures()
  const figures = useDashboardFigures(f.anaesthetistId) as { productivity: Productivity } | undefined
  if (figures === undefined) return <div className="tw:text-[13px] tw:text-mist">The seed has no productivity figures for this persona right now.</div>
  const p = figures.productivity
  return (
    <dl className="tw:m-0 tw:grid tw:grid-cols-2 tw:gap-3">
      <Tile label="UNITS" value={String(p.units)} pill={`+${p.unitsChangePct}%`} />
      <Tile label="LISTS" value={String(p.lists)} />
      <Tile label="AVG UNITS / LIST" value={p.avgUnitsPerList.toFixed(1)} />
      <Tile label="FEES INVOICED" value={formatCurrency(p.feesInvoiced) as string} />
    </dl>
  )
}
