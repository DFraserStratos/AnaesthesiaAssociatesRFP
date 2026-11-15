import { useId, useMemo, useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CHOOSABLE_PRICING_KINDS, CONTRACT_REFUSAL_MESSAGES, billsPayerOnly, contractRefusal, isRvgKind, takesLinks } from '@proto/domain/billing/contracts'
import { destinationHint, destinationOf } from '@proto/domain/billing/fallbacks'
import { fundingTagsInOrder } from '@proto/domain/billing/fundingTags'
import { specialtiesInOrder } from '@proto/domain/specialties'
import { compareBySurname } from '@proto/domain/surgeons'
import { BILLS_LABEL, PARTY_KIND_LABEL, PRICING_KIND_LABEL, STATUS_LABEL } from '@proto/shared/contracts'
import { useSeedIds } from '@proto/apps/demo/catalogue/admin/adminData'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { DatePicker } from './DatePicker'
import { PriceField, PriceRangesEditor } from './PriceRanges'
import { useDemoToday, useStore } from './data'
import { Echo, FormAlert, Helper, TextAction } from './shared'

type YesNo = 'yes' | 'no'
type Kind = 'rvgAnaesthetistRate' | 'rvgContractRate' | 'rvgDiscount' | 'fixed' | 'open'

interface Contract {
  id: string
  aaCode: string
  name: string
  holderId: string
  holderReference?: string
  invoiceDescription: string | null
  defaultRvgGroupId: string | null
  billsTo: 'holder' | 'payer'
  linkedSurgeonIds: string[]
  linkedAnaesthetistId?: string
  prepaid: boolean
  anaesthetistMayOverridePrice: boolean
  pricing: { kind: Kind; unitRate?: number; discountPct?: number; ranges?: { startISO: string; price: number }[] }
  status: 'active' | 'disabled'
  systemRole?: string
  specialtyIds: string[]
  fundingTagId?: string
  permitsRateTime: boolean
}

interface Form {
  aaCode: string
  name: string
  holderReference: string
  invoiceDescription: string
  defaultRvgGroupId: string | null
  holderId: string
  billsTo: 'holder' | 'payer'
  surgeonIds: string[]
  anaesthetistId: string
  specialtyIds: string[]
  fundingTagId: string
  prepaid: YesNo
  kind: Kind
  rate: string
  discount: string
  override: YesNo
  firstStart: string
  firstPrice: number | null
}

const PREPAID_BILLS_PAYER_HELPER = "A prepaid Contract always bills the payer, awaiting AA's confirmation."
const NONE = '__none__'

/** Which field a refusal belongs under (the model's codes); anything else stays form level. */
const REFUSAL_FIELD: Partial<Record<string, FieldPath<Form>>> = {
  nameRequired: 'name',
  aaCodeRequired: 'aaCode',
  aaCodeTaken: 'aaCode',
  holderMissing: 'holderId',
  rateAboveZero: 'rate',
  discountRange: 'discount',
  linkRequired: 'surgeonIds',
  linkUnknown: 'surgeonIds',
  specialtyUnknown: 'specialtyIds',
  fundingTagUnknown: 'fundingTagId',
  startRequired: 'firstStart',
  duplicateStart: 'firstStart',
  noRange: 'firstStart',
  negativePrice: 'firstPrice',
  prepaidPriceNotAboveZero: 'firstPrice',
}

/**
 * The Contract editor (ContractPanel in MasterPanel) as a shadcn Sheet on React Hook Form + Zod.
 * The schema's refinement is the prototype's own save guard (`contractRefusal`), so every rule
 * and sentence is unchanged; the save is local, nothing reaches the store. Selects are shadcn
 * Select (the holder grouped by Party kind), the segmented choices ToggleGroups, surgeons and
 * specialties a chips Combobox, and a fixed price's ranges the ContractPriceRanges replacement.
 */
