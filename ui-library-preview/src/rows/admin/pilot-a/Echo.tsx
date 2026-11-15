import type { ReactNode } from 'react'

/** The catalogue's quiet "what the last click did" line (basicExamples Echo), in theme utilities. */
export function Echo({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="tw:mt-2 tw:min-h-[18px] tw:text-[12.5px] tw:text-slate">
      {children}
    </div>
  )
}
