import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/*
 * AA brand: badges are labels, never actions, so none is filled teal and none
 * is crimson. Two anatomies from the prototype:
 *  - the small Pill (shared/ui/Pill): 1px 8px, 11.5/18, 600, on a tint/on-tint
 *    pair: default (neutral sunken/slate), outline, success, warning, error;
 *  - the StatusChip (shared/StatusChip): 4px 10px, 12/16, 600, a 7px solid dot
 *    before the label, on the status tint with on-tint text. Flat tints, as the
 *    prototype chips: the hatched / dashed treatments belong to BLOCKS
 *    (DayGrid, cells), via the aa-status-hatched / aa-status-dashed classes.
 */
const STATUS =
  "tw:gap-1.5 tw:px-2.5 tw:py-1 tw:text-xs tw:leading-4 tw:before:size-[7px] tw:before:shrink-0 tw:before:rounded-full"

const badgeVariants = cva(
  "tw:group/badge tw:inline-flex tw:w-fit tw:shrink-0 tw:items-center tw:justify-center tw:gap-1 tw:overflow-hidden tw:rounded-pill tw:font-semibold tw:whitespace-nowrap tw:focus-visible:shadow-focus tw:outline-none tw:has-data-[icon=inline-end]:pr-1.5 tw:has-data-[icon=inline-start]:pl-1.5 tw:[&>svg]:pointer-events-none tw:[&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "tw:bg-sunken tw:px-2 tw:py-px tw:text-[11.5px] tw:leading-[18px] tw:text-slate",
        outline: "tw:border tw:border-line tw:bg-surface tw:px-2 tw:py-px tw:text-[11.5px] tw:leading-[18px] tw:text-slate",
        success: "tw:bg-success-tint tw:px-2 tw:py-px tw:text-[11.5px] tw:leading-[18px] tw:text-success-on-tint",
        warning: "tw:bg-warning-tint tw:px-2 tw:py-px tw:text-[11.5px] tw:leading-[18px] tw:text-warning-on-tint",
        error: "tw:bg-error-tint tw:px-2 tw:py-px tw:text-[11.5px] tw:leading-[18px] tw:text-error-on-tint",
        private: `${STATUS} tw:bg-status-private-tint tw:text-status-private-on-tint tw:before:bg-status-private`,
        public: `${STATUS} tw:bg-status-public-tint tw:text-status-public-on-tint tw:before:bg-status-public`,
        preop: `${STATUS} tw:bg-status-preop-tint tw:text-status-preop-on-tint tw:before:bg-status-preop`,
        holiday: `${STATUS} tw:bg-status-holiday-tint tw:text-status-holiday-on-tint tw:before:bg-status-holiday`,
        unavailable: `${STATUS} tw:bg-status-unavailable-tint tw:text-status-unavailable-on-tint tw:before:bg-status-unavailable`,
        free: `${STATUS} tw:bg-status-free-tint tw:text-status-free-on-tint tw:before:bg-status-free`,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
