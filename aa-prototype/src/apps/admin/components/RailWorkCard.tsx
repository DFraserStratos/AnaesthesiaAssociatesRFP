import { useMemo, useRef, useState } from 'react'
import { activeNotificationCount, type Actor, type NotificationTarget, type OpenWarningRow } from '../../../store'
import { Card, CountBadge, LineTab, LineTabs } from '../../../shared/ui'
import { InfoTip } from '../../../shared/help/InfoTip'
import { ToDoList, toDoItems, useReplacedContractRows } from './WarningsToDo'
import { ContractsToSetList, useListsNeedingContracts } from './ContractsToSet'
import { ActiveCount, NotificationList, usePoolState } from './NotificationsCard'

type Tab = 'todo' | 'contracts' | 'notifications'

const TAB_LABEL: Record<Tab, string> = { todo: 'To-do', contracts: 'Contracts', notifications: 'Notifications' }
const TAB_SHOT: Record<Tab, string> = { todo: 'admin-warnings-todo', contracts: 'admin-contracts-to-set', notifications: 'admin-notifications-rail' }

/**
 * The Admin Day rail's one work card: what the office has to deal with, in three tabs.
 * To-do holds every open warning (US-13.7.2), soonest first; Contracts holds the Lists whose
 * Procedures still need a Contract, one row per List (US-04.3.12); Notifications holds the shared
 * pool (US-13.8.1), kept apart from the to-do list as FT-13.7 rules. Each tab shows its count, so
 * none hides what is waiting. It opens on To-do, or on Notifications when To-do is empty and a
 * notice is waiting.
 */
export function RailWorkCard({
  todoRows,
  actor,
  onOpenBooking,
  onOpenConflicts,
  onOpenNotification,
  onSeeAllNotifications,
  onShowResolvedNotifications,
  onOpenContract,
  onOpenList,
}: {
  todoRows: readonly OpenWarningRow[]
  actor: Actor
  onOpenBooking: (dateISO: string, bookingId: string) => void
  onOpenConflicts?: () => void
  /** Opens a replaced Contract's page from its to-do (build plan Phase 49). */
  onOpenContract?: (contractId: string) => void
  /** Opens a List from its Contracts row (US-04.3.12). */
  onOpenList?: (listId: string) => void
  onOpenNotification: (target: NotificationTarget) => void
  onSeeAllNotifications: () => void
  onShowResolvedNotifications?: () => void
}) {
  const replaced = useReplacedContractRows()
  const items = useMemo(() => toDoItems(todoRows, replaced), [todoRows, replaced])
  const contractLists = useListsNeedingContracts()
  const pool = usePoolState()
  const notices = useMemo(() => activeNotificationCount(pool), [pool])
  const [tab, setTab] = useState<Tab>(() => (items.length === 0 && notices > 0 ? 'notifications' : 'todo'))
  const panel = useRef<HTMLDivElement>(null)

  return (
    <Card shot="admin-work-card">
      <LineTabs kind="group" label="Office work" style={{ margin: '-6px -16px 0', padding: '0 8px', alignItems: 'center' }}>
        <LineTab active={tab === 'todo'} onClick={() => setTab('todo')} shot="admin-work-tab-todo" badge={<CountBadge count={items.length} srNoun="to do" />}>
          To-do
        </LineTab>
        <LineTab active={tab === 'contracts'} onClick={() => setTab('contracts')} shot="admin-work-tab-contracts" badge={<CountBadge count={contractLists.length} srNoun={contractLists.length === 1 ? 'List' : 'Lists'} />}>
          Contracts
        </LineTab>
        <LineTab active={tab === 'notifications'} onClick={() => setTab('notifications')} shot="admin-work-tab-notifications" badge={<ActiveCount count={notices} shot="admin-notifications-count" />}>
          Notifications
        </LineTab>
        <span style={{ marginLeft: 'auto', display: 'inline-flex' }}>
          <InfoTip topic={tab === 'contracts' ? 'day.contracts' : 'day.todo'} />
        </span>
      </LineTabs>
      <div
        ref={panel}
        tabIndex={-1}
        role="region"
        aria-label={TAB_LABEL[tab]}
        data-shot={TAB_SHOT[tab]}
        style={{ display: 'flex', flexDirection: 'column', gap: 10, outline: 'none' }}
      >
        {tab === 'todo' ? (
          <ToDoList
            items={items}
            actor={actor}
            onOpenBooking={onOpenBooking}
            {...(onOpenConflicts !== undefined ? { onOpenConflicts } : {})}
            {...(onOpenContract !== undefined ? { onOpenContract } : {})}
          />
        ) : tab === 'contracts' ? (
          <ContractsToSetList rows={contractLists} onOpenBooking={onOpenBooking} {...(onOpenList !== undefined ? { onOpenList } : {})} />
        ) : (
          // After a tick the row leaves; focus goes to the panel, not the page.
          <NotificationList
            actor={actor}
            onOpen={onOpenNotification}
            onSeeAll={onSeeAllNotifications}
            {...(onShowResolvedNotifications !== undefined ? { onShowResolved: onShowResolvedNotifications } : {})}
            onTicked={() => panel.current?.focus()}
          />
        )}
      </div>
    </Card>
  )
}
