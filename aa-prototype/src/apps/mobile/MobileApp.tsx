import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { List as ListIcon, LayoutGrid, CircleDollarSign, MoreHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PhoneFrame } from '../../shell/PhoneFrame'
import { APP_CONFIG } from '../../shell/appConfig'
import { neutral, accent } from '../../theme/tokens'
import { useAppStore, type Actor } from '../../store'
import { SlideStack, type SlideLayer } from './components'
import {
  AvailabilityScreen,
  BalancesScreen,
  CardDetailScreen,
  ForwardListsScreen,
  ListDetailScreen,
  MoreScreen,
} from './screens'
import { AddCardSheet } from './flows/AddCardSheet'
import { RequestCoverSheet } from './flows/RequestCoverSheet'

type Tab = 'lists' | 'availability' | 'balances' | 'more'

interface TabDef {
  key: Tab
  label: string
  icon: LucideIcon
}

const TABS: readonly TabDef[] = [
  { key: 'lists', label: 'Lists', icon: ListIcon },
  { key: 'availability', label: 'Availability', icon: LayoutGrid },
  { key: 'balances', label: 'Balances', icon: CircleDollarSign },
  { key: 'more', label: 'More', icon: MoreHorizontal },
]

function BottomTabBar({ active, onSelect }: { active: Tab; onSelect: (tab: Tab) => void }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        padding: '10px 8px 26px',
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(14px)',
        borderTop: `1px solid ${neutral.line}`,
      }}
    >
      {TABS.map((tab) => {
        const on = tab.key === active
        const Icon = tab.icon
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '4px 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: on ? accent.base : neutral.mist,
            }}
          >
            <Icon size={22} strokeWidth={2} aria-hidden />
            <span style={{ fontSize: 11, fontWeight: 600 }}>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

interface OfferTarget {
  listId: string
  slotLabel: string
}

/**
 * Anaesthetist mobile app (Phase 03). Owns the active tab and a local
 * navigation stack for the Lists tab (ForwardLists → ListDetail → CardDetail)
 * driven by translateX depth so both screens stay mounted for the card-advance
 * choreography (Decisions log: local-nav-stack, not router routes). Every read
 * is view-scoped to Dr Souter's own lists (A8); every write goes through the
 * Phase 02/03 store guards as the Souter actor.
 */
export function MobileApp() {
  const persona = APP_CONFIG.mobile.persona
  const actor: Actor = useMemo(
    () => ({ who: persona.name, role: 'anaesthetist', source: 'anaesthetist', anaesthetistId: persona.anaesthetistId ?? '34821' }),
    [persona],
  )
  const anaesthetistId = persona.anaesthetistId ?? '34821'

  const [tab, setTab] = useState<Tab>('lists')
  const [listId, setListId] = useState<string | null>(null)
  const [cardId, setCardId] = useState<string | null>(null)
  const [depth, setDepth] = useState<0 | 1 | 2>(0)
  const [addOpen, setAddOpen] = useState(false)
  const [offer, setOffer] = useState<OfferTarget | null>(null)

  function openList(id: string) {
    setListId(id)
    setDepth(1)
  }
  function openCard(id: string) {
    setCardId(id)
    setDepth(2)
  }

  function offerCover(id: string) {
    const list = useAppStore.getState().schedule.lists[id]
    const slotLabel =
      list !== undefined ? `${format(parseISO(list.dateISO), 'EEE d MMM')} · ${list.session}` : 'Free session'
    setOffer({ listId: id, slotLabel })
  }

  const listsLayers: SlideLayer[] = [
    {
      key: 'home',
      mounted: true,
      node: (
        <ForwardListsScreen
          anaesthetistId={anaesthetistId}
          personaName={persona.name}
          initials={persona.initials}
          onOpenList={openList}
          onOfferCover={offerCover}
        />
      ),
    },
    {
      key: 'list',
      mounted: listId !== null,
      node:
        listId !== null ? (
          <ListDetailScreen
            listId={listId}
            actor={actor}
            onBack={() => setDepth(0)}
            onOpenCard={openCard}
            onAddCard={() => setAddOpen(true)}
          />
        ) : null,
    },
    {
      key: 'card',
      mounted: cardId !== null,
      node:
        cardId !== null ? (
          <CardDetailScreen cardId={cardId} actor={actor} onBack={() => setDepth(1)} onCopied={() => setDepth(1)} />
        ) : null,
    },
  ]

  const showTabBar = tab !== 'lists' || depth === 0

  return (
    <PhoneFrame>
      <div style={{ height: '100%', position: 'relative', overflow: 'hidden', background: neutral.bg, color: neutral.ink }}>
        {tab === 'lists' && <SlideStack layers={listsLayers} depth={depth} />}
        {tab === 'availability' && <AvailabilityScreen actor={actor} anaesthetistId={anaesthetistId} initials={persona.initials} />}
        {tab === 'balances' && <BalancesScreen initials={persona.initials} />}
        {tab === 'more' && <MoreScreen personaName={persona.name} personaRole={persona.role} initials={persona.initials} />}

        {showTabBar && <BottomTabBar active={tab} onSelect={setTab} />}

        {listId !== null && (
          <AddCardSheet
            open={addOpen}
            listId={listId}
            actor={actor}
            onClose={() => setAddOpen(false)}
            onCreated={() => undefined}
          />
        )}

        {offer !== null && (
          <RequestCoverSheet
            open
            listId={offer.listId}
            actor={actor}
            kind="offer"
            personName={persona.name}
            slotLabel={offer.slotLabel}
            onClose={() => setOffer(null)}
            onSent={() => undefined}
          />
        )}
      </div>
    </PhoneFrame>
  )
}
