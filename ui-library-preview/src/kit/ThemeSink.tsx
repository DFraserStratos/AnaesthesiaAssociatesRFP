import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { BellIcon, ChevronRightIcon, InboxIcon, PlusIcon, SearchIcon, Trash2Icon, XIcon } from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { Kbd } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { MobileReplacementStage } from './stages'

/**
 * /theme: every branded library component and variant on one page, for
 * checking the AA brand layer (src/theme.css) against the Design Language.
 * Fixed demo data only; the demo "today" is 21 Jul 2026.
 */

const TODAY = new Date(2026, 6, 21)
const SELECTED = new Date(2026, 6, 24)

const HOSPITALS = ["St George's", 'Southern Cross', 'Forte Health', 'Christchurch Public', 'Burwood']
const SURGEONS = ['Mr Hale', 'Ms Ngata', 'Dr Okafor', 'Mr Brandt', 'Ms Liu', 'Dr Patel']

const AGING = [
  { bucket: 'Current', amount: 48210 },
  { bucket: '30 d', amount: 21480 },
  { bucket: '60 d', amount: 9320 },
  { bucket: '90 d +', amount: 4105 },
]
const agingConfig = { amount: { label: 'Outstanding', color: 'var(--chart-1)' } } satisfies ChartConfig

const ROWS = [
  { list: "St George's AM", surgeon: 'Mr Hale', units: 14, fee: '556.50', status: 'private' as const },
  { list: 'Chch Public Acute', surgeon: 'Ms Ngata', units: 22, fee: '874.50', status: 'public' as const },
  { list: 'Pre-op clinic', surgeon: 'Dr Okafor', units: 6, fee: '238.50', status: 'preop' as const },
]
const STATUS_LABEL = { private: 'Private', public: 'Public', preop: 'Pre-op' }

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="tw:flex tw:flex-col tw:gap-4 tw:border-t tw:border-line tw:pt-6">
      <h2 className="tw:text-[11px] tw:leading-[14px] tw:font-semibold tw:tracking-[0.06em] tw:text-mist tw:uppercase">{title}</h2>
      {children}
    </section>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3">{children}</div>
}

