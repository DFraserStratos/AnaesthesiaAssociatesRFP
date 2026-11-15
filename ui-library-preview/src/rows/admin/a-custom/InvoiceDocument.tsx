import { useMemo, useState, type ReactNode } from 'react'
import { Clock, FlaskConical, Mail, Printer, Upload } from 'lucide-react'
import { clockISO, counterpartyName, invoiceLinesFor, useAppStore } from '@proto/store'
import { GST_RATE } from '@proto/domain/billing'
import { dateTimeMicroCap, formatCurrency, hhmm } from '@proto/shared/format'
import logoUrl from '@proto/assets/aa-logo.png'
import { useSeedIds } from '@proto/apps/demo/catalogue/admin/adminData'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

/** The prototype records this row reads. */
interface Invoice {
  id: string
  invoiceNumber: string
  bookingId: string
  raisedAtISO: string
  caseReference: string
  layout: 'patient' | 'contractHolder'
  kind: 'standard' | 'prePayment'
  counterparty: { kind: string }
  subtotal: number
  gst: number
  total: number
  emailedAtISO?: string
}
interface BillingCase {
  invoiceId: string
  accRecId?: string
  accPayId?: string
  handoffFailure?: unknown
  paidInAtISO?: string
  receivedAmount: number
  disbursedAtISO?: string
  disbursedAmount: number
}
interface Line {
  id: string
  description: string
  units?: number
  amount: number
  procedureId?: string
}
interface Procedure {
  billingReference?: string
  patientPaymentCategory?: 'insuredReimbursement' | 'selfFundedPrepayment' | 'selfFundedPostProcedure'
  prepaymentDetail?: { type: 'full' | 'split'; depositAmount?: number }
}

const SERIF = "tw:font-['Georgia','Times_New_Roman',serif]"
const META = 'tw:text-[10px] tw:font-bold tw:tracking-[0.08em] tw:text-mist tw:uppercase'

/**
 * The invoice as a print-styled page, kept custom: the document is a plain
 * section (never a fixed Dialog, so print isolation stays), its voice serif,
 * money mono, the crimson logo as the only identity. Library pieces replace the
 * chrome: shadcn Table for the lines, Card for the rail cards, Button for Email
 * and Print, Badge for the simulated-send marker. Email is local only here.
 */
export function InvoiceDocumentReplacement() {
  const { invoiceId } = useSeedIds() as { invoiceId?: string }
  if (invoiceId === undefined) return <div className="tw:text-[13px] tw:text-mist">The seed has no invoices right now (try Demo reset).</div>
  return (
    <div style={{ zoom: 0.5 }}>
      <div className="tw:w-[1180px]">
        <InvoiceView invoiceId={invoiceId} />
      </div>
    </div>
  )
}

