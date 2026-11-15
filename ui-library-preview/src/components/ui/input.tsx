import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "tw:h-12 tw:w-full tw:min-w-0 tw:px-3.5 tw:py-0 tw:rounded-ctl tw:border tw:border-line tw:bg-background tw:text-[15px] tw:text-ink tw:transition-[border-color,box-shadow] tw:duration-150 tw:outline-none tw:placeholder:text-mist tw:focus-visible:border-primary tw:focus-visible:shadow-focus tw:disabled:cursor-not-allowed tw:disabled:bg-sunken tw:disabled:text-mist tw:aria-invalid:border-error tw:file:inline-flex tw:file:h-6 tw:file:border-0 tw:file:bg-transparent tw:file:text-sm tw:file:font-semibold tw:file:text-ink",
        className
      )}
      {...props}
    />
  )
}

export { Input }
