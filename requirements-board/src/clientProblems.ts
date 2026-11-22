/**
 * Problems found in the browser, for the masthead's problem pill (accepted decision 17, D-06):
 *
 * - **crashes:** a region (a view, a sheet) that failed to draw, caught by `RegionBoundary`. Listed
 *   under "This page" until the region recovers (Try again, a catalogue change, or leaving it).
 * - **errors:** an uncaught error from a click or a promise, caught page-wide (`main.tsx`). Listed
 *   under "This page" until dismissed.
 * - **repairs:** a saved browser preference that could not be read and was reset (`storage.ts`).
 *   Listed under "Saved preferences" until dismissed.
 *
 * Server-found data problems are not here: they arrive as catalogue issues (Checks). A later phase
 * that finds a client-side problem the user must notice reports it here, never through a masthead
 * mark, toast or banner of its own. No imports from the rest of the app, so anything may report.
 */
import { create } from 'zustand'

export interface Crash {
  /** Which boundary: stable per region ("view:/board", "sheet:item", "dock:item"). */
  region: string
  /** In words, for the list: "The Board", "This card's sheet". */
  label: string
  message: string
  /** The error's stack and React's component stack, for Details. */
  detail: string
  /** A card or question is open in this region, so Close card can recover it. */
  closable: boolean
}

export interface PageError {
  message: string
  detail: string
  count: number
}

interface ClientProblems {
  crashes: Crash[]
  /** A region's retry count: bumped by Try again in the problem list, read by its boundary. */
  retries: Record<string, number>
  errors: PageError[]
  repairs: { key: string; label: string }[]
  crashed: (c: Crash) => void
  recovered: (region: string) => void
  retry: (region: string) => void
  pageError: (message: string, detail: string) => void
  /** A boundary caught a crash with this message: take back page-error listings of it made a moment ago. */
  caughtCrash: (message: string) => void
  dismissError: (message: string) => void
  repaired: (key: string, label: string) => void
  dismissRepair: (key: string) => void
}

/**
 * A crash a `RegionBoundary` caught is listed once, as a crash, never also as a page error. React in
 * development reports a failed render to the page's error handler too, from a replay that throws a
 * fresh error object, sometimes before the boundary has caught it. So the two are matched by message
 * within a moment: the handler skips a message a boundary has just caught, and the boundary
 * (`caughtCrash`) takes back listings of its message made just before.
 */
const MOMENT_MS = 2000
const caughtAt = new Map<string, number>()
const listedAt = new Map<string, number[]>()
const recent = (t: number | undefined) => t !== undefined && Date.now() - t < MOMENT_MS
/** Forget what is older than a moment, so the maps stay small however many messages come. */
function prune() {
  for (const [m, t] of caughtAt) if (!recent(t)) caughtAt.delete(m)
  for (const [m, ts] of listedAt) if (!ts.some(recent)) listedAt.delete(m)
}

/** Uncaught errors kept: the newest few, each once with a count. */
const KEEP_ERRORS = 5

export const useClientProblems = create<ClientProblems>((set) => ({
  crashes: [],
  retries: {},
  errors: [],
  repairs: [],
  crashed: (c) => set((s) => ({ crashes: [...s.crashes.filter((x) => x.region !== c.region), c] })),
  recovered: (region) => set((s) => (s.crashes.some((x) => x.region === region) ? { crashes: s.crashes.filter((x) => x.region !== region) } : s)),
  retry: (region) => set((s) => ({ retries: { ...s.retries, [region]: (s.retries[region] ?? 0) + 1 } })),
  pageError: (message, detail) =>
    set((s) => {
      prune()
      listedAt.set(message, [...(listedAt.get(message) ?? []), Date.now()].filter(recent))
      const was = s.errors.find((e) => e.message === message)
      const rest = s.errors.filter((e) => e.message !== message)
      return { errors: [...rest, { message, detail, count: (was?.count ?? 0) + 1 }].slice(-KEEP_ERRORS) }
    }),
  caughtCrash: (message) =>
    set((s) => {
      prune()
      caughtAt.set(message, Date.now())
      const times = (listedAt.get(message) ?? []).filter(recent).length
      listedAt.delete(message)
      if (!times) return s
      return { errors: s.errors.flatMap((e) => (e.message !== message ? [e] : e.count > times ? [{ ...e, count: e.count - times }] : [])) }
    }),
  dismissError: (message) => set((s) => ({ errors: s.errors.filter((e) => e.message !== message) })),
  repaired: (key, label) => set((s) => (s.repairs.some((r) => r.key === key) ? s : { repairs: [...s.repairs, { key, label }] })),
  dismissRepair: (key) => set((s) => ({ repairs: s.repairs.filter((r) => r.key !== key) })),
}))

/** How many problems these make for the pill's count. */
export const clientProblemCount = (s: Pick<ClientProblems, 'crashes' | 'errors' | 'repairs'>) => s.crashes.length + s.errors.length + s.repairs.length

/**
 * Not listed: browser noise (ResizeObserver's loop notice, a cross-origin script's opaque error), and
 * a request that could not reach the board's server, which the Offline entry already reports.
 */
const NOISE = /ResizeObserver loop|^Script error\.?$|^Failed to fetch$|^NetworkError when attempting to fetch|^Load failed$|aborted/i

/**
 * List uncaught errors from event handlers and promises under "This page", each message once with a
 * count. A crash a boundary has just caught is not listed again here (see `caughtCrash`).
 */
export function watchPageErrors(target: Pick<Window, 'addEventListener'>, later: (fn: () => void) => void = (fn) => setTimeout(fn, 0)) {
  const report = (reason: unknown, fallback: string) => {
    const message = reason instanceof Error ? reason.message : reason !== undefined && reason !== null ? String(reason) : fallback
    if (!message || NOISE.test(message)) return
    later(() => {
      if (recent(caughtAt.get(message))) return
      useClientProblems.getState().pageError(message, reason instanceof Error ? (reason.stack ?? message) : message)
    })
  }
  target.addEventListener('error', (e) => report((e as ErrorEvent).error, (e as ErrorEvent).message))
  target.addEventListener('unhandledrejection', (e) => report((e as PromiseRejectionEvent).reason, 'a promise failed'))
}
