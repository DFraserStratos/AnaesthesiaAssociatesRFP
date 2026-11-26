/**
 * The Lists section's tabs in one registry (US-13.1.3): each tab's label, path and one-line sub, in
 * the strip's order. Lists opens on Draft Lists.
 */

import { DRAFT_LISTS } from '../../../../shared/scheduleTerms'
import { listsPath, type ListsTab } from './listsPaths'

export interface ListsTabEntry {
  tab: ListsTab
  label: string
  path: string
  /** The one-line sub under the Lists title. Every tab has one, kept to one line at 1280px, so the tab strip never moves between tabs. */
  sub: string
}

export const LISTS_TABS: readonly ListsTabEntry[] = [
  { tab: 'draft-lists', label: DRAFT_LISTS, path: listsPath('draft-lists'), sub: 'Lists with no anaesthetist yet, soonest first. Assign each one for its session.' },
  { tab: 'conflicts', label: 'Conflicts', path: listsPath('conflicts'), sub: 'Lists at a hospital closed that day. Reassign the List or clear the flag.' },
  { tab: 'contracts-to-set', label: 'Contracts to set', path: listsPath('contracts-to-set'), sub: 'Procedures still needing a Contract. Past Lists first: they hold up submission.' },
  { tab: 'to-authorise', label: 'To authorise', path: listsPath('to-authorise'), sub: 'Submitted Lists waiting for the office to check and authorise for billing.' },
]

export function listsTabEntry(tab: ListsTab): ListsTabEntry {
  return LISTS_TABS.find((t) => t.tab === tab)!
}
