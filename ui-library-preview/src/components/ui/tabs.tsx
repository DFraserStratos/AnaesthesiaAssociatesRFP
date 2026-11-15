"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "tw:group/tabs tw:flex tw:gap-2 tw:data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "tw:group/tabs-list tw:inline-flex tw:w-fit tw:items-center tw:justify-center tw:text-slate tw:group-data-vertical/tabs:h-fit tw:group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        // The prototype segmented control: sunken track, white selected pill.
        default: "tw:gap-1 tw:rounded-[12px] tw:bg-sunken tw:p-1",
        // The prototype tab links (AA Fees, Accounts, Integrations): ink underline.
        line: "tw:gap-0 tw:rounded-none tw:border-b tw:border-line tw:bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "tw:relative tw:inline-flex tw:flex-1 tw:cursor-pointer tw:items-center tw:justify-center tw:gap-1.5 tw:border-0 tw:bg-transparent tw:text-sm tw:font-semibold tw:whitespace-nowrap tw:text-slate tw:transition-[color,background-color,box-shadow] tw:duration-150 tw:outline-none tw:group-data-vertical/tabs:w-full tw:group-data-vertical/tabs:justify-start tw:hover:text-ink tw:focus-visible:shadow-focus tw:disabled:pointer-events-none tw:disabled:text-line-strong tw:aria-disabled:pointer-events-none tw:aria-disabled:text-line-strong tw:[&_svg]:pointer-events-none tw:[&_svg]:shrink-0 tw:[&_svg:not([class*=size-])]:size-4",
        // Segmented (default list): 40 tall, r9, the selected cell a white pill with ink text.
        "tw:group-data-[variant=default]/tabs-list:min-h-10 tw:group-data-[variant=default]/tabs-list:rounded-[9px] tw:group-data-[variant=default]/tabs-list:px-3 tw:group-data-[variant=default]/tabs-list:data-active:bg-surface tw:group-data-[variant=default]/tabs-list:data-active:text-ink tw:group-data-[variant=default]/tabs-list:data-active:shadow-[0_1px_3px_rgba(23,35,32,0.15)]",
        // Line: 10px 14px, 500 slate at rest, 600 ink with a 2px ink underline when active.
        "tw:group-data-[variant=line]/tabs-list:flex-none tw:group-data-[variant=line]/tabs-list:rounded-none tw:group-data-[variant=line]/tabs-list:px-3.5 tw:group-data-[variant=line]/tabs-list:py-2.5 tw:group-data-[variant=line]/tabs-list:font-medium tw:group-data-[variant=line]/tabs-list:data-active:font-semibold tw:group-data-[variant=line]/tabs-list:data-active:text-ink tw:group-data-[variant=line]/tabs-list:data-active:shadow-[inset_0_-2px_0_var(--aa-ink)] tw:group-data-[variant=line]/tabs-list:focus-visible:shadow-focus",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("tw:flex-1 tw:text-[15px] tw:leading-[22px] tw:outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
