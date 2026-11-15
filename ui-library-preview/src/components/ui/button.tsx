import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/*
 * AA brand: the prototype's own button kinds (aa-prototype shared/ui/Button,
 * admin drawerParts ActionBtn, tableChrome textActionStyle, ContractEditSheet's
 * destructive outline). Teal is the only filled colour; every label is 600;
 * no press translate (the prototype compresses only phone controls).
 *
 * - default     teal filled (Button primary / ActionBtn primary)
 * - outline     surface + line border, ink text (Button secondary / ActionBtn)
 * - secondary   teal tint + teal-pressed text (the tinted compact action)
 * - pill        the same tint on a full pill (Button "pill", rows and chips)
 * - ghost       no chrome, slate text, sunken hover (panel close, icon actions)
 * - link        teal text action, no underline (textActionStyle)
 * - destructive surface + faint error border, error-on-tint text (never filled)
 *
 * Sizes: default 40 (desktop ActionBtn), xs 28 (DrawerLink), sm 32, lg 48
 * (Button secondary), cta 54 on r-card at 17/700 (mobile primary CTA).
 */
const buttonVariants = cva(
  "tw:group/button tw:inline-flex tw:shrink-0 tw:items-center tw:justify-center tw:rounded-ctl tw:border tw:border-transparent tw:bg-clip-padding tw:font-semibold tw:whitespace-nowrap tw:transition-[background-color,color,border-color,opacity,box-shadow] tw:duration-150 tw:outline-none tw:select-none tw:cursor-pointer tw:focus-visible:shadow-focus tw:disabled:pointer-events-none tw:disabled:cursor-default tw:aria-invalid:border-error tw:[&_svg]:pointer-events-none tw:[&_svg]:shrink-0 tw:[&_svg:not([class*=size-])]:size-4",
  {
    variants: {
      variant: {
        default:
          "tw:bg-primary tw:text-primary-foreground tw:hover:bg-teal-hover tw:active:bg-teal-pressed tw:disabled:bg-line-strong tw:disabled:text-white",
        outline:
          "tw:border-line tw:bg-surface tw:text-ink tw:hover:bg-sunken tw:aria-expanded:bg-sunken tw:focus-visible:border-primary tw:disabled:text-mist",
        secondary:
          "tw:bg-teal-tint tw:text-teal-pressed tw:hover:bg-[color-mix(in_srgb,var(--teal-tint),var(--teal)_8%)] tw:aria-expanded:bg-[color-mix(in_srgb,var(--teal-tint),var(--teal)_8%)] tw:disabled:bg-sunken tw:disabled:text-mist",
        pill:
          "tw:rounded-pill! tw:bg-teal-tint tw:text-teal-pressed tw:hover:bg-[color-mix(in_srgb,var(--teal-tint),var(--teal)_8%)] tw:disabled:bg-sunken tw:disabled:text-mist",
        ghost:
          "tw:bg-transparent tw:text-slate tw:hover:bg-sunken tw:hover:text-ink tw:aria-expanded:bg-sunken tw:aria-expanded:text-ink tw:disabled:text-line-strong",
        destructive:
          "tw:border-[color-mix(in_srgb,var(--error)_33%,transparent)] tw:bg-surface tw:text-error-on-tint tw:hover:bg-error-tint tw:focus-visible:border-error tw:disabled:text-mist",
        link:
          "tw:h-auto! tw:border-0 tw:bg-transparent tw:p-0! tw:text-primary tw:hover:text-teal-pressed tw:disabled:text-mist",
      },
      size: {
        default:
          "tw:h-10 tw:gap-2 tw:px-3 tw:text-[13.5px] tw:has-data-[icon=inline-end]:pr-2.5 tw:has-data-[icon=inline-start]:pl-2.5",
        xs: "tw:h-7 tw:gap-1 tw:rounded-[8px]! tw:px-2.5 tw:text-[12.5px] tw:has-data-[icon=inline-end]:pr-2 tw:has-data-[icon=inline-start]:pl-2 tw:[&_svg:not([class*=size-])]:size-3.5",
        sm: "tw:h-8 tw:gap-1.5 tw:px-3 tw:text-[13px] tw:has-data-[icon=inline-end]:pr-2 tw:has-data-[icon=inline-start]:pl-2 tw:[&_svg:not([class*=size-])]:size-3.5",
        lg: "tw:h-12 tw:gap-2 tw:px-[18px] tw:text-[15px] tw:has-data-[icon=inline-end]:pr-4 tw:has-data-[icon=inline-start]:pl-4",
        cta: "tw:h-[54px] tw:gap-2 tw:rounded-card! tw:px-5 tw:text-[17px] tw:font-bold",
        icon: "tw:size-10",
        "icon-xs":
          "tw:size-7 tw:rounded-[8px]! tw:[&_svg:not([class*=size-])]:size-3.5",
        "icon-sm": "tw:size-8",
        "icon-lg": "tw:size-12",
      },
    },
    compoundVariants: [
      // The tinted pill keeps the prototype's 13px label at every height.
      { variant: "pill", size: "default", className: "tw:px-4 tw:text-[13px]" },
      { variant: "link", className: "tw:text-[12.5px]" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
