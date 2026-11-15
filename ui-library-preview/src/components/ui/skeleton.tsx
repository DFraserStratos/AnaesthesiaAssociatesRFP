import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("tw:animate-pulse tw:rounded-ctl tw:bg-sunken", className)}
      {...props}
    />
  )
}

export { Skeleton }
