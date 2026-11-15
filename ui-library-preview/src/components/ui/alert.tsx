import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const alertVariants = cva(
  "tw:group/alert tw:relative tw:grid tw:w-full tw:gap-0.5 tw:rounded-ctl tw:border tw:border-transparent tw:px-3 tw:py-2.5 tw:text-left tw:text-[13px] tw:leading-5 tw:has-data-[slot=alert-action]:relative tw:has-data-[slot=alert-action]:pr-18 tw:has-[>svg]:grid-cols-[auto_1fr] tw:has-[>svg]:gap-x-2 tw:*:[svg]:row-span-2 tw:*:[svg]:translate-y-0.5 tw:*:[svg]:text-current tw:*:[svg:not([class*=size-])]:size-4",
  {
    variants: {
      variant: {
        default: "tw:border-line tw:bg-surface tw:text-ink",
        success: "tw:bg-success-tint tw:text-success-on-tint tw:*:data-[slot=alert-description]:text-success-on-tint",
        warning: "tw:bg-warning-tint tw:text-warning-on-tint tw:*:data-[slot=alert-description]:text-warning-on-tint",
        destructive:
          "tw:bg-error-tint tw:text-error-on-tint tw:*:data-[slot=alert-description]:text-error-on-tint",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "tw:font-semibold tw:group-has-[>svg]/alert:col-start-2 tw:[&_a]:font-semibold tw:[&_a]:text-primary",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "tw:text-[13px] tw:leading-5 tw:text-balance tw:text-slate tw:md:text-pretty tw:[&_a]:font-semibold tw:[&_a]:text-primary tw:[&_p:not(:last-child)]:mb-3",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("tw:absolute tw:top-2 tw:right-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
