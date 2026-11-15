import { useId, useState, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SheetClose } from '@/components/ui/sheet'
import { SideDrawer } from './parts'

/** PanelGrid: two fields side by side. */
export function PanelGrid({ children }: { children: ReactNode }) {
  return <div className="tw:grid tw:grid-cols-2 tw:gap-4">{children}</div>
}

/** PanelSection: a titled group of fields. */
export function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="tw:flex tw:flex-col tw:gap-3.5">
      <h3 className="tw:m-0 tw:text-sm tw:font-bold tw:text-ink">{title}</h3>
      {children}
    </section>
  )
}

/**
 * MasterPanel as a 600px shadcn Sheet (Base UI Dialog): the same title, Active
 * pill, two-column Details, Notes and Cancel / Save footer. The library adds the
 * focus trap, portal, scroll lock and focus restore the hand-built panel lacks.
 */
export function MasterPanelReplacement() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('Example record')
  const [code, setCode] = useState('EX-01')
  const nameId = useId()
  const codeId = useId()
  return (
    <div>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        Open side panel
      </Button>
      <SideDrawer
        open={open}
        onOpenChange={setOpen}
        width={600}
        title={name === '' ? 'New record' : name}
        meta={<Badge variant="success">Active</Badge>}
        footer={
          <>
            <SheetClose render={<Button variant="outline" size="lg" />}>Cancel</SheetClose>
            <Button size="lg" onClick={() => setOpen(false)}>
              Save
            </Button>
          </>
        }
      >
        <PanelSection title="Details">
          <PanelGrid>
            <Field>
              <FieldLabel htmlFor={nameId}>Name</FieldLabel>
              <Input id={nameId} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor={codeId}>Code</FieldLabel>
              <Input id={codeId} value={code} onChange={(e) => setCode(e.target.value)} className="tw:font-mono" />
            </Field>
          </PanelGrid>
        </PanelSection>
        <PanelSection title="Notes">
          <div className="tw:text-[13px] tw:text-slate">Local fields only. Escape closes the panel and returns focus.</div>
        </PanelSection>
      </SideDrawer>
    </div>
  )
}
