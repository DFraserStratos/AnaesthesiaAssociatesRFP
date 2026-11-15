"use client"

import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "tw:flex tw:flex-col tw:gap-4 tw:has-[>[data-slot=checkbox-group]]:gap-3 tw:has-[>[data-slot=radio-group]]:gap-3",
        className
      )}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "tw:mb-1.5 tw:font-semibold tw:text-ink tw:data-[variant=label]:text-[13px] tw:data-[variant=label]:leading-4 tw:data-[variant=legend]:text-[17px] tw:data-[variant=legend]:leading-6",
        className
      )}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "tw:group/field-group tw:@container/field-group tw:flex tw:w-full tw:flex-col tw:gap-5 tw:data-[slot=checkbox-group]:gap-3 tw:*:data-[slot=field-group]:gap-4",
        className
      )}
      {...props}
    />
  )
}

const fieldVariants = cva(
  "tw:group/field tw:flex tw:w-full tw:gap-1.5 tw:data-[invalid=true]:text-error-on-tint",
  {
    variants: {
      orientation: {
        vertical: "tw:flex-col tw:*:w-full tw:[&>.sr-only]:w-auto",
        horizontal:
          "tw:flex-row tw:items-center tw:has-[>[data-slot=field-content]]:items-start tw:*:data-[slot=field-label]:flex-auto tw:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "tw:flex-col tw:*:w-full tw:@md/field-group:flex-row tw:@md/field-group:items-center tw:@md/field-group:*:w-auto tw:@md/field-group:has-[>[data-slot=field-content]]:items-start tw:@md/field-group:*:data-[slot=field-label]:flex-auto tw:[&>.sr-only]:w-auto tw:@md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "tw:group/field-content tw:flex tw:flex-1 tw:flex-col tw:gap-0.5 tw:leading-snug",
        className
      )}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "tw:group/field-label tw:peer/field-label tw:flex tw:w-fit tw:gap-2 tw:leading-snug tw:group-data-[disabled=true]/field:opacity-50 tw:has-data-checked:border-primary tw:has-data-checked:bg-teal-tint tw:has-[>[data-slot=field]]:rounded-ctl tw:has-[>[data-slot=field]]:border tw:has-[>[data-slot=field]]:border-line tw:has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-sunken tw:has-[>[data-slot=field]]:has-[:focus-visible]:border-primary tw:has-[>[data-slot=field]]:has-[:focus-visible]:shadow-focus tw:*:data-[slot=field]:p-3",
        "tw:has-[>[data-slot=field]]:w-full tw:has-[>[data-slot=field]]:flex-col",
        // The prototype's field label (shared/ui/Field): an 11px uppercase mist eyebrow.
        // Choice-card labels (wrapping a nested Field) keep sentence case.
        "tw:not-has-[>[data-slot=field]]:text-[11px] tw:not-has-[>[data-slot=field]]:leading-[14px] tw:not-has-[>[data-slot=field]]:font-semibold tw:not-has-[>[data-slot=field]]:uppercase tw:not-has-[>[data-slot=field]]:tracking-[0.06em] tw:not-has-[>[data-slot=field]]:text-mist",
        className
      )}
      {...props}
    />
  )
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "tw:flex tw:w-fit tw:items-center tw:gap-2 tw:text-[13px] tw:leading-4 tw:font-semibold tw:text-ink tw:group-data-[disabled=true]/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "tw:text-left tw:text-xs tw:leading-4 tw:font-normal tw:text-mist tw:group-has-data-horizontal/field:text-balance tw:[[data-variant=legend]+&]:-mt-1.5",
        "tw:last:mt-0 tw:nth-last-2:-mt-1",
        "tw:[&>a]:font-semibold tw:[&>a]:text-primary tw:[&>a:hover]:text-teal-pressed",
        className
      )}
      {...props}
    />
  )
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "tw:relative tw:-my-2 tw:h-5 tw:text-sm tw:group-data-[variant=outline]/field-group:-mb-2",
        className
      )}
      {...props}
    >
      <Separator className="tw:absolute tw:inset-0 tw:top-1/2" />
      {children && (
        <span
          className="tw:relative tw:mx-auto tw:block tw:w-fit tw:bg-surface tw:px-2 tw:text-xs tw:text-mist"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ]

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className="tw:ml-4 tw:flex tw:list-disc tw:flex-col tw:gap-1">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>
        )}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("tw:text-xs tw:leading-4 tw:font-medium tw:text-error-on-tint", className)}
      {...props}
    >
      {content}
    </div>
  )
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
}
