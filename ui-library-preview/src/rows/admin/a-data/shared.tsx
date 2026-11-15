import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** The catalogue's quiet "what the last click did" line (basicExamples Echo). */
export function Echo({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="tw:mt-2 tw:min-h-[18px] tw:text-[12.5px] tw:text-slate">
      {children}
    </div>
  )
}

/** The masters chrome's page header: heading, one mist line, its action on the right. */
export function Header({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="tw:flex tw:items-end tw:justify-between tw:gap-3">
      <div>
        <h2 className="tw:m-0 tw:text-lg tw:leading-6 tw:font-bold">{title}</h2>
        {sub !== undefined && <div className="tw:mt-0.5 tw:max-w-[820px] tw:text-[12.5px] tw:text-mist">{sub}</div>}
      </div>
      {action !== undefined && <div className="tw:flex-none tw:whitespace-nowrap">{action}</div>}
    </div>
  )
}

/** A teal text action ("Edit", "Retire"): shadcn Button's link variant. */
export function TextAction({
  onClick,
  label,
  disabled,
  children,
  className,
}: {
  onClick: () => void
  label?: string
  disabled?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <Button variant="link" onClick={onClick} aria-label={label} disabled={disabled} className={cn('tw:font-semibold', className)}>
      {children}
    </Button>
  )
}

/** The sheets' refused-save box (shared/ui FormError): error tint, role=alert. Nothing when there is no message. */
export function FormAlert({ message, className }: { message: string | null | undefined; className?: string }) {
  if (message === null || message === undefined || message === '') return null
  return (
    <div role="alert" className={cn('tw:rounded-ctl tw:bg-error-tint tw:px-3 tw:py-2.5 tw:text-[13px] tw:text-error-on-tint', className)}>
      {message}
    </div>
  )
}

/** A mist helper line under a field. */
export function Helper({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div id={id} className="tw:text-[12.5px] tw:text-mist">
      {children}
    </div>
  )
}

/** The bordered 14px-radius card the admin tables sit in. */
export function TableCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('tw:overflow-hidden tw:rounded-card tw:border tw:border-line tw:bg-surface', className)}>{children}</div>
}
