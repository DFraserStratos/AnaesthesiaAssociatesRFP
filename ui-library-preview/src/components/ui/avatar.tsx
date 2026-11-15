"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { cn } from "cn"

function Avatar({
  className,
  size = "default",
  variant = "tint",
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: "default" | "sm" | "lg"
  /**
   * AA identity chips, crimson initials either way (crimson is identity only):
   * "tint" = the web nav chip (brand tint, 36px, 13/700);
   * "elevated" = the mobile persona avatar (white chip at e1, 44px, 0.34 x size / 700).
   */
  variant?: "tint" | "elevated"
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      data-variant={variant}
      className={cn(
        "tw:group/avatar tw:relative tw:flex tw:size-9 tw:shrink-0 tw:rounded-pill tw:select-none tw:data-[size=lg]:size-11 tw:data-[size=sm]:size-7 tw:data-[variant=elevated]:shadow-e1",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "tw:aspect-square tw:size-full tw:rounded-full tw:object-cover",
        className
      )}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "tw:flex tw:size-full tw:items-center tw:justify-center tw:rounded-pill tw:bg-brand-tint tw:text-[13px] tw:font-bold tw:text-brand tw:group-data-[variant=elevated]/avatar:bg-surface tw:group-data-[size=lg]/avatar:text-[15px] tw:group-data-[size=sm]/avatar:text-[10px]",
        className
      )}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "tw:absolute tw:right-0 tw:bottom-0 tw:z-10 tw:inline-flex tw:items-center tw:justify-center tw:rounded-pill tw:bg-success tw:text-white tw:ring-2 tw:ring-surface tw:select-none",
        "tw:group-data-[size=sm]/avatar:size-2 tw:group-data-[size=sm]/avatar:[&>svg]:hidden",
        "tw:group-data-[size=default]/avatar:size-2.5 tw:group-data-[size=default]/avatar:[&>svg]:size-2",
        "tw:group-data-[size=lg]/avatar:size-3 tw:group-data-[size=lg]/avatar:[&>svg]:size-2",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "tw:group/avatar-group tw:flex tw:-space-x-2 tw:*:data-[slot=avatar]:ring-2 tw:*:data-[slot=avatar]:ring-surface",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "tw:relative tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-pill tw:bg-sunken tw:font-mono tw:text-xs tw:font-semibold tw:text-slate tw:ring-2 tw:ring-surface tw:group-has-data-[size=lg]/avatar-group:size-11 tw:group-has-data-[size=sm]/avatar-group:size-7 tw:[&>svg]:size-4 tw:group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 tw:group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
