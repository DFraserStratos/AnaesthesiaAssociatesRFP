/**
 * Arrivals as an inbox (27 Nov 2026 rebuild; docs/explorations/intake-inbox-iterations.html, inbox B): a full-width
 * table of every arrival, narrowed from the toolbar, sorted from any column header, and by default grouped by date of
 * surgery, soonest first. The query lives in the URL (`intakePaths.ts`): every change is written with replace, so Back
 * leaves Intake rather than stepping through filters. A row opens its arrival on its own page (`arrivalPath`, a push),
 * the query riding along so the opened page's Back, Previous and Next keep this order.
 */

import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { emptyInboxText, inboxCountText, nextInboxSort, type InboxQuery } from '../../../../domain/intake/inbox'
import { EmptyState } from '../../../../shared/ui'
import { useToday } from '../../../../store'
import { useInboxItems } from '../../../../store/intakeSelectors'
import type { Actor } from '../../../../store/mutate'
import { PageBody } from '../../components/AdminPage'
import { InboxTable } from './inbox/InboxTable'
import { InboxToolbar } from './inbox/InboxToolbar'
import { arrivalPath, inboxPath, inboxQueryFromParams } from './intakePaths'

// The actor is taken for the route's shape; the inbox itself only reads.
export function InboxView(_props: { actor: Actor }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const todayISO = useToday()
  const query = inboxQueryFromParams(params)

  // The box keeps what is typed (spaces included); the URL keeps it trimmed. A new `q` from outside resets it.
  const [typed, setTyped] = useState(query.q)
  const [seenQ, setSeenQ] = useState(query.q)
  if (query.q !== seenQ) {
    setSeenQ(query.q)
    if (typed.trim() !== query.q) setTyped(query.q)
  }

  const items = useInboxItems(query, todayISO)
  const write = (next: InboxQuery) => navigate(inboxPath(next), { replace: true })

  return (
    <>
      <InboxToolbar
        query={query}
        typed={typed}
        count={inboxCountText(items.length, query.show)}
        onSearch={(text) => {
          setTyped(text)
          write({ ...query, q: text })
        }}
        onChange={write}
      />
      <PageBody>
        {items.length === 0 ? (
          <EmptyState variant="card" shot="intake-inbox-empty">
            {emptyInboxText({ ...query, q: typed })}
          </EmptyState>
        ) : (
          <InboxTable
            items={items}
            query={query}
            todayISO={todayISO}
            onSort={(key) => write({ ...query, sort: nextInboxSort(query.sort, key) })}
            onOpen={(key) => navigate(arrivalPath(key, query))}
          />
        )}
      </PageBody>
    </>
  )
}
