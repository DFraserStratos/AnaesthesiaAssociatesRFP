/**
 * Where a List came from, on the Admin List view (catch-up Phase 34;
 * US-02.2.4): the origin in words and who the office's emails about it go to,
 * through 17b's one helper `officeAddressFor` (the List's sender first, else
 * the surgeon's first office contact). One `DefRow`; the words live in
 * `domain/lists/listOrigin.ts`.
 */

import type { List } from '../../../domain/types'
import { listOriginText } from '../../../domain/lists/listOrigin'
import { officeAddressFor } from '../../../domain/surgeonContacts'
import { useAppStore } from '../../../store'
import { DefRow } from '../../../shared/ui'
import { locationName } from '../../../shared/format'

export function ListOriginRow({ list, shot = 'list-origin' }: { list: Pick<List, 'origin' | 'surgeonId'>; shot?: string }) {
  const masters = useAppStore((s) => s.masters)
  const replies = officeAddressFor(masters, list.surgeonId, list).to
  return (
    <DefRow
      label="Origin"
      shot={shot}
      data-origin={list.origin.kind}
      note={replies !== null ? `Replies go to ${replies.email}` : 'No address held for replies'}
    >
      {listOriginText(list.origin, (id) => locationName(id, masters.hospitals))}
    </DefRow>
  )
}
