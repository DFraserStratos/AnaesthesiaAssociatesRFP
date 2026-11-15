import { useState, type MouseEvent } from 'react'
import { TelescopeIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '@/components/ui/navigation-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Wordmark } from '@proto/shared'
import { DRAFT_LISTS } from '@proto/shared/scheduleTerms'
import { MASTERS_NAV } from '@proto/apps/admin/screens/masters/view'
import { Echo, Wide } from './shared'

const stop = (e: MouseEvent) => e.preventDefault()

// ---------------------------------------------------------------------------
// SideNav (with RolesInfo)
// ---------------------------------------------------------------------------

type NavSection = 'day' | 'draftLists' | 'conflicts' | 'notifications' | 'review' | 'invoices' | 'billing' | 'integrations' | 'masters' | 'audit'

/** The RolesInfo dialog's four entries, verbatim from apps/admin/RolesInfo.tsx (not exported there). */
const ROLES = [
  {
    role: 'Anaesthetist (e.g. Dr Melanie Souter)',
    view: "Only their OWN Lists and Bookings. A colleague's availability shows session status only, never patient or billing detail.",
    edit: 'Edits their own Bookings while the List is ACTIVE or SUBMITTED, until the office authorises it; sets their own availability; submits their own Lists. No access to authorisation, master data, audit or billing.',
  },
  {
    role: 'OfficeAdmin (Kirsty W. · Office)',
    view: 'The whole day across every anaesthetist; every Booking, the master data, the audit trail and the billing monitor.',
    edit: 'Edits Bookings on ACTIVE and SUBMITTED Lists, corrects billing setup, reassigns, authorises for billing, and manages master data. Cannot edit an AUTHORISED List (locked).',
  },
  {
    role: 'Integration (HL7 / FHIR feed · source integration)',
    view: 'Writes appointment Bookings through the feed; no interactive UI.',
    edit: 'Creates and updates Bookings only while the List is ACTIVE; never completes or authorises. A write to a SUBMITTED / AUTHORISED List is refused into a monitor manual-intervention item.',
  },
  {
    role: 'System / Demo (automated · source system/demo)',
    view: 'No UI; the billing run and the demo clock act here.',
    edit: 'Automated actions (billing run, canvas roll) are audited with source system / demo, so they are reconstructable in the audit viewer alongside human actions.',
  },
]

/** "Roles in this prototype" as a shadcn Dialog; `closeX` adds the kit's corner close button. */
function RolesInfo({ closeX }: { closeX: boolean }) {
  return (
    <Dialog>
      <DialogTrigger className="tw:cursor-pointer tw:border-0 tw:bg-transparent tw:px-2 tw:py-0.5 tw:text-left tw:text-xs tw:font-medium tw:text-sidebar-foreground/60 tw:outline-none tw:hover:text-sidebar-foreground tw:focus-visible:shadow-focus">
        Roles in this prototype
      </DialogTrigger>
      <DialogContent showCloseButton={closeX}>
        <DialogHeader className="tw:gap-3.5">
          <DialogTitle className="tw:text-lg tw:font-bold">Roles in this prototype</DialogTitle>
          <DialogDescription className="tw:text-[13px] tw:text-slate">
            View, access and edit rights are managed by role (RFP). Each is provable live by switching persona in the app switcher.
          </DialogDescription>
        </DialogHeader>
        {ROLES.map((r) => (
          <div key={r.role} className="tw:flex tw:flex-col tw:gap-1.5 tw:rounded-card tw:border tw:border-line tw:p-3.5">
            <div className="tw:text-sm tw:font-bold tw:text-teal-pressed">{r.role}</div>
            <div className="tw:text-[12.5px] tw:text-ink">
              <strong className="tw:text-slate">Sees: </strong>
              {r.view}
            </div>
            <div className="tw:text-[12.5px] tw:text-ink">
              <strong className="tw:text-slate">Edits: </strong>
              {r.edit}
            </div>
          </div>
        ))}
      </DialogContent>
    </Dialog>
  )
}

/**
 * The dark Admin side nav on Base UI NavigationMenu (vertical): a labelled nav of real links,
 * aria-current on the open section, arrow keys between items. Colours come from the
 * --sidebar tokens (ink ground, crimson active marker only).
 */
export function SideNavReplacement({ closeX = false }: { closeX?: boolean }) {
  const [active, setActive] = useState<NavSection>('day')
  const items: { section: NavSection; label: string; badge?: number; warn?: boolean }[] = [
    { section: 'day', label: 'Day view' },
    { section: 'draftLists', label: DRAFT_LISTS as string, badge: 4, warn: true },
    { section: 'conflicts', label: 'Conflicts', badge: 19, warn: true },
    { section: 'notifications', label: 'Notifications', badge: 1, warn: true },
    { section: 'review', label: 'Review queue', badge: 5 },
    { section: 'invoices', label: 'Invoices' },
    { section: 'billing', label: 'Billing monitor', badge: 2, warn: true },
    { section: 'integrations', label: 'Integrations', badge: 0, warn: true },
    { section: 'masters', label: 'Master data' },
    { section: 'audit', label: 'Audit' },
  ]
  return (
    <div className="tw:flex tw:h-[560px]">
      <div className="tw:box-border tw:flex tw:w-[216px] tw:flex-none tw:flex-col tw:gap-6 tw:bg-sidebar tw:px-3 tw:py-5 tw:leading-[1.5]">
        <div className="tw:flex tw:flex-col tw:gap-[5px] tw:px-2">
          <Wordmark tone="dark" size={15} />
          {/* The prototype's #D89AA9 has no token: the brand tint is the nearest. */}
          <span className="tw:pl-0.5 tw:text-[9px] tw:font-semibold tw:tracking-[0.14em] tw:text-brand-tint">ADMIN</span>
        </div>

        <NavigationMenu orientation="vertical" aria-label="Admin" className="tw:max-w-none tw:flex-none tw:items-stretch tw:justify-start">
          <NavigationMenuList className="tw:w-full tw:flex-col tw:items-stretch tw:gap-0.5">
            {items.map((item) => {
              const on = item.section === active
              return (
                <NavigationMenuItem key={item.section}>
                  <NavigationMenuLink
                    href="#"
                    active={on}
                    onClick={(e) => {
                      stop(e)
                      setActive(item.section)
                    }}
                    className={cn(
                      'tw:justify-between tw:gap-2.5 tw:rounded-[9px] tw:px-3 tw:py-2.5 tw:text-[13.5px] tw:leading-[1.5] tw:font-medium tw:text-sidebar-foreground/90 tw:hover:bg-sidebar-accent tw:focus:bg-sidebar-accent tw:data-active:text-sidebar-foreground',
                      on && 'tw:bg-sidebar-accent tw:font-semibold tw:shadow-[inset_3px_0_0_var(--sidebar-primary)]',
                    )}
                  >
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge className={cn('tw:px-2 tw:py-0.5 tw:text-[11px] tw:leading-[14px] tw:font-bold tw:text-white', item.warn ? 'tw:bg-warning' : 'tw:bg-sidebar-primary')}>
                        {item.badge}
                      </Badge>
                    )}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )
            })}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="tw:mt-auto tw:flex tw:flex-col tw:gap-2">
          <RolesInfo closeX={closeX} />
          <div className="tw:flex tw:items-center tw:gap-2.5 tw:p-2">
            <Avatar className="tw:size-[30px]">
              <AvatarFallback className="tw:text-[11px]">KW</AvatarFallback>
            </Avatar>
            <div className="tw:flex tw:flex-col">
              <span className="tw:text-[12.5px] tw:font-semibold tw:text-sidebar-foreground">Kirsty W.</span>
              <span className="tw:text-[11px] tw:text-sidebar-foreground/50">Office</span>
            </div>
          </div>
        </div>
      </div>
      <div className="tw:p-3.5 tw:text-[13px] tw:text-slate">
        Section: <strong>{active}</strong>
        <div className="tw:mt-1.5 tw:text-mist">Badge counts are fixed for the example. "Roles in this prototype" opens the dialog.</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Master data sub-nav
// ---------------------------------------------------------------------------

type MastersView = string
const MASTERS = MASTERS_NAV as readonly { view: MastersView; label: string }[]

/** The 15 master views as a vertical NavigationMenu: links, aria-current, the teal-tint active row. */
export function MastersSubNavReplacement() {
  const [view, setView] = useState<MastersView>(MASTERS[0]!.view)
  return (
    <div className="tw:flex tw:gap-4">
      <div className="tw:w-[190px] tw:flex-none">
        <h1 className="tw:mb-2 tw:text-xl tw:font-bold">Master data</h1>
        <NavigationMenu orientation="vertical" aria-label="Master data" className="tw:max-w-none tw:items-stretch tw:justify-start">
          <NavigationMenuList className="tw:w-full tw:flex-col tw:items-stretch tw:gap-0.5">
            {MASTERS.map((n) => {
              const on = n.view === view
              return (
                <NavigationMenuItem key={n.view}>
                  <NavigationMenuLink
                    href="#"
                    active={on}
                    onClick={(e) => {
                      stop(e)
                      setView(n.view)
                    }}
                    className={cn(
                      'tw:rounded-[8px] tw:px-2.5 tw:py-2 tw:text-[13px] tw:leading-[1.5] tw:font-medium tw:text-slate',
                      on && 'tw:bg-teal-tint tw:font-bold tw:text-teal-pressed tw:hover:bg-teal-tint tw:focus:bg-teal-tint tw:data-active:font-bold tw:data-active:text-teal-pressed',
                    )}
                  >
                    {n.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )
            })}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <div className="tw:pt-9 tw:text-[13px] tw:text-slate">View: {MASTERS.find((n) => n.view === view)?.label}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TabButton (Integrations)
// ---------------------------------------------------------------------------

type IntegrationTab = 'messages' | 'feeds' | 'pdfs' | 'quality' | 'validators'

/** DemoBadge tone "future" as a Badge (outline, uppercase, telescope). */
function FutureBadge({ compact = false }: { compact?: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'tw:border-line-strong tw:bg-sunken tw:tracking-[0.06em] tw:uppercase',
        compact ? 'tw:gap-1 tw:px-[7px] tw:py-px tw:text-[9.5px] tw:leading-[14px]' : 'tw:gap-1.5 tw:px-2.5 tw:py-1 tw:text-[11px] tw:leading-[14px] tw:[&>svg]:size-[13px]!',
      )}
    >
      <TelescopeIcon aria-hidden />
      Future scope
    </Badge>
  )
}

const PANEL_STUB: Record<IntegrationTab, string> = {
  messages: 'The message log: each HL7 v2 and FHIR message, its status, retries and the dead-letter queue.',
  feeds: 'Editable per-hospital feed mappings (the failure-fix flow).',
  pdfs: 'The surgeon PDF inbox and its extraction review.',
  quality: 'The ethnicity data-quality queue.',
  validators: 'The NHI and ethnicity validators.',
}

/**
 * The Integrations monitor's five tabs as shadcn Tabs (line variant, ink underline). The panels
 * are one-line stand-ins: the real tab bodies are not exported and some write to the store.
 * `activateOnFocus` true makes arrow keys switch the tab; false (as today's click-only buttons)
 * moves focus and waits for Enter or Space.
 */
export function IntegrationTabsReplacement({ activateOnFocus = false }: { activateOnFocus?: boolean }) {
  const [tab, setTab] = useState<IntegrationTab>('messages')
  const tabs: { value: IntegrationTab; label: string; future?: boolean }[] = [
    { value: 'messages', label: 'Messages', future: true },
    { value: 'feeds', label: 'Feed config', future: true },
    { value: 'pdfs', label: 'Surgeon PDFs' },
    { value: 'quality', label: 'Data quality' },
    { value: 'validators', label: 'Validators' },
  ]
  return (
    <Wide minWidth={1000}>
    <div className="tw:flex tw:max-w-[1080px] tw:flex-col tw:gap-4">
      <div>
        <h1 className="tw:m-0 tw:text-2xl tw:leading-[30px] tw:font-bold tw:tracking-[-0.01em]">Integrations</h1>
        <div className="tw:mt-1 tw:max-w-[820px] tw:text-[13px] tw:text-slate">
          Hospital HL7 v2 messages are translated to FHIR R4 and applied to the schedule; a FHIR-native feed shows the target state; surgeon PDFs are read and
          ingested. Each message is stored on receipt, then processed, and retried with a dead-letter queue, so nothing is lost when a message cannot be applied.
        </div>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as IntegrationTab)} className="tw:gap-4">
        <TabsList variant="line" activateOnFocus={activateOnFocus} className="tw:w-full tw:flex-wrap tw:justify-start tw:gap-1">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="tw:gap-2 tw:text-sm">
              {t.label}
              {t.future === true && <FutureBadge compact />}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.value} value={t.value} className="tw:flex tw:flex-col tw:gap-3">
            {t.future === true && (
              <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2.5 tw:rounded-ctl tw:border tw:border-line tw:bg-sunken tw:px-3.5 tw:py-2.5 tw:text-[12.5px] tw:text-slate">
                <FutureBadge />
                <span>
                  HL7 v2, FHIR R4 and near real time messaging are Future scope. In scope today is the St George's and Southern Cross download into a matching screen.
                </span>
              </div>
            )}
            <div className="tw:text-[13px] tw:text-mist">{PANEL_STUB[t.value]} (Tab body left out of this row.)</div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
    </Wide>
  )
}

