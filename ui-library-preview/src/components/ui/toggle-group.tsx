import * as React from "react"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { type VariantProps } from "class-variance-authority"
import { cn } from "cn"

import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
  }
>({
  size: "default",
  variant: "default",
  spacing: 2,
  orientation: "horizontal",
})

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 2,
  orientation = "horizontal",
  children,
  ...props
}: ToggleGroupPrimitive.Props &
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
  }) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        "tw:group/toggle-group tw:flex tw:w-fit tw:flex-row tw:items-center tw:gap-1 tw:rounded-[12px] tw:bg-sunken tw:p-1 tw:data-[variant=outline]:gap-[--spacing(var(--gap))] tw:data-[variant=outline]:bg-transparent tw:data-[variant=outline]:p-0 tw:data-vertical:flex-col tw:data-vertical:items-stretch",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider
        value={{ variant, size, spacing, orientation }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        // The prototype segmented control (SlidingSegmentedControl): r9 cells on
        // the r12 sunken track, slate at rest, the selected cell a raised pill.
        "tw:shrink-0 tw:flex-1 tw:focus:z-10 tw:focus-visible:z-10 tw:hover:bg-transparent tw:hover:text-ink",
        (context.variant || variant) === "teal"
          ? "tw:rounded-[9px]! tw:aria-pressed:bg-primary tw:aria-pressed:text-white tw:data-pressed:bg-primary tw:data-pressed:text-white tw:aria-pressed:shadow-[0_1px_3px_rgba(23,35,32,0.2)] tw:hover:aria-pressed:text-white"
          : (context.variant || variant) === "outline"
            ? "tw:hover:bg-sunken"
            : "tw:rounded-[9px]! tw:aria-pressed:bg-surface tw:aria-pressed:text-ink tw:data-pressed:bg-surface tw:data-pressed:text-ink tw:aria-pressed:shadow-[0_1px_3px_rgba(23,35,32,0.15)]",
        className
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  )
}

export { ToggleGroup, ToggleGroupItem }
