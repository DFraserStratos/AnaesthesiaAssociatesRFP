import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { useAppStore } from '../../store'
import { AddCardFlow, RequestCoverSheet } from '../../shared/flows'
import { SlideStack, type SlideLayer } from './components'
import {
  AvailabilityScreen,
  BalancesScreen,
  CardDetailScreen,
  ForwardListsScreen,
  ListDetailScreen,
  MoreScreen,
} from './screens'
import { listsStackLocation } from './navigation'
import { useMobileOutlet } from './outlet'

/**
 * The mobile app's route elements. The three simple tabs are thin wrappers; the
 * Lists tab is one splat route hosting the whole slide stack, with its depth and
 * ids read off the URL.
 */

interface OfferTarget {
  listId: string
  slotLabel: string
}

// ---------------------------------------------------------------------------
// Lists — `/mobile/lists/*` (the slide stack)
// ---------------------------------------------------------------------------

export function MobileListsRoute() {
  const { actor, anaesthetistId, personaName, initials } = useMobileOutlet()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { depth, listId: urlListId, cardId: urlCardId } = listsStackLocation(pathname)

  const [addOpen, setAddOpen] = useState(false)
  const [offer, setOffer] = useState<OfferTarget | null>(null)

  // A POPPED layer has to stay mounted so it can slide out — exactly what the
  // old `onBack={() => setDepth(0)}` did, which moved depth but left listId /
  // cardId in place. So the last-seen ids are remembered here and never cleared:
  // the URL drives which layer is ACTIVE, this ref keeps the outgoing one alive.
  const seen = useRef<{ listId: string | null; cardId: string | null }>({ listId: null, cardId: null })
  useEffect(() => {
    if (urlListId !== null) seen.current.listId = urlListId
    if (urlCardId !== null) seen.current.cardId = urlCardId
  }, [urlListId, urlCardId])

  // Stale ids fall back a layer rather than blanking (URLs outlive the seed).
  const listMissing = useAppStore((s) => urlListId !== null && s.schedule.lists[urlListId] === undefined)
  const cardMissing = useAppStore((s) => urlCardId !== null && s.schedule.cards[urlCardId] === undefined)
  if (listMissing) return <Navigate to="/mobile/lists" replace />
  if (cardMissing) return <Navigate to={`/mobile/lists/${urlListId}`} replace />

  const listId = urlListId ?? seen.current.listId
  const cardId = urlCardId ?? seen.current.cardId
  const backToLists = () => navigate('/mobile/lists')
  const backToList = () => navigate(listId !== null ? `/mobile/lists/${listId}` : '/mobile/lists')

  // Edge-swipe-back on the drilled-in layer, wired per depth to the SAME two
  // handlers the on-screen back affordances use. Deliberately not a history
  // `go(-1)`: the stack's depth lives in the URL, but history can also hold
  // entries that are not part of this stack (a tab switch, or a deep link
  // landed on directly), so stepping back would sometimes leave the Lists tab
  // altogether. Installed as a PWA there is no browser chrome to fall back on,
  // which is exactly why the gesture exists.
  const popLayer = depth === 2 ? backToList : depth === 1 ? backToLists : undefined

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
          personaName={personaName}
          initials={initials}
          onOpenList={(id) => navigate(`/mobile/lists/${id}`)}
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
            onBack={backToLists}
            onOpenCard={(id) => navigate(`/mobile/lists/${listId}/cards/${id}`)}
            onAddCard={() => setAddOpen(true)}
          />
        ) : null,
    },
    {
      key: 'card',
      mounted: cardId !== null,
      node:
        cardId !== null ? (
          <CardDetailScreen cardId={cardId} actor={actor} onBack={backToList} onCopied={backToList} />
        ) : null,
    },
  ]

  return (
    <>
      <SlideStack layers={listsLayers} depth={depth} onPop={popLayer} />

      {listId !== null && (
        <AddCardFlow
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
          personName={personaName}
          slotLabel={offer.slotLabel}
          onClose={() => setOffer(null)}
          onSent={() => undefined}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// The other three tabs
// ---------------------------------------------------------------------------

export function MobileAvailabilityRoute() {
  const { actor, anaesthetistId, initials } = useMobileOutlet()
  return <AvailabilityScreen actor={actor} anaesthetistId={anaesthetistId} initials={initials} />
}

export function MobileBalancesRoute() {
  const { anaesthetistId, initials } = useMobileOutlet()
  return <BalancesScreen initials={initials} anaesthetistId={anaesthetistId} />
}

export function MobileMoreRoute() {
  const { personaName, personaRole, initials, moreExtra } = useMobileOutlet()
  return <MoreScreen personaName={personaName} personaRole={personaRole} initials={initials} extra={moreExtra} />
}
