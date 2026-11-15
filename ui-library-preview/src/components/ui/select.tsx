import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { cn } from "cn"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"
import { usePortalContainer } from "@/kit/portal"

const Select = SelectPrimitive.Root

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("tw:scroll-my-1 tw:p-1", className)}
      {...props}
    />
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("tw:flex tw:flex-1 tw:text-left", className)}
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "tw:flex tw:w-fit tw:cursor-pointer tw:items-center tw:justify-between tw:gap-2 tw:pr-3 tw:pl-3.5 tw:whitespace-nowrap tw:select-none tw:rounded-ctl tw:border tw:border-line tw:bg-background tw:text-[15px] tw:text-ink tw:transition-[border-color,box-shadow] tw:duration-150 tw:outline-none tw:placeholder:text-mist tw:focus-visible:border-primary tw:focus-visible:shadow-focus tw:disabled:cursor-not-allowed tw:disabled:bg-sunken tw:disabled:text-mist tw:aria-invalid:border-error tw:data-placeholder:text-mist tw:data-popup-open:border-primary tw:data-[size=default]:h-12 tw:data-[size=sm]:h-8 tw:data-[size=sm]:pl-2.5 tw:data-[size=sm]:pr-2 tw:data-[size=sm]:text-[13px] tw:*:data-[slot=select-value]:line-clamp-1 tw:*:data-[slot=select-value]:flex tw:*:data-[slot=select-value]:items-center tw:*:data-[slot=select-value]:gap-1.5 tw:[&_svg]:pointer-events-none tw:[&_svg]:shrink-0 tw:[&_svg:not([class*=size-])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="tw:pointer-events-none tw:size-4 tw:text-primary" />
        }
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal container={usePortalContainer()}>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="tw:isolate tw:z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn("aa-motion-fade tw:relative tw:isolate tw:z-50 tw:max-h-(--available-height) tw:w-(--anchor-width) tw:min-w-36 tw:origin-(--transform-origin) tw:overflow-x-hidden tw:overflow-y-auto tw:rounded-ctl tw:border tw:border-line tw:bg-surface tw:text-ink tw:shadow-e2", className )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("tw:px-2.5 tw:pt-2 tw:pb-1 tw:text-[11px] tw:leading-[14px] tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "tw:relative tw:flex tw:w-full tw:cursor-default tw:items-center tw:gap-1.5 tw:rounded-[6px] tw:py-2 tw:pr-8 tw:pl-2.5 tw:text-sm tw:outline-hidden tw:select-none tw:focus:bg-accent tw:focus:text-accent-foreground tw:not-data-[variant=destructive]:focus:**:text-accent-foreground tw:data-disabled:pointer-events-none tw:data-disabled:opacity-50 tw:[&_svg]:pointer-events-none tw:[&_svg]:shrink-0 tw:[&_svg:not([class*=size-])]:size-4 tw:*:[span]:last:flex tw:*:[span]:last:items-center tw:*:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="tw:flex tw:flex-1 tw:shrink-0 tw:gap-2 tw:whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="tw:pointer-events-none tw:absolute tw:right-2 tw:flex tw:size-4 tw:items-center tw:justify-center" />
        }
      >
        <CheckIcon className="tw:pointer-events-none tw:text-primary" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("tw:pointer-events-none tw:-mx-1 tw:my-1 tw:h-px tw:bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "tw:top-0 tw:z-10 tw:flex tw:w-full tw:cursor-default tw:items-center tw:justify-center tw:bg-surface tw:py-1 tw:[&_svg:not([class*=size-])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon
      />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "tw:bottom-0 tw:z-10 tw:flex tw:w-full tw:cursor-default tw:items-center tw:justify-center tw:bg-surface tw:py-1 tw:[&_svg:not([class*=size-])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon
      />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
