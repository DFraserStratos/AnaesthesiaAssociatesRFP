"use client"

import * as React from "react"
import { cn } from "cn"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="tw:relative tw:w-full tw:overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("tw:w-full tw:caption-bottom tw:text-[13px] tw:leading-5 tw:text-ink", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("tw:[&_tr]:border-b tw:[&_tr]:border-line-strong tw:[&_tr]:hover:bg-transparent", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("tw:[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "tw:border-t tw:border-line-strong tw:bg-[var(--aa-bg)] tw:font-semibold tw:[&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "tw:border-b tw:border-line tw:transition-colors tw:hover:bg-sunken tw:has-aria-expanded:bg-sunken tw:data-[state=selected]:bg-teal-tint",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "tw:h-9 tw:bg-[var(--aa-bg)] tw:px-2.5 tw:text-left tw:align-middle tw:text-[10px] tw:font-bold tw:tracking-[0.06em] tw:whitespace-nowrap tw:text-mist tw:uppercase tw:[&:has([role=checkbox])]:pr-0 tw:data-numeric:text-right",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "tw:h-10 tw:px-2.5 tw:py-2.5 tw:align-middle tw:whitespace-nowrap tw:[&:has([role=checkbox])]:pr-0 tw:data-numeric:text-right tw:data-numeric:font-mono tw:data-numeric:text-[12.5px] tw:data-numeric:font-medium",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("tw:mt-3 tw:text-xs tw:text-mist", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