export function ContractPanelReplacement({ refusals }: { refusals: 'form' | 'field' }) {
  const { fixedContractId } = useSeedIds() as { fixedContractId?: string }
  const contract = useStore((s) => (fixedContractId !== undefined ? s.masters.contracts[fixedContractId] : undefined)) as Contract | undefined
  const [open, setOpen] = useState<'edit' | 'new' | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  return (
    <div>
      <div className="tw:flex tw:flex-wrap tw:gap-2.5">
        <Button variant="outline" size="lg" disabled={contract === undefined} onClick={() => setOpen('edit')}>
          Edit a fixed-price Contract
        </Button>
        <Button variant="outline" size="lg" onClick={() => setOpen('new')}>
          New Contract
        </Button>
      </div>
      <Sheet open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="right" className="tw:gap-0">
          {open !== null && (
            <ContractForm
              key={open}
              contract={open === 'edit' ? contract : undefined}
              refusals={refusals}
              onClose={() => setOpen(null)}
              onSaved={(m) => {
                setSaved(m)
                setOpen(null)
              }}
            />
          )}
        </SheetContent>
      </Sheet>
      <Echo>{saved ?? 'Local only: saving never reaches the store.'}</Echo>
    </div>
  )
}

function ContractForm({ contract, refusals, onClose, onSaved }: { contract?: Contract; refusals: 'form' | 'field'; onClose: () => void; onSaved: (m: string) => void }) {
  const masters = useStore((s) => s.masters)
  const { today } = useDemoToday()
  const editing = contract !== undefined
  const [status, setStatus] = useState(contract?.status ?? 'active')
  const [rangeError, setRangeError] = useState<string | null>(null)
  const [pickerNote, setPickerNote] = useState(false)
  const ids = { aa: useId(), name: useId(), ref: useId(), desc: useId(), rate: useId(), disc: useId(), first: useId() }

  const ctx = useMemo(
    () => ({
      ...(contract !== undefined ? { prev: contract } : {}),
      parties: masters.parties,
      contracts: masters.contracts,
      surgeonIds: new Set(Object.keys(masters.surgeons)),
      anaesthetistIds: new Set(Object.keys(masters.anaesthetists)),
      specialtyIds: new Set(Object.keys(masters.specialties)),
      fundingTagIds: new Set(Object.keys(masters.fundingTags)),
      rvgGroups: masters.rvgGroups,
    }),
    [masters, contract],
  )

  /** The Contract this form would save, built the way the store's create and edit build it. */
  const draftOf = (v: Form): Contract => {
    const holder = masters.parties[v.holderId] as { kind: string } | undefined
    const forcedPayer = billsPayerOnly(holder?.kind, v.prepaid === 'yes') as boolean
    const links = takesLinks(holder?.kind) as boolean
    const pricing: Contract['pricing'] =
      v.kind === 'rvgContractRate'
        ? { kind: v.kind, unitRate: Number(v.rate) }
        : v.kind === 'rvgDiscount'
          ? { kind: v.kind, discountPct: Number(v.discount) }
          : v.kind === 'fixed'
            ? { kind: 'fixed', ranges: contract?.pricing.kind === 'fixed' ? (contract.pricing.ranges ?? []) : v.firstStart === '' && v.firstPrice === null ? [] : [{ startISO: v.firstStart, price: v.firstPrice ?? Number.NaN }] }
            : { kind: v.kind }
    return {
      id: contract?.id ?? '',
      aaCode: editing ? v.aaCode : 'NEW-001',
      name: v.name.trim(),
      holderId: v.holderId,
      billsTo: forcedPayer ? 'payer' : v.billsTo,
      linkedSurgeonIds: links ? v.surgeonIds : [],
      ...(links && v.anaesthetistId !== '' ? { linkedAnaesthetistId: v.anaesthetistId } : {}),
      prepaid: v.prepaid === 'yes',
      anaesthetistMayOverridePrice: isRvgKind(v.kind) && v.override === 'yes',
      pricing,
      status,
      ...(v.holderReference.trim() !== '' ? { holderReference: v.holderReference.trim() } : {}),
      invoiceDescription: v.invoiceDescription.trim() === '' ? null : v.invoiceDescription,
      defaultRvgGroupId: v.defaultRvgGroupId,
      permitsRateTime: contract?.permitsRateTime ?? false,
      specialtyIds: v.specialtyIds,
      ...(v.fundingTagId !== '' ? { fundingTagId: v.fundingTagId } : {}),
    }
  }

  const schema = useMemo(
    () =>
      z.custom<Form>().superRefine((v, c) => {
        const refused = contractRefusal(draftOf(v), ctx) as { code: string; message: string } | null
        if (refused === null) return
        const field = refusals === 'field' ? REFUSAL_FIELD[refused.code] : undefined
        c.addIssue({ code: 'custom', path: [field ?? 'root'], message: refused.message })
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx, refusals, status],
  )

  const form = useForm<Form>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      aaCode: contract?.aaCode ?? '',
      name: contract?.name ?? '',
      holderReference: contract?.holderReference ?? '',
      invoiceDescription: contract?.invoiceDescription ?? '',
      defaultRvgGroupId: contract?.defaultRvgGroupId ?? null,
      holderId: contract?.holderId ?? '',
      billsTo: contract?.billsTo ?? 'holder',
      surgeonIds: contract?.linkedSurgeonIds ?? [],
      anaesthetistId: contract?.linkedAnaesthetistId ?? '',
      specialtyIds: contract?.specialtyIds ?? [],
      fundingTagId: contract?.fundingTagId ?? '',
      prepaid: contract?.prepaid === true ? 'yes' : 'no',
      kind: contract?.pricing.kind ?? 'rvgAnaesthetistRate',
      rate: contract?.pricing.kind === 'rvgContractRate' ? String(contract.pricing.unitRate) : '',
      discount: contract?.pricing.kind === 'rvgDiscount' ? String(contract.pricing.discountPct) : '',
      override: contract?.anaesthetistMayOverridePrice === true ? 'yes' : 'no',
      firstStart: '',
      firstPrice: null,
    },
  })
  const v = useWatch({ control: form.control }) as Form
  const e = form.formState.errors as Record<string, { message?: string } | undefined>

  const holder = masters.parties[v.holderId] as { kind: string; name: string } | undefined
  const holderForcesPayer = billsPayerOnly(holder?.kind, false) as boolean
  const forcedPayer = billsPayerOnly(holder?.kind, v.prepaid === 'yes') as boolean
  const showLinks = takesLinks(holder?.kind) as boolean
  const rvg = isRvgKind(v.kind) as boolean
  const placement = destinationHint(
    destinationOf({ billsTo: forcedPayer ? 'payer' : v.billsTo, prepaid: v.prepaid === 'yes', holderId: v.holderId, ...(v.fundingTagId !== '' ? { fundingTagId: v.fundingTagId } : {}) }, masters.parties),
    masters.parties,
    masters.fundingTags,
  ) as string

  const partyGroups = useMemo(() => {
    const groups = new Map<string, { id: string; name: string }[]>()
    for (const p of (Object.values(masters.parties) as { id: string; name: string; kind: string }[]).sort((a, b) => a.name.localeCompare(b.name))) {
      const label = (PARTY_KIND_LABEL as Record<string, string>)[p.kind] ?? p.kind
      groups.set(label, [...(groups.get(label) ?? []), { id: p.id, name: p.name }])
    }
    return [...groups.entries()]
  }, [masters.parties])
  const surgeons = useMemo(() => (Object.values(masters.surgeons) as { id: string; name: string }[]).sort(compareBySurname), [masters.surgeons])
  const anaesthetists = useMemo(
    () => (Object.values(masters.anaesthetists) as { registrationNumber: string; name: string }[]).sort((a, b) => a.name.localeCompare(b.name)),
    [masters.anaesthetists],
  )
  const specialties = useMemo(() => specialtiesInOrder(masters.specialties) as { id: string; name: string }[], [masters.specialties])
  const tags = useMemo(() => fundingTagsInOrder(masters.fundingTags) as { id: string; code: string }[], [masters.fundingTags])
  const defaultGroup = v.defaultRvgGroupId !== null ? (masters.rvgGroups[v.defaultRvgGroupId] as { code: string; description: string } | undefined) : undefined
  const fixedAfterSave = 'Set when the Contract is created.'
  const rootError = e.root?.message ?? rangeError

  const err = (name: FieldPath<Form>) => e[name]
  const textField = (name: 'aaCode' | 'name' | 'holderReference' | 'invoiceDescription' | 'rate' | 'discount', id: string, label: string, opts: { mono?: boolean; hint?: string; upper?: boolean } = {}) => (
    <Field data-invalid={err(name) !== undefined ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Input
            id={id}
            value={field.value}
            onChange={(ev) => field.onChange(opts.upper === true ? ev.target.value.toUpperCase() : ev.target.value)}
            onBlur={field.onBlur}
            aria-invalid={err(name) !== undefined ? true : undefined}
            className={cn(opts.mono === true && 'tw:font-mono')}
          />
        )}
      />
      {opts.hint !== undefined && <FieldDescription>{opts.hint}</FieldDescription>}
      <FieldError errors={[err(name)]} />
    </Field>
  )

  return (
    <form
      noValidate
      className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col"
      onSubmit={form.handleSubmit((values) => {
        if (rangeError !== null) return
        const d = draftOf(values)
        onSaved(`${editing ? 'Saved' : 'Created'} ${d.name} locally (${(PRICING_KIND_LABEL as Record<string, string>)[d.pricing.kind]}): nothing reached the store.`)
      })}
    >
      <SheetHeader>
        <SheetTitle>{editing ? contract.name : 'New contract'}</SheetTitle>
        {editing && (
          <SheetDescription render={<div />} className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            <span className="tw:font-mono tw:font-semibold tw:text-ink">{contract.aaCode}</span>
            <Badge variant={status === 'active' ? 'success' : 'default'}>{(STATUS_LABEL as Record<string, string>)[status]}</Badge>
            <span>{(masters.parties[contract.holderId] as { name: string } | undefined)?.name ?? contract.holderId}</span>
          </SheetDescription>
        )}
      </SheetHeader>

      <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-5 tw:overflow-y-auto tw:px-6 tw:py-5">
        {editing && status === 'disabled' && (
          <div className="tw:rounded-ctl tw:bg-sunken tw:px-3 tw:py-2.5 tw:text-[13px] tw:text-slate">
            Disabled: hidden from the Contract list unless asked for. Procedures already on it keep it and bill as normal.
          </div>
        )}

        <Section title="Contract">
          <Grid>
            {editing ? textField('aaCode', ids.aa, 'AA code', { mono: true, hint: "AA's own unique code.", upper: true }) : <ReadOnly label="AA code" mono>Assigned on save</ReadOnly>}
            {textField('name', ids.name, 'Name')}
          </Grid>
        </Section>

        <Section title="Invoice and codes">
          <Grid>
            {textField('holderReference', ids.ref, 'Holder reference code', { mono: true, hint: "The holder's own code for the item. Need not be unique." })}
            <Field className="tw:min-w-0">
              <FieldLabel>Default RVG code</FieldLabel>
              <div className="tw:flex tw:min-h-12 tw:items-center tw:gap-2.5 tw:rounded-ctl tw:border tw:border-line tw:bg-background tw:px-3 tw:py-1.5">
                <span className={cn('tw:min-w-0 tw:flex-1 tw:truncate tw:text-sm', defaultGroup !== undefined ? 'tw:text-ink' : 'tw:text-mist')}>
                  {defaultGroup !== undefined ? (
                    <>
                      <span className="tw:font-mono tw:font-semibold">{defaultGroup.code}</span>
                      <span className="tw:text-slate"> · {defaultGroup.description}</span>
                    </>
                  ) : (
                    'None'
                  )}
                </span>
                <TextAction onClick={() => setPickerNote(true)} label="Choose the default RVG code">
                  {defaultGroup !== undefined ? 'Change' : 'Choose'}
                </TextAction>
                {defaultGroup !== undefined && (
                  <TextAction onClick={() => form.setValue('defaultRvgGroupId', null, { shouldDirty: true })} label="Clear the default RVG code">
                    Clear
                  </TextAction>
                )}
              </div>
              <Helper>{pickerNote ? 'Stubbed here: Choose opens the RVG code picker, rebuilt in its own row (CodePickerSheet).' : "Fills a Procedure's RVG code when it has none."}</Helper>
            </Field>
          </Grid>
          {textField('invoiceDescription', ids.desc, 'Invoice description', { hint: 'The words the patient reads on the invoice, where filled in.' })}
        </Section>

        <Section title="Holder and who it bills">
          {editing ? (
            <ReadOnly label="Holder" hint="Fixed once the Contract is saved.">
              {holder?.name ?? v.holderId}
            </ReadOnly>
          ) : (
            <Field data-invalid={err('holderId') !== undefined ? true : undefined}>
              <FieldLabel>Holder</FieldLabel>
              <Controller
                control={form.control}
                name="holderId"
                render={({ field }) => (
                  <Select value={field.value === '' ? null : field.value} onValueChange={(x) => field.onChange(x === null ? '' : String(x))} items={partyGroups.flatMap(([, list]) => list.map((p) => ({ value: p.id, label: p.name })))}>
                    <SelectTrigger className="tw:w-full" aria-label="Holder" aria-invalid={err('holderId') !== undefined ? true : undefined}>
                      <SelectValue placeholder="Choose the Party that holds it" />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {partyGroups.map(([group, list]) => (
                        <SelectGroup key={group}>
                          <SelectLabel>{group}</SelectLabel>
                          {list.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[err('holderId')]} />
            </Field>
          )}
          <Field>
            <FieldLabel>Bills</FieldLabel>
            <Controller
              control={form.control}
              name="billsTo"
              render={({ field }) => (
                <Segment
                  label="Bills"
                  value={forcedPayer ? 'payer' : field.value}
                  onChange={field.onChange}
                  disabled={forcedPayer}
                  options={[
                    { value: 'holder', label: BILLS_LABEL.holder },
                    { value: 'payer', label: `${BILLS_LABEL.payer} on the Booking` },
                  ]}
                />
              )}
            />
            {v.prepaid === 'yes' ? <Helper>{PREPAID_BILLS_PAYER_HELPER}</Helper> : holderForcesPayer ? <Helper>{CONTRACT_REFUSAL_MESSAGES.holderBillsPayer}</Helper> : null}
          </Field>
          {showLinks && (
            <Grid>
              <Field data-invalid={err('surgeonIds') !== undefined ? true : undefined} className="tw:min-w-0">
                <FieldLabel>Linked surgeons</FieldLabel>
                <Controller
                  control={form.control}
                  name="surgeonIds"
                  render={({ field }) => <ChipsMulti options={surgeons} value={field.value} onChange={field.onChange} placeholder="Add a surgeon" label="Linked surgeons" invalid={err('surgeonIds') !== undefined} />}
                />
                <FieldError errors={[err('surgeonIds')]} />
              </Field>
              <Field className="tw:min-w-0">
                <FieldLabel>Linked anaesthetist</FieldLabel>
                <Controller
                  control={form.control}
                  name="anaesthetistId"
                  render={({ field }) => (
                    <Select value={field.value === '' ? NONE : field.value} onValueChange={(x) => field.onChange(x === NONE || x === null ? '' : String(x))} items={[{ value: NONE, label: 'None' }, ...anaesthetists.map((a) => ({ value: a.registrationNumber, label: a.name }))]}>
                      <SelectTrigger className="tw:w-full" aria-label="Linked anaesthetist">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        <SelectItem value={NONE}>None</SelectItem>
                        {anaesthetists.map((a) => (
                          <SelectItem key={a.registrationNumber} value={a.registrationNumber}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </Grid>
          )}
          {holder?.kind === 'hospital' && <Helper>{CONTRACT_REFUSAL_MESSAGES.noLinksOnHospital}</Helper>}
        </Section>

        <Section title="Where it is offered">
          <Grid>
            <Field className="tw:min-w-0" data-invalid={err('specialtyIds') !== undefined ? true : undefined}>
              <FieldLabel>Specialties</FieldLabel>
              <Controller
                control={form.control}
                name="specialtyIds"
                render={({ field }) => <ChipsMulti options={specialties} value={field.value} onChange={field.onChange} placeholder="Every specialty" label="Specialties" />}
              />
              <FieldDescription>None means every specialty.</FieldDescription>
              <FieldError errors={[err('specialtyIds')]} />
            </Field>
            <Field className="tw:min-w-0">
              <FieldLabel>Funding tag</FieldLabel>
              <Controller
                control={form.control}
                name="fundingTagId"
                render={({ field }) => (
                  <Select value={field.value === '' ? NONE : field.value} onValueChange={(x) => field.onChange(x === NONE || x === null ? '' : String(x))} items={[{ value: NONE, label: 'None' }, ...tags.map((t) => ({ value: t.id, label: t.code }))]}>
                    <SelectTrigger className="tw:w-full" aria-label="Funding tag">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectItem value={NONE}>None</SelectItem>
                      {tags.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="tw:font-mono">
                          {t.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </Grid>
          <div aria-live="polite" className="tw:rounded-ctl tw:border tw:border-line tw:bg-background tw:px-3 tw:py-2 tw:text-[13px] tw:text-ink">
            {placement}
          </div>
        </Section>

        <Section title="Pricing">
          <Grid>
            <Field>
              <FieldLabel>Prepaid</FieldLabel>
              <Controller
                control={form.control}
                name="prepaid"
                render={({ field }) => (
                  <Segment label="Prepaid" value={field.value} onChange={field.onChange} disabled={editing} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
                )}
              />
              {editing && <Helper>{fixedAfterSave}</Helper>}
            </Field>
            <Field>
              <FieldLabel>Pricing kind</FieldLabel>
              <Controller
                control={form.control}
                name="kind"
                render={({ field }) => {
                  const kinds = (editing && field.value === 'open' ? [...CHOOSABLE_PRICING_KINDS, 'open'] : CHOOSABLE_PRICING_KINDS) as Kind[]
                  return (
                    <Select value={field.value} onValueChange={(x) => field.onChange(x as Kind)} disabled={editing} items={kinds.map((k) => ({ value: k, label: (PRICING_KIND_LABEL as Record<string, string>)[k] }))}>
                      <SelectTrigger className="tw:w-full" aria-label="Pricing kind">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {kinds.map((k) => (
                          <SelectItem key={k} value={k}>
                            {(PRICING_KIND_LABEL as Record<string, string>)[k]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }}
              />
              {editing && <Helper>{fixedAfterSave}</Helper>}
            </Field>
          </Grid>
          {v.kind === 'rvgContractRate' && textField('rate', ids.rate, 'Rate ($ per unit)', { mono: true })}
          {v.kind === 'rvgDiscount' && textField('discount', ids.disc, 'Discount (%)', { mono: true })}
          {rvg && (
            <Field>
              <FieldLabel>Anaesthetist may override the price</FieldLabel>
              <Controller
                control={form.control}
                name="override"
                render={({ field }) => (
                  <Segment label="Anaesthetist may override the price" value={field.value} onChange={field.onChange} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
                )}
              />
            </Field>
          )}
          {editing && contract.permitsRateTime && <Helper>Allows hourly rate and time billing lines on its Procedures.</Helper>}
          {v.kind === 'fixed' && !editing && (
            <Grid>
              <Field data-invalid={err('firstStart') !== undefined ? true : undefined}>
                <FieldLabel htmlFor={ids.first}>First price from</FieldLabel>
                <Controller
                  control={form.control}
                  name="firstStart"
                  render={({ field }) => <DatePicker id={ids.first} value={field.value} onChange={field.onChange} today={today} invalid={err('firstStart') !== undefined} />}
                />
                <FieldDescription>May be in the past.</FieldDescription>
                <FieldError errors={[err('firstStart')]} />
              </Field>
              <Field data-invalid={err('firstPrice') !== undefined ? true : undefined}>
                <FieldLabel>Price (ex GST)</FieldLabel>
                <Controller
                  control={form.control}
                  name="firstPrice"
                  render={({ field }) => <PriceField value={field.value} onChange={field.onChange} label="Price (ex GST)" className="tw:[&_[role=group]]:h-12 tw:[&_[role=group]]:w-full tw:w-full" />}
                />
                <FieldError errors={[err('firstPrice')]} />
              </Field>
            </Grid>
          )}
          {editing && contract.pricing.kind === 'fixed' && <PriceRangesEditor contract={contract} onError={setRangeError} />}
        </Section>

        <FormAlert message={rootError} />
      </div>

      <SheetFooter>
        {editing && (
          <div className="tw:mr-auto">
            {status === 'active' ? (
              <Button type="button" variant="destructive" size="lg" onClick={() => setStatus('disabled')}>
                Disable
              </Button>
            ) : (
              <Button type="button" variant="outline" size="lg" onClick={() => setStatus('active')}>
                Make active
              </Button>
            )}
          </div>
        )}
        <Button type="button" variant="outline" size="lg" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="lg">
          {editing ? 'Save contract' : 'Create contract'}
        </Button>
      </SheetFooter>
    </form>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="tw:flex tw:flex-col tw:gap-3.5">
      <h3 className="tw:m-0 tw:text-sm tw:font-bold tw:text-ink">{title}</h3>
      {children}
    </section>
  )
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="tw:grid tw:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] tw:gap-4">{children}</div>
}

function ReadOnly({ label, children, hint, mono }: { label: string; children: ReactNode; hint?: string; mono?: boolean }) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-1.5">
      <span className="tw:text-[11px] tw:leading-[14px] tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase">{label}</span>
      <div className={cn('tw:flex tw:min-h-12 tw:items-center tw:rounded-ctl tw:bg-sunken tw:px-3.5 tw:text-[15px] tw:text-slate', mono === true && 'tw:font-mono')}>{children}</div>
      {hint !== undefined && <Helper>{hint}</Helper>}
    </div>
  )
}

/** The prototype Segmented as a teal ToggleGroup (one always selected; read-only when disabled). */
function Segment<T extends string>({ label, value, onChange, options, disabled }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; disabled?: boolean }) {
  return (
    <ToggleGroup
      variant="teal"
      aria-label={label}
      value={[value]}
      disabled={disabled}
      onValueChange={(next: unknown[]) => {
        if (typeof next[0] === 'string') onChange(next[0] as T)
      }}
      className="tw:w-full"
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value} className="tw:disabled:opacity-60">
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** Any number of ids as chips, with a filtering type-ahead to add one (ChipMultiSelect, SurgeonPicker). */
function ChipsMulti({
  options,
  value,
  onChange,
  placeholder,
  label,
  invalid,
}: {
  options: { id: string; name: string }[]
  value: string[]
  onChange: (ids: string[]) => void
  placeholder: string
  label: string
  invalid?: boolean
}) {
  const anchor = useComboboxAnchor()
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options])
  const selected = value.map((id) => byId.get(id) ?? { id, name: id })
  return (
    <Combobox<{ id: string; name: string }, true>
      multiple
      items={options}
      value={selected}
      onValueChange={(next) => onChange(next.map((o) => o.id))}
      itemToStringLabel={(o) => o.name}
      isItemEqualToValue={(a, b) => a.id === b.id}
    >
      <ComboboxChips ref={anchor} aria-invalid={invalid === true ? true : undefined}>
        <ComboboxValue>
          {(items: { id: string; name: string }[]) =>
            items.map((o) => (
              <ComboboxChip key={o.id} aria-label={o.name}>
                {o.name}
              </ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxChipsInput placeholder={value.length === 0 ? placeholder : undefined} aria-label={label} />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>Nothing matches.</ComboboxEmpty>
        <ComboboxList>
          {(o: { id: string; name: string }) => (
            <ComboboxItem key={o.id} value={o}>
              {o.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
