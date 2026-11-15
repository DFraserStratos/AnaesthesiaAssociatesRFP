import { useState, type ReactNode } from 'react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Echo } from './parts'

/** IdChip: the label and mono value on a sunken outlined pill (an outline Badge). */
function IdChip({ label, value }: { label: string; value: string }) {
  return (
    <Badge variant="outline" className="tw:items-baseline tw:gap-1.5 tw:border-line tw:bg-sunken tw:px-2.5 tw:py-[3px]">
      <span className="tw:text-[11px] tw:font-semibold tw:text-mist">{label}</span>
      <span className="tw:font-mono tw:text-[13px] tw:font-semibold tw:text-ink">{value}</span>
    </Badge>
  )
}

/** Fact: a labelled value in a card; `mono` for identifiers, `note` a mist line. */
function Fact({ label, value, mono, note }: { label: string; value: ReactNode; mono?: boolean; note?: string }) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-0.5">
      <div className="tw:text-xs tw:font-semibold tw:text-mist">{label}</div>
      <div className={mono === true ? 'tw:font-mono tw:text-sm tw:wrap-anywhere tw:text-ink' : 'tw:text-sm tw:wrap-anywhere tw:text-ink'}>{value}</div>
      {note !== undefined && <div className="tw:text-xs tw:text-mist">{note}</div>}
    </div>
  )
}

/**
 * The profile chrome on shadcn Card (+ Breadcrumb): header with name, id chip,
 * sub line and History / Edit details; a Contact card of facts. `crumb` adds
 * the BackLink as a Breadcrumb (rendered as a plain link, no router here).
 */
export function ProfileChromeReplacement({ crumb = false }: { crumb?: boolean }) {
  const [last, setLast] = useState('Nothing clicked yet.')
  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      {crumb && (
        <Breadcrumb>
          <BreadcrumbList className="tw:text-[13px]">
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setLast('Back to Master data · Anaesthetists (stubbed).')
                }}
                className="tw:font-semibold"
              >
                Anaesthetists
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dr Example Anaesthetist</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <header className="tw:flex tw:flex-wrap tw:items-end tw:justify-between tw:gap-4 tw:pb-1">
        <div className="tw:min-w-0">
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
            <h1 className="tw:m-0 tw:text-2xl tw:leading-[30px] tw:font-bold tw:tracking-[-0.01em]">Dr Example Anaesthetist</h1>
            <IdChip label="Reg" value="12345" />
          </div>
          <div className="tw:mt-1 tw:text-[13px] tw:text-slate">Anaesthetist · since Jan 2020</div>
        </div>
        <div className="tw:flex tw:flex-none tw:gap-2">
          <Button variant="outline" size="lg" onClick={() => setLast('History (stubbed).')}>
            History
          </Button>
          <Button variant="outline" size="lg" onClick={() => setLast('Edit details (stubbed).')}>
            Edit details
          </Button>
        </div>
      </header>
      <Card size="sm" className="tw:gap-3 tw:shadow-none">
        <CardHeader className="tw:px-[18px]">
          <CardTitle role="heading" aria-level={2} className="tw:text-[15px] tw:leading-[22px] tw:font-semibold">
            Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="tw:flex tw:flex-col tw:gap-3 tw:px-[18px]">
          <Fact label="Email" value="example@aa.co.nz" />
          <Fact label="Mobile" value="021 000 0000" mono note="Shown to the office only." />
        </CardContent>
      </Card>
      <Echo>{last}</Echo>
    </div>
  )
}
