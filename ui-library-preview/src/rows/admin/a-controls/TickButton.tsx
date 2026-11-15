import { useState } from 'react'
import { CheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Echo } from './shared'

export type TickLook = 'teal-outline' | 'tint'

/**
 * The office's "dealt with" control on shadcn Button. `teal-outline` keeps today's look
 * (the outline variant recoloured teal); `tint` uses the kit's secondary (teal tint) variant
 * instead of a one-off outline colour. Sizes: 36 tall (default) and 30 compact.
 */
export function TickButton({
  children,
  onClick,
  compact = false,
  label,
  look,
}: {
  children: string
  onClick: () => void
  compact?: boolean
  label?: string
  look: TickLook
}) {
  return (
    <Button
      variant={look === 'tint' ? 'secondary' : 'outline'}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'tw:gap-1',
        compact ? 'tw:h-[30px] tw:px-2.5 tw:text-xs tw:[&_svg]:size-[13px]!' : 'tw:h-9 tw:px-3 tw:text-[13px] tw:[&_svg]:size-3.5!',
        look === 'teal-outline' && 'tw:border-primary tw:text-primary tw:hover:bg-teal-tint tw:focus-visible:border-primary',
      )}
    >
      <CheckIcon aria-hidden />
      {children}
    </Button>
  )
}

export function TickButtonReplacement({ look = 'teal-outline' }: { look?: TickLook }) {
  const [done, setDone] = useState(0)
  return (
    <div>
      <div className="tw:flex tw:items-center tw:gap-2.5">
        <TickButton look={look} onClick={() => setDone((n) => n + 1)} label="Resolve notice: example">
          Resolve
        </TickButton>
        <TickButton look={look} compact onClick={() => setDone((n) => n + 1)}>
          Clear
        </TickButton>
      </div>
      <Echo>{done === 0 ? 'Not ticked yet.' : `Ticked ${done} time${done === 1 ? '' : 's'}.`}</Echo>
    </div>
  )
}
