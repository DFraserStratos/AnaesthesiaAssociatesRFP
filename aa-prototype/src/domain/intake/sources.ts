/**
 * Sources: each source's state and today's traffic (build plan Phase 71; US-02.1.7, DM-14). Pure: it reads the
 * stored sources, the arrivals (`ImportBatch`) and the feed's read model (`ArrivalItem`), and the demo day; never
 * the store, never the wall clock.
 *
 * A message is one arrival. It belongs to a source: a hospital's feed batch to that hospital's source, a rooms'
 * PDF (by the mailbox or added by hand) to the mailbox. What a message became comes from its arriving Lists'
 * kinds (an update, a new List, a cancellation, Lists that match exactly), or from its held or unreadable reason.
 * A message counts on the day of its received time.
 */

import { shortDay } from '../dateText'
import type { ImportBatch, IntakeSource, IntakeSourceState } from '../types'
import type { ArrivalItem } from './arrivals'
import { sessionLabel } from './matching'

/** What the Sources measures read. `items` is the feed's read model (`arrivalItemsOf`); `todayISO` the demo day. */
export interface SourcesInput {
  sources: readonly IntakeSource[]
  batches: Readonly<Record<string, ImportBatch>>
  items: readonly ArrivalItem[]
  todayISO: string
}

/** What today's messages from one source became, as counts: Lists for the first four, messages for the last two. */
export interface BecameCounts {
  newList: number
  update: number
  cancellation: number
  /** Lists that match what AA holds exactly. */
  unchanged: number
  held: number
  unreadable: number
}

/** One connected or reading source, with its measures. */
export interface SourceRowModel {
  source: IntakeSource
  /** The stored state: receiving (a feed) or reading (the mailbox). */
  receiving: IntakeSourceState
  /** When it last sent: the newest arrival's time (or the stored time); absent when nothing was ever received. */
  lastSentISO?: string
  /** Messages received on the demo day. */
  todayCount: number
  became: BecameCounts
  /** Held messages not yet dismissed, any day. */
  heldCount: number
}

export type MessageState = 'waiting' | 'decided' | 'held' | 'dismissed'

/** One message received today, as Today's messages lists it. */
export interface TodaysMessage {
  batchId: string
  receivedAtISO: string
  sourceId: string
  sourceName: string
  /** The file's name, else the message's label. */
  message: string
  /** What it became, in words. */
  became: string
  state: MessageState
  /** Lists still waiting on a person that have a difference, and Lists that match exactly still to confirm. */
  waiting: number
  unchanged: number
  /** How many Lists the message held (0 for a held or unreadable message). */
  listCount: number
}

/** A message held under its source (or an unreadable PDF under the mailbox), not yet dismissed. */
export interface HeldMessage {
  batchId: string
  receivedAtISO: string
  message: string
  reason: string
  /** A PDF that cannot be read: it has no raw view. */
  unreadable?: true
}

export interface NotConnectedSource {
  id: string
  name: string
}

// ---------------------------------------------------------------------------
// Which source a message came from
// ---------------------------------------------------------------------------

/** The source a message belongs to, or undefined when no stored source matches it. */
export function sourceOfBatch(sources: readonly IntakeSource[], batch: Pick<ImportBatch, 'arrivalSource'>): IntakeSource | undefined {
  const from = batch.arrivalSource
  if (from.kind === 'hospitalFeed') return sources.find((s) => s.kind === 'hospitalFeed' && s.hospitalId === from.hospitalId)
  return sources.find((s) => s.kind === 'mailbox')
}

function onDay(iso: string, dayISO: string): boolean {
  return iso.slice(0, 10) === dayISO
}

/** The feed's List items of each arrival (the rows waiting for an NHI are their List's, not items of their own). */
function listItemsByBatch(items: readonly ArrivalItem[]): Map<string, ArrivalItem[]> {
  const out = new Map<string, ArrivalItem[]>()
  for (const item of items) {
    if (item.kind === 'needsNhi' || item.kind === 'held' || item.kind === 'unreadable') continue
    const list = out.get(item.batchId)
    if (list === undefined) out.set(item.batchId, [item])
    else list.push(item)
  }
  return out
}

function emptyBecame(): BecameCounts {
  return { newList: 0, update: 0, cancellation: 0, unchanged: 0, held: 0, unreadable: 0 }
}

function addBecame(into: BecameCounts, batch: ImportBatch, lists: readonly ArrivalItem[]): void {
  if (batch.heldReason !== undefined && lists.length === 0) {
    into.held += 1
    return
  }
  if (batch.unreadableReason !== undefined && lists.length === 0) {
    into.unreadable += 1
    return
  }
  for (const item of lists) {
    if (item.kind === 'newList') into.newList += 1
    else if (item.kind === 'update') into.update += 1
    else if (item.kind === 'cancellation') into.cancellation += 1
    else if (item.kind === 'matchesExactly') into.unchanged += 1
  }
}

function byNewest(a: ImportBatch, b: ImportBatch): number {
  return b.receivedAtISO.localeCompare(a.receivedAtISO) || a.id.localeCompare(b.id)
}

// ---------------------------------------------------------------------------
// The measures
// ---------------------------------------------------------------------------

