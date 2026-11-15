import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

import { Separator } from "@/components/ui/separator"

function ItemGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="list"
      data-slot="item-group"
      className={cn(
        "tw:group/item-group tw:flex tw:w-full tw:flex-col tw:gap-4 tw:has-data-[size=sm]:gap-2.5 tw:has-data-[size=xs]:gap-2",
        className
      )}
      {...props}
    />
  )
}

function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={cn("tw:my-2", className)}
      {...props}
    />
  )
}

const itemVariants = cva(
  "tw:group/item tw:flex tw:w-full tw:flex-wrap tw:items-center tw:rounded-ctl tw:border tw:text-sm tw:text-ink tw:transition-colors tw:duration-150 tw:outline-none tw:focus-visible:shadow-focus tw:[a]:transition-colors tw:[a]:hover:bg-muted",
  {
    variants: {
      variant: {
        default: "tw:border-transparent",
        outline: "tw:border-line tw:bg-surface",
        muted: "tw:border-transparent tw:bg-sunken",
      },
      size: {
        default: "tw:gap-2.5 tw:px-3 tw:py-2.5",
        sm: "tw:gap-2.5 tw:px-3 tw:py-2.5",
        xs: "tw:gap-2 tw:px-2.5 tw:py-2 tw:in-data-[slot=dropdown-menu-content]:p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Item({
  className,
  variant = "default",
  size = "default",
  render,
  ...props
}: useRender.ComponentProps<"div"> & VariantProps<typeof itemVariants>) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(itemVariants({ variant, size, className })),
      },
      props
    ),
    render,
    state: {
      slot: "item",
      variant,
      size,
    },
  })
}

const itemMediaVariants = cva(
  "tw:flex tw:shrink-0 tw:items-center tw:justify-center tw:gap-2 tw:group-has-data-[slot=item-description]/item:translate-y-0.5 tw:group-has-data-[slot=item-description]/item:self-start tw:[&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "tw:bg-transparent",
        icon: "tw:[&_svg:not([class*=size-])]:size-4",
        image:
          "tw:size-10 tw:overflow-hidden tw:rounded-[8px] tw:group-data-[size=sm]/item:size-8 tw:group-data-[size=xs]/item:size-6 tw:[&_img]:size-full tw:[&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function ItemMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn(
        "tw:flex tw:flex-1 tw:flex-col tw:gap-1 tw:group-data-[size=xs]/item:gap-0 tw:[&+[data-slot=item-content]]:flex-none",
        className
      )}
      {...props}
    />
  )
}

function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn(
        "tw:line-clamp-1 tw:flex tw:w-fit tw:items-center tw:gap-2 tw:text-sm tw:leading-5 tw:font-semibold tw:text-ink",
        className
      )}
      {...props}
    />
  )
}

function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        "tw:line-clamp-2 tw:text-left tw:text-[13px] tw:leading-5 tw:font-normal tw:text-slate tw:group-data-[size=xs]/item:text-xs tw:[&>a]:font-semibold tw:[&>a]:text-primary",
        className
      )}
      {...props}
    />
  )
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn("tw:flex tw:items-center tw:gap-2", className)}
      {...props}
    />
  )
}

function ItemHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-header"
      className={cn(
        "tw:flex tw:basis-full tw:items-center tw:justify-between tw:gap-2",
        className
      )}
      {...props}
    />
  )
}

function ItemFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-footer"
      className={cn(
        "tw:flex tw:basis-full tw:items-center tw:justify-between tw:gap-2",
        className
      )}
      {...props}
    />
  )
}

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
}
