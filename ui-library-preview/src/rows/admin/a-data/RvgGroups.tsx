import { Fragment, useId, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  columnGroupingFeature,
  createColumnHelper,
  createExpandedRowModel,
  createGroupedRowModel,
  rowExpandingFeature,
  tableFeatures,
  useTable,
  type ExpandedState,
} from '@tanstack/react-table'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import {
  ANATOMY_HEADINGS,
  RVG_GROUP_REFUSAL_MESSAGES,
  baseUnitsText,
  rvgGroupRefusal,
  searchRvgGroups,
} from '@proto/domain/billing/rvgGroups'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SearchField } from '../../shared/searchField'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { AutocompleteField } from './AutocompleteField'
import { useStore } from './data'
import { Echo, FormAlert, Header, TableCard, TextAction } from './shared'
import { describeTimeRule } from '@proto/domain/billing/timeUnits'

interface RvgGroup {
  id: string
  code: string
  description: string
  anatomy: string
  baseUnits: number
  baseUnitsRange?: { min: number; max: number }
  modifierUnits: number
  retired: boolean
  includedModifierIds: string[]
}

const HEADINGS = ANATOMY_HEADINGS as readonly string[]

// ---------------------------------------------------------------------------
// RVG anatomy datalist
// ---------------------------------------------------------------------------

/**
 * RvgGroupSheet's anatomy heading on Base UI Autocomplete: free text, the known headings
 * (ANATOMY_HEADINGS) suggested and filtered as you type, the same echo as the example.
 */
export function AnatomyAutocompleteReplacement({ mode }: { mode: 'list' | 'both' }) {
  const id = useId()
  const [anatomy, setAnatomy] = useState('')
  return (
    <div>
      <Field>
        <FieldLabel htmlFor={id}>Anatomy heading</FieldLabel>
        <AnatomyField id={id} value={anatomy} onChange={setAnatomy} headings={HEADINGS} mode={mode} />
      </Field>
      <Echo>{anatomy === '' ? 'Type or pick a heading.' : HEADINGS.includes(anatomy) ? `Existing heading: ${anatomy}` : `New heading: ${anatomy}`}</Echo>
    </div>
  )
}

function AnatomyField({
  id,
  value,
  onChange,
  headings,
  mode = 'list',
  invalid,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  headings: readonly string[]
  mode?: 'list' | 'both'
  invalid?: boolean
}) {
  return (
    <AutocompleteField
      id={id}
      items={headings}
      value={value}
      onValueChange={onChange}
      placeholder="e.g. Head"
      mode={mode}
      invalid={invalid}
      emptyText="No heading matches. A new heading is kept as typed."
    />
  )
}

// ---------------------------------------------------------------------------
// RvgGroupsView (grouped rows)
// ---------------------------------------------------------------------------

const features = tableFeatures({
  columnGroupingFeature,
  groupedRowModel: createGroupedRowModel(),
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
})
const helper = createColumnHelper<typeof features, RvgGroup>()

/** "6", or "10 · range 10 to 12" where the guide prints a range. */
function baseUnitsCell(g: RvgGroup): string {
  return g.baseUnitsRange !== undefined ? `${g.baseUnits} · range ${baseUnitsText(g)}` : String(g.baseUnits)
}

type StatusFilter = 'active' | 'all'
const EVERY = '__every__'

/**
 * RvgGroupsView on TanStack Table v9 with column grouping (rows grouped by anatomy heading) and
 * row expanding, rendered through shadcn Table. Same search (the prototype's searchRvgGroups),
 * anatomy filter (shadcn Select), Active / All (ToggleGroup), columns and actions. Add, edit,
 * retire and restore change a local copy of the store's groups, never the store.
 * `collapsible` turns each heading into a disclosure button (row expanding); off, headings are
 * plain label rows as today.
 */