function InvoiceView({ invoiceId }: { invoiceId: string }) {
  const billing = useAppStore((s: { billing: unknown }) => s.billing) as { invoices: Record<string, Invoice>; cases: Record<string, BillingCase> }
  const bookings = useAppStore((s: { schedule: { bookings: unknown } }) => s.schedule.bookings) as Record<string, { listId: string; patientId: string }>
  const lists = useAppStore((s: { schedule: { lists: unknown } }) => s.schedule.lists) as Record<string, { anaesthetistId?: string }>
  const procedures = useAppStore((s: { schedule: { procedures: unknown } }) => s.schedule.procedures) as Record<string, Procedure>
  const masters = useAppStore((s: { masters: unknown }) => s.masters) as { anaesthetists: Record<string, { name: string }>; patients: Record<string, { name: string }> }
  const nowISO = useAppStore((s: { clock: unknown }) => clockISO(s.clock)) as string
  const [emailedLocally, setEmailedLocally] = useState<string | undefined>(undefined)

  const invoice = billing.invoices[invoiceId]
  const lines = useMemo(() => invoiceLinesFor({ billing }, invoiceId) as Line[], [billing, invoiceId])
  const theCase = useMemo(() => Object.values(billing.cases).find((c) => c.invoiceId === invoiceId), [billing.cases, invoiceId])
  const procs = useMemo(() => [...new Set(lines.map((l) => l.procedureId).filter((id): id is string => id !== undefined))].map((id) => procedures[id]).filter((p): p is Procedure => p !== undefined), [lines, procedures])
  if (invoice === undefined) return null

  const booking = bookings[invoice.bookingId]
  const list = booking !== undefined ? lists[booking.listId] : undefined
  const anaesthetist = list?.anaesthetistId !== undefined ? masters.anaesthetists[list.anaesthetistId] : undefined
  const patient = booking !== undefined ? masters.patients[booking.patientId] : undefined
  const addressee = counterpartyName({ masters }, invoice.counterparty) as string
  const isPatient = invoice.layout === 'patient'
  const references = [...new Set(procs.map((p) => p.billingReference).filter((r): r is string => r !== undefined && r.trim() !== ''))]
  const categories = (() => {
    const d = [...new Set(procs.map((p) => p.patientPaymentCategory).filter((c) => c !== undefined))]
    return d.length > 0 ? d : (['selfFundedPostProcedure'] as const)
  })()
  const prepay = procs.find((p) => p.patientPaymentCategory === 'selfFundedPrepayment')
  const emailedAtISO = invoice.emailedAtISO ?? emailedLocally

  return (
    <div className="tw:mx-auto tw:grid tw:w-full tw:max-w-[1048px] tw:grid-cols-[760px_264px] tw:items-start tw:gap-6">
      <section aria-label={`Tax invoice ${invoice.invoiceNumber}`} className="aa-invoice-doc tw:flex tw:min-w-0 tw:flex-col tw:gap-[22px] tw:rounded-panel tw:border tw:border-line tw:bg-surface tw:px-10 tw:py-9">
        <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
          <div className="tw:flex tw:flex-col tw:gap-2">
            <img src={logoUrl as string} alt="Anaesthesia Associates" height={26} className="tw:block tw:h-[26px] tw:w-auto" />
            <div className="tw:text-[11.5px] tw:text-slate">Christchurch · New Zealand</div>
          </div>
          <div className="tw:text-right">
            <div className={cn(SERIF, 'tw:text-[21px] tw:tracking-[0.12em] tw:text-ink')}>TAX INVOICE</div>
            <div className="tw:mt-1 tw:font-mono tw:text-[13.5px] tw:font-bold">{invoice.invoiceNumber}</div>
          </div>
        </div>

        <dl className="tw:m-0 tw:grid tw:grid-cols-3 tw:gap-3 tw:border-y tw:border-line tw:py-3">
          <Meta label="Date raised"><span className="tw:font-mono">{dateTimeMicroCap(invoice.raisedAtISO)}</span></Meta>
          <Meta label="Anaesthetist">{anaesthetist?.name ?? '·'}</Meta>
          <Meta label="Case reference">
            <span className="tw:font-mono">{invoice.caseReference}</span>
            <div className="tw:text-[10.5px] tw:text-mist">internal reference only</div>
          </Meta>
        </dl>

        <div className="tw:flex tw:flex-col tw:gap-1.5">
          <div className={META}>Invoice to</div>
          <div className="tw:text-[15.5px] tw:font-bold">{addressee}</div>
          {!isPatient && <div className="tw:text-[12.5px] tw:text-slate">Attn: Accounts</div>}
          {isPatient && invoice.counterparty.kind === 'billableParty' && patient !== undefined && <div className="tw:text-[12.5px] tw:text-slate">For the care of {patient.name}</div>}
          {!isPatient && references.length > 0 && (
            <div className="tw:text-[12.5px] tw:text-slate">
              Reference <span className="tw:font-mono">{references.join(' · ')}</span>
            </div>
          )}
          <div className="tw:text-[12.5px] tw:text-slate tw:italic">Billed by Anaesthesia Associates as agent for {anaesthetist?.name ?? 'the anaesthetist'}.</div>
        </div>

        {isPatient && categories.map((c) => <CategoryNote key={c} category={c} invoiceKind={invoice.kind} prepaymentType={prepay?.prepaymentDetail?.type} depositAmount={prepay?.prepaymentDetail?.depositAmount} />)}

        <Table className="tw:[&_td]:align-top">
          <TableHeader>
            <TableRow className="tw:border-b-[1.5px] tw:border-line-strong tw:hover:bg-transparent">
              <TableHead className={cn(META, 'tw:h-auto tw:px-2 tw:py-[9px]')}>Description</TableHead>
              <TableHead data-numeric="" className={cn(META, 'tw:h-auto tw:w-[70px] tw:px-2 tw:py-[9px]')}>Units</TableHead>
              <TableHead data-numeric="" className={cn(META, 'tw:h-auto tw:w-[110px] tw:px-2 tw:py-[9px]')}>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.id} className="tw:hover:bg-transparent">
                <TableCell className="tw:px-2 tw:py-[9px] tw:text-[13px] tw:whitespace-normal">{line.description}</TableCell>
                <TableCell data-numeric="" className="tw:px-2 tw:py-[9px] tw:font-mono tw:text-[13px]">{line.units ?? ''}</TableCell>
                <TableCell data-numeric="" className="tw:px-2 tw:py-[9px] tw:font-mono tw:text-[13px]">{formatCurrency(line.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="tw:flex tw:flex-col tw:items-end tw:gap-1">
          <TotalRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
          <TotalRow label={`GST (${GST_RATE * 100}%)`} value={formatCurrency(invoice.gst)} />
          <div className="tw:mt-0.5 tw:flex tw:gap-6 tw:border-t-2 tw:border-ink tw:pt-1.5">
            <span className="tw:text-[13.5px] tw:font-bold">Total due</span>
            <span className="tw:min-w-[110px] tw:text-right tw:font-mono tw:text-[15px] tw:font-bold">{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {theCase !== undefined && theCase.accRecId !== undefined && (
          <div className="tw:flex tw:flex-wrap tw:gap-2.5 tw:border-t tw:border-line tw:pt-3">
            <StateChip
              on={theCase.paidInAtISO !== undefined}
              label={theCase.paidInAtISO !== undefined ? `Paid into AA account ${dateTimeMicroCap(theCase.paidInAtISO)}` : theCase.receivedAmount > 0 ? `Part paid ${formatCurrency(theCase.receivedAmount)} of ${formatCurrency(invoice.total)}` : 'Awaiting payment'}
            />
            <StateChip
              on={theCase.disbursedAtISO !== undefined}
              label={theCase.disbursedAtISO !== undefined ? `Disbursed to anaesthetist ${dateTimeMicroCap(theCase.disbursedAtISO)}` : theCase.disbursedAmount > 0 ? `Part disbursed ${formatCurrency(theCase.disbursedAmount)}` : 'Not yet disbursed'}
            />
          </div>
        )}

        <div className="tw:border-t tw:border-line tw:pt-2.5 tw:text-[10.5px] tw:text-mist">
          GST at the NZ standard rate of {GST_RATE * 100}% is a demo assumption; the RFP describes only the GST component of amounts received. A discovery item for AA.
        </div>
      </section>

      <Rail
        invoice={invoice}
        billingCase={theCase}
        addressee={addressee}
        emailedAtISO={emailedAtISO}
        onEmail={() => setEmailedLocally(nowISO)}
      />
    </div>
  )
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className={META}>{label}</dt>
      <dd className="tw:m-0 tw:mt-[3px] tw:text-[12.5px]">{children}</dd>
    </div>
  )
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="tw:flex tw:gap-6">
      <span className="tw:text-[12.5px] tw:text-slate">{label}</span>
      <span className="tw:min-w-[110px] tw:text-right tw:font-mono tw:text-[12.5px]">{value}</span>
    </div>
  )
}

