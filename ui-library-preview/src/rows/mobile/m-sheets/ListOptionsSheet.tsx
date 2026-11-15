import { useState, type ReactNode } from 'react'
import { ArrowLeftRight, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Said } from './shared'
import { PRESS } from './Controls'

interface ListOption {
  key: string
  icon: ReactNode
  label: string
  hint: string
  disabled?: boolean
  line?: string
}

/** The current example's three options (the third shows the disabled "already alerted" row). */
const OPTIONS: ListOption[] = [
  { key: 'move', icon: <ArrowLeftRight className="tw:size-[18px]" strokeWidth={2.2} />, label: 'Move this List', hint: 'Give it to a colleague or back to the office', line: 'Move this List: would open the move sheet.' },
  { key: 'alert', icon: <BellRing className="tw:size-[18px]" strokeWidth={2.2} />, label: 'Alert the office', hint: 'Ask the office to check this List, with a note', line: 'Alert the office: would open its sheet.' },
  { key: 'done', icon: <BellRing className="tw:size-[18px]" strokeWidth={2.2} />, label: 'The office has been alerted', hint: 'It stays with the office until someone there deals with it', disabled: true },
]

const TITLE = "St George's AM"
const SUBTITLE = 'Today · 08:00 to 12:30'

function OptionBody({ o }: { o: ListOption }) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          'tw:grid tw:size-10 tw:flex-none tw:place-items-center tw:rounded-[12px]',
          o.disabled ? 'tw:bg-sunken tw:text-mist!' : 'tw:bg-teal-tint tw:text-primary!',
        )}
      >
        {o.icon}
      </span>
      <span className="tw:flex tw:min-w-0 tw:flex-col tw:gap-px tw:text-left">
        <span className={cn('tw:text-base tw:leading-[22px] tw:font-semibold', o.disabled ? 'tw:text-slate!' : 'tw:text-ink')}>{o.label}</span>
        <span className="tw:text-[13px] tw:leading-[18px] tw:font-normal tw:whitespace-normal tw:text-slate!">{o.hint}</span>
      </span>
    </>
  )
}

/**
 * Option 1: the sheet on shadcn Drawer with a plain list of buttons. The menu roles go (they
 * promised arrow keys that never existed); the Drawer gives the focus trap, Escape and drag.
 */
function SheetOptions({ onLine }: { onLine: (line: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="lg" className={PRESS} onClick={() => setOpen(true)}>
        List options
      </Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <div className="tw:flex tw:flex-col tw:gap-1 tw:overflow-auto tw:px-5 tw:pb-[max(calc(var(--aa-inset-bottom,34px)+2px),20px)]">
            <div className="tw:flex tw:flex-col tw:gap-0.5 tw:px-1 tw:pb-2">
              <DrawerTitle className="tw:text-[17px]">{TITLE}</DrawerTitle>
              <DrawerDescription>{SUBTITLE}</DrawerDescription>
            </div>
            <ul aria-label="List options" className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-1 tw:p-0">
              {OPTIONS.map((o) => (
                <li key={o.key}>
                  <button
                    type="button"
                    disabled={o.disabled}
                    onClick={() => {
                      setOpen(false)
                      if (o.line) onLine(o.line)
                    }}
                    className={cn(
                      'tw:flex tw:min-h-[60px] tw:w-full tw:cursor-pointer tw:items-center tw:gap-3.5 tw:rounded-[12px] tw:border-0 tw:bg-transparent tw:px-1.5 tw:py-2.5 tw:outline-none tw:hover:bg-sunken tw:focus-visible:shadow-focus tw:disabled:cursor-default tw:disabled:hover:bg-transparent',
                      PRESS,
                    )}
                  >
                    <OptionBody o={o} />
                  </button>
                </li>
              ))}
            </ul>
            <DrawerClose render={<Button variant="outline" size="lg" className={cn('tw:mt-2 tw:w-full', PRESS)} />}>Close</DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

/**
 * Option 2: a real Menu (shadcn DropdownMenu on Base UI Menu) anchored to the button: role=menu
 * with arrow keys, typeahead and Escape, the disabled row skipped. No sheet, no Close button.
 */
function MenuOptions({ onLine }: { onLine: (line: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="lg" className={PRESS} />}>List options</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="tw:w-[min(340px,calc(100vw-28px))] tw:rounded-card tw:p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="tw:normal-case tw:tracking-normal">
            <span className="tw:block tw:text-[15px] tw:leading-[22px] tw:font-bold tw:text-ink">{TITLE}</span>
            <span className="tw:block tw:text-[13px] tw:leading-[18px] tw:font-normal tw:text-slate">{SUBTITLE}</span>
          </DropdownMenuLabel>
          {OPTIONS.map((o) => (
            <DropdownMenuItem
              key={o.key}
              disabled={o.disabled}
              onClick={() => {
                if (o.line) onLine(o.line)
              }}
              className="tw:min-h-[60px] tw:gap-3.5 tw:rounded-[12px] tw:px-1.5 tw:py-2.5 tw:data-disabled:opacity-100 tw:[&_svg:not([class*=size-])]:size-[18px]"
            >
              <OptionBody o={o} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ListOptionsSheetReplacement({ mode }: { mode: 'sheet' | 'menu' }) {
  const [line, setLine] = useState<string | null>(null)
  return (
    <>
      {mode === 'sheet' ? <SheetOptions onLine={setLine} /> : <MenuOptions onLine={setLine} />}
      <Said line={line} />
    </>
  )
}