export function ThemeSink() {
  const [hospital, setHospital] = useState<string | null>(null)
  const [day, setDay] = useState<Date | undefined>(SELECTED)

  return (
    <TooltipProvider>
      <div className="lib-scope" style={{ minHeight: '100vh', background: 'var(--aa-bg)' }}>
        <div className="tw:mx-auto tw:flex tw:max-w-[1440px] tw:flex-col tw:gap-8 tw:px-10 tw:py-10">
          <header className="tw:flex tw:flex-col tw:gap-1">
            <h1 className="tw:text-[32px] tw:leading-[38px] tw:font-bold tw:tracking-[-0.02em]">Theme sink</h1>
            <p className="tw:text-[15px] tw:text-slate">
              Every branded library component and variant, on the AA brand layer. Demo today · Tue 21 Jul 2026.
            </p>
          </header>

          <Section title="Button">
            <Row>
              <Button>Save booking</Button>
              <Button variant="outline">Cancel</Button>
              <Button variant="secondary">Add line</Button>
              <Button variant="pill">
                <PlusIcon data-icon="inline-start" />
                Add
              </Button>
              <Button variant="ghost">Dismiss</Button>
              <Button variant="link">Open record</Button>
              <Button variant="destructive">
                <Trash2Icon data-icon="inline-start" />
                Remove contract
              </Button>
            </Row>
            <Row>
              <Button size="xs" variant="outline">Edit</Button>
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button size="cta">Mark list completed</Button>
              <Button size="icon-xs" variant="outline" aria-label="Close">
                <XIcon />
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label="Notifications">
                <BellIcon />
              </Button>
              <Button size="icon" variant="outline" aria-label="Search">
                <SearchIcon />
              </Button>
              <Button size="icon-lg" aria-label="Add">
                <PlusIcon />
              </Button>
            </Row>
            <Row>
              <Button disabled>Save booking</Button>
              <Button disabled variant="outline">Cancel</Button>
              <Button disabled variant="secondary">Add line</Button>
              <Button disabled variant="pill">Add</Button>
              <Button disabled variant="destructive">Remove contract</Button>
            </Row>
          </Section>

          <Section title="Badge">
            <Row>
              <Badge>Hospital</Badge>
              <Badge variant="outline">Draft</Badge>
              <Badge variant="success">Active</Badge>
              <Badge variant="warning">Needs review</Badge>
              <Badge variant="error">Failed</Badge>
            </Row>
            <Row>
              <Badge variant="private">Private</Badge>
              <Badge variant="public">Public</Badge>
              <Badge variant="preop">Pre-op</Badge>
              <Badge variant="holiday">Holiday</Badge>
              <Badge variant="unavailable">Unavailable</Badge>
              <Badge variant="free">Free</Badge>
            </Row>
          </Section>

          <Section title="Overlays">
            <Row>
              <Dialog>
                <DialogTrigger render={<Button variant="outline" data-sink="open-dialog" />}>Open dialog</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit list</DialogTitle>
                    <DialogDescription>St George's AM list · Tue 21 Jul 2026</DialogDescription>
                  </DialogHeader>
                  <Field>
                    <FieldLabel htmlFor="dlg-surgeon">Surgeon</FieldLabel>
                    <Input id="dlg-surgeon" defaultValue="Mr Hale" />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="dlg-notes">Notes</FieldLabel>
                    <Textarea id="dlg-notes" placeholder="Anything the office should know" />
                  </Field>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                    <DialogClose render={<Button />}>Save</DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" />}>Cancel booking</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                    <AlertDialogDescription>The anaesthetist is told at once. The booking stays in the audit trail.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep booking</AlertDialogCancel>
                    <AlertDialogAction variant="destructive">Cancel booking</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Sheet>
                <SheetTrigger render={<Button variant="outline" data-sink="open-sheet" />}>Open side sheet</SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Southern Cross</SheetTitle>
                    <SheetDescription>Hospital · 4 theatres · Active</SheetDescription>
                  </SheetHeader>
                  <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-5 tw:overflow-y-auto tw:px-6 tw:py-5">
                    <Field>
                      <FieldLabel htmlFor="sh-name">Name</FieldLabel>
                      <Input id="sh-name" defaultValue="Southern Cross" />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="sh-code">Code</FieldLabel>
                      <Input id="sh-code" className="tw:font-mono" defaultValue="SCH01" />
                    </Field>
                  </div>
                  <SheetFooter>
                    <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
                    <SheetClose render={<Button />}>Save</SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              <Popover>
                <PopoverTrigger render={<Button variant="outline" />}>Popover</PopoverTrigger>
                <PopoverContent>
                  <PopoverHeader>
                    <PopoverTitle>Times</PopoverTitle>
                    <PopoverDescription>Start and finish for this list.</PopoverDescription>
                  </PopoverHeader>
                  <div className="tw:font-mono tw:text-sm tw:font-medium">13:05 to 16:20</div>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" />}>List options</DropdownMenuTrigger>
                <DropdownMenuContent className="tw:w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>This list</DropdownMenuLabel>
                    <DropdownMenuItem>
                      Move this list
                      <DropdownMenuShortcut>M</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Alert the office</DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">Cancel list</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger render={<Button variant="ghost" />}>Hover for tooltip</TooltipTrigger>
                <TooltipContent>Open warnings · 2</TooltipContent>
              </Tooltip>

              <HoverCard>
                <HoverCardTrigger render={<Button variant="link" />}>Dr Souter</HoverCardTrigger>
                <HoverCardContent>
                  <div className="tw:flex tw:items-center tw:gap-3">
                    <Avatar>
                      <AvatarFallback>MS</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="tw:text-sm tw:font-semibold">Dr Mark Souter</div>
                      <div className="tw:text-xs tw:text-slate">Anaesthetist · 3 lists this week</div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>

              <Button variant="outline" onClick={() => toast('Booking saved', { description: 'Tue 21 Jul 2026 · 13:05' })}>
                Show toast
              </Button>
              <Button variant="outline" onClick={() => toast.success('Invoice sent', { description: 'INV 10432 · $556.50' })}>
                Success toast
              </Button>
            </Row>
          </Section>

          <Section title="Fields">
            <div className="tw:grid tw:grid-cols-3 tw:gap-6">
              <Field>
                <FieldLabel htmlFor="f-nhi">NHI</FieldLabel>
                <Input id="f-nhi" className="tw:font-mono" placeholder="ZAA0067" />
                <FieldDescription>Three letters then four numbers.</FieldDescription>
              </Field>
              <Field data-invalid>
                <FieldLabel htmlFor="f-units">Base units</FieldLabel>
                <Input id="f-units" aria-invalid defaultValue="-2" />
                <FieldError>Units cannot be below zero.</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="f-dis">Contract</FieldLabel>
                <Input id="f-dis" disabled defaultValue="Southern Cross 2026" />
              </Field>
              <Field>
                <FieldLabel>Hospital</FieldLabel>
                <Select value={hospital} onValueChange={(v) => setHospital(v as string | null)}>
                  <SelectTrigger className="tw:w-full" data-sink="select">
                    <SelectValue placeholder="Choose a hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOSPITALS.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Surgeon</FieldLabel>
                <Combobox items={SURGEONS}>
                  <ComboboxInput placeholder="Type a surgeon" />
                  <ComboboxContent>
                    <ComboboxEmpty>No surgeon matches.</ComboboxEmpty>
                    <ComboboxList>
                      {(item: string) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
              <Field>
                <FieldLabel htmlFor="f-search">Search</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <SearchIcon />
                  </InputGroupAddon>
                  <InputGroupInput id="f-search" placeholder="Name or NHI" />
                  <InputGroupAddon align="inline-end">
                    <Kbd>/</Kbd>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
              <Field>
                <FieldLabel htmlFor="f-notes">Notes</FieldLabel>
                <Textarea id="f-notes" placeholder="Anything the office should know" />
              </Field>
              <div className="tw:flex tw:flex-col tw:gap-4">
                <Label className="tw:gap-2.5">
                  <Checkbox defaultChecked /> After hours
                </Label>
                <Label className="tw:gap-2.5">
                  <Checkbox /> Weekend
                </Label>
                <RadioGroup defaultValue="aa">
                  <Label className="tw:gap-2.5">
                    <RadioGroupItem value="aa" /> Bill through AA
                  </Label>
                  <Label className="tw:gap-2.5">
                    <RadioGroupItem value="self" /> Bill myself
                  </Label>
                </RadioGroup>
              </div>
              <div className="tw:flex tw:flex-col tw:gap-4">
                <Label className="tw:gap-3">
                  <Switch defaultChecked /> Notify me (default)
                </Label>
                <Label className="tw:gap-3">
                  <Switch /> Off
                </Label>
                <Label className="tw:gap-3">
                  <Switch size="sm" defaultChecked /> Small
                </Label>
              </div>
            </div>
          </Section>

          <Section title="Tabs, toggle, toggle group">
            <div className="tw:grid tw:grid-cols-2 tw:gap-8">
              <Tabs defaultValue="lists">
                <TabsList>
                  <TabsTrigger value="lists">Lists</TabsTrigger>
                  <TabsTrigger value="bookings">Bookings</TabsTrigger>
                  <TabsTrigger value="invoices">Invoices</TabsTrigger>
                </TabsList>
                <TabsContent value="lists" className="tw:text-slate">Segmented tabs: sunken track, white pill.</TabsContent>
              </Tabs>
              <Tabs defaultValue="xero">
                <TabsList variant="line">
                  <TabsTrigger value="xero">Xero</TabsTrigger>
                  <TabsTrigger value="hl7">HL7 feed</TabsTrigger>
                  <TabsTrigger value="fhir">FHIR</TabsTrigger>
                </TabsList>
                <TabsContent value="xero" className="tw:text-slate">Line tabs: ink underline.</TabsContent>
              </Tabs>
              <ToggleGroup defaultValue={['everyone']}>
                <ToggleGroupItem value="everyone">Everyone</ToggleGroupItem>
                <ToggleGroupItem value="free">Free only</ToggleGroupItem>
                <ToggleGroupItem value="mine">Mine</ToggleGroupItem>
              </ToggleGroup>
              <ToggleGroup variant="teal" defaultValue={['week']}>
                <ToggleGroupItem value="day">Day</ToggleGroupItem>
                <ToggleGroupItem value="week">Week</ToggleGroupItem>
                <ToggleGroupItem value="month">Month</ToggleGroupItem>
              </ToggleGroup>
              <Row>
                <Toggle defaultPressed>Show cancelled</Toggle>
                <Toggle>Show drafts</Toggle>
                <Toggle variant="outline">Outline</Toggle>
              </Row>
              <ToggleGroup variant="outline" defaultValue={['b']}>
                <ToggleGroupItem value="a">Outline A</ToggleGroupItem>
                <ToggleGroupItem value="b">Outline B</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </Section>

          <Section title="Table, card, avatar">
            <div className="tw:grid tw:grid-cols-[2fr_1fr] tw:gap-8">
              <Card className="tw:py-0 tw:gap-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>List</TableHead>
                      <TableHead>Surgeon</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead data-numeric>Units</TableHead>
                      <TableHead data-numeric>Fee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ROWS.map((r) => (
                      <TableRow key={r.list}>
                        <TableCell className="tw:font-semibold">{r.list}</TableCell>
                        <TableCell>{r.surgeon}</TableCell>
                        <TableCell>
                          <Badge variant={r.status}>{STATUS_LABEL[r.status]}</Badge>
                        </TableCell>
                        <TableCell data-numeric>{r.units}</TableCell>
                        <TableCell data-numeric>${r.fee}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Receivables aging</CardTitle>
                  <CardDescription>All contracts · at 21 Jul 2026</CardDescription>
                  <CardAction>
                    <Button variant="link">Open</Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="tw:flex tw:items-center tw:gap-4">
                  <Avatar>
                    <AvatarFallback>MS</AvatarFallback>
                  </Avatar>
                  <Avatar size="lg" variant="elevated">
                    <AvatarFallback>KT</AvatarFallback>
                  </Avatar>
                  <Avatar size="sm">
                    <AvatarFallback>JP</AvatarFallback>
                  </Avatar>
                  <AvatarGroup>
                    <Avatar>
                      <AvatarFallback>AB</AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarFallback>CD</AvatarFallback>
                    </Avatar>
                    <AvatarGroupCount>+3</AvatarGroupCount>
                  </AvatarGroup>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="outline">Export</Button>
                  <Button size="sm">Send reminders</Button>
                </CardFooter>
              </Card>
            </div>
          </Section>

          <Section title="Calendar, chart">
            <div className="tw:flex tw:flex-wrap tw:items-start tw:gap-8">
              <Card className="tw:w-fit tw:py-3">
                <CardContent className="tw:px-3">
                  <Calendar mode="single" today={TODAY} defaultMonth={TODAY} selected={day} onSelect={setDay} />
                </CardContent>
              </Card>
              <Card className="tw:w-[420px]">
                <CardHeader>
                  <CardTitle>Outstanding by age</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={agingConfig} className="tw:aspect-auto tw:h-[200px] tw:w-full">
                    <BarChart data={AGING} accessibilityLayer>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="amount" fill="var(--color-amount)" radius={6} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section title="Alert, accordion, empty, item, progress, skeleton, kbd">
            <div className="tw:grid tw:grid-cols-2 tw:gap-8">
              <div className="tw:flex tw:flex-col tw:gap-3">
                <Alert>
                  <AlertTitle>Draft saved</AlertTitle>
                  <AlertDescription>Nothing is sent until you submit the list.</AlertDescription>
                </Alert>
                <Alert variant="success">
                  <AlertTitle>Contract active</AlertTitle>
                </Alert>
                <Alert variant="warning">
                  <AlertTitle>Base units outside the guide</AlertTitle>
                </Alert>
                <Alert variant="destructive">
                  <AlertTitle>Choose the surgeon.</AlertTitle>
                </Alert>
              </div>
              <Accordion defaultValue={['times']}>
                <AccordionItem value="times">
                  <AccordionTrigger>Times</AccordionTrigger>
                  <AccordionContent>Start 13:05, finish 16:20, 13 time units.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="codes">
                  <AccordionTrigger>Procedure codes</AccordionTrigger>
                  <AccordionContent>47516 · Total hip replacement.</AccordionContent>
                </AccordionItem>
              </Accordion>
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <InboxIcon />
                  </EmptyMedia>
                  <EmptyTitle>No warnings</EmptyTitle>
                  <EmptyDescription>Everything on this day checks out.</EmptyDescription>
                </EmptyHeader>
              </Empty>
              <div className="tw:flex tw:flex-col tw:gap-4">
                <Item variant="outline">
                  <ItemContent>
                    <ItemTitle>Southern Cross 2026</ItemTitle>
                    <ItemDescription>Contract · price first · 4 rules</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <ChevronRightIcon className="tw:size-4 tw:text-mist" />
                  </ItemActions>
                </Item>
                <Item variant="muted">
                  <ItemContent>
                    <ItemTitle>Muted item</ItemTitle>
                  </ItemContent>
                </Item>
                <Progress value={64}>
                  <ProgressLabel>Lists submitted</ProgressLabel>
                  <ProgressValue />
                </Progress>
                <div className="tw:flex tw:items-center tw:gap-3">
                  <Skeleton className="tw:size-10 tw:rounded-pill" />
                  <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-2">
                    <Skeleton className="tw:h-3.5 tw:w-2/3" />
                    <Skeleton className="tw:h-3.5 tw:w-1/3" />
                  </div>
                </div>
                <div className="tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:text-slate">
                  Search <Kbd>/</Kbd> · Close <Kbd>Esc</Kbd>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Breadcrumb, pagination">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Master data</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Contracts</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Southern Cross 2026</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Pagination className="tw:mx-0 tw:justify-start">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    2
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </Section>

          <Section title="Mobile drawer (390 px stage)">
            <MobileReplacementStage height={560}>
              <div className="tw:flex tw:flex-col tw:gap-3">
                <div className="tw:text-[17px] tw:font-semibold">St George's AM</div>
                <div className="tw:text-slate">Tap to open the bottom drawer, then drag it down to dismiss.</div>
                <Drawer>
                  <DrawerTrigger render={<Button size="lg" data-sink="open-drawer" />}>List options</DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>List options</DrawerTitle>
                      <DrawerDescription>St George's AM · Tue 21 Jul 2026</DrawerDescription>
                    </DrawerHeader>
                    <div className="tw:flex tw:flex-col tw:gap-2 tw:px-5 tw:pt-4">
                      <Button variant="outline" size="lg" className="tw:justify-start">Move this list</Button>
                      <Button variant="outline" size="lg" className="tw:justify-start">Alert the office</Button>
                    </div>
                    <DrawerFooter>
                      <DrawerClose render={<Button size="cta" />}>Done</DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </MobileReplacementStage>
          </Section>
        </div>
        <Toaster position="bottom-right" />
      </div>
    </TooltipProvider>
  )
}
