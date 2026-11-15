import { useMemo } from 'react'
import { Bar, BarChart, Cell, XAxis, YAxis, type YAxisTickContentProps } from 'recharts'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { receivablesAgingFor, useAppStore } from '@proto/store'
import { formatCurrency } from '@proto/shared/format'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

type Bucket = 'current' | 'd31_60' | 'd61_90' | 'd90plus'

/** The dashboard's buckets and colours (AGING_ROWS): teal, teal at 55%, the pre-op amber, the error red. */
const BUCKETS: { key: Bucket; label: string; color: string; opacity: number }[] = [
  { key: 'current', label: 'Current', color: 'var(--teal)', opacity: 1 },
  { key: 'd31_60', label: '31 to 60 d', color: 'var(--teal)', opacity: 0.55 },
  { key: 'd61_90', label: '61 to 90 d', color: 'var(--status-preop)', opacity: 1 },
  { key: 'd90plus', label: '90 d +', color: 'var(--error)', opacity: 1 },
]

const config = Object.fromEntries(BUCKETS.map((b) => [b.key, { label: b.label, color: b.color }])) satisfies ChartConfig

const money = (n: number) => formatCurrency(n) as string

/**
 * Receivables aging as a Recharts horizontal bar chart in shadcn Chart: one bar per bucket on a sunken
 * track scaled to the total, the label on the left axis and the amount on the right axis. A visually
 * hidden table carries the same figures for screen readers.
 */
export function AgingBarsReplacement({ tooltip = false }: { tooltip?: boolean }) {
  const f = useWebFixtures() as { anaesthetistId: string; todayISO: string }
  const billing = useAppStore((s: any) => s.billing)
  const schedule = useAppStore((s: any) => s.schedule)
  const masters = useAppStore((s: any) => s.masters)
  const r = useMemo(
    () => receivablesAgingFor({ billing, schedule, masters }, f.anaesthetistId, f.todayISO) as { rows: unknown[]; aging: Record<Bucket, number> & { total: number } },
    [billing, schedule, masters, f.anaesthetistId, f.todayISO],
  )
  if (r.rows.length === 0) return <div className="tw:text-[13px] tw:text-mist">No outstanding accounts. Receivables appear here once billed work goes unpaid.</div>
  const data = BUCKETS.map((b) => ({ key: b.key, label: b.label, amount: r.aging[b.key], amountLabel: money(r.aging[b.key]) }))
  return (
    <div>
      <div className="tw:mb-2.5 tw:font-mono tw:text-sm tw:font-semibold tw:tabular-nums">{money(r.aging.total)} outstanding</div>
      <ChartContainer config={config} className="tw:aspect-auto tw:h-[100px] tw:w-full" aria-hidden>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={5}>
          <XAxis type="number" hide domain={[0, Math.max(r.aging.total, 1)]} />
          <YAxis yAxisId="label" type="category" dataKey="label" width={84} interval={0} tickLine={false} axisLine={false} tick={({ y, payload }: YAxisTickContentProps) => (
              <text x={0} y={y} dy={4} textAnchor="start" fontSize={12} fontWeight={600} fill="var(--aa-slate)">
                {payload.value}
              </text>
            )} />
          <YAxis yAxisId="amount" orientation="right" type="category" dataKey="amountLabel" width={84} interval={0} tickLine={false} axisLine={false} tick={({ x, y, payload }: YAxisTickContentProps) => (
              <text x={Number(x) + 76} y={y} dy={4} textAnchor="end" fontSize={12} fill="var(--aa-ink)" fontFamily="var(--font-data)">
                {payload.value}
              </text>
            )} />
          {tooltip && <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator nameKey="key" labelKey="label" formatter={(v, _n, item) => <span className="tw:flex tw:w-full tw:justify-between tw:gap-3"><span className="tw:text-slate">{(item.payload as { label: string }).label}</span><span className="tw:font-mono tw:tabular-nums tw:text-ink">{money(Number(v))}</span></span>} />} />}
          <Bar yAxisId="label" dataKey="amount" barSize={14} radius={99} background={{ fill: 'var(--aa-sunken)', radius: 99 }} isAnimationActive={false}>
            {BUCKETS.map((b) => (
              <Cell key={b.key} fill={b.color} fillOpacity={b.opacity} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <table className="tw:sr-only">
        <caption>Outstanding receivables by age</caption>
        <thead>
          <tr>
            <th scope="col">Age</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.label}</th>
              <td>{d.amountLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
