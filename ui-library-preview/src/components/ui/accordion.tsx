import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { cn } from "cn"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("tw:flex tw:w-full tw:flex-col", className)}
      {...props}
    />
  )
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("tw:not-last:border-b tw:border-line", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="tw:flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "tw:group/accordion-trigger tw:relative tw:flex tw:flex-1 tw:cursor-pointer tw:items-start tw:justify-between tw:rounded-ctl tw:border tw:border-transparent tw:py-3 tw:text-left tw:text-[15px] tw:leading-[22px] tw:font-semibold tw:text-ink tw:transition-colors tw:outline-none tw:focus-visible:shadow-focus tw:aria-disabled:pointer-events-none tw:aria-disabled:text-mist tw:**:data-[slot=accordion-trigger-icon]:ml-auto tw:**:data-[slot=accordion-trigger-icon]:size-4 tw:**:data-[slot=accordion-trigger-icon]:translate-y-[3px] tw:**:data-[slot=accordion-trigger-icon]:text-slate",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon data-slot="accordion-trigger-icon" className="tw:pointer-events-none tw:shrink-0 tw:group-aria-expanded/accordion-trigger:hidden" />
        <ChevronUpIcon data-slot="accordion-trigger-icon" className="tw:pointer-events-none tw:hidden tw:shrink-0 tw:group-aria-expanded/accordion-trigger:inline" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="tw:overflow-hidden tw:text-[15px] tw:leading-[22px] tw:text-slate tw:data-open:animate-accordion-down tw:data-closed:animate-accordion-up"
      {...props}
    >
      <div
        className={cn(
          "tw:h-(--accordion-panel-height) tw:pt-0 tw:pb-3 tw:data-ending-style:h-0 tw:data-starting-style:h-0 tw:[&_a]:font-semibold tw:[&_a]:text-primary tw:[&_p:not(:last-child)]:mb-4",
          className
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