function StateChip({ on, label }: { on: boolean; label: string }) {
  return (
    <Badge variant={on ? 'success' : 'default'} className="tw:gap-1.5 tw:px-3 tw:py-[5px] tw:text-xs">
      <span aria-hidden>{on ? '✓' : '○'}</span>
      {label}
    </Badge>
  )
}

function CategoryNote({ category, invoiceKind, prepaymentType, depositAmount }: { category: string; invoiceKind: 'standard' | 'prePayment'; prepaymentType?: 'full' | 'split'; depositAmount?: number }) {
  const prepaymentText =
    invoiceKind === 'prePayment'
      ? prepaymentType === 'split'
        ? `This pre-procedure invoice is the agreed deposit${depositAmount !== undefined ? ` of ${formatCurrency(depositAmount)}` : ''}. Payment is required before the procedure proceeds; the balance is invoiced after the procedure. The timing of pre-payment against the billing trigger is a discovery point for AA.`
        : 'This pre-procedure invoice is the full estimated fee, payable before the procedure proceeds. The timing of pre-payment against the billing trigger is a discovery point for AA.'
      : prepaymentType === 'split'
        ? 'A pre-payment deposit has already been invoiced for this procedure. This invoice covers the balance.'
        : 'This procedure was pre-paid; this invoice covers any remaining balance.'
  const content =
    category === 'insuredReimbursement'
      ? { badge: 'Insured reimbursement', text: 'You may claim this invoice from your insurer. It is issued to you, and Anaesthesia Associates does not send it to your insurer.' }
      : category === 'selfFundedPrepayment'
        ? { badge: invoiceKind === 'prePayment' ? 'Pre-payment (pre-procedure)' : 'Pre-payment balance', text: prepaymentText }
        : { badge: 'Self funded', text: 'Payment is due on receipt of this invoice.' }
  return (
    <div className="tw:flex tw:flex-col tw:gap-1 tw:rounded-ctl tw:bg-sunken tw:px-3.5 tw:py-2.5">
      <span className="tw:text-[10px] tw:font-bold tw:tracking-[0.08em] tw:text-slate tw:uppercase">{content.badge}</span>
      <span className="tw:text-[12.5px] tw:text-ink">{content.text}</span>
    </div>
  )
}

