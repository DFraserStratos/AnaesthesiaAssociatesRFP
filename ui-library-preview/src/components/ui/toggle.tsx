import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/*
 * AA brand. A standalone toggle is a quiet control whose ON state uses the
 * selection colour (teal tint, teal-pressed text). Inside a ToggleGroup the
 * items become the prototype's segmented control instead (toggle-group.tsx).
 */
const toggleVariants = cva(
  "tw:group/toggle tw:inline-flex tw:cursor-pointer tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-ctl tw:text-sm tw:font-semibold tw:whitespace-nowrap tw:text-slate tw:transition-[color,background-color,box-shadow] tw:duration-150 tw:outline-none tw:hover:bg-sunken tw:hover:text-ink tw:focus-visible:shadow-focus tw:disabled:pointer-events-none tw:disabled:text-line-strong tw:aria-pressed:bg-teal-tint tw:aria-pressed:text-teal-pressed tw:data-pressed:bg-teal-tint tw:data-pressed:text-teal-pressed tw:[&_svg]:pointer-events-none tw:[&_svg]:shrink-0 tw:[&_svg:not([class*=size-])]:size-4",
  {
    variants: {
      variant: {
        // Segmented look in a group: white pill, ink text.
        default: "tw:bg-transparent",
        // Segmented look in a group: the prototype's default teal pill, white text.
        teal: "tw:bg-transparent",
        outline: "tw:border tw:border-line tw:bg-surface",
      },
      size: {
        default:
          "tw:h-10 tw:min-w-10 tw:px-3 tw:has-data-[icon=inline-end]:pr-2.5 tw:has-data-[icon=inline-start]:pl-2.5",
        sm: "tw:h-8 tw:min-w-8 tw:px-2.5 tw:text-[13px] tw:has-data-[icon=inline-end]:pr-2 tw:has-data-[icon=inline-start]:pl-2 tw:[&_svg:not([class*=size-])]:size-3.5",
        lg: "tw:h-12 tw:min-w-12 tw:px-4 tw:text-[15px] tw:has-data-[icon=inline-end]:pr-3 tw:has-data-[icon=inline-start]:pl-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
