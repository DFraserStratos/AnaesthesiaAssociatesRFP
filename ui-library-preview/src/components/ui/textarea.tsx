import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "tw:flex tw:field-sizing-content tw:min-h-[72px] tw:w-full tw:resize-none tw:px-3 tw:py-3 tw:leading-5 tw:rounded-ctl tw:border tw:border-line tw:bg-background tw:text-[15px] tw:text-ink tw:transition-[border-color,box-shadow] tw:duration-150 tw:outline-none tw:placeholder:text-mist tw:focus-visible:border-primary tw:focus-visible:shadow-focus tw:disabled:cursor-not-allowed tw:disabled:bg-sunken tw:disabled:text-mist tw:aria-invalid:border-error",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