function Rail({ invoice, billingCase, addressee, emailedAtISO, onEmail }: { invoice: Invoice; billingCase: BillingCase | undefined; addressee: string; emailedAtISO: string | undefined; onEmail: () => void }) {
  const insurerDirect = invoice.counterparty.kind === 'insurer'
  const showEmail = !insurerDirect && emailedAtISO === undefined
  const failed = billingCase?.handoffFailure !== undefined
  const complete = billingCase?.accRecId !== undefined
  const accRec = useAppStore((s: { xero: { accRecs: Record<string, { invoiceNumber: string }> } }) => (billingCase?.accRecId !== undefined ? s.xero.accRecs[billingCase.accRecId]?.invoiceNumber : undefined)) as string | undefined
  const accPay = useAppStore((s: { xero: { accPays: Record<string, { invoiceNumber: string }> } }) => (billingCase?.accPayId !== undefined ? s.xero.accPays[billingCase.accPayId]?.invoiceNumber : undefined)) as string | undefined

  return (
    <aside aria-label="Invoice information and actions" className="tw:sticky tw:top-6 tw:flex tw:w-[264px] tw:flex-col tw:gap-3">
      <RailCard title="Delivery">
        {insurerDirect ? (
          <>
            <RailStatus tone="warning" icon={<Upload className="tw:size-4" aria-hidden />}>Present via {addressee} upload portal</RailStatus>
            <DemoBadge label="Simulated portal handoff" />
          </>
        ) : emailedAtISO !== undefined ? (
          <>
            <RailStatus tone="success" icon={<Mail className="tw:size-4" aria-hidden />}>Emailed {hhmm(emailedAtISO)}</RailStatus>
            <DemoBadge label="Simulated send" />
          </>
        ) : null}
        <div className="tw:flex tw:w-full tw:items-center tw:gap-2">
          {showEmail && (
            <Button className="tw:min-w-0 tw:flex-auto" onClick={onEmail}>
              <Mail aria-hidden /> Email invoice
            </Button>
          )}
          <Button variant="outline" className={showEmail ? 'tw:w-[84px] tw:flex-none' : 'tw:w-full'} onClick={() => window.print()}>
            <Printer aria-hidden /> Print
          </Button>
        </div>
      </RailCard>

      <RailCard title="Xero handoff" warning={failed}>
        <div className={cn('tw:flex tw:items-start tw:gap-2', failed ? 'tw:text-warning-on-tint' : complete ? 'tw:text-ink' : 'tw:text-slate')}>
          <Clock className="tw:mt-px tw:size-[15px] tw:flex-none" aria-hidden />
          <span className="tw:text-[12.5px] tw:leading-[18px] tw:font-semibold">{failed ? 'Xero handoff failed' : complete ? 'ACCREC and ACCPAY created' : 'Xero handoff pending'}</span>
        </div>
        {failed ? (
          <div className="tw:text-[12.5px] tw:leading-[18px] tw:text-warning-on-tint">The invoice remains valid. Resolve and retry in Billing monitor.</div>
        ) : complete ? (
          <dl className="tw:m-0 tw:flex tw:flex-col tw:gap-2.5">
            <XeroRef label="ACCREC" value={accRec ?? invoice.invoiceNumber} />
            {accPay !== undefined && <XeroRef label="ACCPAY" value={accPay} />}
          </dl>
        ) : null}
      </RailCard>
    </aside>
  )
}

