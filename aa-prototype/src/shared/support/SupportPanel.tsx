import { useMemo, useState } from 'react'
import { coverAt, supportReadings, SUPPORT_READINGS_CAPTION } from '../../domain/support'
import type { SupportChannel, SupportTicket } from '../../domain/types'
import { clockISO, raiseSupportTicket, ticketsFor, useAppStore, type Actor } from '../../store'
import { useDemoTriggerContext } from '../demoTriggers/context'
import { DemoBadge } from '../DemoBadge'
import { LineTab, LineTabs, Notice, type ButtonSize } from '../ui'
import { neutral } from '../../theme/tokens'
import { ResponseTable } from './ResponseTable'
import { SupportHours } from './SupportHours'
import { SupportRequestForm, type SupportRequestDraft } from './SupportRequestForm'
import { TicketList } from './TicketList'
import { CHANNEL_INTRO, CHANNEL_LABEL, CHRISTMAS_NOTE, OUT_OF_HOURS_NOTE, PUBLIC_HOLIDAY_NOTE, SIMULATED_CAPTION } from './supportCopy'

export interface SupportPanelProps {
  /** The channels this app shows: the help line everywhere, product support too in Admin. */
  channels: readonly SupportChannel[]
  actor: Actor
  app: SupportTicket['raisedBy']['app']
  /** The office sees every request; an anaesthetist sees their own. */
  seesEveryRequest: boolean
  buttonSize: ButtonSize
}

const CAPTION = { margin: 0, fontSize: 12, lineHeight: '17px', color: neutral.mist } as const

/**
 * The one support panel body (catch-up Phase 43b; US-15.0.8, US-15.0.9),
 * hosted by a `BottomSheet` on the phone and the shared `SidePanel` on web
 * and Admin. Top to bottom: the status, phone and hours; the response table;
 * the out-of-hours notice; the request form; the tickets; the one Simulated
 * badge and the readings caption. Everything time-based reads the demo clock
 * and 42's master public-holiday calendar.
 */
export function SupportPanel({ channels, actor, app, seesEveryRequest, buttonSize }: SupportPanelProps) {
  const [tab, setTab] = useState<SupportChannel>(channels[0] ?? 'helpLine')
  const [newestId, setNewestId] = useState<string | undefined>(undefined)
  const clock = useAppStore((s) => s.clock)
  const support = useAppStore((s) => s.support)
  const publicHolidayRows = useAppStore((s) => s.masters.publicHolidays)
  const publicHolidays = useMemo(() => Object.values(publicHolidayRows), [publicHolidayRows])
  useDemoTriggerContext('support.tab', tab)
  useDemoTriggerContext('support.requester', seesEveryRequest ? '' : actor.who)

  const cover = coverAt(tab, clock.todayISO, clock.minutesSinceMidnight, publicHolidays)
  const tickets = useMemo(
    () => ticketsFor({ support }, { channel: tab, ...(seesEveryRequest ? {} : { requester: actor.who }) }),
    [support, tab, seesEveryRequest, actor.who],
  )
  const coverNote =
    cover.kind === 'inHours' ? null
    : cover.kind === 'christmas' ? CHRISTMAS_NOTE
    : cover.kind === 'publicHoliday' && tab === 'productSupport' ? PUBLIC_HOLIDAY_NOTE
    : OUT_OF_HOURS_NOTE[tab]

  function send(draft: SupportRequestDraft): string | null {
    const res = raiseSupportTicket(useAppStore, actor, { channel: tab, app, ...draft })
    if (!res.ok) return res.message
    setNewestId(res.value.ticketId)
    return null
  }

  return (
    <div data-shot="support-panel" data-tab={tab} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {channels.length > 1 && (
        <LineTabs label="Support" kind="group">
          {channels.map((c) => (
            <LineTab key={c} active={tab === c} onClick={() => setTab(c)} shot={`support-tab-${c}`}>
              {CHANNEL_LABEL[c]}
            </LineTab>
          ))}
        </LineTabs>
      )}
      <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: neutral.slate }}>{CHANNEL_INTRO[tab]}</p>
      <SupportHours channel={tab} dateISO={clock.todayISO} minutes={clock.minutesSinceMidnight} publicHolidays={publicHolidays} />
      <ResponseTable channel={tab} />
      {coverNote !== null && (
        <Notice tone="warning" shot="support-cover-note" data-cover={cover.kind}>
          {coverNote}
        </Notice>
      )}
      {/* A new form per tab, so a half-typed help-line request never becomes a product ticket. */}
      <SupportRequestForm key={tab} channel={tab} outOfHours={cover.kind !== 'inHours'} buttonSize={buttonSize} onSend={send} />
      <TicketList
        tickets={tickets}
        clockISO={clockISO(clock)}
        showRequester={seesEveryRequest}
        title={seesEveryRequest ? 'Every request' : 'Your requests'}
        {...(newestId !== undefined ? { newestId } : {})}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
          <DemoBadge label="Simulated" />
          <p style={{ ...CAPTION, flex: 1, minWidth: 180 }}>{SIMULATED_CAPTION}</p>
        </div>
        <div data-shot="support-readings">
          <p style={{ ...CAPTION, fontWeight: 600 }}>{SUPPORT_READINGS_CAPTION}</p>
          <ul style={{ ...CAPTION, paddingLeft: 18, marginTop: 2 }}>
            {supportReadings().map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
