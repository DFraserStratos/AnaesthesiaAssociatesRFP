"use client"

import * as React from "react"
import { cn } from "cn"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"

import { Button, buttonVariants } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "outline",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "tw:group/calendar tw:bg-surface tw:p-2 tw:text-ink tw:[--cell-radius:10px] tw:[--cell-size:--spacing(10)] tw:in-data-[slot=card-content]:bg-transparent tw:in-data-[slot=popover-content]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("tw:w-fit", defaultClassNames.root),
        months: cn(
          "tw:relative tw:flex tw:flex-col tw:gap-4 tw:md:flex-row",
          defaultClassNames.months
        ),
        month: cn("tw:flex tw:w-full tw:flex-col tw:gap-4", defaultClassNames.month),
        nav: cn(
          "tw:absolute tw:inset-x-0 tw:top-0 tw:flex tw:w-full tw:items-center tw:justify-between tw:gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "tw:size-(--cell-size) tw:rounded-pill! tw:p-0 tw:text-teal-pressed tw:select-none tw:aria-disabled:text-line-strong",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "tw:size-(--cell-size) tw:rounded-pill! tw:p-0 tw:text-teal-pressed tw:select-none tw:aria-disabled:text-line-strong",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "tw:flex tw:h-(--cell-size) tw:w-full tw:items-center tw:justify-center tw:px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "tw:flex tw:h-(--cell-size) tw:w-full tw:items-center tw:justify-center tw:gap-1.5 tw:text-[17px] tw:font-bold",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "tw:relative tw:rounded-(--cell-radius)",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "tw:absolute tw:inset-0 tw:bg-surface tw:opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "tw:font-bold tw:select-none",
          captionLayout === "label"
            ? "tw:text-[17px]"
            : "tw:flex tw:items-center tw:gap-1 tw:rounded-(--cell-radius) tw:text-[17px] tw:[&>svg]:size-4 tw:[&>svg]:text-primary",
          defaultClassNames.caption_label
        ),
        month_grid: cn("tw:w-full tw:border-collapse", defaultClassNames.month_grid),
        weekdays: cn("tw:flex", defaultClassNames.weekdays),
        weekday: cn(
          "tw:flex-1 tw:rounded-(--cell-radius) tw:text-[10.5px] tw:font-semibold tw:text-mist tw:select-none",
          defaultClassNames.weekday
        ),
        week: cn("tw:mt-2 tw:flex tw:w-full", defaultClassNames.week),
        week_number_header: cn(
          "tw:w-(--cell-size) tw:select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "tw:font-mono tw:text-[11px] tw:text-mist tw:select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "tw:group/day tw:relative tw:aspect-square tw:h-full tw:w-full tw:rounded-(--cell-radius) tw:p-0 tw:text-center tw:select-none tw:[&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
          props.showWeekNumber
            ? "tw:[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)"
            : "tw:[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
          defaultClassNames.day
        ),
        range_start: cn(
          "tw:relative tw:isolate tw:z-0 tw:rounded-l-(--cell-radius) tw:bg-teal-tint tw:after:absolute tw:after:inset-y-0 tw:after:right-0 tw:after:w-4 tw:after:bg-teal-tint",
          defaultClassNames.range_start
        ),
        range_middle: cn("tw:rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "tw:relative tw:isolate tw:z-0 tw:rounded-r-(--cell-radius) tw:bg-teal-tint tw:after:absolute tw:after:inset-y-0 tw:after:left-0 tw:after:w-4 tw:after:bg-teal-tint",
          defaultClassNames.range_end
        ),
        today: cn(
          "tw:rounded-(--cell-radius) tw:shadow-[inset_0_0_0_1.5px_var(--teal)] tw:text-ink tw:data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "tw:text-line-strong tw:aria-selected:text-teal-pressed",
          defaultClassNames.outside
        ),
        disabled: cn(
          "tw:text-line-strong",
          defaultClassNames.disabled
        ),
        hidden: cn("tw:invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("tw:size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("tw:size-4", className)} {...props} />
            )
          }

          return (
            <ChevronDownIcon className={cn("tw:size-4", className)} {...props} />
          )
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="tw:flex tw:size-(--cell-size) tw:items-center tw:justify-center tw:text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "tw:relative tw:isolate tw:z-10 tw:flex tw:aspect-square tw:size-auto tw:w-full tw:min-w-(--cell-size) tw:flex-col tw:gap-1 tw:rounded-(--cell-radius)! tw:border-0 tw:font-mono tw:text-[13px] tw:leading-none tw:font-medium tw:text-inherit tw:hover:bg-sunken tw:group-data-[focused=true]/day:relative tw:group-data-[focused=true]/day:z-10 tw:group-data-[focused=true]/day:shadow-focus tw:data-[range-end=true]:rounded-r-(--cell-radius) tw:data-[range-end=true]:bg-primary tw:data-[range-end=true]:text-white tw:data-[range-middle=true]:rounded-none! tw:data-[range-middle=true]:bg-teal-tint tw:data-[range-middle=true]:text-teal-pressed tw:data-[range-start=true]:rounded-l-(--cell-radius) tw:data-[range-start=true]:bg-primary tw:data-[range-start=true]:text-white tw:data-[selected-single=true]:bg-primary tw:data-[selected-single=true]:text-white tw:data-[selected-single=true]:hover:bg-teal-hover tw:[&>span]:text-xs tw:[&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
