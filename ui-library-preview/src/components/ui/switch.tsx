import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "cn"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "tw:peer tw:group/switch tw:relative tw:inline-flex tw:shrink-0 tw:cursor-pointer tw:items-center tw:rounded-pill tw:p-[3px] tw:transition-[background-color,box-shadow] tw:duration-150 tw:ease-card tw:outline-none tw:after:absolute tw:after:-inset-x-3 tw:after:-inset-y-2 tw:focus-visible:shadow-focus tw:aria-invalid:shadow-[0_0_0_1px_var(--error)] tw:data-[size=default]:h-8 tw:data-[size=default]:w-[52px] tw:data-[size=sm]:h-[22px] tw:data-[size=sm]:w-9 tw:data-checked:bg-primary tw:data-unchecked:bg-line-strong tw:data-disabled:cursor-not-allowed tw:data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="tw:pointer-events-none tw:block tw:rounded-pill tw:bg-white tw:transition-transform tw:duration-150 tw:ease-card tw:group-data-[size=default]/switch:size-[26px] tw:group-data-[size=sm]/switch:size-4 tw:group-data-[size=default]/switch:data-checked:translate-x-5 tw:group-data-[size=sm]/switch:data-checked:translate-x-3.5 tw:data-unchecked:translate-x-0"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