function RailCard({ title, warning = false, children }: { title: string; warning?: boolean; children: ReactNode }) {
  return (
    <Card size="sm" className={cn('tw:gap-3 tw:shadow-none', warning && 'tw:border-[color-mix(in_srgb,var(--warning)_33%,transparent)] tw:bg-warning-tint')}>
      <CardHeader>
        <CardTitle className="tw:text-[13px]! tw:leading-[18px]! tw:font-bold">
          <h2 className="tw:m-0 tw:text-inherit tw:font-inherit">{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="tw:flex tw:flex-col tw:gap-3">{children}</CardContent>
    </Card>
  )
}

function RailStatus({ tone, icon, children }: { tone: 'success' | 'warning'; icon: ReactNode; children: ReactNode }) {
  return (
    <div className={cn('tw:flex tw:items-start tw:gap-2 tw:rounded-ctl tw:px-2.5 tw:py-[9px] tw:text-[12.5px] tw:leading-[18px] tw:font-semibold', tone === 'success' ? 'tw:bg-success-tint tw:text-success-on-tint' : 'tw:bg-warning-tint tw:text-warning-on-tint')}>
      <span className="tw:mt-px tw:inline-flex tw:flex-none">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

function DemoBadge({ label }: { label: string }) {
  return (
    <Badge variant="warning" className="tw:gap-1.5 tw:border tw:border-[color-mix(in_srgb,var(--warning)_20%,transparent)] tw:px-2.5 tw:py-1 tw:text-[11px] tw:leading-[14px] tw:tracking-[0.06em] tw:uppercase">
      <FlaskConical aria-hidden />
      {label}
    </Badge>
  )
}

function XeroRef({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className={META}>{label}</dt>
      <dd className="tw:m-0 tw:mt-[3px] tw:font-mono tw:text-xs tw:leading-[17px] tw:break-all tw:text-ink">{value}</dd>
    </div>
  )
}