// ---------------------------------------------------------------------------
// TabLink (AA fees)
// ---------------------------------------------------------------------------

type FeeTab = 'invoices' | 'settings'
const FEE_TABS: { value: FeeTab; label: string }[] = [
  { value: 'invoices', label: 'Fee invoices' },
  { value: 'settings', label: 'Fee settings' },
]

/** The line-tab look (TabsTrigger line variant) on a plain link: 10/14 padding, ink underline when current. */
const LINK_TAB =
  'tw:px-3.5 tw:py-2.5 tw:text-sm tw:font-medium tw:text-slate tw:no-underline tw:outline-none tw:hover:text-ink tw:focus-visible:shadow-focus tw:aria-[current=page]:font-semibold tw:aria-[current=page]:text-ink tw:aria-[current=page]:shadow-[inset_0_-2px_0_var(--aa-ink)]'

/**
 * The AA fees route tabs. `links`: a labelled nav of links with aria-current (route semantics,
 * as today); `tabs`: shadcn Tabs, whose tablist roles and arrow keys suit in-page panels.
 */
export function TabLinkReplacement({ as = 'links' }: { as?: 'links' | 'tabs' }) {
  const [tab, setTab] = useState<FeeTab>('invoices')
  return (
    <div>
      {as === 'links' ? (
        <nav aria-label="AA fees" className="tw:flex tw:border-b tw:border-line">
          {FEE_TABS.map((t) => (
            <a
              key={t.value}
              href="#"
              aria-current={tab === t.value ? 'page' : undefined}
              onClick={(e) => {
                stop(e)
                setTab(t.value)
              }}
              className={LINK_TAB}
            >
              {t.label}
            </a>
          ))}
        </nav>
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as FeeTab)}>
          <TabsList variant="line" className="tw:w-full tw:justify-start">
            {FEE_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="tw:text-sm">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      <Echo>Route: /admin/billing/aa-fees{tab === 'settings' ? '/settings' : ''}</Echo>
    </div>
  )
}
