import { Fragment } from 'react'
import { format, parseISO } from 'date-fns'
import { useWebFixtures } from '@proto/apps/demo/catalogue/web/fixtures'
import { useListInvoices } from '@proto/shared/schedule'
import { formatCurrency } from '@proto/shared/format'
import { Badge } from '@/components/ui/badge'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemSeparator, ItemTitle } from '@/components/ui/item'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Missing } from './shared'

type Paid = 'paid' | 'partPaid' | 'outstanding'
interface InvoiceRow {
  invoiceId: string
  invoiceNumber: string
  party: string
  issuedISO?: string
  total: number
  paid: Paid
}

const PAID_LABEL: Record<Paid, string> = { paid: 'Paid', partPaid: 'Part paid', outstanding: 'Outstanding' }
const PAID_TEXT: Record<Paid, string> = { paid: 'tw:text-success-on-tint', partPaid: 'tw:text-warning-on-tint', outstanding: 'tw:text-slate' }
const PAID_BADGE: Record<Paid, 'success' | 'warning' | 'default'> = { paid: 'success', partPaid: 'warning', outstanding: 'default' }
const money = (n: number) => formatCurrency(n) as string
const issued = (iso: string) => format(parseISO(iso), 'd MMM yyyy')

const EMPTY = 'No invoices were raised for this List.'

/** Today's two-line list, on shadcn Item: number and who over when; total over paid state. */
function AsList({ rows }: { rows: InvoiceRow[] }) {
  return (
    <ItemGroup className="tw:gap-0">
      {rows.map((r, i) => (
        <Fragment key={r.invoiceId}>
          {i > 0 && <ItemSeparator className="tw:my-0 tw:bg-sunken" />}
          <Item className="tw:gap-3 tw:rounded-none tw:border-0 tw:px-0 tw:py-2.5">
            <ItemContent className="tw:gap-0.5">
              <ItemTitle className="tw:font-mono tw:text-[13px] tw:font-semibold">{r.invoiceNumber}</ItemTitle>
              <ItemDescription className="tw:text-xs tw:text-slate">
                {r.party}
                {r.issuedISO !== undefined && (
                  <>
                    {' · '}
                    <span className="tw:font-mono">{issued(r.issuedISO)}</span>
                  </>
                )}
              </ItemDescription>
            </ItemContent>
            <ItemActions className="tw:flex-col tw:items-end tw:gap-0.5">
              <span className="tw:font-mono tw:text-[13px] tw:font-semibold tw:tabular-nums">{money(r.total)}</span>
              <span className={cn('tw:text-[11.5px] tw:font-semibold', PAID_TEXT[r.paid])}>{PAID_LABEL[r.paid]}</span>
            </ItemActions>
          </Item>
        </Fragment>
      ))}
    </ItemGroup>
  )
}

/** A plain shadcn Table: no TanStack, five fixed columns. */
function AsTable({ rows }: { rows: InvoiceRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Sent to</TableHead>
          <TableHead>Issued</TableHead>
          <TableHead data-numeric>Total</TableHead>
          <TableHead>Paid</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.invoiceId}>
            <TableCell className="tw:font-mono tw:font-semibold">{r.invoiceNumber}</TableCell>
            <TableCell className="tw:text-slate">{r.party}</TableCell>
            <TableCell className="tw:font-mono tw:text-slate">{r.issuedISO !== undefined ? issued(r.issuedISO) : '·'}</TableCell>
            <TableCell data-numeric className="tw:font-semibold">
              {money(r.total)}
            </TableCell>
            <TableCell>
              <Badge variant={PAID_BADGE[r.paid]}>{PAID_LABEL[r.paid]}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** An authorised List's invoices, read only; the same useListInvoices rows as today. */
export function ListInvoicesReplacement({ layout = 'list' }: { layout?: 'list' | 'table' }) {
  const f = useWebFixtures() as { authorisedListId?: string }
  const rows = useListInvoices(f.authorisedListId ?? '') as InvoiceRow[]
  if (f.authorisedListId === undefined) return <Missing what="authorised List" />
  if (rows.length === 0) return <div className="tw:text-[13px] tw:text-mist">{EMPTY}</div>
  return layout === 'table' ? <AsTable rows={rows} /> : <AsList rows={rows} />
}