export function RvgGroupsViewReplacement({ collapsible = false }: { collapsible?: boolean }) {
  const storeGroups = useStore((s) => s.masters.rvgGroups) as Record<string, RvgGroup>
  const modifiers = useStore((s) => s.masters.modifiers) as Record<string, { code: string }>
  const [groups, setGroups] = useState<Record<string, RvgGroup>>(storeGroups)
  const [query, setQuery] = useState('')
  const [anatomy, setAnatomy] = useState('')
  const [status, setStatus] = useState<StatusFilter>('active')
  const [sheet, setSheet] = useState<{ group?: RvgGroup } | null>(null)
  const [retiring, setRetiring] = useState<RvgGroup | null>(null)
  const [expanded, setExpanded] = useState<ExpandedState>(true)
  const [last, setLast] = useState('Local copy: changes here never reach the demo store.')

  const anatomyOptions = useMemo(() => {
    const present = new Set(Object.values(groups).map((g) => g.anatomy))
    return [...HEADINGS.filter((h) => present.has(h)), ...[...present].filter((h) => !HEADINGS.includes(h)).sort()]
  }, [groups])

  // Rows in heading order (stable, so a search keeps its own order inside each heading): the
  // grouped row model lists groups in first-seen order.
  const results = useMemo(() => {
    const rank = (h: string) => anatomyOptions.indexOf(h)
    return (searchRvgGroups(query, groups, { includeRetired: status === 'all' }) as RvgGroup[])
      .filter((g) => anatomy === '' || g.anatomy === anatomy)
      .map((g, i) => ({ g, i }))
      .sort((a, b) => rank(a.g.anatomy) - rank(b.g.anatomy) || a.i - b.i)
      .map((x) => x.g)
  }, [groups, query, status, anatomy, anatomyOptions])

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('anatomy', { header: 'Anatomy' }),
        helper.accessor('code', {
          header: 'Code',
          cell: ({ row }) => (
            <span className={cn('tw:font-mono tw:font-semibold', row.original.retired ? 'tw:text-mist' : 'tw:text-ink')}>{row.original.code}</span>
          ),
        }),
        helper.accessor('description', {
          header: 'Description',
          cell: ({ row }) => <span className={cn('tw:block tw:min-w-[150px] tw:whitespace-normal', row.original.retired && 'tw:text-mist')}>{row.original.description}</span>,
        }),
        helper.display({
          id: 'baseUnits',
          header: 'Base units',
          meta: { numeric: true },
          cell: ({ row }) => <span className={cn(row.original.retired && 'tw:text-mist')}>{baseUnitsCell(row.original)}</span>,
        }),
        helper.display({
          id: 'included',
          header: 'Included modifiers',
          cell: ({ row }) => (
            <span className="tw:inline-flex tw:flex-wrap tw:gap-1.5">
              {row.original.includedModifierIds.map((mid) => (
                <Badge key={mid} className="tw:font-mono">
                  {modifiers[mid]?.code ?? '?'} · 0
                </Badge>
              ))}
            </span>
          ),
        }),
        helper.display({ id: 'retired', header: '', cell: ({ row }) => (row.original.retired ? <Badge>Retired</Badge> : null) }),
        helper.display({
          id: 'actions',
          header: '',
          meta: { right: true },
          cell: ({ row }) => {
            const g = row.original
            const name = `${g.code} ${g.description}`
            return (
              <span className="tw:inline-flex tw:gap-3">
                <TextAction label={`History of ${name}`} onClick={() => setLast(`History of ${g.code} (stubbed: the History sheet is another row).`)}>
                  History
                </TextAction>
                <TextAction label={`Edit ${name}`} onClick={() => setSheet({ group: g })}>
                  Edit
                </TextAction>
                {g.retired ? (
                  <TextAction
                    label={`Restore ${name}`}
                    onClick={() => {
                      setGroups((all) => ({ ...all, [g.id]: { ...g, retired: false } }))
                      setLast(`Restored ${g.code} (local).`)
                    }}
                  >
                    Restore
                  </TextAction>
                ) : (
                  <TextAction label={`Retire ${name}`} onClick={() => setRetiring(g)}>
                    Retire
                  </TextAction>
                )}
              </span>
            )
          },
        }),
      ]),
    [modifiers],
  )

  const table = useTable({
    features,
    columns,
    data: results,
    getRowId: (g) => g.id,
    state: { grouping: ['anatomy'], expanded: collapsible ? expanded : true },
    onExpandedChange: setExpanded,
    autoResetExpanded: false,
    groupedColumnMode: false,
  })

  const leafHeaders = table.getHeaderGroups()[0]?.headers.filter((h) => h.column.id !== 'anatomy') ?? []
  const filtered = query.trim() !== '' || anatomy !== '' || status !== 'active'

  return (
    <div className="tw:flex tw:flex-col tw:gap-3.5">
      <Header
        title="RVG groups"
        sub="The NZSA RVG 2021 groups AA prices from, plus AA's own. Demo-sized; the full set loads at go-live."
        action={
          <Button variant="secondary" size="lg" onClick={() => setSheet({})}>
            Add group
          </Button>
        }
      />

      <TimeRuleCard />

      <div className="tw:flex tw:flex-wrap tw:items-start tw:gap-3">
        <Field className="tw:flex-[1_1_240px] tw:w-auto">
          <FieldLabel htmlFor="rvg-search-replacement">Search</FieldLabel>
          <SearchField id="rvg-search-replacement" value={query} onChange={setQuery} label="Search RVG code or description" />
          <div className="tw:text-[12.5px] tw:text-slate" aria-live="polite">
            <span className="tw:font-mono">{results.length}</span>
            {status === 'active' ? ' active' : ''} {results.length === 1 ? 'group' : 'groups'}
            {anatomy !== '' ? ` under ${anatomy}` : ''}
            {query.trim() !== '' ? ` matching "${query.trim()}"` : ''}
          </div>
        </Field>
        <Field className="tw:w-[230px]">
          <FieldLabel>Anatomy heading</FieldLabel>
          <Select
            value={anatomy === '' ? EVERY : anatomy}
            onValueChange={(v) => setAnatomy(v === EVERY || v === null ? '' : String(v))}
            items={[{ value: EVERY, label: 'Every heading' }, ...anatomyOptions.map((h) => ({ value: h, label: h }))]}
          >
            <SelectTrigger className="tw:w-full" aria-label="Anatomy heading">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EVERY}>Every heading</SelectItem>
              {anatomyOptions.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field className="tw:w-[200px]">
          <FieldLabel>Show</FieldLabel>
          <ToggleGroup
            variant="teal"
            aria-label="Show"
            value={[status]}
            onValueChange={(v: string[]) => {
              if (v[0] === 'active' || v[0] === 'all') setStatus(v[0])
            }}
            className="tw:w-full"
          >
            <ToggleGroupItem value="active">Active</ToggleGroupItem>
            <ToggleGroupItem value="all">All</ToggleGroupItem>
          </ToggleGroup>
        </Field>
      </div>

      {results.length === 0 ? (
        <TableCard className="tw:flex tw:flex-col tw:items-start tw:gap-2.5 tw:px-5 tw:py-7">
          <div className="tw:text-sm tw:font-semibold">No RVG groups match.</div>
          <div className="tw:text-[13px] tw:text-slate">Check the code or a word of the description, or add the group if AA needs it.</div>
          {filtered && (
            <TextAction
              onClick={() => {
                setQuery('')
                setAnatomy('')
                setStatus('all')
              }}
            >
              Search every group
            </TextAction>
          )}
        </TableCard>
      ) : (
        <TableCard>
          <Table className="tw:text-[12.5px]">
            <TableHeader>
              <TableRow>
                {leafHeaders.map((h) => (
                  <TableHead key={h.id} className="tw:whitespace-normal" data-numeric={(h.column.columnDef.meta as { numeric?: boolean } | undefined)?.numeric ? true : undefined}>
                    <table.FlexRender header={h} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                if (row.getIsGrouped()) {
                  const heading = String(row.groupingValue)
                  const open = row.getIsExpanded()
                  return (
                    <TableRow key={row.id} data-rvg-anatomy={heading} className="tw:bg-background tw:hover:bg-background">
                      <TableCell colSpan={leafHeaders.length} className="tw:pt-2.5 tw:pb-2">
                        {collapsible ? (
                          <button
                            type="button"
                            aria-expanded={open}
                            onClick={row.getToggleExpandedHandler()}
                            className="tw:-mx-1 tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-[6px] tw:px-1 tw:text-[13px] tw:font-bold tw:text-ink tw:outline-none tw:focus-visible:shadow-focus"
                          >
                            {open ? <ChevronDownIcon aria-hidden className="tw:size-3.5 tw:text-primary" /> : <ChevronRightIcon aria-hidden className="tw:size-3.5 tw:text-primary" />}
                            {heading}
                            <span className="tw:font-mono tw:text-[11.5px] tw:font-medium tw:text-mist">{row.subRows.length}</span>
                          </button>
                        ) : (
                          <span className="tw:text-[13px] tw:font-bold tw:text-ink">{heading}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                }
                return (
                  <TableRow key={row.id} data-rvg-group-code={row.original.code} className={cn(row.original.retired && 'tw:bg-background')}>
                    {row
                      .getAllCells()
                      .filter((c) => c.column.id !== 'anatomy')
                      .map((cell) => (
                        <TableCell
                          key={cell.id}
                          data-numeric={(cell.column.columnDef.meta as { numeric?: boolean } | undefined)?.numeric ? true : undefined}
                          className={cn('tw:h-auto tw:py-2 tw:align-top', cell.column.id === 'actions' && 'tw:text-right')}
                        >
                          <table.FlexRender cell={cell} />
                        </TableCell>
                      ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableCard>
      )}
      <Echo>{last}</Echo>

      <RvgGroupDialog
        open={sheet !== null}
        group={sheet?.group}
        groups={groups}
        headings={anatomyOptions}
        onClose={() => setSheet(null)}
        onSave={(row) => {
          setGroups((all) => ({ ...all, [row.id]: row }))
          setLast(`${sheet?.group === undefined ? 'Added' : 'Saved'} ${row.code} · ${row.description} (local).`)
          setSheet(null)
        }}
      />
      <Dialog open={retiring !== null} onOpenChange={(o) => !o && setRetiring(null)}>
        <DialogContent showCloseButton={false} className="tw:gap-3.5">
          {retiring !== null && (
            <>
              <DialogTitle className="tw:pr-0">Retire {retiring.code}?</DialogTitle>
              <DialogDescription className="tw:text-sm tw:leading-5">
                {retiring.description} leaves the RVG code search. Procedures that already carry it keep it and price as before. You can restore it later.
              </DialogDescription>
              <Button
                size="cta"
                className="tw:w-full"
                onClick={() => {
                  setGroups((all) => ({ ...all, [retiring.id]: { ...retiring, retired: true } }))
                  setLast(`Retired ${retiring.code} (local).`)
                  setRetiring(null)
                }}
              >
                Retire group
              </Button>
              <Button variant="outline" size="lg" className="tw:w-full" onClick={() => setRetiring(null)}>
                Cancel
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// RvgGroupSheet: add or edit, on React Hook Form + Zod
// ---------------------------------------------------------------------------

/** A whole number from a field's text, or NaN (the model's sentences explain the rest). */
function wholeOrNaN(text: string): number {
  const t = text.trim()
  return /^\d+$/.test(t) ? Number(t) : Number.NaN
}

const M = RVG_GROUP_REFUSAL_MESSAGES as Record<string, string>
const whole = (message: string, min: number) =>
  z.string().refine((v) => {
    const n = wholeOrNaN(v)
    return Number.isInteger(n) && n >= min
  }, message)

function groupSchema(groups: Record<string, RvgGroup>, selfId: string | undefined) {
  return z
    .object({
      code: z.string().trim().min(1, M.codeRequired),
      description: z.string().trim().min(1, M.descriptionRequired),
      anatomy: z.string().trim().min(1, M.anatomyRequired),
      baseUnits: whole(M.baseUnitsInvalid!, 1),
      modifierUnits: whole(M.modifierUnitsInvalid!, 0),
      hasRange: z.boolean(),
      rangeMin: z.string(),
      rangeMax: z.string(),
    })
    .superRefine((v, ctx) => {
      // The model's own rule decides the range and duplicates; only where it shows is ours.
      const refusal = rvgGroupRefusal(toInput(v), groups, selfId) as { code: string; message: string } | null
      if (refusal === null) return
      if (refusal.code === 'rangeInvalid' || refusal.code === 'rangeMissesFigure') ctx.addIssue({ code: 'custom', path: ['rangeMax'], message: refusal.message })
      else if (refusal.code === 'duplicateGroup' || refusal.code === 'duplicateRetired') ctx.addIssue({ code: 'custom', path: ['root'], message: refusal.message })
    })
}

type GroupForm = { code: string; description: string; anatomy: string; baseUnits: string; modifierUnits: string; hasRange: boolean; rangeMin: string; rangeMax: string }

function toInput(v: GroupForm) {
  return {
    code: v.code,
    description: v.description,
    anatomy: v.anatomy,
    baseUnits: wholeOrNaN(v.baseUnits),
    ...(v.hasRange ? { baseUnitsRange: { min: wholeOrNaN(v.rangeMin), max: wholeOrNaN(v.rangeMax) } } : {}),
    modifierUnits: wholeOrNaN(v.modifierUnits),
  }
}

function RvgGroupDialog({
  open,
  group,
  groups,
  headings,
  onClose,
  onSave,
}: {
  open: boolean
  group?: RvgGroup
  groups: Record<string, RvgGroup>
  headings: readonly string[]
  onClose: () => void
  onSave: (row: RvgGroup) => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="tw:gap-3.5 tw:sm:max-w-[520px]">
        {open && <RvgGroupForm key={group?.id ?? 'new'} group={group} groups={groups} headings={headings} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  )
}

function RvgGroupForm({ group, groups, headings, onSave }: { group?: RvgGroup; groups: Record<string, RvgGroup>; headings: readonly string[]; onSave: (row: RvgGroup) => void }) {
  const ids = { code: useId(), anatomy: useId(), description: useId(), base: useId(), mod: useId(), min: useId(), max: useId(), range: useId() }
  const schema = useMemo(() => groupSchema(groups, group?.id), [groups, group?.id])
  const form = useForm<GroupForm>({
    resolver: zodResolver(schema) as never,
    mode: 'onTouched',
    defaultValues: {
      code: group?.code ?? '',
      description: group?.description ?? '',
      anatomy: group?.anatomy ?? '',
      baseUnits: group !== undefined ? String(group.baseUnits) : '',
      modifierUnits: String(group?.modifierUnits ?? 0),
      hasRange: group?.baseUnitsRange !== undefined,
      rangeMin: group?.baseUnitsRange !== undefined ? String(group.baseUnitsRange.min) : '',
      rangeMax: group?.baseUnitsRange !== undefined ? String(group.baseUnitsRange.max) : '',
    },
  })
  const e = form.formState.errors
  const hasRange = form.watch('hasRange')
  const rootError = (e as { root?: { message?: string } }).root?.message

  const text = (name: keyof GroupForm, id: string, label: string, opts: { mono?: boolean; placeholder?: string; hint?: string } = {}) => {
    const err = e[name]
    return (
      <Field data-invalid={err !== undefined ? true : undefined}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Input id={id} placeholder={opts.placeholder} className={cn(opts.mono && 'tw:font-mono')} aria-invalid={err !== undefined ? true : undefined} {...form.register(name)} />
        {opts.hint !== undefined && err === undefined && <FieldDescription>{opts.hint}</FieldDescription>}
        <FieldError errors={[err]} />
      </Field>
    )
  }

  return (
    <form
      noValidate
      className="tw:flex tw:flex-col tw:gap-3.5"
      onSubmit={form.handleSubmit((v) => {
        const input = toInput(v)
        const base = group ?? { id: `local-${Object.keys(groups).length + 1}`, retired: false, includedModifierIds: [] }
        const row: RvgGroup = {
          ...base,
          code: input.code.trim(),
          description: input.description.trim(),
          anatomy: input.anatomy.trim(),
          baseUnits: input.baseUnits,
          modifierUnits: input.modifierUnits,
          ...(input.baseUnitsRange !== undefined ? { baseUnitsRange: input.baseUnitsRange } : {}),
        } as RvgGroup
        if (input.baseUnitsRange === undefined) delete row.baseUnitsRange
        onSave(row)
      })}
    >
      <DialogTitle className="tw:pr-0">{group === undefined ? 'Add an RVG group' : `Edit ${group.code} · ${group.description}`}</DialogTitle>
      <div className="tw:grid tw:grid-cols-[120px_1fr] tw:gap-3">
        {text('code', ids.code, 'RVG code', { mono: true, placeholder: 'e.g. H3' })}
        <Field data-invalid={e.anatomy !== undefined ? true : undefined}>
          <FieldLabel htmlFor={ids.anatomy}>Anatomy heading</FieldLabel>
          <Controller
            control={form.control}
            name="anatomy"
            render={({ field }) => <AnatomyField id={ids.anatomy} value={field.value} onChange={field.onChange} headings={headings} invalid={e.anatomy !== undefined} />}
          />
          <FieldError errors={[e.anatomy]} />
        </Field>
      </div>
      {text('description', ids.description, 'Description', { placeholder: 'e.g. Brow lift', hint: 'Users find the group by its code or a word from this.' })}
      <div className="tw:grid tw:grid-cols-2 tw:gap-3">
        {text('baseUnits', ids.base, 'Base units', { mono: true, placeholder: 'e.g. 5', hint: 'The starting figure: a whole number above 0.' })}
        {text('modifierUnits', ids.mod, 'Modifier units', { mono: true, hint: 'Usually 0.' })}
      </div>
      <div className="tw:flex tw:items-center tw:gap-2">
        <Controller
          control={form.control}
          name="hasRange"
          render={({ field }) => <Checkbox id={ids.range} checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />}
        />
        <Label htmlFor={ids.range} className="tw:text-sm tw:font-normal">
          The guide prints a range of base units
        </Label>
      </div>
      {hasRange && (
        <Fragment>
          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            {text('rangeMin', ids.min, 'Range from', { mono: true, placeholder: 'e.g. 10' })}
            {text('rangeMax', ids.max, 'Range to', { mono: true, placeholder: 'e.g. 12' })}
          </div>
          <div className="tw:-mt-1.5 tw:text-[12.5px] tw:text-slate">The anaesthetist sees the range when choosing the value. The base units must sit within it.</div>
        </Fragment>
      )}
      <FormAlert message={rootError} />
      <Button type="submit" size="cta" className="tw:w-full">
        {group === undefined ? 'Add group' : 'Save changes'}
      </Button>
    </form>
  )
}

/**
 * The RVG time rule card above the table, as a plain static stand-in (read only, as today): the
 * rule in words and its tiers from masters.rvgTimeRule, so the comparison is like for like.
 */
function TimeRuleCard() {
  const rule = useStore((s) => s.masters.rvgTimeRule) as { tiers: { fromMinute: number; intervalMinutes: number }[] }
  return (
    <section aria-labelledby="rvg-time-rule-title-replacement" className="tw:flex tw:flex-wrap tw:items-start tw:gap-6 tw:rounded-card tw:border tw:border-line tw:bg-surface tw:px-4 tw:py-3.5">
      <div className="tw:flex tw:flex-[1_1_300px] tw:flex-col tw:gap-1">
        <h3 id="rvg-time-rule-title-replacement" className="tw:m-0 tw:text-sm tw:font-bold tw:text-ink">RVG time rule</h3>
        <div className="tw:max-w-[520px] tw:text-[13px] tw:text-slate">{describeTimeRule(rule) as string}</div>
        <div className="tw:text-xs tw:text-mist">A part interval always rounds up. The anaesthetist enters start and finish; the time units follow these tiers.</div>
      </div>
      <div className="tw:min-w-0 tw:flex-[0_1_300px]">
      <Table className="tw:text-[12.5px]">
        <TableHeader>
          <TableRow>
            <TableHead>From minute</TableHead>
            <TableHead data-numeric="">Minutes per unit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rule.tiers.map((t) => (
            <TableRow key={t.fromMinute}>
              <TableCell className="tw:font-mono">{t.fromMinute}</TableCell>
              <TableCell data-numeric="">{t.intervalMinutes}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </section>
  )
}