/** One row per connected or reading source, in the order given: its state, last sent, today's count and mix, held count. */
export function sourceRows(input: SourcesInput): SourceRowModel[] {
  const lists = listItemsByBatch(input.items)
  const batches = Object.values(input.batches)
  return input.sources
    .filter((s) => s.state !== 'notConnected')
    .map((source) => {
      const own = batches.filter((b) => sourceOfBatch(input.sources, b)?.id === source.id)
      let lastSentISO = source.lastReceivedAtISO
      for (const b of own) if (lastSentISO === undefined || b.receivedAtISO > lastSentISO) lastSentISO = b.receivedAtISO
      const today = own.filter((b) => onDay(b.receivedAtISO, input.todayISO))
      const became = emptyBecame()
      for (const b of today) addBecame(became, b, lists.get(b.id) ?? [])
      const heldCount = own.filter((b) => b.heldReason !== undefined && b.dismissed === undefined).length
      return {
        source,
        receiving: source.state,
        ...(lastSentISO !== undefined ? { lastSentISO } : {}),
        todayCount: today.length,
        became,
        heldCount,
      }
    })
}

const ONE_LIST_BECAME: Partial<Record<ArrivalItem['kind'], string>> = {
  newList: 'New List',
  update: 'Update',
  cancellation: 'Cancellation',
}

/** "Update · Wed 25 Nov AM": a single List's kind and when it is. */
function oneListBecame(item: ArrivalItem): string {
  const when = item.dateISO !== undefined && item.session !== undefined ? sessionLabel(item.dateISO, item.session) : undefined
  if (item.kind === 'matchesExactly') return 'Unchanged · 1 List'
  const word = ONE_LIST_BECAME[item.kind] ?? 'New List'
  return when !== undefined ? `${word} · ${when}` : word
}

/** "6 Lists for Wed 25 Nov · 1 update, 2 new Lists, 3 unchanged": a hospital file of several Lists, with its mix. */
function manyListsBecame(lists: readonly ArrivalItem[]): string {
  const counts = emptyBecame()
  for (const item of lists) {
    if (item.kind === 'newList') counts.newList += 1
    else if (item.kind === 'update') counts.update += 1
    else if (item.kind === 'cancellation') counts.cancellation += 1
    else if (item.kind === 'matchesExactly') counts.unchanged += 1
  }
  if (counts.unchanged === lists.length) return `Unchanged · ${lists.length} Lists`
  const days = [...new Set(lists.map((i) => i.dateISO).filter((d): d is string => d !== undefined))].sort()
  const head = days.length === 1 ? `${lists.length} Lists for ${shortDay(days[0]!)}` : `${lists.length} Lists`
  const mix = [
    counts.update > 0 ? `${counts.update} ${counts.update === 1 ? 'update' : 'updates'}` : '',
    counts.newList > 0 ? `${counts.newList} new ${counts.newList === 1 ? 'List' : 'Lists'}` : '',
    counts.cancellation > 0 ? `${counts.cancellation} ${counts.cancellation === 1 ? 'cancellation' : 'cancellations'}` : '',
    counts.unchanged > 0 ? `${counts.unchanged} unchanged` : '',
  ].filter((s) => s !== '')
  return mix.length > 0 ? `${head} · ${mix.join(', ')}` : head
}

/** Today's messages, newest first: one row per message, with what it became and its state. */
export function todaysMessages(input: SourcesInput): TodaysMessage[] {
  const lists = listItemsByBatch(input.items)
  const out: TodaysMessage[] = []
  for (const batch of Object.values(input.batches).sort(byNewest)) {
    if (!onDay(batch.receivedAtISO, input.todayISO)) continue
    const source = sourceOfBatch(input.sources, batch)
    if (source === undefined) continue
    const own = lists.get(batch.id) ?? []
    const base = { batchId: batch.id, receivedAtISO: batch.receivedAtISO, sourceId: source.id, sourceName: source.name, message: batch.file?.name ?? batch.label }
    if (own.length === 0 && (batch.heldReason !== undefined || batch.unreadableReason !== undefined)) {
      const held = batch.heldReason !== undefined
      const state: MessageState = batch.dismissed !== undefined ? 'dismissed' : held ? 'held' : 'waiting'
      out.push({ ...base, became: held ? 'Held' : 'Cannot be read', state, waiting: 0, unchanged: 0, listCount: 0 })
      continue
    }
    if (own.length === 0) continue
    const open = own.filter((i) => !i.decided)
    const waiting = open.filter((i) => i.kind !== 'matchesExactly').length
    const unchanged = open.filter((i) => i.kind === 'matchesExactly').length
    out.push({
      ...base,
      became: own.length === 1 ? oneListBecame(own[0]!) : manyListsBecame(own),
      state: open.length > 0 ? 'waiting' : 'decided',
      waiting,
      unchanged,
      listCount: own.length,
    })
  }
  return out
}

/** Each source's held messages not yet dismissed (any day), newest first; unreadable PDFs sit under the mailbox. */
export function heldBySource(input: SourcesInput): Record<string, HeldMessage[]> {
  const out: Record<string, HeldMessage[]> = {}
  for (const batch of Object.values(input.batches).sort(byNewest)) {
    if (batch.dismissed !== undefined || batch.rowIds.length > 0) continue
    const reason = batch.heldReason ?? batch.unreadableReason
    if (reason === undefined) continue
    const source = sourceOfBatch(input.sources, batch)
    if (source === undefined) continue
    const held: HeldMessage = {
      batchId: batch.id,
      receivedAtISO: batch.receivedAtISO,
      message: batch.file?.name ?? batch.label,
      reason,
      ...(batch.heldReason === undefined ? { unreadable: true as const } : {}),
    }
    ;(out[source.id] ??= []).push(held)
  }
  return out
}

/** The hospitals not connected: their Lists come by PDF to the mailbox. */
export function notConnected(input: Pick<SourcesInput, 'sources'>): NotConnectedSource[] {
  return input.sources.filter((s) => s.state === 'notConnected').map((s) => ({ id: s.id, name: s.name }))
}
