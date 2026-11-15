import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { Logo } from '@proto/shared'
import { useAppStore } from '@proto/store'
import { dayWithYear } from '@proto/shared/format'
import { sessionText } from '@proto/domain/outOfHours'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { buttonVariants } from '@/components/ui/button'
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '@/components/ui/navigation-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Echo, stop, useWebFixtures } from './shared'

// ---------------------------------------------------------------------------
// WebNav
// ---------------------------------------------------------------------------

type WebTab = 'dashboard' | 'lists' | 'availability' | 'accounts'

const NAV_TABS: { key: WebTab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'lists', label: 'Lists' },
  { key: 'availability', label: 'Availability' },
  { key: 'accounts', label: 'Accounts' },
]

/**
 * The web top bar on NavigationMenu: a labelled <nav> of real links, the active
 * one marked aria-current="page" (Base UI sets it from `active`) with the
 * crimson underline (identity: active nav). The avatar is the kit Avatar (tint).
 */
export function WebNavReplacement() {
  const f = useWebFixtures()
  const [tab, setTab] = useState<WebTab>('dashboard')
  return (
    <div className="tw:overflow-x-auto">
      <div className="tw:w-[1000px] tw:border-b tw:border-line tw:bg-surface">
        <div className="tw:mx-auto tw:flex tw:h-16 tw:max-w-[1320px] tw:items-center tw:gap-8 tw:px-8">
          <Logo height={24} />
          <NavigationMenu aria-label="Main" className="tw:h-full tw:max-w-none tw:flex-1 tw:items-stretch tw:justify-start">
            <NavigationMenuList className="tw:h-full tw:items-stretch tw:justify-start tw:gap-1">
              {NAV_TABS.map((t) => (
                <NavigationMenuItem key={t.key} className="tw:flex">
                  <NavigationMenuLink
                    href={`#web-${t.key}`}
                    active={t.key === tab}
                    onClick={(e) => {
                      stop(e)
                      setTab(t.key)
                    }}
                    className="tw:h-full tw:rounded-none tw:px-3.5 tw:py-0 tw:text-sm tw:font-medium tw:text-slate tw:hover:bg-transparent tw:hover:text-ink tw:focus:bg-transparent tw:data-active:font-semibold tw:data-active:text-ink tw:data-active:shadow-[inset_0_-3px_0_var(--brand)]"
                  >
                    {t.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="tw:flex tw:items-center tw:gap-2.5">
            <span className="tw:text-[13px] tw:font-semibold tw:text-slate">{f.personaName}</span>
            <Avatar aria-hidden>
              <AvatarFallback>{f.initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AvailabilityPageSwitch
// ---------------------------------------------------------------------------

const PAGES = [
  { value: 'find', label: 'Find cover', path: '/web/availability' },
  { value: 'mine', label: 'My availability', path: '/web/availability/mine' },
] as const
type Page = (typeof PAGES)[number]['value']

/**
 * The two Availability pages as Tabs whose tabs are links (href = the route,
 * aria-current on the current page). `look="pill"` keeps today's sliding white
 * pill with teal text, using Base UI's own Tabs.Indicator for the slide;
 * `look="line"` is the kit's underline tabs.
 */
export function PageSwitchReplacement({ look = 'pill' }: { look?: 'pill' | 'line' }) {
  const [current, setCurrent] = useState<Page>('find')
  const pill = look === 'pill'
  return (
    <div>
      <div className={pill ? 'tw:w-80' : undefined}>
        <Tabs value={current} onValueChange={(v) => setCurrent(v as Page)}>
          <TabsList variant={pill ? 'default' : 'line'} aria-label="Availability page" className={pill ? 'tw:relative tw:z-0 tw:w-full' : undefined}>
            {pill && (
              <TabsPrimitive.Indicator className="tw:absolute tw:top-(--active-tab-top) tw:left-(--active-tab-left) tw:-z-10 tw:h-(--active-tab-height) tw:w-(--active-tab-width) tw:rounded-[9px] tw:bg-surface tw:shadow-[0_1px_3px_rgba(23,35,32,0.15)] tw:transition-[left,width] tw:duration-180 tw:ease-card" />
            )}
            {PAGES.map((p) => (
              <TabsTrigger
                key={p.value}
                value={p.value}
                nativeButton={false}
                render={<a href={p.path} />}
                aria-current={current === p.value ? 'page' : undefined}
                onClick={stop}
                className={cn(
                  pill &&
                    'tw:min-h-[38px]! tw:no-underline tw:data-active:bg-transparent! tw:data-active:text-primary! tw:data-active:shadow-none! tw:focus-visible:shadow-focus',
                  !pill && 'tw:no-underline',
                )}
              >
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <Echo>Would open {PAGES.find((p) => p.value === current)!.path} (navigation is stubbed here).</Echo>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SubTabButton
// ---------------------------------------------------------------------------

const SUB_TABS = [
  { key: 'overdue', label: 'Overdue', body: 'Accounts more than 30 days overdue.' },
  { key: 'payments', label: 'Payments', body: 'Payments received against her invoices.' },
  { key: 'gst', label: 'GST activity', body: 'GST collected and claimed for the period.' },
  { key: 'fees', label: 'AA fees', body: 'The fees AA charged for its service.' },
] as const

/** The Accounts sub-tabs as shadcn Tabs (line): tablist, tabs, panels and arrow keys. */
export function SubTabsReplacement() {
  return (
    <Tabs defaultValue="overdue">
      <TabsList variant="line" aria-label="Accounts" className="tw:w-full tw:justify-start tw:gap-1">
        {SUB_TABS.map((t) => (
          <TabsTrigger key={t.key} value={t.key}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {SUB_TABS.map((t) => (
        <TabsContent key={t.key} value={t.key} className="tw:pt-1 tw:text-[13px] tw:text-mist">
          {t.body}
        </TabsContent>
      ))}
    </Tabs>
  )
}

// ---------------------------------------------------------------------------
// Back link
// ---------------------------------------------------------------------------

interface ListLite {
  dateISO: string
  session: string
}

/**
 * The way back from List detail. `breadcrumb={false}` keeps today's single teal
 * chevron link (now a real link); `breadcrumb` makes it a shadcn Breadcrumb
 * that also names the page you are on (the persona's next List).
 */
export function BackLinkReplacement({ breadcrumb = false }: { breadcrumb?: boolean }) {
  const f = useWebFixtures()
  const list = useAppStore((s: { schedule: { lists: Record<string, ListLite> } }) => (f.detailListId !== undefined ? s.schedule.lists[f.detailListId] : undefined)) as ListLite | undefined
  const [said, setSaid] = useState<string | null>(null)
  const back = (e: { preventDefault: () => void }) => {
    stop(e)
    setSaid('Would go back to the Lists page (or the search it came from).')
  }
  return (
    <div>
      {breadcrumb ? (
        <Breadcrumb>
          <BreadcrumbList className="tw:text-sm">
            <BreadcrumbItem>
              <BreadcrumbLink href="/web/lists" onClick={back} className="tw:font-semibold tw:text-primary tw:hover:text-teal-pressed">
                Lists
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{list !== undefined ? `${dayWithYear(list.dateISO)} · ${sessionText(list.session)}` : 'List'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      ) : (
        // A plain <a> styled as the link Button: Base UI Button with nativeButton={false}
        // would stamp role="button" on it, hiding that it is a link.
        <a href="/web/lists" onClick={back} className={cn(buttonVariants({ variant: 'link' }), 'tw:gap-1 tw:text-sm tw:font-semibold')}>
          <ChevronLeft className="tw:size-4" strokeWidth={2.4} aria-hidden /> Lists
        </a>
      )}
      <Echo>{said}</Echo>
    </div>
  )
}
