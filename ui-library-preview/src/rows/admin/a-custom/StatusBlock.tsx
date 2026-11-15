import { useId, useState, type CSSProperties } from 'react'
import { useAppStore } from '@proto/store'
import { resolveDisplayStatus, useLegendKeys, useDisplayStatus } from '@proto/shared'
import { FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { blockFillStyle, ON_TINT, TINT_BG, tokenOf, type ResolvedStatus } from './statusFill'

/**
 * A session block filled by its status, on theme tokens: the tint body and 3px
 * left bar (solid), the hatch over the tint (hatched), or the dashed outline
 * (dashed). Every colour is a status CSS variable or token class; the shape and
 * type match the prototype (6px radius, 11/600 title, 10px detail at 75%).
 */
export function StatusBlock({ status, title, detail, className, style }: { status: string; title: string; detail?: string; className?: string; style?: CSSProperties }) {
  const resolved = useDisplayStatus(status) as ResolvedStatus
  const { token, treatment } = tokenOf(resolved)
  return (
    <span
      data-status-key={status}
      className={cn('tw:block tw:min-w-[110px] tw:rounded-sm tw:px-[9px] tw:py-1.5', TINT_BG[token], ON_TINT[token], className)}
      style={{ ...blockFillStyle(token, treatment), ...style }}
    >
      <span className="tw:block tw:text-[11px] tw:leading-[15px] tw:font-semibold">{title}</span>
      {detail !== undefined && <span className="tw:block tw:text-[10px] tw:leading-[14px] tw:opacity-75">{detail}</span>}
    </span>
  )
}

/** The example: a status Select drives one large block; below it the first six legend statuses. */
export function StatusBlockReplacement() {
  const keys = useLegendKeys() as string[]
  const statuses = useAppStore((s: { masters: { slotStatuses: unknown } }) => s.masters.slotStatuses)
  const label = (k: string) => (resolveDisplayStatus(k, statuses) as ResolvedStatus).label
  const [status, setStatus] = useState<string>(keys[0] ?? 'free')
  const labelId = useId()
  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      <div className="tw:flex tw:flex-col tw:gap-1.5">
        <FieldLabel id={labelId}>Status</FieldLabel>
        <Select
          value={status}
          onValueChange={(v) => {
            if (typeof v === 'string') setStatus(v)
          }}
          items={keys.map((k) => ({ value: k, label: label(k) }))}
        >
          <SelectTrigger aria-labelledby={labelId} className="tw:w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {keys.map((k) => (
              <SelectItem key={k} value={k}>
                {label(k)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <StatusBlock status={status} title="St George's" detail="Mr Hale · Ortho" style={{ height: 56 }} />
      <div className="tw:grid tw:grid-cols-3 tw:gap-2">
        {keys.slice(0, 6).map((k) => (
          <StatusBlock key={k} status={k} title={label(k)} style={{ height: 40 }} />
        ))}
      </div>
    </div>
  )
}
