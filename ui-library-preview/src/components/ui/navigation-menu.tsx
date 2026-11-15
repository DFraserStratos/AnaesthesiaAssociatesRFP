import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu"
import { cva } from "class-variance-authority"
import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"
import { usePortalContainer } from "@/kit/portal"

function NavigationMenu({
  align = "start",
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Root.Props &
  Pick<NavigationMenuPrimitive.Positioner.Props, "align">) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      className={cn(
        "tw:group/navigation-menu tw:relative tw:flex tw:max-w-max tw:flex-1 tw:items-center tw:justify-center",
        className
      )}
      {...props}
    >
      {children}
      <NavigationMenuPositioner align={align} />
    </NavigationMenuPrimitive.Root>
  )
}

function NavigationMenuList({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        "tw:group tw:flex tw:flex-1 tw:list-none tw:items-center tw:justify-center tw:gap-0",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuItem({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn("tw:relative", className)}
      {...props}
    />
  )
}

const navigationMenuTriggerStyle = cva(
  "tw:group/navigation-menu-trigger tw:inline-flex tw:h-10 tw:w-max tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-ctl tw:px-3 tw:text-sm tw:font-semibold tw:text-slate tw:transition-colors tw:duration-150 tw:outline-none tw:hover:bg-sunken tw:hover:text-ink tw:focus-visible:shadow-focus tw:disabled:pointer-events-none tw:disabled:text-line-strong tw:data-popup-open:bg-sunken tw:data-popup-open:text-ink tw:data-open:bg-sunken tw:data-open:text-ink"
)

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Trigger.Props) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), "tw:group", className)}
      {...props}
    >
      {children}{" "}
      <ChevronDownIcon className="tw:relative tw:top-px tw:ml-1 tw:size-3.5 tw:text-primary tw:group-data-popup-open/navigation-menu-trigger:rotate-180 tw:group-data-open/navigation-menu-trigger:rotate-180" aria-hidden="true" />
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({
  className,
  ...props
}: NavigationMenuPrimitive.Content.Props) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "tw:h-full tw:w-auto tw:p-1.5 tw:transition-opacity tw:duration-240 tw:ease-sheet tw:data-ending-style:opacity-0 tw:data-starting-style:opacity-0 tw:group-data-[viewport=false]/navigation-menu:rounded-ctl tw:group-data-[viewport=false]/navigation-menu:border tw:group-data-[viewport=false]/navigation-menu:border-line tw:group-data-[viewport=false]/navigation-menu:bg-surface tw:group-data-[viewport=false]/navigation-menu:text-ink tw:group-data-[viewport=false]/navigation-menu:shadow-e2 tw:**:data-[slot=navigation-menu-link]:focus:outline-none",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuPositioner({
  className,
  side = "bottom",
  sideOffset = 8,
  align = "start",
  alignOffset = 0,
  ...props
}: NavigationMenuPrimitive.Positioner.Props) {
  return (
    <NavigationMenuPrimitive.Portal container={usePortalContainer()}>
      <NavigationMenuPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className={cn(
          "tw:isolate tw:z-50 tw:h-(--positioner-height) tw:w-(--positioner-width) tw:max-w-(--available-width) tw:transition-[top,left,right,bottom] tw:duration-240 tw:ease-sheet tw:data-instant:transition-none tw:data-[side=bottom]:before:top-[-10px] tw:data-[side=bottom]:before:right-0 tw:data-[side=bottom]:before:left-0",
          className
        )}
        {...props}
      >
        <NavigationMenuPrimitive.Popup className="aa-motion-fade tw:relative tw:h-(--popup-height) tw:w-(--popup-width) tw:origin-(--transform-origin) tw:rounded-ctl tw:border tw:border-line tw:bg-surface tw:text-ink tw:shadow-e2 tw:outline-none">
          <NavigationMenuPrimitive.Viewport className="tw:relative tw:size-full tw:overflow-hidden" />
        </NavigationMenuPrimitive.Popup>
      </NavigationMenuPrimitive.Positioner>
    </NavigationMenuPrimitive.Portal>
  )
}

function NavigationMenuLink({
  className,
  ...props
}: NavigationMenuPrimitive.Link.Props) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "tw:flex tw:items-center tw:gap-2 tw:rounded-[6px] tw:px-2.5 tw:py-2 tw:text-sm tw:text-ink tw:transition-colors tw:outline-none tw:hover:bg-sunken tw:focus:bg-sunken tw:focus-visible:shadow-focus tw:data-active:font-semibold tw:data-active:text-ink tw:[&_svg:not([class*=size-])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.Icon>) {
  return (
    <NavigationMenuPrimitive.Icon
      data-slot="navigation-menu-indicator"
      className={cn(
        "tw:top-full tw:z-1 tw:flex tw:h-1.5 tw:items-end tw:justify-center tw:overflow-hidden tw:transition-opacity tw:duration-240 tw:ease-sheet tw:data-[state=hidden]:opacity-0",
        className
      )}
      {...props}
    >
      <div className="tw:relative tw:top-[60%] tw:h-2 tw:w-2 tw:rotate-45 tw:rounded-tl-sm tw:bg-line tw:shadow-e1" />
    </NavigationMenuPrimitive.Icon>
  )
}

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuPositioner,
}
