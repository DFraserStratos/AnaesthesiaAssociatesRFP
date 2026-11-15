import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="tw:toaster tw:group"
      icons={{
        success: (
          <CircleCheckIcon className="tw:size-4 tw:text-success" />
        ),
        info: (
          <InfoIcon className="tw:size-4 tw:text-slate" />
        ),
        warning: (
          <TriangleAlertIcon className="tw:size-4 tw:text-warning" />
        ),
        error: (
          <OctagonXIcon className="tw:size-4 tw:text-error" />
        ),
        loading: (
          <Loader2Icon className="tw:size-4 tw:animate-spin tw:text-primary" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--aa-surface)",
          "--normal-text": "var(--aa-ink)",
          "--normal-border": "var(--aa-line)",
          "--border-radius": "14px",
          "--font-family": "var(--font-ui)",
        } as React.CSSProperties
      }
      toastOptions={{
        // Surface, line, e2, r-card, Schibsted; plain colours whatever the type (no richColors).
        classNames: {
          toast: "cn-toast tw:font-sans! tw:shadow-e2! tw:gap-2.5! tw:px-4! tw:py-3!",
          title: "tw:text-[13px]! tw:leading-5! tw:font-semibold! tw:text-ink!",
          description: "tw:text-xs! tw:leading-4! tw:text-slate!",
          actionButton: "tw:rounded-[8px]! tw:bg-primary! tw:font-semibold! tw:text-white!",
          cancelButton: "tw:rounded-[8px]! tw:bg-sunken! tw:font-semibold! tw:text-slate!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
