import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"
import { usePortalContainer } from "@/kit/portal"

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal container={usePortalContainer()} data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "aa-motion-fade tw:fixed tw:inset-0 tw:z-50 tw:bg-[var(--scrim)]",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "tw:fixed tw:z-50 tw:flex tw:flex-col tw:bg-surface tw:text-[15px] tw:leading-[22px] tw:text-ink tw:shadow-e3 tw:outline-none tw:data-[side=right]:inset-y-0 tw:data-[side=right]:right-0 tw:data-[side=right]:h-full tw:data-[side=right]:w-[600px] tw:data-[side=right]:max-w-full tw:data-[side=left]:inset-y-0 tw:data-[side=left]:left-0 tw:data-[side=left]:h-full tw:data-[side=left]:w-[600px] tw:data-[side=left]:max-w-full tw:data-[side=bottom]:inset-x-0 tw:data-[side=bottom]:bottom-0 tw:data-[side=bottom]:max-h-[90%] tw:data-[side=bottom]:rounded-t-sheet tw:data-[side=top]:inset-x-0 tw:data-[side=top]:top-0 tw:data-[side=top]:max-h-[90%]",
          // Our named motion: card-advance from the right, sheet-in from the bottom, a fade otherwise.
          side === "bottom" ? "aa-motion-sheet" : "aa-motion-fade",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="tw:absolute tw:top-4 tw:right-4"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="tw:sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("tw:flex tw:shrink-0 tw:flex-col tw:gap-1.5 tw:border-b tw:border-line tw:px-6 tw:py-5 tw:pr-14", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("tw:mt-auto tw:flex tw:shrink-0 tw:items-center tw:justify-end tw:gap-2.5 tw:border-t tw:border-line tw:px-6 tw:py-3.5", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "tw:text-xl tw:leading-[26px] tw:font-bold tw:text-ink",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("tw:text-[13px] tw:leading-5 tw:text-slate", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
